import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMatchAwardSuggestions } from "@/lib/league";

type RouteContext = { params: Promise<{ matchId: string }> };

function deriveWinner(match: { teamAId: string; teamBId: string; innings: Array<{ battingTeamId: string; totalRuns: number }> }) {
  const totals = new Map<string, number>([
    [match.teamAId, 0],
    [match.teamBId, 0],
  ]);
  for (const innings of match.innings) {
    totals.set(innings.battingTeamId, (totals.get(innings.battingTeamId) ?? 0) + innings.totalRuns);
  }
  const a = totals.get(match.teamAId) ?? 0;
  const b = totals.get(match.teamBId) ?? 0;
  return a === b ? null : a > b ? match.teamAId : match.teamBId;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { matchId } = await params;
    const body = await request.json().catch(() => ({}));
    const requestedStatus = String(body?.status ?? "").toUpperCase();

    if (requestedStatus === "COMPLETED") {
      const match = await prisma.match.findUnique({ where: { id: matchId }, include: { innings: true } });
      if (!match) return NextResponse.json({ error: "Match not found." }, { status: 404 });

      const result = body.result === "TIE" ? "TIE" : body.result === "NO_RESULT" ? "NO_RESULT" : "NORMAL";
      if (match.tournamentId && (result === "TIE" || result === "NO_RESULT")) {
        const tournament = await prisma.tournament.findUnique({ where: { id: match.tournamentId } });
        if (result === "TIE" && !tournament?.allowTie) return NextResponse.json({ error: "Tie is disabled for this tournament." }, { status: 400 });
        if (result === "NO_RESULT" && !tournament?.allowNoResult) return NextResponse.json({ error: "No Result is disabled for this tournament." }, { status: 400 });
      }

      const explicitWinnerId = typeof body.winnerId === "string" ? body.winnerId : null;
      const derivedWinnerId = explicitWinnerId === match.teamAId || explicitWinnerId === match.teamBId ? explicitWinnerId : deriveWinner(match);
      const finalResult = result === "NORMAL" && !derivedWinnerId ? "TIE" : result;

      if (finalResult === "TIE" && match.tournamentId) {
        const tournament = await prisma.tournament.findUnique({ where: { id: match.tournamentId } });
        if (!tournament?.allowTie) return NextResponse.json({ error: "The match is tied, but Tie is disabled for this tournament." }, { status: 400 });
      }

      const updated = await prisma.match.update({
        where: { id: matchId },
        data: {
          status: "COMPLETED",
          result: finalResult,
          winnerId: finalResult === "NORMAL" ? derivedWinnerId : null,
        },
      });

      const suggestions = await getMatchAwardSuggestions(matchId);
      await prisma.matchAward.upsert({
        where: { matchId },
        create: { matchId, suggestedPlayerId: suggestions.suggestedPlayerId },
        update: { suggestedPlayerId: suggestions.suggestedPlayerId },
      });

      return NextResponse.json(updated);
    }

    if (requestedStatus === "ABANDONED") {
      const match = await prisma.match.findUnique({ where: { id: matchId } });
      if (!match) return NextResponse.json({ error: "Match not found." }, { status: 404 });
      if (match.tournamentId) {
        const tournament = await prisma.tournament.findUnique({ where: { id: match.tournamentId } });
        if (!tournament?.allowNoResult) return NextResponse.json({ error: "No Result is disabled for this tournament." }, { status: 400 });
      }
      const updated = await prisma.match.update({ where: { id: matchId }, data: { status: "ABANDONED", result: "NO_RESULT", winnerId: null } });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Only COMPLETED or ABANDONED status can be set from this endpoint." }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/matches/[matchId] error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update match." }, { status: 500 });
  }
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { matchId } = await params;
    if (!matchId) return NextResponse.json({ error: "Match ID is required." }, { status: 400 });

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        teamA: true,
        teamB: true,
        tossWinner: true,
        winner: true,
        award: { include: { suggestedPlayer: true, awardedPlayer: true } },
        players: { orderBy: { addedAt: "asc" }, include: { player: true, team: true } },
        innings: { orderBy: { inningsNumber: "asc" }, include: { deliveries: { orderBy: { createdAt: "asc" }, include: { wicket: true } } } },
      },
    });

    if (!match) return NextResponse.json({ error: "Match not found." }, { status: 404 });
    return NextResponse.json(match);
  } catch (error) {
    console.error("GET /api/matches/[matchId] error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load match." }, { status: 500 });
  }
}