"use client";

import { useEffect, useMemo, useState } from "react";
import BroadcastTicker, { TickerData, TickerTeam } from "@/components/BroadcastTicker";
import styles from "./ticker.module.css";

type Player = { id: string; name: string };
type Team = TickerTeam & { players: { player: Player }[] };
type SavedResponse = { ticker: TickerData; teams: TickerTeam[] };
type LiveMatch = { id: string; matchNumber?: number | null; teamA: TickerTeam; teamB: TickerTeam; venue?: string | null; status: string };
type MatchDetail = LiveMatch & {
  tossWinner?: { name?: string | null } | null;
  tossDecision?: string | null;
  players: { player: Player; teamId: string }[];
  innings: Array<{
    id: string; inningsNumber: number; battingTeamId: string; bowlingTeamId: string; status: string;
    totalRuns: number; wickets: number; legalBalls: number; target?: number | null;
    currentStrikerId?: string | null; currentNonStrikerId?: string | null; currentBowlerAId?: string | null; currentBowlerBId?: string | null;
    deliveries: Array<{ bowlerId: string; strikerId: string; runsBat: number; runsExtra: number; runsTotal: number; isLegal: boolean; extraType?: string | null; wicket?: { bowlerId?: string | null } | null }>;
  }>;
};

type DisplayOptions = { score: boolean; overs: boolean; target: boolean; batsmen: boolean; bowler: boolean; lastSix: boolean; toss: boolean; venue: boolean; teamNames: boolean };
const DISPLAY_DEFAULTS: DisplayOptions = { score: true, overs: true, target: true, batsmen: true, bowler: true, lastSix: true, toss: true, venue: true, teamNames: true };

const EMPTY: TickerData = {
  style: "compact", teamAId: "", teamBId: "", score: "0-0", overs: "0.0", target: "",
  batsman1: { name: "", runs: "0", balls: "0" }, batsman2: { name: "", runs: "0", balls: "0" },
  bowler: { name: "", figures: "0-0" }, lastSix: ["0", "0", "0", "0", "0", "0"], toss: "", venue: "", status: "LIVE",
  display: DISPLAY_DEFAULTS, font: "Arial", fontSize: "100",
};

function deliveryLabel(delivery: MatchDetail["innings"][number]["deliveries"][number]) {
  if (delivery.wicket) return "W";
  if (delivery.extraType === "WIDE") return "Wd";
  if (delivery.extraType === "NO_BALL") return "Nb";
  return String(delivery.runsTotal ?? 0);
}

function playerName(players: MatchDetail["players"], id?: string | null) {
  return players.find((entry) => entry.player.id === id)?.player.name ?? "";
}

function snapshotFromMatch(match: MatchDetail): Partial<TickerData> {
  const liveInnings = [...match.innings].reverse().find((innings) => innings.status === "LIVE") ?? [...match.innings].reverse()[0];
  if (!liveInnings) return {};
  const deliveries = liveInnings.deliveries ?? [];
  const strikerId = liveInnings.currentStrikerId;
  const nonStrikerId = liveInnings.currentNonStrikerId;
  const currentBowlerId = deliveries.length ? deliveries[deliveries.length - 1].bowlerId : liveInnings.currentBowlerAId;

  const battingStats = (playerId?: string | null) => {
    const playerDeliveries = deliveries.filter((delivery) => delivery.strikerId === playerId);
    const runs = playerDeliveries.reduce((sum, delivery) => sum + delivery.runsBat, 0);
    const balls = playerDeliveries.filter((delivery) => delivery.isLegal).length;
    return { name: playerName(match.players, playerId), runs: String(runs), balls: String(balls) };
  };

  const bowlerDeliveries = deliveries.filter((delivery) => delivery.bowlerId === currentBowlerId);
  const bowlerRuns = bowlerDeliveries.reduce((sum, delivery) => sum + delivery.runsTotal, 0);
  const bowlerWickets = bowlerDeliveries.filter((delivery) => delivery.wicket?.bowlerId === currentBowlerId).length;
  const legalBowlerBalls = bowlerDeliveries.filter((delivery) => delivery.isLegal).length;
  const bowlerOvers = `${Math.floor(legalBowlerBalls / 6)}.${legalBowlerBalls % 6}`;
  const lastSix = deliveries.slice(-6).map(deliveryLabel);

  return {
    teamAId: match.teamA.id,
    teamBId: match.teamB.id,
    score: `${liveInnings.totalRuns}-${liveInnings.wickets}`,
    overs: `${Math.floor(liveInnings.legalBalls / 6)}.${liveInnings.legalBalls % 6}`,
    target: liveInnings.target == null ? "" : String(liveInnings.target),
    batsman1: battingStats(strikerId),
    batsman2: battingStats(nonStrikerId),
    bowler: { name: playerName(match.players, currentBowlerId), figures: `${bowlerOvers}-${bowlerRuns}-${bowlerWickets}` },
    lastSix: lastSix.length ? lastSix : EMPTY.lastSix,
    venue: match.venue ?? "",
    toss: match.tossWinner?.name ? `TOSS ${match.tossWinner.name}${match.tossDecision ? ` ${match.tossDecision}` : ""}` : "",
    status: "LIVE",
  };
}

