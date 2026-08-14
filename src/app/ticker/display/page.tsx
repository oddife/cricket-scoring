"use client";

import { useEffect, useRef, useState } from "react";
import BroadcastTicker, { TickerData, TickerTeam } from "@/components/BroadcastTicker";

type Player = { id: string; name: string };
type MatchDetail = {
  id: string;
  status: string;
  teamA: TickerTeam;
  teamB: TickerTeam;
  venue?: string | null;
  tossWinner?: { name?: string | null } | null;
  tossDecision?: string | null;
  players: { player: Player; teamId: string }[];
  innings: Array<{
    status: string;
    totalRuns: number;
    wickets: number;
    legalBalls: number;
    target?: number | null;
    runRate?: number | null;
    economy?: number | null;
    leadDeficit?: { kind: "NONE" | "TRAIL" | "LEVEL" | "LEAD"; runs: number };
    currentStrikerId?: string | null;
    currentNonStrikerId?: string | null;
    currentBowlerAId?: string | null;
    deliveries: Array<{
      bowlerId: string;
      strikerId: string;
      runsBat: number;
      runsTotal: number;
      isLegal: boolean;
      extraType?: string | null;
      wicket?: { bowlerId?: string | null } | null;
    }>;
  }>;
};

type DisplayData = { ticker: TickerData; teams: TickerTeam[] };
const REFRESH_OPTIONS = [1, 2, 3, 5, 10];
const MATCH_STORAGE_KEY = "new-castle-cricket-ticker-match";

function playerName(players: MatchDetail["players"], id?: string | null) {
  return players.find((entry) => entry.player.id === id)?.player.name ?? "";
}

function deliveryLabel(delivery: MatchDetail["innings"][number]["deliveries"][number]) {
  if (delivery.wicket) return "W";
  if (delivery.extraType === "WIDE") return "Wd";
  if (delivery.extraType === "NO_BALL") return "Nb";
  return String(delivery.runsTotal ?? 0);
}

function liveTickerFromMatch(match: MatchDetail, ticker: TickerData): TickerData {
  const innings = [...match.innings].reverse().find((item) => item.status === "LIVE") ?? [...match.innings].reverse()[0];
  if (!innings) return ticker;
  const deliveries = innings.deliveries ?? [];
  const strikerId = innings.currentStrikerId;
  const nonStrikerId = innings.currentNonStrikerId;
  const currentBowlerId = deliveries.length ? deliveries[deliveries.length - 1].bowlerId : innings.currentBowlerAId;
  const battingStats = (id?: string | null) => {
    const playerDeliveries = deliveries.filter((delivery) => delivery.strikerId === id);
    return { name: playerName(match.players, id), runs: String(playerDeliveries.reduce((sum, delivery) => sum + delivery.runsBat, 0)), balls: String(playerDeliveries.filter((delivery) => delivery.isLegal).length) };
  };
  const lastSix = deliveries.slice(-6).map(deliveryLabel);
  const position = innings.leadDeficit;
  const leadDeficit = position?.kind === "LEAD" ? `LEAD ${position.runs}` : position?.kind === "TRAIL" ? `DEFICIT ${position.runs}` : position?.kind === "LEVEL" ? "LEVEL" : "";
  const bowlerDeliveries = deliveries.filter((delivery) => delivery.bowlerId === currentBowlerId);
  const legalBalls = bowlerDeliveries.filter((delivery) => delivery.isLegal).length;
  const bowlerOvers = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
  const bowlerRuns = bowlerDeliveries.reduce((sum, delivery) => sum + delivery.runsTotal, 0);
  const bowlerWickets = bowlerDeliveries.filter((delivery) => delivery.wicket?.bowlerId === currentBowlerId).length;
  return {
    ...ticker,
    teamAId: match.teamA.id,
    teamBId: match.teamB.id,
    score: `${innings.totalRuns}-${innings.wickets}`,
    overs: `${Math.floor(innings.legalBalls / 6)}.${innings.legalBalls % 6}`,
    target: innings.target == null ? "" : String(innings.target),
    leadDeficit,
    runRate: innings.runRate == null ? "" : Number(innings.runRate).toFixed(2),
    economy: innings.economy == null ? "" : Number(innings.economy).toFixed(2),
    batsman1: battingStats(strikerId),
    batsman2: battingStats(nonStrikerId),
    bowler: { name: playerName(match.players, currentBowlerId), figures: `${bowlerOvers}-${bowlerRuns}-${bowlerWickets}` },
    lastSix: lastSix.length ? lastSix : ticker.lastSix,
    venue: match.venue ?? ticker.venue,
    toss: match.tossWinner?.name ? `TOSS ${match.tossWinner.name}${match.tossDecision ? ` ${match.tossDecision}` : ""}` : ticker.toss,
    status: match.status || ticker.status,
  };
}

