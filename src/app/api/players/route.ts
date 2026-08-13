import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(players);
  } catch (error) {
    console.error("Failed to load players:", error);
    return NextResponse.json({ error: "Failed to load players." }, { status: 500 });
  }
}
