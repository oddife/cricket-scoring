import { NextResponse } from "next/server";
import { manualChangePersistentState } from "@/lib/scoring";

type RouteContext = { params: Promise<{ inningsId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { inningsId } = await params;
    const body = await request.json();
    const change = body.change;
    const playerId = typeof body.playerId === "string" ? body.playerId.trim() : "";
    if (!["STRIKER", "NON_STRIKER", "BOWLER_A", "BOWLER_B"].includes(change)) {
      return NextResponse.json({ error: "Invalid manual change." }, { status: 400 });
    }
    return NextResponse.json(await manualChangePersistentState(inningsId, change, playerId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to change player.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
