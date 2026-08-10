import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id: tournamentId } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
      include: {
        teams: {
          include: {
            team: {
              include: {
                _count: {
                  select: {
                    players: true,
                  },
                },
              },
            },
          },
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(tournament.teams);
  } catch (error) {
    console.error("GET tournament teams error:", error);

    return NextResponse.json(
      { error: "Failed to load teams." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { id: tournamentId } = await params;

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const shortName =
      typeof body.shortName === "string"
        ? body.shortName.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        { error: "Team name is required." },
        { status: 400 },
      );
    }

    const tournament =
      await prisma.tournament.findUnique({
        where: {
          id: tournamentId,
        },
      });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found." },
        { status: 404 },
      );
    }

    // Check whether this team is already attached
    // to this tournament.
    const existingMembership =
      await prisma.tournamentTeam.findFirst({
        where: {
          tournamentId,
          team: {
            name: {
              equals: name,
            },
          },
        },
        include: {
          team: {
            include: {
              _count: {
                select: {
                  players: true,
                },
              },
            },
          },
        },
      });

    if (existingMembership) {
      return NextResponse.json(
        {
          error:
            "A team with this name is already in this tournament.",
        },
        { status: 409 },
      );
    }

    // Re-use an existing team if the exact name exists.
    let team = await prisma.team.findFirst({
      where: {
        name,
      },
    });

    if (!team) {
      team = await prisma.team.create({
        data: {
          name,
          shortName: shortName || null,
        },
      });
    } else if (
      shortName &&
      !team.shortName
    ) {
      team = await prisma.team.update({
        where: {
          id: team.id,
        },
        data: {
          shortName,
        },
      });
    }

    const membership =
      await prisma.tournamentTeam.create({
        data: {
          tournamentId,
          teamId: team.id,
        },
        include: {
          team: {
            include: {
              _count: {
                select: {
                  players: true,
                },
              },
            },
          },
        },
      });

    return NextResponse.json(
      membership,
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "POST tournament team error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to create team." },
      { status: 500 },
    );
  }
}