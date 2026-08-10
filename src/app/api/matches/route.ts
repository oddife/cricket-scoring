import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMatch } from "@/lib/matches";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const tournamentId =
      url.searchParams.get("tournamentId")?.trim() || null;

    const status =
      url.searchParams.get("status")?.trim().toUpperCase() || null;

    const whereBase = tournamentId
      ? { tournamentId }
      : {};

    const include = {
      teamA: {
        select: {
          id: true,
          name: true,
          shortName: true,
        },
      },
      teamB: {
        select: {
          id: true,
          name: true,
          shortName: true,
        },
      },
      innings: {
        orderBy: {
          inningsNumber: "asc" as const,
        },
        select: {
          id: true,
          inningsNumber: true,
          battingTeamId: true,
          bowlingTeamId: true,
          status: true,
          totalRuns: true,
          wickets: true,
          legalBalls: true,
          target: true,
          currentStrikerId: true,
          currentNonStrikerId: true,
          currentBowlerAId: true,
          currentBowlerBId: true,
          previousOverBowlerAId: true,
          previousOverBowlerBId: true,
          startedAt: true,
          completedAt: true,
        },
      },
    };

    if (status === "LIVE") {
      const matches = await prisma.match.findMany({
        where: {
          ...whereBase,
          status: "LIVE",
        },
        include,
        orderBy: {
          updatedAt: "desc",
        },
      });

      return NextResponse.json(matches);
    }

    if (status === "COMPLETED") {
      const matches = await prisma.match.findMany({
        where: {
          ...whereBase,
          status: "COMPLETED",
        },
        include,
        orderBy: {
          updatedAt: "desc",
        },
      });

      return NextResponse.json(matches);
    }

    if (
      status === "SCHEDULED" ||
      status === "ABANDONED" ||
      status === "CANCELLED"
    ) {
      const matches = await prisma.match.findMany({
        where: {
          ...whereBase,
          status,
        },
        include,
        orderBy: {
          scheduledAt: "asc",
          createdAt: "desc",
        },
      });

      return NextResponse.json(matches);
    }

    const matches = await prisma.match.findMany({
      where: whereBase,
      include,
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("GET /api/matches error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load matches.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const match = await createMatch({
      teamAId: body.teamAId,
      teamBId: body.teamBId,
      tournamentId: body.tournamentId,
      oversPerInnings: Number(body.oversPerInnings),
      inningsPerMatch: Number(body.inningsPerMatch),
      playersPerTeam: Number(body.playersPerTeam),
      oddOvers: Boolean(body.oddOvers),
      bowlingMode:
        body.bowlingMode === "DOUBLE"
          ? "DOUBLE"
          : "NORMAL",
      tossWinnerId:
        typeof body.tossWinnerId === "string"
          ? body.tossWinnerId
          : undefined,
      tossDecision:
        body.tossDecision === "BOWL"
          ? "BOWL"
          : body.tossDecision === "BAT"
            ? "BAT"
            : undefined,
    });

    return NextResponse.json(match, {
      status: 201,
    });
  } catch (error) {
    console.error("POST /api/matches error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create match.",
      },
      { status: 400 },
    );
  }
}