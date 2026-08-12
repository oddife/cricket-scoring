import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id: tournamentId } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        teams: {
          include: {
            team: {
              include: {
                _count: { select: { players: true } },
              },
            },
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(tournament.teams);
  } catch (error) {
    console.error("GET tournament teams error:", error);
    return NextResponse.json(
      { error: "Failed to load teams." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { id: tournamentId } = await params;
    const body = await request.json();

    const teamId =
      typeof body.teamId === "string" ? body.teamId.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const shortName =
      typeof body.shortName === "string" ? body.shortName.trim() : "";

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found." },
        { status: 404 },
      );
    }

    if (teamId) {
      const team = await prisma.team.findUnique({ where: { id: teamId } });

      if (!team) {
        return NextResponse.json(
          { error: "Selected team not found." },
          { status: 404 },
        );
      }

      const existingMembership = await prisma.tournamentTeam.findFirst({
        where: { tournamentId, teamId: team.id },
      });

      if (existingMembership) {
        return NextResponse.json(
          { error: "This team is already in this tournament." },
          { status: 409 },
        );
      }

      const membership = await prisma.tournamentTeam.create({
        data: { tournamentId, teamId: team.id },
        include: {
          team: {
            include: { _count: { select: { players: true } } },
          },
        },
      });

      return NextResponse.json(membership, { status: 201 });
    }

    if (!name) {
      return NextResponse.json(
        { error: "Team name is required." },
        { status: 400 },
      );
    }

    const existingMembership = await prisma.tournamentTeam.findFirst({
      where: {
        tournamentId,
        team: { name: { equals: name } },
      },
      include: {
        team: { include: { _count: { select: { players: true } } } },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "A team with this name is already in this tournament." },
        { status: 409 },
      );
    }

    let team = await prisma.team.findFirst({ where: { name } });

    if (!team) {
      team = await prisma.team.create({
        data: { name, shortName: shortName || null },
      });
    } else if (shortName && !team.shortName) {
      team = await prisma.team.update({
        where: { id: team.id },
        data: { shortName },
      });
    }

    const membership = await prisma.tournamentTeam.create({
      data: { tournamentId, teamId: team.id },
      include: {
        team: {
          include: { _count: { select: { players: true } } },
        },
      },
    });

    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    console.error("POST tournament team error:", error);
    return NextResponse.json(
      { error: "Failed to create team." },
      { status: 500 },
    );
  }
}

/**
 * Remove a team from this tournament only.
 * The global Team record and all historical data remain intact.
 */
export async function DELETE(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { id: tournamentId } = await params;
    const body = await request.json().catch(() => ({}));
    const teamId =
      typeof body.teamId === "string" ? body.teamId.trim() : "";

    if (!tournamentId) {
      return NextResponse.json(
        { error: "Tournament ID is required." },
        { status: 400 },
      );
    }

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required." },
        { status: 400 },
      );
    }

    const membership = await prisma.tournamentTeam.findFirst({
      where: { tournamentId, teamId },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Team is not in this tournament." },
        { status: 404 },
      );
    }

    await prisma.tournamentTeam.delete({
      where: { id: membership.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE tournament team error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to remove team.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
