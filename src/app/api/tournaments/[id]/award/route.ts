import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTournamentAwardShortlist } from "@/lib/league";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    return NextResponse.json(await getTournamentAwardShortlist(id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load tournament award." }, { status: 400 });
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
    if (tournament.status !== "COMPLETED") return NextResponse.json({ error: "Complete the tournament before awarding Man of the Series." }, { status: 400 });

    const body = await request.json();
    const playerId = typeof body.playerId === "string" ? body.playerId : "";
    const membership = await prisma.tournamentTeamPlayer.findFirst({ where: { playerId, tournamentTeam: { tournamentId: id } } });
    if (!membership) return NextResponse.json({ error: "Player did not participate in this tournament." }, { status: 400 });

    const shortlist = await getTournamentAwardShortlist(id);
    const suggestedIds = shortlist.candidates.map((candidate) => candidate.player.id);
    const award = await prisma.tournamentAward.upsert({
      where: { tournamentId: id },
      create: { tournamentId: id, suggestedPlayerIds: JSON.stringify(suggestedIds), suggestedPlayers: { connect: suggestedIds.map((playerId) => ({ id: playerId })) }, awardedPlayerId: playerId },
      update: { suggestedPlayerIds: JSON.stringify(suggestedIds), suggestedPlayers: { set: suggestedIds.map((playerId) => ({ id: playerId })) }, awardedPlayerId: playerId },
      include: { awardedPlayer: true, suggestedPlayers: true },
    });
    return NextResponse.json(award);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save Man of the Series." }, { status: 400 });
  }
}
