export type MatchInningsSummary = {
  inningsNumber: number;
  battingTeamId: string;
  totalRuns: number;
};

export type InningsPosition =
  | { kind: "NONE" }
  | { kind: "TRAIL"; runs: number }
  | { kind: "LEVEL"; runs: 0 }
  | { kind: "LEAD"; runs: number };

export function aggregateRunsBeforeInnings(
  innings: MatchInningsSummary[],
  teamId: string,
  currentInningsNumber: number,
): number {
  return innings
    .filter((item) => item.inningsNumber < currentInningsNumber)
    .filter((item) => item.battingTeamId === teamId)
    .reduce((sum, item) => sum + item.totalRuns, 0);
}

export function calculateTarget(params: {
  inningsNumber: number;
  inningsPerMatch: 2 | 4;
  battingTeamId: string;
  bowlingTeamId: string;
  previousInnings: MatchInningsSummary[];
}): number | null {
  const { inningsNumber, inningsPerMatch, battingTeamId, bowlingTeamId } = params;
  const isChase =
    (inningsPerMatch === 2 && inningsNumber === 2) ||
    (inningsPerMatch === 4 && inningsNumber === 4);
  if (!isChase) return null;

  const battingAggregate = aggregateRunsBeforeInnings(params.previousInnings, battingTeamId, inningsNumber);
  const bowlingAggregate = aggregateRunsBeforeInnings(params.previousInnings, bowlingTeamId, inningsNumber);
  return Math.max(1, bowlingAggregate - battingAggregate + 1);
}

/** Returns the current aggregate lead/deficit against the opponent. */
export function calculateInningsPosition(params: {
  inningsNumber: number;
  inningsPerMatch: 2 | 4;
  battingTeamId: string;
  bowlingTeamId: string;
  currentInningsRuns: number;
  previousInnings: MatchInningsSummary[];
}): InningsPosition {
  const { inningsNumber, inningsPerMatch, battingTeamId, bowlingTeamId, currentInningsRuns, previousInnings } = params;
  const isRelevant =
    (inningsPerMatch === 2 && inningsNumber === 2) ||
    (inningsPerMatch === 4 && (inningsNumber === 2 || inningsNumber === 3));
  if (!isRelevant) return { kind: "NONE" };

  const battingAggregate = aggregateRunsBeforeInnings(previousInnings, battingTeamId, inningsNumber) + currentInningsRuns;
  const bowlingAggregate = aggregateRunsBeforeInnings(previousInnings, bowlingTeamId, inningsNumber);
  const difference = battingAggregate - bowlingAggregate;
  if (difference > 0) return { kind: "LEAD", runs: difference };
  if (difference < 0) return { kind: "TRAIL", runs: Math.abs(difference) };
  return { kind: "LEVEL", runs: 0 };
}

/** Backward-compatible four-innings helper. */
export function calculateFourInningsPosition(params: {
  inningsNumber: number;
  inningsPerMatch: 2 | 4;
  battingTeamId: string;
  bowlingTeamId: string;
  currentInningsRuns: number;
  previousInnings: MatchInningsSummary[];
}): InningsPosition {
  if (params.inningsPerMatch !== 4 || (params.inningsNumber !== 2 && params.inningsNumber !== 3)) return { kind: "NONE" };
  return calculateInningsPosition(params);
}

export function decideMatchAfterCompletedInnings(params: {
  inningsNumber: number;
  inningsPerMatch: 2 | 4;
  battingTeamId: string;
  bowlingTeamId: string;
  currentInningsRuns: number;
  previousInnings: MatchInningsSummary[];
  target: number | null;
}): { completed: boolean; winnerTeamId: string | null; tie: boolean } {
  const { inningsNumber, inningsPerMatch, battingTeamId, bowlingTeamId, currentInningsRuns, previousInnings, target } = params;
  if (target !== null && currentInningsRuns >= target) return { completed: true, winnerTeamId: battingTeamId, tie: false };
  if (inningsNumber < inningsPerMatch) {
    if (inningsPerMatch === 4 && inningsNumber === 3) {
      const battingAggregate = aggregateRunsBeforeInnings(previousInnings, battingTeamId, inningsNumber) + currentInningsRuns;
      const bowlingAggregate = aggregateRunsBeforeInnings(previousInnings, bowlingTeamId, inningsNumber);
      if (battingAggregate < bowlingAggregate) return { completed: true, winnerTeamId: bowlingTeamId, tie: false };
    }
    return { completed: false, winnerTeamId: null, tie: false };
  }
  const battingAggregate = aggregateRunsBeforeInnings(previousInnings, battingTeamId, inningsNumber) + currentInningsRuns;
  const bowlingAggregate = aggregateRunsBeforeInnings(previousInnings, bowlingTeamId, inningsNumber);
  if (battingAggregate > bowlingAggregate) return { completed: true, winnerTeamId: battingTeamId, tie: false };
  if (battingAggregate < bowlingAggregate) return { completed: true, winnerTeamId: bowlingTeamId, tie: false };
  return { completed: true, winnerTeamId: null, tie: true };
}
