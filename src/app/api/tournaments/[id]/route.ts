import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Tournament ID is required." },
        { status: 400 },
      );
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found." },
        { status: 404 },
      );
    }

    await prisma.$transaction(async (tx) => {
      // Match.tournamentId does not use cascade delete, so remove
      // matches first. Their innings, deliveries, wickets and
      // match-player records cascade from the Match relation.
      await tx.match.deleteMany({
        where: { tournamentId: id },
      });

      await tx.tournament.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      id: tournament.id,
      name: tournament.name,
    });
  } catch (error) {
    console.error("Failed to delete tournament:", error);

    return NextResponse.json(
      { error: "Failed to delete tournament." },
      { status: 500 },
    );
  }
}
