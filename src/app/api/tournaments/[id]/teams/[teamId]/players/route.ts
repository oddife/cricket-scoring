import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
    teamId: string;
  }>;
};

/**
 * Find the team's membership in this specific tournament.
 *
 * Important:
 * We deliberately use TournamentTeam rather than TeamPlayer.
 * This keeps player membership seasonal.
 */
async function getTournamentTeam(
  tournamentId: string,
  teamId: string,
) {
  return prisma.tournamentTeam.findFirst({
    where: {
      tournamentId,
      teamId,
    },
  });
}

/**
 * GET
 *
 * Returns players belonging to this team
 * in this specific tournament/season.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id: tournamentId, teamId } = await params;

    if (!tournamentId || !teamId) {
      return NextResponse.json(
        {
          error: "Tournament ID and Team ID are required.",
        },
        { status: 400 },
      );
    }

    const tournamentTeam = await getTournamentTeam(
      tournamentId,
      teamId,
    );

    if (!tournamentTeam) {
      return NextResponse.json(
        {
          error:
            "Team is not part of this tournament.",
        },
        { status: 404 },
      );
    }

    const players =
      await prisma.tournamentTeamPlayer.findMany({
        where: {
          tournamentTeamId: tournamentTeam.id,
        },
        include: {
          player: true,
        },
        orderBy: {
          player: {
            name: "asc",
          },
        },
      });

    return NextResponse.json(players);
  } catch (error) {
    console.error(
      "GET seasonal team players error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to load tournament team players.",
      },
      { status: 500 },
    );
  }
}

/**
 * POST
 *
 * Adds an EXISTING player to this team's roster
 * for this specific tournament.
 *
 * If the player does not exist, send name/details
 * and a new global Player is created first.
 */
export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const {
      id: tournamentId,
      teamId,
    } = await params;

    if (!tournamentId || !teamId) {
      return NextResponse.json(
        {
          error:
            "Tournament ID and Team ID are required.",
        },
        { status: 400 },
      );
    }

    const tournamentTeam =
      await getTournamentTeam(
        tournamentId,
        teamId,
      );

    if (!tournamentTeam) {
      return NextResponse.json(
        {
          error:
            "Team is not part of this tournament.",
        },
        { status: 404 },
      );
    }

    const body = await request.json();

    let playerId =
      typeof body.playerId === "string"
        ? body.playerId.trim()
        : "";

    /*
     * Existing player
     */
    if (playerId) {
      const player =
        await prisma.player.findUnique({
          where: {
            id: playerId,
          },
        });

      if (!player) {
        return NextResponse.json(
          {
            error: "Player not found.",
          },
          { status: 404 },
        );
      }
    } else {
      /*
       * New player.
       *
       * This creates the Player globally,
       * then assigns that player to this
       * tournament roster.
       */
      const name =
        typeof body.name === "string"
          ? body.name.trim()
          : "";

      if (!name) {
        return NextResponse.json(
          {
            error:
              "Player name is required.",
          },
          { status: 400 },
        );
      }

      const jerseyNumber =
        body.jerseyNumber === null ||
        body.jerseyNumber === undefined ||
        body.jerseyNumber === ""
          ? null
          : Number(body.jerseyNumber);

      if (
        jerseyNumber !== null &&
        (!Number.isInteger(jerseyNumber) ||
          jerseyNumber < 0)
      ) {
        return NextResponse.json(
          {
            error:
              "Jersey number must be a valid positive number.",
          },
          { status: 400 },
        );
      }

      const player =
        await prisma.player.create({
          data: {
            name,
            jerseyNumber,
            photo:
              typeof body.photo === "string"
                ? body.photo
                : null,
            battingStyle:
              typeof body.battingStyle ===
              "string"
                ? body.battingStyle
                : null,
            bowlingStyle:
              typeof body.bowlingStyle ===
              "string"
                ? body.bowlingStyle
                : null,
          },
        });

      playerId = player.id;
    }

    /*
     * Check whether this player is already
     * registered for this team's roster
     * in this tournament.
     */
    const existing =
      await prisma.tournamentTeamPlayer.findFirst(
        {
          where: {
            tournamentTeamId:
              tournamentTeam.id,
            playerId,
          },
        },
      );

    if (existing) {
      return NextResponse.json(
        {
          error:
            "Player is already in this tournament team.",
        },
        { status: 409 },
      );
    }

    const membership =
      await prisma.tournamentTeamPlayer.create({
        data: {
          tournamentTeamId:
            tournamentTeam.id,
          playerId,
        },
        include: {
          player: true,
        },
      });

    return NextResponse.json(
      membership,
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "POST seasonal team player error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to add player.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE
 *
 * Removes the player from this tournament's
 * roster ONLY.
 *
 * The global Player record is NOT deleted.
 */
export async function DELETE(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const {
      id: tournamentId,
      teamId,
    } = await params;

    const url = new URL(request.url);

    const playerId =
      url.searchParams.get("playerId");

    if (
      !tournamentId ||
      !teamId ||
      !playerId
    ) {
      return NextResponse.json(
        {
          error:
            "Tournament ID, Team ID and Player ID are required.",
        },
        { status: 400 },
      );
    }

    const tournamentTeam =
      await getTournamentTeam(
        tournamentId,
        teamId,
      );

    if (!tournamentTeam) {
      return NextResponse.json(
        {
          error:
            "Team is not part of this tournament.",
        },
        { status: 404 },
      );
    }

    const membership =
      await prisma.tournamentTeamPlayer.findFirst(
        {
          where: {
            tournamentTeamId:
              tournamentTeam.id,
            playerId,
          },
        },
      );

    if (!membership) {
      return NextResponse.json(
        {
          error:
            "Player is not in this tournament team.",
        },
        { status: 404 },
      );
    }

    await prisma.tournamentTeamPlayer.delete({
      where: {
        id: membership.id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE seasonal team player error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to remove player from tournament team.",
      },
      { status: 500 },
    );
  }
}