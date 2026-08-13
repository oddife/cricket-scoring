import { NextResponse } from "next/server";
import { undoPersistentAction } from "@/lib/scoring-actions";

type RouteContext = { params: Promise<{ inningsId: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const { inningsId } = await params;
    return NextResponse.json(await undoPersistentAction(inningsId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to undo action.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
