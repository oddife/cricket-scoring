import { NextResponse } from "next/server";
import { getLeagueTable } from "@/lib/league";

type RouteContext = { params: Promise<{ tournamentId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { tournamentId } = await params;
    return NextResponse.json(await getLeagueTable(tournamentId));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to calculate points table." },
      { status: 400 },
    );
  }
}
