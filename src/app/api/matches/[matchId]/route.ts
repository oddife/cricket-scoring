import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    matchId: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { matchId } = await params;
    const body = await request.json().catch(() => ({}));

    if (!matchId) {
      return NextResponse.json(
        { error: "Match ID is required." },
        { status: 400 },
      );
    }

    if (String(body?.status ?? "").toUpperCase() !== "COMPLETED") {
      return NextResponse.json(
        { error: "Only COMPLETED status can be set from this endpoint." },
        { status: 400 },
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { innings: true },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found." },
        { status: 404 },
      );
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/matches/[matchId] error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Failed to complete match.",
      },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: Request,
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

    const match = await prisma.match.findUnique({
      where: {
        id: matchId,
      },
      include: {
        teamA: true,
        teamB: true,
        tossWinner: true,
        winner: true,
        players: {
          orderBy: {
            addedAt: "asc",
          },
          include: {
            player: true,
            team: true,
          },
        },
        innings: {
          orderBy: {
            inningsNumber: "asc",
          },
          include: {
            deliveries: {
              orderBy: {
                createdAt: "asc",
              },
              include: {
                wicket: true,
              },
            },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error(
      "GET /api/matches/[matchId] error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load match.",
      },
      { status: 500 },
    );
  }
}