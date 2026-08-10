import { NextResponse } from "next/server";
import { setupMatchPlayers } from "@/lib/matches";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ matchId: string }>;
  },
) {
  try {
    const { matchId } = await context.params;
    const body = await request.json();

    if (!body.teamAId || !body.teamBId) {
      return NextResponse.json(
        { error: "Both match teams are required." },
        { status: 400 },
      );
    }

    const teamAPlayers = Array.isArray(body.teamAPlayers)
      ? body.teamAPlayers
      : [];
    const teamBPlayers = Array.isArray(body.teamBPlayers)
      ? body.teamBPlayers
      : [];

    const teamAResult = await setupMatchPlayers({
      matchId,
      teamId: body.teamAId,
      players: teamAPlayers,
    });

    const teamBResult = await setupMatchPlayers({
      matchId,
      teamId: body.teamBId,
      players: teamBPlayers,
    });

    return NextResponse.json({
      success: true,
      teamA: teamAResult,
      teamB: teamBResult,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save match players.",
      },
      { status: 400 },
    );
  }
}
