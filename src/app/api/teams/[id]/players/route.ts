import { NextResponse } from "next/server";

import {
  addPlayerToTeam,
  createPlayer,
  getTeam,
  removePlayerFromTeam,
  updatePlayer,
} from "@/lib/teams";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id: teamId } = await params;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required." },
        { status: 400 },
      );
    }

    const team = await getTeam(teamId);

    if (!team) {
      return NextResponse.json(
        { error: "Team not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(team.players);
  } catch (error) {
    console.error("GET team players error:", error);

    return NextResponse.json(
      { error: "Failed to load team players." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { id: teamId } = await params;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required." },
        { status: 400 },
      );
    }

    const body = await request.json();

    const playerId =
      typeof body.playerId === "string"
        ? body.playerId.trim()
        : "";

    if (playerId) {
      const membership = await addPlayerToTeam(teamId, playerId);

      return NextResponse.json(membership, { status: 201 });
    }

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        { error: "Player name is required." },
        { status: 400 },
      );
    }

    const jerseyNumber =
      body.jerseyNumber === null ||
      body.jerseyNumber === undefined ||
      body.jerseyNumber === ""
        ? undefined
        : Number(body.jerseyNumber);

    if (
      jerseyNumber !== undefined &&
      (!Number.isInteger(jerseyNumber) || jerseyNumber < 0)
    ) {
      return NextResponse.json(
        { error: "Jersey number must be a valid positive number." },
        { status: 400 },
      );
    }

    const player = await createPlayer({
      name,
      photo: typeof body.photo === "string" ? body.photo : undefined,
      jerseyNumber,
      battingStyle:
        typeof body.battingStyle === "string"
          ? body.battingStyle
          : undefined,
      bowlingStyle:
        typeof body.bowlingStyle === "string"
          ? body.bowlingStyle
          : undefined,
    });

    const membership = await addPlayerToTeam(teamId, player.id);

    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    console.error("POST team player error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to add player.";

    if (message === "Player is already in this team.") {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    if (message === "Team not found." || message === "Player not found.") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Remove a player from this team's current roster.
 * This only deletes the TeamPlayer membership; the global Player remains.
 */
export async function DELETE(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { id: teamId } = await params;
    const body = await request.json().catch(() => ({}));
    const playerId =
      typeof body.playerId === "string" ? body.playerId.trim() : "";

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required." },
        { status: 400 },
      );
    }

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required." },
        { status: 400 },
      );
    }

    await removePlayerFromTeam(teamId, playerId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE team player error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to remove player.";

    if (message === "Player is not a member of this team.") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/*
 * Update an existing player.
 */
export async function PUT(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { id: teamId } = await params;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required." },
        { status: 400 },
      );
    }

    const body = await request.json();

    const playerId =
      typeof body.playerId === "string" ? body.playerId.trim() : "";

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required." },
        { status: 400 },
      );
    }

    const team = await getTeam(teamId);

    if (!team) {
      return NextResponse.json(
        { error: "Team not found." },
        { status: 404 },
      );
    }

    const membership = team.players.find(
      (entry) => entry.player.id === playerId,
    );

    if (!membership) {
      return NextResponse.json(
        { error: "Player is not a member of this team." },
        { status: 404 },
      );
    }

    const updateData: {
      name?: string;
      photo?: string | null;
      jerseyNumber?: number | null;
      battingStyle?: string | null;
      bowlingStyle?: string | null;
    } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string") {
        return NextResponse.json(
          { error: "Player name is invalid." },
          { status: 400 },
        );
      }

      const name = body.name.trim();

      if (!name) {
        return NextResponse.json(
          { error: "Player name is required." },
          { status: 400 },
        );
      }

      updateData.name = name;
    }

    if (body.photo !== undefined) {
      updateData.photo =
        typeof body.photo === "string" ? body.photo.trim() || null : null;
    }

    if (body.jerseyNumber !== undefined) {
      if (body.jerseyNumber === null || body.jerseyNumber === "") {
        updateData.jerseyNumber = null;
      } else {
        const jerseyNumber = Number(body.jerseyNumber);

        if (!Number.isInteger(jerseyNumber) || jerseyNumber < 0) {
          return NextResponse.json(
            { error: "Jersey number must be a valid positive number." },
            { status: 400 },
          );
        }

        updateData.jerseyNumber = jerseyNumber;
      }
    }

    if (body.battingStyle !== undefined) {
      updateData.battingStyle =
        typeof body.battingStyle === "string"
          ? body.battingStyle.trim() || null
          : null;
    }

    if (body.bowlingStyle !== undefined) {
      updateData.bowlingStyle =
        typeof body.bowlingStyle === "string"
          ? body.bowlingStyle.trim() || null
          : null;
    }

    const player = await updatePlayer(playerId, updateData);

    return NextResponse.json({
      id: membership.id,
      player,
    });
  } catch (error) {
    console.error("PUT team player error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to update player.";

    if (
      message === "Player not found." ||
      message === "Player is not a member of this team."
    ) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
