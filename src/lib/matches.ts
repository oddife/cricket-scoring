import { prisma } from "./prisma";

export type CreateMatchInput = {
  teamAId: string;
  teamBId: string;
  tournamentId?: string;
  matchNumber?: number;
  venue?: string;
  scheduledAt?: Date;
  oversPerInnings: number;
  inningsPerMatch?: number;
  playersPerTeam: number;
  oddOvers?: boolean;
  bowlingMode?: "NORMAL" | "DOUBLE";
  tossWinnerId?: string;
  tossDecision?: "BAT" | "BOWL";
};

export type AddMatchPlayerInput = {
  matchId: string;
  teamId: string;
  playerId: string;
  role?:
    | "PLAYER"
    | "CAPTAIN"
    | "VICE_CAPTAIN"
    | "WICKET_KEEPER";
  isWicketKeeper?: boolean;
};

export type MatchPlayerInput = {
  playerId: string;
  role?:
    | "PLAYER"
    | "CAPTAIN"
    | "VICE_CAPTAIN"
    | "WICKET_KEEPER";
  isWicketKeeper?: boolean;
};

export type SetupMatchPlayersInput = {
  matchId: string;
  teamId: string;
  players: MatchPlayerInput[];
};

/**
 * Create a match between two existing teams.
 */
export async function createMatch(
  input: CreateMatchInput,
) {
  if (!input.teamAId) {
    throw new Error("Team A is required.");
  }

  if (!input.teamBId) {
    throw new Error("Team B is required.");
  }

  if (input.teamAId === input.teamBId) {
    throw new Error(
      "A team cannot play against itself.",
    );
  }

  if (
    !Number.isInteger(input.oversPerInnings) ||
    input.oversPerInnings <= 0
  ) {
    throw new Error(
      "Overs per innings must be a positive integer.",
    );
  }

  if (
    input.inningsPerMatch !== undefined &&
    input.inningsPerMatch !== 2 &&
    input.inningsPerMatch !== 4
  ) {
    throw new Error(
      "A match must have exactly 2 or 4 innings.",
    );
  }

  if (
    !Number.isInteger(input.playersPerTeam) ||
    input.playersPerTeam < 3 ||
    input.playersPerTeam > 18
  ) {
    throw new Error(
      "Players per team must be an integer from 3 to 18.",
    );
  }

  const [teamA, teamB] =
    await Promise.all([
      prisma.team.findUnique({
        where: {
          id: input.teamAId,
        },
      }),

      prisma.team.findUnique({
        where: {
          id: input.teamBId,
        },
      }),
    ]);

  if (!teamA) {
    throw new Error("Team A not found.");
  }

  if (!teamB) {
    throw new Error("Team B not found.");
  }

  if (input.tournamentId) {
    const tournament =
      await prisma.tournament.findUnique({
        where: {
          id: input.tournamentId,
        },
      });

    if (!tournament) {
      throw new Error(
        "Tournament not found.",
      );
    }
  }

  return prisma.match.create({
    data: {
      teamAId: input.teamAId,
      teamBId: input.teamBId,

      tournamentId:
        input.tournamentId ?? null,

      matchNumber:
        input.matchNumber ?? null,

      venue:
        input.venue?.trim() || null,

      scheduledAt:
        input.scheduledAt ?? null,

      oversPerInnings:
        input.oversPerInnings,

      inningsPerMatch:
        input.inningsPerMatch ?? 2,

      playersPerTeam:
        input.playersPerTeam,

      oddOvers:
        input.oddOvers ??
        input.oversPerInnings % 2 === 1,

      bowlingMode:
        input.bowlingMode ?? "NORMAL",

      tossWinnerId:
        input.tossWinnerId ?? null,

      tossDecision:
        input.tossWinnerId
          ? input.tossDecision ?? null
          : null,
    },

    include: {
      teamA: true,
      teamB: true,

      players: {
        include: {
          player: true,
          team: true,
        },
      },
    },
  });
}

/**
 * Validate the selected match-player group.
 */