export default function BroadcastTickerDisplayPage() {
  const [data, setData] = useState<DisplayData | null>(null);
  const [refreshSeconds, setRefreshSeconds] = useState(2);
  const [refreshOpen, setRefreshOpen] = useState(false);
  const [refreshHover, setRefreshHover] = useState(false);
  const refreshRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlBackground = html.style.background;
    const previousBodyBackground = body.style.background;
    const previousBodyMargin = body.style.margin;
    html.style.background = "transparent";
    body.style.background = "transparent";
    body.style.margin = "0";

    const load = async () => {
      try {
        const response = await fetch("/api/broadcast-ticker", { cache: "no-store" });
        const json = await response.json();
        if (!response.ok || !json?.ticker) return;
        let nextTicker: TickerData = json.ticker;
        const savedTeams: TickerTeam[] = Array.isArray(json.teams) ? json.teams : [];
        const matchId = window.localStorage.getItem(MATCH_STORAGE_KEY) || "";
        if (matchId) {
          try {
            const matchResponse = await fetch(`/api/matches/${matchId}`, { cache: "no-store" });
            if (matchResponse.ok) {
              const match: MatchDetail = await matchResponse.json();
              nextTicker = liveTickerFromMatch(match, nextTicker);
              const teamsById = new Map(savedTeams.map((team) => [team.id, team]));
              for (const team of [match.teamA, match.teamB]) {
                teamsById.set(team.id, { ...team, players: teamsById.get(team.id)?.players ?? match.players.filter((entry) => entry.teamId === team.id).map((entry) => ({ player: entry.player })) });
              }
              setData({ ticker: nextTicker, teams: [...teamsById.values()] });
              return;
            }
          } catch {
            // Fall back to the saved ticker if the live match cannot be fetched.
          }
        }
        setData({ ticker: nextTicker, teams: savedTeams });
      } catch {
        // Keep the last valid frame.
      }
    };

    void load();
    const timer = window.setInterval(load, refreshSeconds * 1000);
    return () => {
      window.clearInterval(timer);
      html.style.background = previousHtmlBackground;
      body.style.background = previousBodyBackground;
      body.style.margin = previousBodyMargin;
    };
  }, [refreshSeconds]);

  useEffect(() => {
    if (!refreshOpen) return;
    const close = (event: MouseEvent) => {
      if (refreshRef.current && !refreshRef.current.contains(event.target as Node)) setRefreshOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [refreshOpen]);

  if (!data) return <main style={{ width: "100vw", height: "100vh", background: "transparent" }} />;

  return (
    <main style={{ width: "100vw", height: "100vh", minWidth: `${data.ticker.outputWidth ?? 1280}px`, minHeight: `${data.ticker.outputHeight ?? 100}px`, background: "transparent", display: "flex", alignItems: "flex-end", justifyContent: "flex-start", padding: 0, margin: 0, overflow: "auto", position: "relative" }}>
      <BroadcastTicker ticker={data.ticker} teams={data.teams} displayOnly />
      <div ref={refreshRef} onMouseEnter={() => setRefreshHover(true)} onMouseLeave={() => { setRefreshHover(false); setRefreshOpen(false); }} style={{ position: "fixed", top: 8, right: 8, zIndex: 1000, font: "12px Arial, sans-serif", opacity: refreshHover ? 1 : 0, transition: "opacity .2s ease", pointerEvents: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 7px", borderRadius: 5, background: "rgba(0,0,0,.65)", color: "#fff" }}>
          <span>Refresh</span>
          <button type="button" aria-haspopup="listbox" aria-expanded={refreshOpen} onClick={() => setRefreshOpen((open) => !open)} style={{ minWidth: 42, background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,.25)", borderRadius: 3, padding: "1px 4px", font: "12px Arial, sans-serif", cursor: "pointer" }}>{refreshSeconds}s <span style={{ fontSize: 9, marginLeft: 3 }}>▼</span></button>
        </div>
        {refreshOpen && <div role="listbox" aria-label="Refresh interval" style={{ position: "absolute", top: "100%", right: 0, marginTop: 3, minWidth: 48, padding: 2, border: "1px solid rgba(255,255,255,.22)", borderRadius: 4, background: "rgba(10,10,10,.78)", backdropFilter: "blur(4px)", boxShadow: "0 4px 12px rgba(0,0,0,.35)" }}>{REFRESH_OPTIONS.map((seconds) => <button type="button" role="option" aria-selected={refreshSeconds === seconds} key={seconds} onClick={() => { setRefreshSeconds(seconds); setRefreshOpen(false); }} style={{ display: "block", width: "100%", border: 0, borderRadius: 2, background: refreshSeconds === seconds ? "rgba(255,255,255,.18)" : "transparent", color: "#fff", padding: "3px 6px", textAlign: "left", font: "12px Arial, sans-serif", cursor: "pointer" }}>{seconds}s</button>)}</div>}
      </div>
    </main>
  );
}
