import { NextResponse } from "next/server";

import { recordPersistentDelivery } from "@/lib/scoring";
import { prisma } from "@/lib/prisma";
import { decideMatchAfterCompletedInnings } from "@/scoring/match-rules";

type RouteContext = {
  params: Promise<{
    inningsId: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { inningsId } = await params;

    if (!inningsId) {
      return NextResponse.json({ error: "Innings ID is required." }, { status: 400 });
    }

    const body = await request.json();
    const bowlerId = typeof body.bowlerId === "string" ? body.bowlerId.trim() : "";
    const strikerId = typeof body.strikerId === "string" ? body.strikerId.trim() : "";
    const nonStrikerId = typeof body.nonStrikerId === "string" ? body.nonStrikerId.trim() : "";

    if (!bowlerId || !strikerId || !nonStrikerId) {
      return NextResponse.json({ error: "Bowler and both batsmen are required." }, { status: 400 });
    }

    const result = await recordPersistentDelivery({
      inningsId,
      bowlerId,
      strikerId,
      nonStrikerId,
      runsBat: typeof body.runsBat === "number" ? body.runsBat : undefined,
      runsExtra: typeof body.runsExtra === "number" ? body.runsExtra : undefined,
      extraType: body.extraType,
      isWicket: body.isWicket === true ? true : undefined,
      wicketType: body.wicketType,
      dismissedPlayerId: typeof body.dismissedPlayerId === "string" ? body.dismissedPlayerId : undefined,
      replacementPlayerId: typeof body.replacementPlayerId === "string" ? body.replacementPlayerId : undefined,
      fielderId: typeof body.fielderId === "string" ? body.fielderId : undefined,
    });

    let innings = await prisma.innings.findUniqueOrThrow({
      where: { id: inningsId },
      include: {
        match: {
          include: {
            innings: {
              orderBy: { inningsNumber: "asc" },
              select: { inningsNumber: true, battingTeamId: true, totalRuns: true },
            },
          },
        },
      },
    });

    // Reaching a target ends the innings immediately, even when overs remain.
    if (innings.status === "LIVE" && innings.target !== null && innings.totalRuns >= innings.target) {
      innings = await prisma.innings.update({
        where: { id: inningsId },
        data: { status: "COMPLETED", completedAt: new Date() },
        include: {
          match: {
            include: {
              innings: {
                orderBy: { inningsNumber: "asc" },
                select: { inningsNumber: true, battingTeamId: true, totalRuns: true },
              },
            },
          },
        },
      });
    }

    let matchCompleted = false;

    if (innings.status === "COMPLETED") {
      const previousInnings = innings.match.innings
        .filter((item) => item.inningsNumber < innings.inningsNumber)
        .map((item) => ({
          inningsNumber: item.inningsNumber,
          battingTeamId: item.battingTeamId,
          totalRuns: item.totalRuns,
        }));

      const decision = decideMatchAfterCompletedInnings({
        inningsNumber: innings.inningsNumber,
        inningsPerMatch: innings.match.inningsPerMatch as 2 | 4,
        battingTeamId: innings.battingTeamId,
        bowlingTeamId: innings.bowlingTeamId,
        currentInningsRuns: innings.totalRuns,
        previousInnings,
        target: innings.target,
      });

      if (decision.completed) {
        matchCompleted = true;
        await prisma.match.update({
          where: { id: innings.matchId },
          data: {
            status: "COMPLETED",
            winnerId: decision.winnerTeamId,
            result: decision.tie ? "TIE" : "NORMAL",
          },
        });
      }
    }

    const finalInnings = await prisma.innings.findUnique({
      where: { id: inningsId },
      select: {
        id: true,
        status: true,
        totalRuns: true,
        wickets: true,
        legalBalls: true,
        currentStrikerId: true,
        currentNonStrikerId: true,
        currentBowlerAId: true,
        currentBowlerBId: true,
        previousOverBowlerAId: true,
        previousOverBowlerBId: true,
        target: true,
      },
    });

    return NextResponse.json({
      ...result,
      result,
      innings: finalInnings,
      matchCompleted,
      nextStrikerId: result.nextStrikerId ?? finalInnings?.currentStrikerId,
      nextNonStrikerId: result.nextNonStrikerId ?? finalInnings?.currentNonStrikerId,
    });
  } catch (error) {
    console.error("POST delivery error:", error);
    const message = error instanceof Error ? error.message : "Failed to record delivery.";
    const status = message.includes("not found") ? 404 : message.includes("already") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