function validateMatchPlayers(
  players: MatchPlayerInput[],
  expectedCount: number,
) {
  if (!Array.isArray(players)) {
    throw new Error("Players are required.");
  }

  if (
    players.length < 3 ||
    players.length > expectedCount
  ) {
    throw new Error(
      `A team must have at least 3 and at most ${expectedCount} match players.`,
    );
  }

  const playerIds = players.map(
    (player) => player.playerId,
  );

  if (
    playerIds.some(
      (playerId) =>
        typeof playerId !== "string" ||
        !playerId,
    )
  ) {
    throw new Error(
      "Every match player must have a valid player ID.",
    );
  }

  if (new Set(playerIds).size !== playerIds.length) {
    throw new Error(
      "A player cannot be selected more than once.",
    );
  }

  const captains = players.filter(
    (player) => player.role === "CAPTAIN",
  );

  const viceCaptains = players.filter(
    (player) =>
      player.role === "VICE_CAPTAIN",
  );

  const wicketKeepers = players.filter(
    (player) => player.isWicketKeeper === true,
  );

  if (captains.length !== 1) {
    throw new Error(
      "Match players must have exactly one captain.",
    );
  }

  if (viceCaptains.length !== 1) {
    throw new Error(
      "Match players must have exactly one vice-captain.",
    );
  }

  if (wicketKeepers.length !== 1) {
    throw new Error(
      "Match players must have exactly one wicketkeeper.",
    );
  }
}

/**
 * Validate that the team is actually participating
 * in the match.
 */
async function validateMatchTeam(
  matchId: string,
  teamId: string,
) {
  const match =
    await prisma.match.findUnique({
      where: {
        id: matchId,
      },
    });

  if (!match) {
    throw new Error("Match not found.");
  }

  if (
    teamId !== match.teamAId &&
    teamId !== match.teamBId
  ) {
    throw new Error(
      "Team is not part of this match.",
    );
  }

  return match;
}

/**
 * Configure the match players for one team.
 *
 * Existing MatchPlayer records are not replaced; selected
 * players are added to the match as the configured group.
 */
export async function setupMatchPlayers(
  input: SetupMatchPlayersInput,
) {
  const {
    matchId,
    teamId,
    players,
  } = input;

  if (!matchId) {
    throw new Error("Match ID is required.");
  }

  if (!teamId) {
    throw new Error("Team ID is required.");
  }

  const match =
    await validateMatchTeam(
      matchId,
      teamId,
    );

  validateMatchPlayers(
    players,
    match.playersPerTeam,
  );

  const playerIds = players.map(
    (player) => player.playerId,
  );

  const memberships =
    await prisma.teamPlayer.findMany({
      where: {
        teamId,
        playerId: {
          in: playerIds,
        },
      },
    });

  if (memberships.length !== playerIds.length) {
    throw new Error(
      "Every selected match player must belong to the selected team.",
    );
  }

  const existingPlayers =
    await prisma.matchPlayer.findMany({
      where: {
        matchId,
        playerId: {
          in: playerIds,
        },
      },
    });

  if (existingPlayers.length > 0) {
    throw new Error(
      "One or more selected players are already registered in this match.",
    );
  }

  await prisma.$transaction(
    players.map((player) =>
      prisma.matchPlayer.create({
        data: {
          matchId,
          teamId,
          playerId: player.playerId,
          role:
            player.role ?? "PLAYER",
          isWicketKeeper:
            player.isWicketKeeper ?? false,
        },
      }),
    ),
  );

  return prisma.matchPlayer.findMany({
    where: {
      matchId,
      teamId,
    },
    include: {
      player: true,
      team: true,
    },
    orderBy: {
      addedAt: "asc",
    },
  });
}

/**
 * Return the match players for a team.
 */
export async function getMatchPlayers(
  matchId: string,
  teamId: string,
) {
  await validateMatchTeam(
    matchId,
    teamId,
  );

  return prisma.matchPlayer.findMany({
    where: {
      matchId,
      teamId,
    },
    include: {
      player: true,
    },
    orderBy: {
      addedAt: "asc",
    },
  });
}

/**
 * Get a match and its current players.
 */
export async function getMatch(
  matchId: string,
) {
  if (!matchId) {
    throw new Error(
      "Match ID is required.",
    );
  }

  return prisma.match.findUnique({
    where: {
      id: matchId,
    },

    include: {
      teamA: true,
      teamB: true,

      players: {
        include: {
          player: true,
          team: true,
        },

        orderBy: {
          addedAt: "asc",
        },
      },

      innings: {
        orderBy: {
          inningsNumber: "asc",
        },
      },
    },
  });
}

/**
 * Add a player to a match.
 *
 * A player must belong to the selected team.
 */
