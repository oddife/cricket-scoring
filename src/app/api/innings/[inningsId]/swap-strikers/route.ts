import { NextResponse } from "next/server";

import { swapPersistentStrikers } from "@/lib/scoring";

type RouteContext = {
  params: Promise<{
    inningsId: string;
  }>;
};

export async function POST(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { inningsId } = await params;

    const result =
      await swapPersistentStrikers(inningsId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST swap strikers error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to swap batsmen.";

    return NextResponse.json(
      { error: message },
      {
        status: message === "Innings not found." ? 404 : 400,
      },
    );
  }
}