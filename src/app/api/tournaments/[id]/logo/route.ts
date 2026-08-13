import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const MAINTENANCE_PIN = process.env.MAINTENANCE_PIN ?? "2580";

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.pin !== MAINTENANCE_PIN) {
      return NextResponse.json({ error: "Invalid maintenance PIN." }, { status: 403 });
    }

    if (typeof body.logo !== "string" && body.logo !== null) {
      return NextResponse.json({ error: "Logo must be an image data URL or null." }, { status: 400 });
    }

    const tournament = await prisma.tournament.update({
      where: { id },
      data: { logo: body.logo },
      select: { id: true, name: true, logo: true },
    });

    return NextResponse.json(tournament);
  } catch (error) {
    console.error("Failed to update tournament logo:", error);
    return NextResponse.json({ error: "Failed to update tournament logo." }, { status: 500 });
  }
}