export default function BroadcastTickerPage() {
  const [ticker, setTicker] = useState<TickerData>(EMPTY);
  const [teams, setTeams] = useState<Team[]>([]);
  const [savedTeams, setSavedTeams] = useState<TickerTeam[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/teams", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/broadcast-ticker", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/matches?status=LIVE", { cache: "no-store" }).then((response) => response.json()),
    ]).then(([teamData, tickerData, matchData]: [Team[], SavedResponse, LiveMatch[]]) => {
      setTeams(Array.isArray(teamData) ? teamData : []);
      if (tickerData?.ticker) setTicker({ ...EMPTY, ...tickerData.ticker, display: { ...DISPLAY_DEFAULTS, ...(tickerData.ticker.display ?? {}) } });
      setSavedTeams(tickerData?.teams ?? []);
      setLiveMatches(Array.isArray(matchData) ? matchData : []);
    }).finally(() => setLoading(false));
  }, []);

  const teamA = teams.find((team) => team.id === ticker.teamAId);
  const teamB = teams.find((team) => team.id === ticker.teamBId);
  const playerOptions = useMemo(() => {
    const all = [...(teamA?.players ?? []), ...(teamB?.players ?? [])].map(({ player }) => player);
    return Array.from(new Map(all.map((player) => [player.id, player])).values());
  }, [teamA, teamB]);
  const displayTeams = [teamA, teamB].filter(Boolean) as TickerTeam[];
  const previewTeams = displayTeams.length ? displayTeams : savedTeams;

  function update<K extends keyof TickerData>(key: K, value: TickerData[K]) { setTicker((current) => ({ ...current, [key]: value })); }
  function updatePlayer(key: "batsman1" | "batsman2" | "bowler", field: string, value: string) { setTicker((current) => ({ ...current, [key]: { ...current[key], [field]: value } })); }
  function toggleDisplay(key: keyof DisplayOptions) { setTicker((current) => ({ ...current, display: { ...DISPLAY_DEFAULTS, ...(current.display ?? {}), [key]: !current.display?.[key] } })); }

  async function loadMatch(matchId: string) {
    setSelectedMatchId(matchId);
    if (!matchId) return;
    setLoadingMatch(true); setMessage("");
    try {
      const response = await fetch(`/api/matches/${matchId}`, { cache: "no-store" });
      const match: MatchDetail = await response.json();
      if (!response.ok) throw new Error((match as unknown as { error?: string }).error || "Failed to load match.");
      const snapshot = snapshotFromMatch(match);
      setTicker((current) => ({ ...current, ...snapshot }));
      setTeams((current) => {
        const byId = new Map(current.map((team) => [team.id, team]));
        for (const team of [match.teamA, match.teamB]) {
          const existing = byId.get(team.id);
          byId.set(team.id, { ...team, players: existing?.players ?? match.players.filter((entry) => entry.teamId === team.id).map((entry) => ({ player: entry.player })) });
        }
        return [...byId.values()];
      });
      setMessage("Live match data loaded. Save to keep this as the ticker snapshot.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Failed to load match."); }
    finally { setLoadingMatch(false); }
  }

  async function save() {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/broadcast-ticker", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ticker) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save ticker.");
      setTicker((current) => ({ ...current, ...data.ticker }));
      setMessage("Ticker saved as a static snapshot.");
      setSavedTeams(previewTeams);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Failed to save ticker."); }
    finally { setSaving(false); }
  }

  if (loading) return <main className={styles.page}><div className={styles.loading}>Loading broadcast ticker…</div></main>;

  return (
    <main className={styles.page}>
      <div className={styles.header}><div><p className={styles.kicker}>BROADCAST GRAPHICS</p><h1>Compact Cricket Ticker</h1><p>Select a live match to automatically load its current data, then save it as a static broadcast snapshot.</p></div><div className={styles.actions}><button onClick={() => window.open("/ticker/display", "_blank", "noopener,noreferrer")}>Open Ticker</button><button className={styles.primary} onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Ticker"}</button></div></div>
      <div className={styles.layout}>
        <section className={styles.editor}>
          <div className={styles.section}><h2>Live match source</h2><label className={styles.fieldLabel}>Select live match<select className={styles.fieldControl} value={selectedMatchId} onChange={(e) => void loadMatch(e.target.value)} disabled={loadingMatch}><option value="">Choose a live match</option>{liveMatches.map((match) => <option key={match.id} value={match.id}>{match.matchNumber ? `Match ${match.matchNumber}: ` : ""}{match.teamA.shortName || match.teamA.name} vs {match.teamB.shortName || match.teamB.name}</option>)}</select></label><p className={styles.hint}>{liveMatches.length ? `${liveMatches.length} live match${liveMatches.length === 1 ? "" : "es"} available. Selecting one automatically fills the ticker.` : "No live matches are currently available."}</p></div>

          <div className={styles.section}><h2>Design</h2><div className={styles.styleButtons}><button className={ticker.style === "compact" ? styles.selected : ""} onClick={() => update("style", "compact")}>Style 1</button><button className={ticker.style === "wide" ? styles.selected : ""} onClick={() => update("style", "wide")}>Style 2</button></div><div className={styles.grid2}><label className={styles.fieldLabel}>Font<select className={styles.fieldControl} value={ticker.font ?? "Arial"} onChange={(e) => update("font", e.target.value)}><option>Arial</option><option>Inter</option><option>Roboto</option><option>Helvetica</option></select></label><label className={styles.fieldLabel}>Scale<select className={styles.fieldControl} value={ticker.fontSize ?? "100"} onChange={(e) => update("fontSize", e.target.value)}><option value="90">90%</option><option value="100">100%</option><option value="110">110%</option><option value="125">125%</option></select></label></div></div>

          <div className={styles.section}><h2>What to display</h2><div className={styles.checkGrid}>{(Object.keys(DISPLAY_DEFAULTS) as (keyof DisplayOptions)[]).map((key) => <label className={styles.checkItem} key={key}><input className={styles.checkbox} type="checkbox" checked={ticker.display?.[key] ?? true} onChange={() => toggleDisplay(key)} /><span>{key === "lastSix" ? "Last 6 balls" : key === "teamNames" ? "Team names" : key[0].toUpperCase() + key.slice(1)}</span></label>)}</div></div>

          <div className={styles.section}><h2>Automatic match data</h2><div className={styles.autoGrid}><div><span>Score</span><strong>{ticker.score}</strong></div><div><span>Overs</span><strong>{ticker.overs}</strong></div><div><span>Target</span><strong>{ticker.target || "—"}</strong></div><div><span>Batsman 1</span><strong>{ticker.batsman1.name || "—"}</strong><small>{ticker.batsman1.runs} ({ticker.batsman1.balls})</small></div><div><span>Batsman 2</span><strong>{ticker.batsman2.name || "—"}</strong><small>{ticker.batsman2.runs} ({ticker.batsman2.balls})</small></div><div><span>Bowler</span><strong>{ticker.bowler.name || "—"}</strong><small>{ticker.bowler.figures}</small></div></div><div className={styles.ballInputs}>{ticker.lastSix.map((ball, index) => <span className={styles.autoBall} key={index}>{ball}</span>)}</div><p className={styles.hint}>All values above came from the selected live match. Save creates a static snapshot; it will not continue changing after save.</p></div>

          <div className={styles.section}><h2>Broadcast text</h2><div className={styles.grid2}><label className={styles.fieldLabel}>Toss / label<input className={styles.fieldControl} value={ticker.toss} onChange={(e) => update("toss", e.target.value)} placeholder="TOSS" /></label><label className={styles.fieldLabel}>Venue / location<input className={styles.fieldControl} value={ticker.venue} onChange={(e) => update("venue", e.target.value)} placeholder="VENUE" /></label></div><label className={styles.fieldLabel}>Status<input className={styles.fieldControl} value={ticker.status} onChange={(e) => update("status", e.target.value)} placeholder="LIVE" /></label></div>
          {message && <div className={styles.message}>{message}</div>}
        </section>
        <section className={styles.preview}><div className={styles.previewHead}><h2>Preview</h2><span>STATIC SNAPSHOT</span></div><div className={styles.previewFrame}><BroadcastTicker ticker={ticker} teams={previewTeams} /></div><p>Select a live match, review the automatic data, then save. The display remains static until you save another snapshot.</p></section>
      </div>
    </main>
  );
}
