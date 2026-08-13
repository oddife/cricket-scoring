import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getLeagueTable } from "@/lib/league";

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

function integerOrDefault(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

async function getTournamentWinner(tournamentId: string, format: string) {
  const knockoutMatches = await prisma.match.findMany({
    where: {
      tournamentId,
      status: "COMPLETED",
      stage: "KNOCKOUT",
      winnerId: { not: null },
    },
    orderBy: [
      { matchNumber: "desc" },
      { createdAt: "desc" },
    ],
    take: 1,
    include: {
      winner: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logo: true,
        },
      },
    },
  });

  if (knockoutMatches[0]?.winner) {
    return knockoutMatches[0].winner;
  }

  if (format === "LEAGUE" || format === "LEAGUE_KNOCKOUT") {
    const table = await getLeagueTable(tournamentId);

    if (table.length > 0 && table[0].played > 0) {
      return {
        id: table[0].teamId,
        name: table[0].teamName,
        shortName: table[0].shortName,
        logo: null,
      };
    }
  }

  const latestWinner = await prisma.match.findFirst({
    where: {
      tournamentId,
      status: "COMPLETED",
      winnerId: { not: null },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      winner: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logo: true,
        },
      },
    },
  });

  return latestWinner?.winner ?? null;
}

async function serializeTournament(
  tournament: Awaited<
    ReturnType<typeof prisma.tournament.findMany>
  >[number],
) {
  if (tournament.status !== "COMPLETED") {
    return {
      ...tournament,
      winner: null,
    };
  }

  const winner = await getTournamentWinner(
    tournament.id,
    tournament.format,
  );

  return {
    ...tournament,
    winner,
  };
}

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

    const serialized = await Promise.all(
      tournaments.map((tournament) =>
        serializeTournament(tournament),
      ),
    );

    return NextResponse.json(serialized);
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

    const allowTie = body.allowTie === true;
    const allowNoResult = body.allowNoResult === true;
    const winPoints = integerOrDefault(body.winPoints, 2);
    const lossPoints = integerOrDefault(body.lossPoints, 0);
    const tiePoints = integerOrDefault(body.tiePoints, 1);
    const noResultPoints = integerOrDefault(
      body.noResultPoints,
      1,
    );

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
        winPoints,
        lossPoints,
        allowTie,
        tiePoints,
        allowNoResult,
        noResultPoints,
        ownerId: user.id,
      },
      include: tournamentInclude,
    });

    return NextResponse.json(
      {
        ...tournament,
        winner: null,
      },
      {
        status: 201,
      },
    );
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
      await tx.match.deleteMany({
        where: {
          tournamentId,
        },
      });

      await tx.tournamentTeam.deleteMany({
        where: {
          tournamentId,
        },
      });

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