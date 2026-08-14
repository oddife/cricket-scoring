import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "broadcast-ticker.json");
const SLOT_COUNT = 5;
const DEFAULT_BOTTOM_SLOTS = ["leadDeficit", "none", "runRate", "economy", "toss"];
const DEFAULT_CUSTOM_BOTTOM_TEXT = ["", "", "", "", ""];

const DEFAULT_TICKER = {
  style: "compact", teamAId: "", teamBId: "", teamAName: "", teamBName: "", score: "0-0", overs: "0.0", target: "",
  leadDeficit: "", runRate: "", economy: "", batsman1: { name: "", runs: "0", balls: "0" }, batsman2: { name: "", runs: "0", balls: "0" },
  bowler: { name: "", figures: "0-0" }, lastSix: ["0", "0", "0", "0", "0", "0"], toss: "", venue: "", status: "LIVE",
  display: { score: true, overs: true, target: true, leadDeficit: false, runRate: false, economy: false, batsmen: true, bowler: true, lastSix: true, toss: false, venue: true, teamNames: true },
  bottomSlots: DEFAULT_BOTTOM_SLOTS, customBottomText: DEFAULT_CUSTOM_BOTTOM_TEXT, outputWidth: 1280, outputHeight: 100, bottomHeight: 30,
};

function slotNumber(value: unknown) { const n = Number(value); return Number.isInteger(n) && n >= 1 && n <= SLOT_COUNT ? n : 1; }
function normalizeTicker(value: any) {
  const slots = Array.isArray(value?.bottomSlots) ? value.bottomSlots.slice(0, SLOT_COUNT).map((v: unknown) => String(v ?? "none")) : DEFAULT_BOTTOM_SLOTS;
  while (slots.length < SLOT_COUNT) slots.push("none");
  const customBottomText = Array.isArray(value?.customBottomText) ? value.customBottomText.slice(0, SLOT_COUNT).map((v: unknown) => String(v ?? "")) : DEFAULT_CUSTOM_BOTTOM_TEXT;
  while (customBottomText.length < SLOT_COUNT) customBottomText.push("");
  return {
    ...DEFAULT_TICKER, ...value,
    batsman1: { ...DEFAULT_TICKER.batsman1, ...(value?.batsman1 ?? {}) },
    batsman2: { ...DEFAULT_TICKER.batsman2, ...(value?.batsman2 ?? {}) },
    bowler: { ...DEFAULT_TICKER.bowler, ...(value?.bowler ?? {}) },
    display: { ...DEFAULT_TICKER.display, ...(value?.display ?? {}) },
    bottomSlots: slots, customBottomText,
    lastSix: Array.isArray(value?.lastSix) ? value.lastSix.slice(0, 6).map((v: unknown) => String(v ?? "0")) : DEFAULT_TICKER.lastSix,
  };
}
async function readStore() { try { return JSON.parse(await fs.readFile(FILE_PATH, "utf8")); } catch { return null; } }
async function readSlots() { const raw = await readStore(); if (raw?.slots && typeof raw.slots === "object") return { activeSlot: slotNumber(raw.activeSlot), slots: Array.from({ length: SLOT_COUNT }, (_, i) => normalizeTicker(raw.slots[String(i + 1)] ?? DEFAULT_TICKER)) }; const legacy = normalizeTicker(raw ?? DEFAULT_TICKER); return { activeSlot: 1, slots: Array.from({ length: SLOT_COUNT }, (_, i) => i === 0 ? legacy : normalizeTicker(DEFAULT_TICKER)) }; }
async function writeSlots(slots: unknown[], activeSlot: number) { await fs.mkdir(DATA_DIR, { recursive: true }); await fs.writeFile(FILE_PATH, JSON.stringify({ activeSlot: slotNumber(activeSlot), slots: Object.fromEntries(slots.map((slot, i) => [String(i + 1), slot])) }, null, 2), "utf8"); }

export async function GET(request: Request) { try { const url = new URL(request.url); const store = await readSlots(); const requested = url.searchParams.get("slot"); const slot = requested == null ? store.activeSlot : slotNumber(requested); const ticker = store.slots[slot - 1]; const teamIds = [ticker.teamAId, ticker.teamBId].filter(Boolean); const teams = teamIds.length ? await prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true, shortName: true, logo: true } }) : []; return NextResponse.json({ ticker, teams, slot, activeSlot: store.activeSlot, slots: [1, 2, 3, 4, 5] }); } catch (error) { console.error("Failed to load broadcast ticker:", error); return NextResponse.json({ error: "Failed to load broadcast ticker." }, { status: 500 }); } }

export async function PUT(request: Request) { try { const body = await request.json(); const slot = slotNumber(body?.slot); const slotsStore = await readSlots(); const outputWidth = Math.max(640, Math.min(7680, Number(body?.outputWidth) || 1280)); const outputHeight = Math.max(60, Math.min(2160, Number(body?.outputHeight) || 100)); const ticker = normalizeTicker({ ...body, outputWidth, outputHeight }); delete ticker.slot; slotsStore.slots[slot - 1] = ticker; await writeSlots(slotsStore.slots, slot); return NextResponse.json({ success: true, ticker, slot, activeSlot: slot, slots: [1, 2, 3, 4, 5] }); } catch (error) { console.error("Failed to save broadcast ticker:", error); return NextResponse.json({ error: "Failed to save broadcast ticker." }, { status: 500 }); } }
