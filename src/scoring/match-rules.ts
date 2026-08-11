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

/**
 * Returns the aggregate score for a team from innings that have already
 * been completed/played before the current innings.
 */
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

/**
 * The target shown at the start of a chasing innings.
 *
 * 2-innings match: innings 2 chases innings 1.
 * 4-innings match: only innings 4 is a chase; it chases the opponent's
 * aggregate with the batting team's innings 3 aggregate already included.
 */
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

  const battingAggregate = aggregateRunsBeforeInnings(
    params.previousInnings,
    battingTeamId,
    inningsNumber,
  );
  const bowlingAggregate = aggregateRunsBeforeInnings(
    params.previousInnings,
    bowlingTeamId,
    inningsNumber,
  );

  return Math.max(1, bowlingAggregate - battingAggregate + 1);
}

/**
 * Position during innings 2 or 3 of a four-innings match.
 * The comparison is always aggregate score versus aggregate score.
 */
export function calculateFourInningsPosition(params: {
  inningsNumber: number;
  inningsPerMatch: 2 | 4;
  battingTeamId: string;
  bowlingTeamId: string;
  currentInningsRuns: number;
  previousInnings: MatchInningsSummary[];
}): InningsPosition {
  if (
    params.inningsPerMatch !== 4 ||
    (params.inningsNumber !== 2 && params.inningsNumber !== 3)
  ) {
    return { kind: "NONE" };
  }

  const battingAggregate =
    aggregateRunsBeforeInnings(
      params.previousInnings,
      params.battingTeamId,
      params.inningsNumber,
    ) + params.currentInningsRuns;

  const bowlingAggregate = aggregateRunsBeforeInnings(
    params.previousInnings,
    params.bowlingTeamId,
    params.inningsNumber,
  );

  const difference = battingAggregate - bowlingAggregate;

  if (difference > 0) return { kind: "LEAD", runs: difference };
  if (difference < 0) return { kind: "TRAIL", runs: Math.abs(difference) };
  return { kind: "LEVEL", runs: 0 };
}

/**
 * Decides the match result once an innings has completed.
 * Returns null when another innings must still be played.
 */
export function decideMatchAfterCompletedInnings(params: {
  inningsNumber: number;
  inningsPerMatch: 2 | 4;
  battingTeamId: string;
  bowlingTeamId: string;
  currentInningsRuns: number;
  previousInnings: MatchInningsSummary[];
  target: number | null;
}): { completed: boolean; winnerTeamId: string | null; tie: boolean } {
  const {
    inningsNumber,
    inningsPerMatch,
    battingTeamId,
    bowlingTeamId,
    currentInningsRuns,
    previousInnings,
    target,
  } = params;

  // Reaching a target ends the match immediately.
  if (target !== null && currentInningsRuns >= target) {
    return { completed: true, winnerTeamId: battingTeamId, tie: false };
  }

  if (inningsNumber < inningsPerMatch) {
    // In a four-innings match, innings 3 is the gatekeeper for innings 4.
    if (inningsPerMatch === 4 && inningsNumber === 3) {
      const battingAggregate =
        aggregateRunsBeforeInnings(
          previousInnings,
          battingTeamId,
          inningsNumber,
        ) + currentInningsRuns;
      const bowlingAggregate = aggregateRunsBeforeInnings(
        previousInnings,
        bowlingTeamId,
        inningsNumber,
      );

      // If Team A is still behind after its second innings, there is no
      // meaningful fourth innings chase and the match ends here.
      if (battingAggregate < bowlingAggregate) {
        return {
          completed: true,
          winnerTeamId: bowlingTeamId,
          tie: false,
        };
      }
    }

    return { completed: false, winnerTeamId: null, tie: false };
  }

  const battingAggregate =
    aggregateRunsBeforeInnings(
      previousInnings,
      battingTeamId,
      inningsNumber,
    ) + currentInningsRuns;
  const bowlingAggregate = aggregateRunsBeforeInnings(
    previousInnings,
    bowlingTeamId,
    inningsNumber,
  );

  if (battingAggregate > bowlingAggregate) {
    return { completed: true, winnerTeamId: battingTeamId, tie: false };
  }

  if (battingAggregate < bowlingAggregate) {
    return { completed: true, winnerTeamId: bowlingTeamId, tie: false };
  }

  return { completed: true, winnerTeamId: null, tie: true };
}
