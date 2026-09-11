export type LiveScoringDelivery = {
  id: string;
  overNumber: number;
  ballNumber: number;
  bowlerId: string;
  strikerId: string;
  nonStrikerId: string;
  runsBat: number;
  runsExtra: number;
  runsTotal: number;
  isLegal: boolean;
  extraType: string | null;
  isWicket: boolean;
  createdAt: string;
  wicket: {
    type: string;
    dismissedPlayerId: string;
    bowlerId: string | null;
    fielderId?: string | null;
  } | null;
};

export type LiveScoringPlayer = {
  id: string;
  name: string;
  jerseyNumber: number | null;
};

export type LiveBattingStat = LiveScoringPlayer & {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
};

export type LiveBowlingStat = LiveScoringPlayer & {
  legalBalls: number;
  runs: number;
  wickets: number;
  overs: string;
  economy: number;
};

export type LiveExtras = {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  total: number;
};

export type LivePartnership = {
  runs: number;
  balls: number;
};

export type LiveFallOfWicket = {
  playerId: string;
  runs: number;
  ballNumber: number;
  overNumber: number;
  createdAt: string;
  wicketType: string;
};

export type LiveScoringStats = {
  batting: LiveBattingStat[];
  bowling: LiveBowlingStat[];
  extras: LiveExtras;
  partnership: LivePartnership;
  fallOfWickets: LiveFallOfWicket[];
};

/**
 * Aggregate the live scorecard in one pass through the delivery list.
 * This avoids separate full-history scans for partnership calculations.
 */
export function calculateLiveScoringStats(
  deliveries: LiveScoringDelivery[],
  battingPlayers: LiveScoringPlayer[],
  bowlingPlayers: LiveScoringPlayer[],
): LiveScoringStats {
  const batting = new Map<string, { runs: number; balls: number; fours: number; sixes: number }>();
  const bowling = new Map<string, { legalBalls: number; runs: number; wickets: number }>();

  for (const player of battingPlayers) {
    batting.set(player.id, { runs: 0, balls: 0, fours: 0, sixes: 0 });
  }

  for (const player of bowlingPlayers) {
    bowling.set(player.id, { legalBalls: 0, runs: 0, wickets: 0 });
  }

  const extras: LiveExtras = {
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
    total: 0,
  };

  const fallOfWickets: LiveFallOfWicket[] = [];
  let runningScore = 0;
  let partnershipRuns = 0;
  let partnershipBalls = 0;

  for (const delivery of deliveries) {
    runningScore += delivery.runsTotal;

    const bat = batting.get(delivery.strikerId);
    if (bat) {
      bat.runs += delivery.runsBat;
      if (delivery.isLegal) bat.balls += 1;
      if (delivery.runsBat === 4) bat.fours += 1;
      if (delivery.runsBat === 6) bat.sixes += 1;
    }

    const bowl = bowling.get(delivery.bowlerId);
    if (bowl) {
      bowl.runs += delivery.runsTotal;
      if (delivery.isLegal) bowl.legalBalls += 1;
      if (delivery.wicket?.bowlerId === delivery.bowlerId) bowl.wickets += 1;
    }

    extras.total += delivery.runsExtra;
    switch (delivery.extraType) {
      case "WIDE":
        extras.wides += delivery.runsExtra;
        break;
      case "NO_BALL":
        extras.noBalls += delivery.runsExtra;
        break;
      case "BYE":
        extras.byes += delivery.runsExtra;
        break;
      case "LEG_BYE":
        extras.legByes += delivery.runsExtra;
        break;
      default:
        break;
    }

    if (delivery.wicket) {
      fallOfWickets.push({
        playerId: delivery.wicket.dismissedPlayerId,
        runs: runningScore,
        ballNumber: delivery.ballNumber,
        overNumber: delivery.overNumber,
        createdAt: delivery.createdAt,
        wicketType: delivery.wicket.type,
      });
      // The wicket ball belongs to the completed partnership. The next ball
      // starts the new partnership, matching the previous calculation.
      partnershipRuns = 0;
      partnershipBalls = 0;
    } else {
      partnershipRuns += delivery.runsTotal;
      if (delivery.isLegal) partnershipBalls += 1;
    }
  }

  return {
    batting: battingPlayers
      .map((player) => {
        const stat = batting.get(player.id)!;
        return {
          ...player,
          ...stat,
          strikeRate: stat.balls > 0 ? (stat.runs / stat.balls) * 100 : 0,
        };
      })
      .filter((player) => player.balls > 0 || player.runs > 0),
    bowling: bowlingPlayers
      .map((player) => {
        const stat = bowling.get(player.id)!;
        return {
          ...player,
          ...stat,
          overs: `${Math.floor(stat.legalBalls / 6)}.${stat.legalBalls % 6}`,
          economy: stat.legalBalls > 0 ? (stat.runs / stat.legalBalls) * 6 : 0,
        };
      })
      .filter((player) => player.legalBalls > 0 || player.runs > 0 || player.wickets > 0),
    extras,
    partnership: {
      runs: partnershipRuns,
      balls: partnershipBalls,
    },
    fallOfWickets,
  };
}
