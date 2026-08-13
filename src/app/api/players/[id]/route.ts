import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const MAINTENANCE_PIN = "2580";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        teams: {
          include: { team: true },
          orderBy: { team: { name: "asc" } },
        },
        tournamentTeams: {
          include: { tournamentTeam: { include: { tournament: true, team: true } } },
          orderBy: { tournamentTeam: { tournament: { name: "asc" } } },
        },
        matchPlayers: {
          include: { match: { include: { teamA: true, teamB: true, tournament: true } }, team: true },
          orderBy: { addedAt: "desc" },
        },
        strikerDeliveries: {
          select: { runsBat: true, isLegal: true, extraType: true },
        },
        wicketsTaken: { select: { id: true } },
        dismissedIn: { select: { id: true } },
      },
    });

    if (!player) return NextResponse.json({ error: "Player not found." }, { status: 404 });

    const runs = player.strikerDeliveries.reduce((sum, d) => sum + d.runsBat, 0);
    const battingBalls = player.strikerDeliveries.filter(
      (d) => d.isLegal && d.extraType !== "WIDE",
    ).length;

    return NextResponse.json({
      player: {
        id: player.id,
        name: player.name,
        photo: player.photo,
        jerseyNumber: player.jerseyNumber,
        battingStyle: player.battingStyle,
        bowlingStyle: player.bowlingStyle,
        createdAt: player.createdAt,
        updatedAt: player.updatedAt,
      },
      teams: player.teams.map(({ team }) => ({
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        logo: team.logo,
      })),
      tournaments: player.tournamentTeams.map(({ tournamentTeam }) => ({
        id: tournamentTeam.tournament.id,
        name: tournamentTeam.tournament.name,
        season: tournamentTeam.tournament.season,
        teamId: tournamentTeam.team.id,
        teamName: tournamentTeam.team.name,
      })),
      stats: {
        matches: new Set(player.matchPlayers.map((mp) => mp.matchId)).size,
        runs,
        battingBalls,
        wickets: player.wicketsTaken.length,
        dismissals: player.dismissedIn.length,
      },
      recentMatches: player.matchPlayers.slice(0, 20).map((mp) => ({
        id: mp.match.id,
        addedAt: mp.addedAt,
        role: mp.role,
        teamId: mp.teamId,
        teamName: mp.team.name,
        teamA: mp.match.teamA.name,
        teamB: mp.match.teamB.name,
        tournamentName: mp.match.tournament?.name ?? null,
        status: mp.match.status,
      })),
    });
  } catch (error) {
    console.error("Failed to load player profile:", error);
    return NextResponse.json({ error: "Failed to load player profile." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const player = await prisma.player.update({
      where: { id },
      data: {
        name: typeof body.name === "string" ? body.name.trim() : undefined,
        jerseyNumber: body.jerseyNumber === null || body.jerseyNumber === "" ? null : Number(body.jerseyNumber),
        battingStyle: typeof body.battingStyle === "string" ? body.battingStyle.trim() || null : undefined,
        bowlingStyle: typeof body.bowlingStyle === "string" ? body.bowlingStyle.trim() || null : undefined,
        photo: body.photo === null || typeof body.photo === "string" ? body.photo : undefined,
      },
    });
    return NextResponse.json(player);
  } catch (error) {
    console.error("Failed to update player:", error);
    return NextResponse.json({ error: "Failed to update player." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    if (String(body.pin ?? "") !== MAINTENANCE_PIN) {
      return NextResponse.json({ error: "Invalid Maintenance PIN." }, { status: 403 });
    }

    const player = await prisma.player.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!player) return NextResponse.json({ error: "Player not found." }, { status: 404 });

    const [deliveries, wickets, awards, matchPlayers, teamLinks, tournamentLinks] = await Promise.all([
      prisma.delivery.count({ where: { OR: [{ strikerId: id }, { nonStrikerId: id }, { bowlerId: id }] } }),
      prisma.wicket.count({ where: { OR: [{ dismissedPlayerId: id }, { bowlerId: id }, { fielderId: id }] } }),
      prisma.matchAward.count({ where: { OR: [{ suggestedPlayerId: id }, { awardedPlayerId: id }] } }),
      prisma.matchPlayer.count({ where: { playerId: id } }),
      prisma.teamPlayer.count({ where: { playerId: id } }),
      prisma.tournamentTeamPlayer.count({ where: { playerId: id } }),
    ]);

    if (deliveries || wickets || awards || matchPlayers) {
      return NextResponse.json(
        { error: "This player has historical match data and cannot be physically deleted. The profile remains available so historical scorecards stay intact.", historicalData: true },
        { status: 409 },
      );
    }

    await prisma.$transaction([
      prisma.teamPlayer.deleteMany({ where: { playerId: id } }),
      prisma.tournamentTeamPlayer.deleteMany({ where: { playerId: id } }),
      prisma.player.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true, id: player.id, name: player.name, removedTeamLinks: teamLinks, removedTournamentLinks: tournamentLinks });
  } catch (error) {
    console.error("Failed to delete player:", error);
    return NextResponse.json({ error: "Failed to delete player." }, { status: 500 });
  }
}