export async function addMatchPlayer(
  input: AddMatchPlayerInput,
) {
  if (!input.matchId) {
    throw new Error(
      "Match ID is required.",
    );
  }

  if (!input.teamId) {
    throw new Error(
      "Team ID is required.",
    );
  }

  if (!input.playerId) {
    throw new Error(
      "Player ID is required.",
    );
  }

  const match =
    await prisma.match.findUnique({
      where: {
        id: input.matchId,
      },
    });

  if (!match) {
    throw new Error(
      "Match not found.",
    );
  }

  if (
    input.teamId !== match.teamAId &&
    input.teamId !== match.teamBId
  ) {
    throw new Error(
      "Team is not part of this match.",
    );
  }

  const membership =
    await prisma.teamPlayer.findUnique({
      where: {
        teamId_playerId: {
          teamId: input.teamId,
          playerId: input.playerId,
        },
      },
    });

  if (!membership) {
    throw new Error(
      "Player does not belong to this team.",
    );
  }

  const teamPlayerCount =
    await prisma.matchPlayer.count({
      where: {
        matchId: input.matchId,
        teamId: input.teamId,
      },
    });

  if (teamPlayerCount >= match.playersPerTeam) {
    throw new Error(
      `A team can have at most ${match.playersPerTeam} match players in this match.`,
    );
  }

  const existing =
    await prisma.matchPlayer.findUnique({
      where: {
        matchId_playerId: {
          matchId: input.matchId,
          playerId: input.playerId,
        },
      },
    });

  if (existing) {
    throw new Error(
      "Player is already in this match.",
    );
  }

  return prisma.matchPlayer.create({
    data: {
      matchId: input.matchId,
      teamId: input.teamId,
      playerId: input.playerId,
      role:
        input.role ?? "PLAYER",
      isWicketKeeper:
        input.isWicketKeeper ?? false,
    },

    include: {
      player: true,
      team: true,
      match: true,
    },
  });
}

/**
 * Add multiple players to a match.
 */
export async function addMatchPlayers(
  matchId: string,
  players: AddMatchPlayerInput[],
) {
  if (!matchId) {
    throw new Error(
      "Match ID is required.",
    );
  }

  if (players.length === 0) {
    throw new Error(
      "At least one player is required.",
    );
  }

  const results = [];

  for (const player of players) {
    results.push(
      await addMatchPlayer({
        ...player,
        matchId,
      }),
    );
  }

  return results;
}

/**
 * Remove a player from a match.
 *
 * A player who has already participated in a
 * delivery cannot be removed.
 */
export async function removeMatchPlayer(
  matchId: string,
  playerId: string,
) {
  if (!matchId) {
    throw new Error(
      "Match ID is required.",
    );
  }

  if (!playerId) {
    throw new Error(
      "Player ID is required.",
    );
  }

  const matchPlayer =
    await prisma.matchPlayer.findUnique({
      where: {
        matchId_playerId: {
          matchId,
          playerId,
        },
      },
    });

  if (!matchPlayer) {
    throw new Error(
      "Player is not in this match.",
    );
  }

  const participated =
    await prisma.delivery.findFirst({
      where: {
        OR: [
          {
            strikerId: playerId,
          },
          {
            nonStrikerId: playerId,
          },
          {
            bowlerId: playerId,
          },
        ],

        innings: {
          matchId,
        },
      },
    });

  if (participated) {
    throw new Error(
      "A player who has participated in the match cannot be removed.",
    );
  }

  return prisma.matchPlayer.delete({
    where: {
      matchId_playerId: {
        matchId,
        playerId,
      },
    },
  });
}

/**
 * Get players belonging to one team in a match.
 */
export async function getMatchTeamPlayers(
  matchId: string,
  teamId: string,
) {
  if (!matchId) {
    throw new Error(
      "Match ID is required.",
    );
  }

  if (!teamId) {
    throw new Error(
      "Team ID is required.",
    );
  }

  return prisma.matchPlayer.findMany({
    where: {
      matchId,
      teamId,
    },

    include: {
      player: true,
    },

    orderBy: {
      addedAt: "asc",
    },
  });
}

/**
 * Update a player's match role.
 */
export async function updateMatchPlayerRole(
  matchId: string,
  playerId: string,
  role:
    | "PLAYER"
    | "CAPTAIN"
    | "VICE_CAPTAIN"
    | "WICKET_KEEPER",
) {
  if (!matchId) {
    throw new Error(
      "Match ID is required.",
    );
  }

  if (!playerId) {
    throw new Error(
      "Player ID is required.",
    );
  }

  const matchPlayer =
    await prisma.matchPlayer.findUnique({
      where: {
        matchId_playerId: {
          matchId,
          playerId,
        },
      },
    });

  if (!matchPlayer) {
    throw new Error(
      "Player is not in this match.",
    );
  }

  return prisma.matchPlayer.update({
    where: {
      matchId_playerId: {
        matchId,
        playerId,
      },
    },

    data: {
      role,
    },

    include: {
      player: true,
      team: true,
    },
  });
}