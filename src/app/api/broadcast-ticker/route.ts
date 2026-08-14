import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "broadcast-ticker.json");

const DEFAULT_TICKER = {
  style: "compact", teamAId: "", teamBId: "", teamAName: "", teamBName: "", score: "0-0", overs: "0.0", target: "",
  batsman1: { name: "", runs: "0", balls: "0" }, batsman2: { name: "", runs: "0", balls: "0" }, bowler: { name: "", figures: "0-0" },
  lastSix: ["0", "0", "0", "0", "0", "0"], toss: "", venue: "", status: "LIVE", outputWidth: 1280, outputHeight: 150,
};

async function readTicker() { try { const raw = await fs.readFile(FILE_PATH, "utf8"); return { ...DEFAULT_TICKER, ...JSON.parse(raw) }; } catch { return DEFAULT_TICKER; } }

export async function GET() {
  try { const ticker = await readTicker(); const teamIds = [ticker.teamAId, ticker.teamBId].filter(Boolean); const teams = teamIds.length ? await prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true, shortName: true, logo: true } }) : []; return NextResponse.json({ ticker, teams }); }
  catch (error) { console.error("Failed to load broadcast ticker:", error); return NextResponse.json({ error: "Failed to load broadcast ticker." }, { status: 500 }); }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const outputWidth = Math.max(640, Math.min(7680, Number(body?.outputWidth) || 1280));
    const outputHeight = Math.max(60, Math.min(2160, Number(body?.outputHeight) || 150));
    const ticker = { ...DEFAULT_TICKER, ...body, outputWidth, outputHeight,
      batsman1: { ...DEFAULT_TICKER.batsman1, ...(body?.batsman1 ?? {}) }, batsman2: { ...DEFAULT_TICKER.batsman2, ...(body?.batsman2 ?? {}) }, bowler: { ...DEFAULT_TICKER.bowler, ...(body?.bowler ?? {}) },
      lastSix: Array.isArray(body?.lastSix) ? body.lastSix.slice(0, 6).map((value: unknown) => String(value ?? "0")) : DEFAULT_TICKER.lastSix,
    };
    await fs.mkdir(DATA_DIR, { recursive: true }); await fs.writeFile(FILE_PATH, JSON.stringify(ticker, null, 2), "utf8"); return NextResponse.json({ success: true, ticker });
  } catch (error) { console.error("Failed to save broadcast ticker:", error); return NextResponse.json({ error: "Failed to save broadcast ticker." }, { status: 500 }); }
}
