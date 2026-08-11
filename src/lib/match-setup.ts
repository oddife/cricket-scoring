import { prisma } from "./prisma";
import {
  getMatchPlayers,
} from "./matches";

export type {
  MatchPlayerInput,
  SetupMatchPlayersInput,
  AddMatchPlayerInput,
} from "./matches";

export {
  setupMatchPlayers,
  getMatchPlayers,
  getMatch,
  addMatchPlayer,
  addMatchPlayers,
  removeMatchPlayer,
  getMatchTeamPlayers,
  updateMatchPlayerRole,
} from "./matches";

export type {
  RecordPersistentDeliveryInput,
} from "./scoring";

export {
  recordPersistentDelivery,
} from "./scoring";

export type StartInningsInput = {
  matchId: string;
  inningsNumber: number;
  battingTeamId: string;
  bowlingTeamId: string;
  strikerId: string;
  nonStrikerId: string;
  bowlerAId: string;
  bowlerBId: string;
};

/**
 * Check whether a team has enough valid match players
 * to participate in an innings.
 *
 * The configured playersPerTeam value is a maximum,
 * not a requirement to fill the entire squad.
 */
export async function hasValidMatchPlayers(
  matchId: string,
  teamId: string,
): Promise<boolean> {
  const match =
    await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        playersPerTeam: true,
      },
    });

  if (!match) {
    throw new Error("Match not found.");
  }

  const players =
    await getMatchPlayers(
      matchId,
      teamId,
    );

  if (
    players.length < 3 ||
    players.length > match.playersPerTeam
  ) {
    return false;
  }

  const captains =
    players.filter(
      (player) =>
        player.role === "CAPTAIN",
    );

  const viceCaptains =
    players.filter(
      (player) =>
        player.role === "VICE_CAPTAIN",
    );

  const wicketKeepers =
    players.filter(
      (player) =>
        player.isWicketKeeper,
    );

  return (
    captains.length === 1 &&
    viceCaptains.length === 1 &&
    wicketKeepers.length === 1
  );
}

/**
 * Start an innings and persist the opening state.
 *
 * Toss determines the first batting team:
 * - toss winner + BAT -> toss winner bats first
 * - toss winner + BOWL -> other team bats first
 *
 * When no toss has been recorded, Team A remains the
 * historical/default first batting team.
 */
