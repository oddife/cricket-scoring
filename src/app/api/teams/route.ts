import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
      include: {
        players: {
          where: { player: { archivedAt: null } },
          include: { player: true },
          orderBy: { player: { name: "asc" } },
        },
      },
    });
    return NextResponse.json(teams);
  } catch (error) {
    console.error("Failed to load teams:", error);
    return NextResponse.json({ error: "Failed to load teams." }, { status: 500 });
  }
}
