import { prisma } from "./prisma";

export type CreateTeamInput = {
  name: string;
  shortName?: string;
  logo?: string;
};

export type CreatePlayerInput = {
  name: string;
  photo?: string | null;
  jerseyNumber?: number | null;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
};

/**
 * Create a new team.
 */
export async function createTeam(
  input: CreateTeamInput,
) {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Team name is required.");
  }

  return prisma.team.create({
    data: {
      name,
      shortName: input.shortName?.trim() || null,
      logo: input.logo?.trim() || null,
    },
  });
}

/**
 * Create a new player.
 */
export async function createPlayer(
  input: CreatePlayerInput,
) {
  const name = input.name.trim();

  if (!name) {
    throw new Error("Player name is required.");
  }

  return prisma.player.create({
    data: {
      name,
      photo: input.photo?.trim() || null,
      jerseyNumber: input.jerseyNumber ?? null,
      battingStyle: input.battingStyle?.trim() || null,
      bowlingStyle: input.bowlingStyle?.trim() || null,
    },
  });
}

/**
 * Add an existing player to a team.
 */
export async function addPlayerToTeam(
  teamId: string,
  playerId: string,
) {
  if (!teamId) {
    throw new Error("Team ID is required.");
  }

  if (!playerId) {
    throw new Error("Player ID is required.");
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new Error("Team not found.");

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) throw new Error("Player not found.");

  const existing = await prisma.teamPlayer.findUnique({
    where: { teamId_playerId: { teamId, playerId } },
  });

  if (existing) throw new Error("Player is already in this team.");

  return prisma.teamPlayer.create({
    data: { teamId, playerId },
    include: { player: true, team: true },
  });
}

/**
 * Remove a player from a team.
 */
export async function removePlayerFromTeam(
  teamId: string,
  playerId: string,
) {
  if (!teamId) throw new Error("Team ID is required.");
  if (!playerId) throw new Error("Player ID is required.");

  const membership = await prisma.teamPlayer.findUnique({
    where: { teamId_playerId: { teamId, playerId } },
  });

  if (!membership) throw new Error("Player is not a member of this team.");

  return prisma.teamPlayer.delete({
    where: { teamId_playerId: { teamId, playerId } },
  });
}

/**
 * Get a team with its current roster.
 */
export async function getTeam(teamId: string) {
  if (!teamId) throw new Error("Team ID is required.");

  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      players: {
        include: { player: true },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
}

/**
 * Get only the players currently registered with a team.
 */
export async function getTeamPlayers(teamId: string) {
  if (!teamId) throw new Error("Team ID is required.");

  const memberships = await prisma.teamPlayer.findMany({
    where: { teamId },
    include: { player: true },
    orderBy: { joinedAt: "asc" },
  });

  return memberships.map((membership) => membership.player);
}

/**
 * Update player information.
 */
export async function updatePlayer(
  playerId: string,
  input: Partial<CreatePlayerInput>,
) {
  if (!playerId) throw new Error("Player ID is required.");

  const existing = await prisma.player.findUnique({ where: { id: playerId } });
  if (!existing) throw new Error("Player not found.");

  const data: {
    name?: string;
    photo?: string | null;
    jerseyNumber?: number | null;
    battingStyle?: string | null;
    bowlingStyle?: string | null;
  } = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new Error("Player name cannot be empty.");
    data.name = name;
  }

  if (input.photo !== undefined) {
    data.photo = input.photo?.trim() || null;
  }

  if (input.jerseyNumber !== undefined) {
    data.jerseyNumber = input.jerseyNumber;
  }

  if (input.battingStyle !== undefined) {
    data.battingStyle = input.battingStyle?.trim() || null;
  }

  if (input.bowlingStyle !== undefined) {
    data.bowlingStyle = input.bowlingStyle?.trim() || null;
  }

  return prisma.player.update({
    where: { id: playerId },
    data,
  });
}

/**
 * Update team information.
 */
export async function updateTeam(
  teamId: string,
  input: Partial<CreateTeamInput>,
) {
  if (!teamId) throw new Error("Team ID is required.");

  const existing = await prisma.team.findUnique({ where: { id: teamId } });
  if (!existing) throw new Error("Team not found.");

  const data: {
    name?: string;
    shortName?: string | null;
    logo?: string | null;
  } = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new Error("Team name cannot be empty.");
    data.name = name;
  }

  if (input.shortName !== undefined) {
    data.shortName = input.shortName.trim() || null;
  }

  if (input.logo !== undefined) {
    data.logo = input.logo.trim() || null;
  }

  return prisma.team.update({
    where: { id: teamId },
    data,
  });
}
