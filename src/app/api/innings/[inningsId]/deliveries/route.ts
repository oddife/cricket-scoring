import { NextResponse } from "next/server";

import { recordPersistentDelivery } from "@/lib/scoring";
import { prisma } from "@/lib/prisma";
import { decideMatchAfterCompletedInnings } from "@/scoring/match-rules";

type RouteContext = {
  params: Promise<{
    inningsId: string;
  }>;
};

const inningsStateSelect = {
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
  inningsNumber: true,
  battingTeamId: true,
  bowlingTeamId: true,
  match: {
    select: {
      id: true,
      inningsPerMatch: true,
      innings: {
        orderBy: { inningsNumber: "asc" as const },
        select: {
          inningsNumber: true,
          battingTeamId: true,
          totalRuns: true,
        },
      },
    },
  },
} as const;

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

    // Only select fields needed for target/match completion and the scorer's
    // local state. The previous include loaded the entire Match record.
    let innings = await prisma.innings.findUniqueOrThrow({
      where: { id: inningsId },
      select: inningsStateSelect,
    });

    // Reaching a target ends the innings immediately, even when overs remain.
    if (innings.status === "LIVE" && innings.target !== null && innings.totalRuns >= innings.target) {
      innings = await prisma.innings.update({
        where: { id: inningsId },
        data: { status: "COMPLETED", completedAt: new Date() },
        select: inningsStateSelect,
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
          where: { id: innings.match.id },
          data: {
            status: "COMPLETED",
            winnerId: decision.winnerTeamId,
            result: decision.tie ? "TIE" : "NORMAL",
          },
        });
      }
    }

    // Return the state already loaded above. Avoid a second database lookup
    // and avoid serializing unrelated Match fields on every delivery.
    const finalInnings = {
      id: innings.id,
      status: innings.status,
      totalRuns: innings.totalRuns,
      wickets: innings.wickets,
      legalBalls: innings.legalBalls,
      currentStrikerId: innings.currentStrikerId,
      currentNonStrikerId: innings.currentNonStrikerId,
      currentBowlerAId: innings.currentBowlerAId,
      currentBowlerBId: innings.currentBowlerBId,
      previousOverBowlerAId: innings.previousOverBowlerAId,
      previousOverBowlerBId: innings.previousOverBowlerBId,
      target: innings.target,
      inningsNumber: innings.inningsNumber,
      battingTeamId: innings.battingTeamId,
      bowlingTeamId: innings.bowlingTeamId,
      match: {
        id: innings.match.id,
        inningsPerMatch: innings.match.inningsPerMatch,
        innings: innings.match.innings,
      },
    };

    return NextResponse.json({
      ...result,
      result,
      delivery: result.delivery,
      innings: finalInnings,
      matchCompleted,
      nextStrikerId: result.nextStrikerId ?? finalInnings.currentStrikerId,
      nextNonStrikerId: result.nextNonStrikerId ?? finalInnings.currentNonStrikerId,
    });
  } catch (error) {
    console.error("POST delivery error:", error);
    const message = error instanceof Error ? error.message : "Failed to record delivery.";
    const status = message.includes("not found") ? 404 : message.includes("already") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
