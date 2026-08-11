import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMatchAwardSuggestions } from "@/lib/league";

type RouteContext = { params: Promise<{ matchId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { matchId } = await params;
    return NextResponse.json(await getMatchAwardSuggestions(matchId));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load award." },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { matchId } = await params;
    const body = await request.json();
    const playerId = typeof body.playerId === "string" ? body.playerId : "";

    const matchPlayer = await prisma.matchPlayer.findUnique({
      where: { matchId_playerId: { matchId, playerId } },
    });
    if (!matchPlayer) {
      return NextResponse.json({ error: "Player did not participate in this match." }, { status: 400 });
    }

    const suggestions = await getMatchAwardSuggestions(matchId);
    const award = await prisma.matchAward.upsert({
      where: { matchId },
      create: {
        matchId,
        suggestedPlayerId: suggestions.suggestedPlayerId,
        awardedPlayerId: playerId,
      },
      update: {
        suggestedPlayerId: suggestions.suggestedPlayerId,
        awardedPlayerId: playerId,
      },
      include: {
        suggestedPlayer: true,
        awardedPlayer: true,
      },
    });

    return NextResponse.json(award);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save Man of the Match." },
      { status: 400 },
    );
  }
}
