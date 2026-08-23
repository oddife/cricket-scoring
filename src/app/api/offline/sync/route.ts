import { NextResponse } from "next/server";

/**
 * Offline sync contract placeholder.
 *
 * The client queues operations locally first. This endpoint establishes the
 * authenticated server boundary for replaying them. Scoring-specific replay
 * will be wired here only after the operation payloads are mapped to the
 * existing idempotent scoring actions.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || typeof body.operationId !== "string" || typeof body.type !== "string") {
      return NextResponse.json({ error: "Invalid offline operation" }, { status: 400 });
    }

    return NextResponse.json(
      {
        accepted: false,
        operationId: body.operationId,
        error: "Offline operation type is not enabled yet",
      },
      { status: 409 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
