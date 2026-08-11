import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTournamentAwardShortlist } from "@/lib/league";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const tournament = await prisma.tournament.findUnique({ where: { id }, include: { matches: { select: { status: true } } } });
    if (!tournament) return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
    if (tournament.status === "COMPLETED") return NextResponse.json(tournament);

    const unfinished = tournament.matches.filter((match) => match.status === "LIVE" || match.status === "SCHEDULED");
    if (unfinished.length > 0) return NextResponse.json({ error: "All scheduled/live matches must be resolved before completing the tournament." }, { status: 400 });

    const updated = await prisma.tournament.update({ where: { id }, data: { status: "COMPLETED", completedAt: new Date() } });
    const shortlist = await getTournamentAwardShortlist(id);
    const suggestedIds = shortlist.candidates.map((candidate) => candidate.player.id);
    await prisma.tournamentAward.upsert({
      where: { tournamentId: id },
      create: { tournamentId: id, suggestedPlayerIds: JSON.stringify(suggestedIds), suggestedPlayers: { connect: suggestedIds.map((playerId) => ({ id: playerId })) } },
      update: { suggestedPlayerIds: JSON.stringify(suggestedIds), suggestedPlayers: { set: suggestedIds.map((playerId) => ({ id: playerId })) } },
    });
    return NextResponse.json({ tournament: updated, shortlist: shortlist.candidates });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to complete tournament." }, { status: 400 });
  }
}
