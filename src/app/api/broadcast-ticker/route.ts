import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "broadcast-ticker.json");
const SLOT_COUNT = 5;

const DEFAULT_TICKER = { style: "compact", teamAId: "", teamBId: "", teamAName: "", teamBName: "", score: "0-0", overs: "0.0", target: "", batsman1: { name: "", runs: "0", balls: "0" }, batsman2: { name: "", runs: "0", balls: "0" }, bowler: { name: "", figures: "0-0" }, lastSix: ["0", "0", "0", "0", "0", "0"], toss: "", venue: "", status: "LIVE", outputWidth: 1280, outputHeight: 100, bottomHeight: 30 };

function slotNumber(value: unknown) { const n = Number(value); return Number.isInteger(n) && n >= 1 && n <= SLOT_COUNT ? n : 1; }
function normalizeTicker(value: any) { return { ...DEFAULT_TICKER, ...value, batsman1: { ...DEFAULT_TICKER.batsman1, ...(value?.batsman1 ?? {}) }, batsman2: { ...DEFAULT_TICKER.batsman2, ...(value?.batsman2 ?? {}) }, bowler: { ...DEFAULT_TICKER.bowler, ...(value?.bowler ?? {}) }, lastSix: Array.isArray(value?.lastSix) ? value.lastSix.slice(0, 6).map((v: unknown) => String(v ?? "0")) : DEFAULT_TICKER.lastSix }; }
async function readStore() { try { return JSON.parse(await fs.readFile(FILE_PATH, "utf8")); } catch { return null; } }
async function readSlots() { const raw = await readStore(); if (raw?.slots && typeof raw.slots === "object") return Array.from({ length: SLOT_COUNT }, (_, i) => normalizeTicker(raw.slots[String(i + 1)] ?? DEFAULT_TICKER)); const legacy = normalizeTicker(raw ?? DEFAULT_TICKER); return Array.from({ length: SLOT_COUNT }, (_, i) => i === 0 ? legacy : normalizeTicker(DEFAULT_TICKER)); }
async function writeSlots(slots: unknown[]) { await fs.mkdir(DATA_DIR, { recursive: true }); await fs.writeFile(FILE_PATH, JSON.stringify({ activeSlot: 1, slots: Object.fromEntries(slots.map((slot, i) => [String(i + 1), slot])) }, null, 2), "utf8"); }

export async function GET(request: Request) { try { const url = new URL(request.url); const slot = slotNumber(url.searchParams.get("slot")); const slots = await readSlots(); const ticker = slots[slot - 1]; const teamIds = [ticker.teamAId, ticker.teamBId].filter(Boolean); const teams = teamIds.length ? await prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true, shortName: true, logo: true } }) : []; return NextResponse.json({ ticker, teams, slot, slots: [1, 2, 3, 4, 5] }); } catch (error) { console.error("Failed to load broadcast ticker:", error); return NextResponse.json({ error: "Failed to load broadcast ticker." }, { status: 500 }); } }

export async function PUT(request: Request) { try { const body = await request.json(); const slot = slotNumber(body?.slot); const slots = await readSlots(); const outputWidth = Math.max(640, Math.min(7680, Number(body?.outputWidth) || 1280)); const outputHeight = Math.max(60, Math.min(2160, Number(body?.outputHeight) || 100)); const ticker = normalizeTicker({ ...body, outputWidth, outputHeight }); delete ticker.slot; slots[slot - 1] = ticker; await writeSlots(slots); return NextResponse.json({ success: true, ticker, slot, slots: [1, 2, 3, 4, 5] }); } catch (error) { console.error("Failed to save broadcast ticker:", error); return NextResponse.json({ error: "Failed to save broadcast ticker." }, { status: 500 }); } }
