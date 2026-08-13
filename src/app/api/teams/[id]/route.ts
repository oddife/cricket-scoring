import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const MAINTENANCE_PIN = "2580";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        players: { include: { player: true }, orderBy: { player: { name: "asc" } } },
        tournaments: { include: { tournament: true }, orderBy: { tournament: { name: "asc" } } },
        homeMatches: { include: { teamB: true, winner: true, tournament: true }, orderBy: { createdAt: "desc" } },
        awayMatches: { include: { teamA: true, winner: true, tournament: true }, orderBy: { createdAt: "desc" } },
        battingInnings: { select: { totalRuns: true, wickets: true, legalBalls: true } },
      },
    });

    if (!team) return NextResponse.json({ error: "Team not found." }, { status: 404 });

    const matches = [...team.homeMatches, ...team.awayMatches].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const wins = matches.filter((match) => match.winnerId === team.id).length;

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        logo: team.logo,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      },
      players: team.players.map(({ player }) => ({
        id: player.id,
        name: player.name,
        photo: player.photo,
        jerseyNumber: player.jerseyNumber,
        battingStyle: player.battingStyle,
        bowlingStyle: player.bowlingStyle,
      })),
      tournaments: team.tournaments.map(({ tournament }) => ({
        id: tournament.id,
        name: tournament.name,
        season: tournament.season,
        status: tournament.status,
        logo: tournament.logo,
      })),
      stats: {
        matches: matches.length,
        wins,
        losses: matches.filter((match) => match.winnerId && match.winnerId !== team.id).length,
        runs: team.battingInnings.reduce((sum, innings) => sum + innings.totalRuns, 0),
        wicketsLost: team.battingInnings.reduce((sum, innings) => sum + innings.wickets, 0),
        innings: team.battingInnings.length,
      },
      recentMatches: matches.slice(0, 20).map((match) => ({
        id: match.id,
        createdAt: match.createdAt,
        status: match.status,
        opponent: match.teamAId === team.id ? match.teamB.name : match.teamA.name,
        opponentId: match.teamAId === team.id ? match.teamB.id : match.teamA.id,
        winnerId: match.winnerId,
        tournamentName: match.tournament?.name ?? null,
      })),
    });
  } catch (error) {
    console.error("Failed to load team profile:", error);
    return NextResponse.json({ error: "Failed to load team profile." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const team = await prisma.team.update({
      where: { id },
      data: {
        name: typeof body.name === "string" ? body.name.trim() : undefined,
        shortName: body.shortName === null || typeof body.shortName === "string" ? body.shortName?.trim() || null : undefined,
        logo: body.logo === null || typeof body.logo === "string" ? body.logo : undefined,
      },
    });
    return NextResponse.json(team);
  } catch (error) {
    console.error("Failed to update team:", error);
    return NextResponse.json({ error: "Failed to update team." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    if (String(body.pin ?? "") !== MAINTENANCE_PIN) {
      return NextResponse.json({ error: "Invalid Maintenance PIN." }, { status: 403 });
    }

    const team = await prisma.team.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!team) return NextResponse.json({ error: "Team not found." }, { status: 404 });

    const [matches, innings, matchPlayers] = await Promise.all([
      prisma.match.count({ where: { OR: [{ teamAId: id }, { teamBId: id }, { winnerId: id }, { tossWinnerId: id }] } }),
      prisma.innings.count({ where: { OR: [{ battingTeamId: id }, { bowlingTeamId: id }] } }),
      prisma.matchPlayer.count({ where: { teamId: id } }),
    ]);

    if (matches || innings || matchPlayers) {
      return NextResponse.json(
        { error: "This team has historical match data and cannot be physically deleted. The profile remains available so historical scorecards stay intact.", historicalData: true },
        { status: 409 },
      );
    }

    await prisma.$transaction([
      prisma.teamPlayer.deleteMany({ where: { teamId: id } }),
      prisma.tournamentTeam.deleteMany({ where: { teamId: id } }),
      prisma.team.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true, id: team.id, name: team.name });
  } catch (error) {
    console.error("Failed to delete team:", error);
    return NextResponse.json({ error: "Failed to delete team." }, { status: 500 });
  }
}
