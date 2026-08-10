import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const DEFAULT_USER_EMAIL = "scorer@local";
const DEFAULT_USER_NAME = "Cricket Scorer";

async function getDefaultUser() {
  return prisma.user.upsert({
    where: {
      email: DEFAULT_USER_EMAIL,
    },
    update: {},
    create: {
      name: DEFAULT_USER_NAME,
      email: DEFAULT_USER_EMAIL,
    },
  });
}

const tournamentInclude = {
  teams: {
    include: {
      team: true,
    },
  },
  _count: {
    select: {
      matches: true,
    },
  },
};

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: [
        {
          startDate: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      include: tournamentInclude,
    });

    return NextResponse.json(tournaments);
  } catch (error) {
    console.error("Failed to load tournaments:", error);

    return NextResponse.json(
      {
        error: "Failed to load tournaments.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const season =
      typeof body.season === "string"
        ? body.season.trim()
        : null;

    const format =
      typeof body.format === "string"
        ? body.format
        : "LEAGUE";

    if (!name) {
      return NextResponse.json(
        {
          error: "Tournament name is required.",
        },
        {
          status: 400,
        },
      );
    }

    const validFormats = [
      "LEAGUE",
      "KNOCKOUT",
      "LEAGUE_KNOCKOUT",
      "CUSTOM",
    ];

    if (!validFormats.includes(format)) {
      return NextResponse.json(
        {
          error: "Invalid tournament format.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await getDefaultUser();

    const tournament = await prisma.tournament.create({
      data: {
        name,
        season: season || null,
        format: format as
          | "LEAGUE"
          | "KNOCKOUT"
          | "LEAGUE_KNOCKOUT"
          | "CUSTOM",
        ownerId: user.id,
      },
      include: tournamentInclude,
    });

    return NextResponse.json(tournament, {
      status: 201,
    });
  } catch (error) {
    console.error("Failed to create tournament:", error);

    return NextResponse.json(
      {
        error: "Failed to create tournament.",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * DELETE /api/tournaments?id=<tournamentId>
 *
 * Deletes:
 * - Tournament
 * - Tournament/team links
 * - Matches belonging to the tournament
 * - Match players
 * - Innings
 * - Deliveries
 * - Wickets
 *
 * Does NOT delete:
 * - Teams
 * - Players
 */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const tournamentId = url.searchParams.get("id");

    if (!tournamentId) {
      return NextResponse.json(
        {
          error: "Tournament ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const tournament = await prisma.tournament.findUnique({
      where: {
        id: tournamentId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        {
          error: "Tournament not found.",
        },
        {
          status: 404,
        },
      );
    }

    await prisma.$transaction(async (tx) => {
      /*
       * Match -> Innings -> Delivery -> Wicket
       * Match -> MatchPlayer
       *
       * These relations use cascade deletes in the schema.
       */
      await tx.match.deleteMany({
        where: {
          tournamentId,
        },
      });

      /*
       * Remove tournament/team relationships.
       * The actual Team records remain.
       */
      await tx.tournamentTeam.deleteMany({
        where: {
          tournamentId,
        },
      });

      /*
       * Finally delete the tournament.
       */
      await tx.tournament.delete({
        where: {
          id: tournamentId,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Tournament "${tournament.name}" deleted successfully.`,
    });
  } catch (error) {
    console.error("Failed to delete tournament:", error);

    return NextResponse.json(
      {
        error: "Failed to delete tournament.",
      },
      {
        status: 500,
      },
    );
  }
}