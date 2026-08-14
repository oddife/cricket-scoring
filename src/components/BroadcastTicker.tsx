"use client";

import { useEffect, useState } from "react";
import styles from "@/app/ticker/ticker.module.css";

export type TickerStyle = "compact" | "classic" | "scoreboard" | "minimal" | "wide";
export type TickerDisplay = { score: boolean; overs: boolean; target: boolean; batsmen: boolean; bowler: boolean; lastSix: boolean; toss: boolean; venue: boolean; teamNames: boolean };
export type TickerData = { style: TickerStyle; teamAId: string; teamBId: string; teamAName?: string; teamBName?: string; score: string; overs: string; target: string; batsman1: { name: string; runs: string; balls: string }; batsman2: { name: string; runs: string; balls: string }; bowler: { name: string; figures: string }; lastSix: string[]; toss: string; venue: string; status: string; display?: TickerDisplay; font?: string; fontSize?: string; outputWidth?: number; outputHeight?: number };
export type TickerTeam = { id: string; name: string; shortName: string | null; logo: string | null };
type Props = { ticker: TickerData; teams: TickerTeam[]; displayOnly?: boolean };

const DEFAULT_DISPLAY: TickerDisplay = { score: true, overs: true, target: true, batsmen: true, bowler: true, lastSix: true, toss: false, venue: true, teamNames: true };

function TeamMark({ team, fallback }: { team?: TickerTeam; fallback: string }) {
  if (team?.logo) return <img className={styles["broadcast-team-logo"]} src={team.logo} alt="" />;
  return <span className={styles["broadcast-team-fallback"]}>{team?.shortName || fallback}</span>;
}

function Balls({ values }: { values: string[] }) {
  return <div className={styles["broadcast-last-six"]} aria-label="Last six balls">{values.slice(0, 6).map((value, index) => { const normalized = String(value || "0").toUpperCase(); const cls = normalized === "W" ? styles.wicket : normalized === "4" || normalized === "6" ? styles.boundary : normalized === "0" ? styles.dot : styles.run; return <span className={`${styles["broadcast-ball"]} ${cls}`} key={`${index}-${normalized}`}>{normalized}</span>; })}</div>;
}

export default function BroadcastTicker({ ticker, teams, displayOnly = false }: Props) {
  const teamA = teams.find((team) => team.id === ticker.teamAId);
  const teamB = teams.find((team) => team.id === ticker.teamBId);
  const display = { ...DEFAULT_DISPLAY, ...(ticker.display ?? {}) };
  const styleClass = styles[`broadcast-style-${ticker.style || "compact"}`] || styles["broadcast-style-compact"];
  const scale = Math.max(0.8, Math.min(1.3, Number(ticker.fontSize ?? "100") / 100));
  const teamAName = ticker.teamAName?.trim() || teamA?.shortName || teamA?.name || "TEAM A";
  const teamBName = ticker.teamBName?.trim() || teamB?.shortName || teamB?.name || "TEAM B";
  const width = Math.max(640, Number(ticker.outputWidth ?? 1280));
  const height = Math.max(60, Number(ticker.outputHeight ?? 150));

  return <div className={`${styles["broadcast-stage"]} ${displayOnly ? styles["broadcast-display"] : ""}`} style={{ width: `${width}px`, height: `${height}px`, fontFamily: ticker.font || "Arial, Helvetica, sans-serif", fontSize: `${scale}em` }}><div className={`${styles["broadcast-strip"]} ${styleClass}`}>
    <div className={styles["broadcast-main-row"]}>
      <div className={styles["broadcast-team-block"]}><TeamMark team={teamA} fallback="A" />{display.teamNames && <div className={styles["broadcast-team-copy"]}><strong>{teamAName}</strong></div>}</div>
      {display.score && <div className={styles["broadcast-score-block"]}><strong>{ticker.score || "0-0"}</strong>{display.overs && <span>{ticker.overs || "0.0"} OV</span>}</div>}
      {!display.score && display.overs && <div className={styles["broadcast-score-block"]}><span>{ticker.overs || "0.0"} OV</span></div>}
      {display.batsmen && <div className={styles["broadcast-batsmen-block"]}><div className={styles["broadcast-batsman"]}><strong>{ticker.batsman1.name || "BATSMAN 1"}</strong><span>{ticker.batsman1.runs || "0"} ({ticker.batsman1.balls || "0"})</span></div><div className={styles["broadcast-batsman"]}><strong>{ticker.batsman2.name || "BATSMAN 2"}</strong><span>{ticker.batsman2.runs || "0"} ({ticker.batsman2.balls || "0"})</span></div></div>}
      {(display.lastSix || display.bowler) && <div className={styles["broadcast-deliveries-block"]}>{display.bowler && <div className={styles["broadcast-deliveries-head"]}><span>BOWLER</span><strong>{ticker.bowler.name || "BOWLER"}</strong></div>}{display.lastSix && <Balls values={ticker.lastSix} />}{display.bowler && <small>{ticker.bowler.figures || "0-0"}</small>}</div>}
      <div className={`${styles["broadcast-team-block"]} ${styles["right-team"]}`}>{display.teamNames && <div className={`${styles["broadcast-team-copy"]} ${styles.right}`}><strong>{teamBName}</strong></div>}<TeamMark team={teamB} fallback="B" /></div>
    </div>

    {(display.target || (display.venue && ticker.venue) || (display.toss && ticker.toss)) && <div className={styles["broadcast-bottom-row"]}>
      {display.target && ticker.target && <div className={styles["broadcast-mini-block"]}><span>TARGET</span><strong>{ticker.target}</strong></div>}
      {display.venue && ticker.venue && <div className={styles["broadcast-toss-block"]}><span>VENUE</span><strong>{ticker.venue}</strong></div>}
      {display.toss && ticker.toss && <div className={styles["broadcast-toss-block"]}><span>OPENING TOSS</span><strong>{ticker.toss}</strong></div>}
    </div>}
  </div></div>;
}

export function useBroadcastTicker() { const [data, setData] = useState<{ ticker: TickerData; teams: TickerTeam[] } | null>(null); const [error, setError] = useState(""); async function load() { try { const response = await fetch("/api/broadcast-ticker", { cache: "no-store" }); const json = await response.json(); if (!response.ok) throw new Error(json.error || "Failed to load ticker."); setData(json); } catch (err) { setError(err instanceof Error ? err.message : "Failed to load ticker."); } } useEffect(() => { void load(); }, []); return { data, error, reload: load }; }
