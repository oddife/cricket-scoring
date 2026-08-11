import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Tournament ID is required." }, { status: 400 });
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { id: true, status: true, winPoints: true, lossPoints: true, allowTie: true, tiePoints: true, allowNoResult: true, noResultPoints: true },
    });
    if (!tournament) return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
    return NextResponse.json(tournament);
  } catch (error) {
    console.error("Failed to load tournament:", error);
    return NextResponse.json({ error: "Failed to load tournament." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Tournament ID is required." }, { status: 400 });
    const body = await request.json();
    const existing = await prisma.tournament.findUnique({ where: { id }, select: { status: true, winPoints: true, lossPoints: true, allowTie: true, tiePoints: true, allowNoResult: true, noResultPoints: true } });
    if (!existing) return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
    if (existing.status === "COMPLETED") return NextResponse.json({ error: "Completed tournaments cannot have their points rules changed." }, { status: 400 });
    const intValue = (value: unknown, fallback: number) => {
      const n = Number(value);
      return Number.isInteger(n) && n >= 0 ? n : fallback;
    };
    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        winPoints: intValue(body.winPoints, existing.winPoints),
        lossPoints: intValue(body.lossPoints, existing.lossPoints),
        allowTie: Boolean(body.allowTie),
        tiePoints: intValue(body.tiePoints, existing.tiePoints),
        allowNoResult: Boolean(body.allowNoResult),
        noResultPoints: intValue(body.noResultPoints, existing.noResultPoints),
      },
      select: { id: true, status: true, winPoints: true, lossPoints: true, allowTie: true, tiePoints: true, allowNoResult: true, noResultPoints: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update tournament points rules:", error);
    return NextResponse.json({ error: "Failed to update tournament points rules." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Tournament ID is required." }, { status: 400 });
    const tournament = await prisma.tournament.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!tournament) return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
    await prisma.$transaction(async (tx) => {
      await tx.match.deleteMany({ where: { tournamentId: id } });
      await tx.tournament.delete({ where: { id } });
    });
    return NextResponse.json({ success: true, id: tournament.id, name: tournament.name });
  } catch (error) {
    console.error("Failed to delete tournament:", error);
    return NextResponse.json({ error: "Failed to delete tournament." }, { status: 500 });
  }
}
