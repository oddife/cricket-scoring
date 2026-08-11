import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ tournamentId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { tournamentId } = await params;
    const body = await request.json();
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
    if (tournament.status === "COMPLETED") return NextResponse.json({ error: "Completed tournaments cannot change points rules." }, { status: 400 });

    const integer = (value: unknown, fallback: number) => {
      const n = Number(value);
      return Number.isInteger(n) && n >= 0 ? n : fallback;
    };

    const updated = await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        winPoints: integer(body.winPoints, tournament.winPoints),
        lossPoints: integer(body.lossPoints, tournament.lossPoints),
        allowTie: body.allowTie === true,
        tiePoints: integer(body.tiePoints, tournament.tiePoints),
        allowNoResult: body.allowNoResult === true,
        noResultPoints: integer(body.noResultPoints, tournament.noResultPoints),
      },
      include: { teams: { include: { team: true } }, _count: { select: { matches: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update tournament rules." }, { status: 400 });
  }
}