export async function startInnings(
  input: StartInningsInput,
) {
  if (!input.matchId) {
    throw new Error(
      "Match ID is required.",
    );
  }

  if (
    !Number.isInteger(
      input.inningsNumber,
    ) ||
    input.inningsNumber < 1
  ) {
    throw new Error(
      "Innings number must be a positive integer.",
    );
  }

  if (
    input.battingTeamId ===
    input.bowlingTeamId
  ) {
    throw new Error(
      "Batting and bowling teams must be different.",
    );
  }

  if (
    input.strikerId ===
    input.nonStrikerId
  ) {
    throw new Error(
      "Striker and non-striker must be different players.",
    );
  }

  if (
    !input.bowlerAId ||
    !input.bowlerBId
  ) {
    throw new Error(
      "Two opening bowlers are required.",
    );
  }

  if (
    input.bowlerAId ===
    input.bowlerBId
  ) {
    throw new Error(
      "Opening bowlers must be different.",
    );
  }

  const match =
    await prisma.match.findUnique({
      where: {
        id: input.matchId,
      },
      include: {
        innings: {
          orderBy: {
            inningsNumber: "asc",
          },
        },
      },
    });

  if (!match) {
    throw new Error("Match not found.");
  }

  if (
    input.inningsNumber >
    match.inningsPerMatch
  ) {
    throw new Error(
      `This match has only ${match.inningsPerMatch} innings.`,
    );
  }

  if (
    input.battingTeamId !==
      match.teamAId &&
    input.battingTeamId !==
      match.teamBId
  ) {
    throw new Error(
      "Batting team is not part of this match.",
    );
  }

  if (
    input.bowlingTeamId !==
      match.teamAId &&
    input.bowlingTeamId !==
      match.teamBId
  ) {
    throw new Error(
      "Bowling team is not part of this match.",
    );
  }

  const expectedFirstBattingTeamId =
    match.tossWinnerId &&
    match.tossDecision
      ? match.tossDecision === "BAT"
        ? match.tossWinnerId
        : match.tossWinnerId ===
            match.teamAId
          ? match.teamBId
          : match.teamAId
      : match.teamAId;

  const expectedBattingTeamId =
    input.inningsNumber % 2 === 1
      ? expectedFirstBattingTeamId
      : expectedFirstBattingTeamId ===
          match.teamAId
        ? match.teamBId
        : match.teamAId;

  if (
    input.battingTeamId !==
    expectedBattingTeamId
  ) {
    throw new Error(
      `Innings ${input.inningsNumber} must be played by the expected batting team.`,
    );
  }

  const expectedBowlingTeamId =
    input.battingTeamId ===
      match.teamAId
      ? match.teamBId
      : match.teamAId;

  if (
    input.bowlingTeamId !==
    expectedBowlingTeamId
  ) {
    throw new Error(
      `Innings ${input.inningsNumber} must be bowled by the opposing team.`,
    );
  }

  const battingPlayers =
    await getMatchPlayers(
      input.matchId,
      input.battingTeamId,
    );

  const bowlingPlayers =
    await getMatchPlayers(
      input.matchId,
      input.bowlingTeamId,
    );

  if (
    battingPlayers.length < 3 ||
    battingPlayers.length >
      match.playersPerTeam
  ) {
    throw new Error(
      `Batting team must have at least 3 and at most ${match.playersPerTeam} match players.`,
    );
  }

  if (
    bowlingPlayers.length < 3 ||
    bowlingPlayers.length >
      match.playersPerTeam
  ) {
    throw new Error(
      `Bowling team must have at least 3 and at most ${match.playersPerTeam} match players.`,
    );
  }

  const battingIds =
    new Set(
      battingPlayers.map(
        (player) =>
          player.playerId,
      ),
    );

  const bowlingIds =
    new Set(
      bowlingPlayers.map(
        (player) =>
          player.playerId,
      ),
    );

  if (
    !battingIds.has(
      input.strikerId,
    )
  ) {
    throw new Error(
      "Striker is not among the batting match players.",
    );
  }

  if (
    !battingIds.has(
      input.nonStrikerId,
    )
  ) {
    throw new Error(
      "Non-striker is not among the batting match players.",
    );
  }

  if (
    !bowlingIds.has(
      input.bowlerAId,
    )
  ) {
    throw new Error(
      "Bowler A is not among the bowling match players.",
    );
  }

  if (
    !bowlingIds.has(
      input.bowlerBId,
    )
  ) {
    throw new Error(
      "Bowler B is not among the bowling match players.",
    );
  }

  const existing =
    await prisma.innings.findUnique({
      where: {
        matchId_inningsNumber: {
          matchId:
            input.matchId,
          inningsNumber:
            input.inningsNumber,
        },
      },
      select: {
        id: true,
      },
    });

  if (existing) {
    throw new Error(
      `Innings ${input.inningsNumber} already exists.`,
    );
  }

  const previousInnings =
    match.innings.filter(
      (innings) =>
        innings.inningsNumber <
        input.inningsNumber,
    );

  if (
    previousInnings.length !==
    input.inningsNumber - 1
  ) {
    throw new Error(
      "Innings must be started in order.",
    );
  }

  const unfinishedPreviousInnings =
    previousInnings.find(
      (innings) => innings.status !== "COMPLETED",
    );

  if (unfinishedPreviousInnings) {
    throw new Error(
      `Innings ${unfinishedPreviousInnings.inningsNumber} must be completed before starting innings ${input.inningsNumber}.`,
    );
  }

  const battingTeamPreviousRuns = previousInnings
    .filter(
      (innings) =>
        innings.battingTeamId ===
        input.battingTeamId,
    )
    .reduce(
      (sum, innings) =>
        sum + innings.totalRuns,
      0,
    );

  const opposingTeamPreviousRuns = previousInnings
    .filter(
      (innings) =>
        innings.battingTeamId ===
        input.bowlingTeamId,
    )
    .reduce(
      (sum, innings) =>
        sum + innings.totalRuns,
      0,
    );

  // Only innings 2 and 4 are chase innings.
  // Innings 1 and 3 are scoring innings and
  // deliberately have no target.
  const target =
    input.inningsNumber === 2 ||
    input.inningsNumber === 4
      ? Math.max(
          1,
          opposingTeamPreviousRuns -
            battingTeamPreviousRuns +
            1,
        )
      : null;

  const innings =
    await prisma.innings.create({
      data: {
        matchId:
          input.matchId,
        inningsNumber:
          input.inningsNumber,
        battingTeamId:
          input.battingTeamId,
        bowlingTeamId:
          input.bowlingTeamId,
        status: "LIVE",
        totalRuns: 0,
        wickets: 0,
        legalBalls: 0,
        singleBatEnabled: false,
        target,
        currentStrikerId:
          input.strikerId,
        currentNonStrikerId:
          input.nonStrikerId,
        currentBowlerAId:
          input.bowlerAId,
        currentBowlerBId:
          input.bowlerBId,
        previousOverBowlerAId:
          null,
        previousOverBowlerBId:
          null,
        startedAt:
          new Date(),
      },
    });

  await prisma.match.update({
    where: {
      id: input.matchId,
    },
    data: {
      status: "LIVE",
    },
  });

  return innings;
}