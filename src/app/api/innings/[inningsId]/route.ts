import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    inningsId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { inningsId } = await params;

    const innings = await prisma.innings.findUnique({
      where: { id: inningsId },
      include: {
        match: {
          select: {
            id: true,
            oversPerInnings: true,
            inningsPerMatch: true,
            oddOvers: true,
            playersPerTeam: true,
          },
        },
        deliveries: {
          orderBy: [
            { overNumber: "asc" },
            { ballNumber: "asc" },
            { createdAt: "asc" },
          ],
          include: {
            bowler: {
              select: {
                id: true,
                name: true,
                jerseyNumber: true,
              },
            },
            striker: {
              select: {
                id: true,
                name: true,
                jerseyNumber: true,
              },
            },
            nonStriker: {
              select: {
                id: true,
                name: true,
                jerseyNumber: true,
              },
            },
            wicket: {
              select: {
                type: true,
                dismissedPlayerId: true,
                bowlerId: true,
              },
            },
          },
        },
      },
    });

    if (!innings) {
      return NextResponse.json(
        { error: "Innings not found." },
        { status: 404 },
      );
    }

    // The scorer reads `data.deliveries`, so there is no need to send the
    // same delivery array again as `data.innings.deliveries`. This cuts the
    // refresh JSON payload roughly in half as an innings grows.
    const { deliveries, ...inningsWithoutDeliveries } = innings;

    return NextResponse.json({
      innings: inningsWithoutDeliveries,
      deliveries,
    });
  } catch (error) {
    console.error("GET innings error:", error);

    return NextResponse.json(
      { error: "Failed to load innings." },
      { status: 500 },
    );
  }
}