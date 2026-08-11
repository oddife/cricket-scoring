import { NextResponse } from "next/server";

import { startInnings } from "@/lib/match-setup";
import { prisma } from "@/lib/prisma";
import { calculateTarget } from "@/scoring/match-rules";

type RouteContext = {
  params: Promise<{
    matchId: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { matchId } = await params;

    if (!matchId) {
      return NextResponse.json(
        { error: "Match ID is required." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const inningsNumber = Number(body.inningsNumber);

    if (!Number.isInteger(inningsNumber) || inningsNumber < 1) {
      return NextResponse.json(
        { error: "Innings number must be a positive integer." },
        { status: 400 },
      );
    }

    const battingTeamId =
      typeof body.battingTeamId === "string" ? body.battingTeamId.trim() : "";
    const bowlingTeamId =
      typeof body.bowlingTeamId === "string" ? body.bowlingTeamId.trim() : "";
    const strikerId =
      typeof body.strikerId === "string" ? body.strikerId.trim() : "";
    const nonStrikerId =
      typeof body.nonStrikerId === "string" ? body.nonStrikerId.trim() : "";
    const bowlerAId =
      typeof body.bowlerAId === "string" ? body.bowlerAId.trim() : "";
    const bowlerBId =
      typeof body.bowlerBId === "string" ? body.bowlerBId.trim() : "";

    const innings = await startInnings({
      matchId,
      inningsNumber,
      battingTeamId,
      bowlingTeamId,
      strikerId,
      nonStrikerId,
      bowlerAId,
      bowlerBId,
    });

    const match = await prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      select: {
        inningsPerMatch: true,
        innings: {
          where: { inningsNumber: { lt: inningsNumber } },
          orderBy: { inningsNumber: "asc" },
          select: {
            inningsNumber: true,
            battingTeamId: true,
            totalRuns: true,
          },
        },
      },
    });

    const target = calculateTarget({
      inningsNumber,
      inningsPerMatch: match.inningsPerMatch as 2 | 4,
      battingTeamId,
      bowlingTeamId,
      previousInnings: match.innings,
    });

    const correctedInnings = await prisma.innings.update({
      where: { id: innings.id },
      data: { target },
    });

    return NextResponse.json(correctedInnings, { status: 201 });
  } catch (error) {
    console.error("POST start innings error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to start innings.";

    if (message === "Match not found.") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (
      message.includes("already exists") ||
      message === "Opening bowlers must be different."
    ) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    if (
      message === "Match ID is required." ||
      message === "Innings number must be a positive integer." ||
      message === "Batting and bowling teams must be different." ||
      message === "Striker and non-striker must be different players." ||
      message === "Two opening bowlers are required." ||
      message === "Batting team is not part of this match." ||
      message === "Bowling team is not part of this match." ||
      message === "Striker is not among the batting match players." ||
      message === "Non-striker is not among the batting match players." ||
      message === "Bowler A is not among the bowling match players." ||
      message === "Bowler B is not among the bowling match players."
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
