"use client";

import { useEffect, useRef, useState } from "react";
import BroadcastTicker, { TickerData, TickerTeam, TickerStyle } from "@/components/BroadcastTicker";
import styles from "./ticker.module.css";

type Player = { id: string; name: string };
type Team = TickerTeam & { players: { player: Player }[] };
type SavedResponse = { ticker: TickerData; teams: TickerTeam[] };
type LiveMatch = { id: string; matchNumber?: number | null; teamA: TickerTeam; teamB: TickerTeam; venue?: string | null; status: string };
type MatchDetail = LiveMatch & { tossWinner?: { name?: string | null } | null; tossDecision?: string | null; players: { player: Player; teamId: string }[]; innings: Array<{ status: string; totalRuns: number; wickets: number; legalBalls: number; target?: number | null; leadDeficit?: { kind: "NONE" | "TRAIL" | "LEVEL" | "LEAD"; runs: number }; currentStrikerId?: string | null; currentNonStrikerId?: string | null; currentBowlerAId?: string | null; deliveries: Array<{ bowlerId: string; strikerId: string; runsBat: number; runsTotal: number; isLegal: boolean; extraType?: string | null; wicket?: { bowlerId?: string | null } | null }> }> };
type DisplayOptions = { score: boolean; overs: boolean; target: boolean; leadDeficit: boolean; batsmen: boolean; bowler: boolean; lastSix: boolean; toss: boolean; venue: boolean; teamNames: boolean };

const DISPLAY_DEFAULTS: DisplayOptions = { score: true, overs: true, target: true, leadDeficit: false, batsmen: true, bowler: true, lastSix: true, toss: false, venue: true, teamNames: true };
const STYLE_OPTIONS: { id: TickerStyle; name: string; description: string }[] = [
  { id: "compact", name: "Compact TV", description: "Balanced broadcast strip" },
  { id: "classic", name: "Classic", description: "Traditional score bar" },
  { id: "scoreboard", name: "Scoreboard", description: "Score-first presentation" },
  { id: "minimal", name: "Minimal", description: "Clean, lightweight strip" },
  { id: "wide", name: "Wide", description: "Larger broadcast graphic" },
];
const EMPTY: TickerData = { style: "compact", teamAId: "", teamBId: "", teamAName: "", teamBName: "", score: "0-0", overs: "0.0", target: "", leadDeficit: "", batsman1: { name: "", runs: "0", balls: "0" }, batsman2: { name: "", runs: "0", balls: "0" }, bowler: { name: "", figures: "0-0" }, lastSix: ["0", "0", "0", "0", "0", "0"], toss: "", venue: "", status: "LIVE", display: DISPLAY_DEFAULTS, font: "Arial", fontSize: "100", outputWidth: 1280, outputHeight: 100, bottomHeight: 30 };
const MATCH_STORAGE_KEY = "new-castle-cricket-ticker-match";
const LIVE_REFRESH_MS = 2000;

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
  const innings = [...match.innings].reverse().find((item) => item.status === "LIVE") ?? [...match.innings].reverse()[0];
  if (!innings) return {};
  const deliveries = innings.deliveries ?? [];
  const strikerId = innings.currentStrikerId;
  const nonStrikerId = innings.currentNonStrikerId;
  const currentBowlerId = deliveries.length ? deliveries[deliveries.length - 1].bowlerId : innings.currentBowlerAId;
  const battingStats = (id?: string | null) => {
    const playerDeliveries = deliveries.filter((delivery) => delivery.strikerId === id);
    return { name: playerName(match.players, id), runs: String(playerDeliveries.reduce((sum, delivery) => sum + delivery.runsBat, 0)), balls: String(playerDeliveries.filter((delivery) => delivery.isLegal).length) };
  };
  const bowlerDeliveries = deliveries.filter((delivery) => delivery.bowlerId === currentBowlerId);
  const legalBalls = bowlerDeliveries.filter((delivery) => delivery.isLegal).length;
  const bowlerOvers = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
  const bowlerRuns = bowlerDeliveries.reduce((sum, delivery) => sum + delivery.runsTotal, 0);
  const bowlerWickets = bowlerDeliveries.filter((delivery) => delivery.wicket?.bowlerId === currentBowlerId).length;
  const lastSix = deliveries.slice(-6).map(deliveryLabel);
  const position = innings.leadDeficit;
  const leadDeficit = position?.kind === "LEAD" ? `LEAD ${position.runs}` : position?.kind === "TRAIL" ? `DEFICIT ${position.runs}` : position?.kind === "LEVEL" ? "LEVEL" : "";
  return {
    teamAId: match.teamA.id,
    teamBId: match.teamB.id,
    score: `${innings.totalRuns}-${innings.wickets}`,
    overs: `${Math.floor(innings.legalBalls / 6)}.${innings.legalBalls % 6}`,
    target: innings.target == null ? "" : String(innings.target),
    leadDeficit,
    batsman1: battingStats(strikerId),
    batsman2: battingStats(nonStrikerId),
    bowler: { name: playerName(match.players, currentBowlerId), figures: `${bowlerOvers}-${bowlerRuns}-${bowlerWickets}` },
    lastSix: lastSix.length ? lastSix : EMPTY.lastSix,
    venue: match.venue ?? "",
    toss: match.tossWinner?.name ? `TOSS ${match.tossWinner.name}${match.tossDecision ? ` ${match.tossDecision}` : ""}` : "",
    status: match.status || "LIVE",
  };
}

export default function BroadcastTickerPage() {
  const [ticker, setTicker] = useState<TickerData>(EMPTY);
  const [teams, setTeams] = useState<Team[]>([]);
  const [savedTeams, setSavedTeams] = useState<TickerTeam[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  async function loadMatchSnapshot(matchId: string, showMessage: boolean) {
    try {
      const response = await fetch(`/api/matches/${matchId}`, { cache: "no-store" });
      const match: MatchDetail = await response.json();
      if (!response.ok) throw new Error((match as unknown as { error?: string }).error || "Failed to load match.");
      setTicker((current) => ({ ...current, ...snapshotFromMatch(match) }));
      setTeams((current) => {
        const byId = new Map(current.map((team) => [team.id, team]));
        for (const team of [match.teamA, match.teamB]) {
          const existing = byId.get(team.id);
          byId.set(team.id, { ...team, players: existing?.players ?? match.players.filter((entry) => entry.teamId === team.id).map((entry) => ({ player: entry.player })) });
        }
        return [...byId.values()];
      });
      if (showMessage) setMessage("Live match data loaded. It will refresh automatically every 2 seconds. Save to keep the current ticker configuration.");
    } catch (error) {
      if (showMessage) setMessage(error instanceof Error ? error.message : "Failed to load match.");
    }
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/teams", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/broadcast-ticker", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/matches?status=LIVE", { cache: "no-store" }).then((response) => response.json()),
    ]).then(([teamData, tickerData, matchData]: [Team[], SavedResponse, LiveMatch[]]) => {
      if (cancelled) return;
      setTeams(Array.isArray(teamData) ? teamData : []);
      const savedTicker = tickerData?.ticker ? { ...EMPTY, ...tickerData.ticker, display: { ...DISPLAY_DEFAULTS, ...(tickerData.ticker.display ?? {}) } } : EMPTY;
      setTicker(savedTicker);
      setSavedTeams(tickerData?.teams ?? []);
      const matches = Array.isArray(matchData) ? matchData : [];
      setLiveMatches(matches);
      const storedId = typeof window !== "undefined" ? window.localStorage.getItem(MATCH_STORAGE_KEY) || "" : "";
      const storedMatch = matches.find((match) => match.id === storedId);
      const inferredMatch = matches.find((match) => match.teamA.id === savedTicker.teamAId && match.teamB.id === savedTicker.teamBId);
      const initialMatch = storedMatch || inferredMatch;
      if (initialMatch) {
        setSelectedMatchId(initialMatch.id);
        if (typeof window !== "undefined") window.localStorage.setItem(MATCH_STORAGE_KEY, initialMatch.id);
        void loadMatchSnapshot(initialMatch.id, false);
      }
    }).catch(() => setMessage("Failed to load ticker data.")).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedMatchId) return;
    const timer = window.setInterval(() => { void loadMatchSnapshot(selectedMatchId, false); }, LIVE_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [selectedMatchId]);

  useEffect(() => {
    const updatePreviewScale = () => {
      const frame = previewRef.current;
      if (!frame) return;
      const width = Math.max(1, Number(ticker.outputWidth ?? 1280));
      const height = Math.max(1, Number(ticker.outputHeight ?? 100));
      const availableWidth = Math.max(1, frame.clientWidth - 20);
      const availableHeight = Math.max(1, frame.clientHeight - 20);
      setPreviewScale(Math.min(1, availableWidth / width, availableHeight / height));
    };
    updatePreviewScale();
    const observer = new ResizeObserver(updatePreviewScale);
    if (previewRef.current) observer.observe(previewRef.current);
    window.addEventListener("resize", updatePreviewScale);
    return () => { observer.disconnect(); window.removeEventListener("resize", updatePreviewScale); };
  }, [ticker.outputWidth, ticker.outputHeight]);

  const teamA = teams.find((team) => team.id === ticker.teamAId);
  const teamB = teams.find((team) => team.id === ticker.teamBId);
  const previewTeams = ([teamA, teamB].filter(Boolean) as TickerTeam[]).length ? [teamA, teamB].filter(Boolean) as TickerTeam[] : savedTeams;

  function update<K extends keyof TickerData>(key: K, value: TickerData[K]) {
    setTicker((current) => ({ ...current, [key]: value }));
  }

  function toggleDisplay(key: keyof DisplayOptions) {
    setTicker((current) => ({ ...current, display: { ...DISPLAY_DEFAULTS, ...(current.display ?? {}), [key]: !current.display?.[key] } }));
  }

  async function loadMatch(matchId: string) {
    setSelectedMatchId(matchId);
    if (typeof window !== "undefined") {
      if (matchId) window.localStorage.setItem(MATCH_STORAGE_KEY, matchId);
      else window.localStorage.removeItem(MATCH_STORAGE_KEY);
    }
    if (!matchId) return;
    setLoadingMatch(true); setMessage("");
    try { await loadMatchSnapshot(matchId, true); } finally { setLoadingMatch(false); }
  }

  async function save() {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/broadcast-ticker", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ticker) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save ticker.");
      setTicker((current) => ({ ...current, ...data.ticker })); setSavedTeams(previewTeams); setMessage("Ticker saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save ticker.");
    } finally { setSaving(false); }
  }

  if (loading) return <main className={styles.page}><div className={styles.loading}>Loading broadcast ticker…</div></main>;

  const previewWidth = Number(ticker.outputWidth ?? 1280) * previewScale;
  const previewHeight = Number(ticker.outputHeight ?? 100) * previewScale;

  return <main className={styles.page}>
    <div className={styles.header}><div><p className={styles.kicker}>BROADCAST GRAPHICS</p><h1>Compact Cricket Ticker</h1><p>Select a live match, choose the graphic style and set the ticker size.</p></div><div className={styles.actions}><button onClick={() => window.open("/ticker/display", "_blank", "noopener,noreferrer")}>Open Ticker</button><button className={styles.primary} onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Ticker"}</button></div></div>
    <div className={styles.layout}>
      <section className={styles.editor}>
        <div className={styles.section}><h2>Live match source</h2><label className={styles.fieldLabel}>Select live match<select className={styles.fieldControl} value={selectedMatchId} onChange={(event) => void loadMatch(event.target.value)} disabled={loadingMatch}><option value="">Choose a live match</option>{liveMatches.map((match) => <option key={match.id} value={match.id}>{match.matchNumber ? `Match ${match.matchNumber}: ` : ""}{match.teamA.shortName || match.teamA.name} vs {match.teamB.shortName || match.teamB.name}</option>)}</select></label><p className={styles.hint}>{liveMatches.length ? `${liveMatches.length} live match${liveMatches.length === 1 ? "" : "es"} available.` : "No live matches are currently available."}</p></div>
        <div className={styles.section}><h2>Design styles</h2><div className={styles.styleGallery}>{STYLE_OPTIONS.map((option) => <button type="button" key={option.id} className={`${styles.styleCard} ${ticker.style === option.id ? styles.styleCardSelected : ""}`} onClick={() => update("style", option.id)}><span className={`${styles.styleSwatch} ${styles[`swatch-${option.id}`]}`}><i></i><b></b><em></em></span><strong>{option.name}</strong><small>{option.description}</small></button>)}</div><div className={styles.grid2}><label className={styles.fieldLabel}>Font<select className={styles.fieldControl} value={ticker.font ?? "Arial"} onChange={(event) => update("font", event.target.value)}><option>Arial</option><option>Inter</option><option>Roboto</option><option>Helvetica</option></select></label><label className={styles.fieldLabel}>Scale<select className={styles.fieldControl} value={ticker.fontSize ?? "100"} onChange={(event) => update("fontSize", event.target.value)}><option value="90">90%</option><option value="100">100%</option><option value="110">110%</option><option value="125">125%</option></select></label></div></div>
        <div className={styles.section}><h2>Ticker size</h2><div className={styles.grid2}><label className={styles.fieldLabel}>Width (px)<input className={styles.fieldControl} type="number" min="640" max="7680" value={ticker.outputWidth ?? 1280} onChange={(event) => update("outputWidth", Number(event.target.value))} /></label><label className={styles.fieldLabel}>Height (px)<input className={styles.fieldControl} type="number" min="60" max="2160" value={ticker.outputHeight ?? 100} onChange={(event) => update("outputHeight", Number(event.target.value))} /></label></div><div className={styles.grid2}><label className={styles.fieldLabel}>Bottom row height (px)<input className={styles.fieldControl} type="number" min="20" max={Math.max(20, Number(ticker.outputHeight ?? 100) - 20)} value={ticker.bottomHeight ?? 30} onChange={(event) => update("bottomHeight", Number(event.target.value))} /></label></div><p className={styles.hint}>Width and height define the exact output. Bottom row height is independent, so you can make the information row thinner without changing the main ticker height.</p></div>
        <div className={styles.section}><h2>Team display names</h2><div className={styles.grid2}><label className={styles.fieldLabel}>Team A display name<input className={styles.fieldControl} value={ticker.teamAName ?? ""} onChange={(event) => update("teamAName", event.target.value)} placeholder={teamA?.shortName || teamA?.name || "Auto short name"} maxLength={24} /></label><label className={styles.fieldLabel}>Team B display name<input className={styles.fieldControl} value={ticker.teamBName ?? ""} onChange={(event) => update("teamBName", event.target.value)} placeholder={teamB?.shortName || teamB?.name || "Auto short name"} maxLength={24} /></label></div><p className={styles.hint}>Leave blank for the automatic short name, or enter a custom broadcast name.</p></div>
        <div className={styles.section}><h2>What to display</h2><div className={styles.checkGrid}>{(Object.keys(DISPLAY_DEFAULTS) as (keyof DisplayOptions)[]).map((key) => <label className={styles.checkItem} key={key}><input className={styles.checkbox} type="checkbox" checked={ticker.display?.[key] ?? true} onChange={() => toggleDisplay(key)} /><span>{key === "lastSix" ? "Last 6 balls" : key === "teamNames" ? "Team names" : key === "leadDeficit" ? "Lead / deficit" : key[0].toUpperCase() + key.slice(1)}</span></label>)}</div></div>
        <div className={styles.section}><h2>Automatic match data</h2><div className={styles.autoGrid}><div><span>Score</span><strong>{ticker.score}</strong></div><div><span>Overs</span><strong>{ticker.overs}</strong></div><div><span>Target</span><strong>{ticker.target || "—"}</strong></div><div><span>Lead / deficit</span><strong>{ticker.leadDeficit || "—"}</strong></div><div><span>Batsman 1</span><strong>{ticker.batsman1.name || "—"}</strong><small>{ticker.batsman1.runs} ({ticker.batsman1.balls})</small></div><div><span>Batsman 2</span><strong>{ticker.batsman2.name || "—"}</strong><small>{ticker.batsman2.runs} ({ticker.batsman2.balls})</small></div><div><span>Bowler</span><strong>{ticker.bowler.name || "—"}</strong><small>{ticker.bowler.figures}</small></div></div><div className={styles.ballInputs}>{ticker.lastSix.map((ball, index) => <span className={styles.autoBall} key={index}>{ball}</span>)}</div><p className={styles.hint}>Live data refreshes automatically every 2 seconds while a match is selected.</p></div>
        <div className={styles.section}><h2>Broadcast text</h2><div className={styles.grid2}><label className={styles.fieldLabel}>Toss / label<input className={styles.fieldControl} value={ticker.toss} onChange={(event) => update("toss", event.target.value)} placeholder="TOSS" /></label><label className={styles.fieldLabel}>Venue / location<input className={styles.fieldControl} value={ticker.venue} onChange={(event) => update("venue", event.target.value)} placeholder="VENUE" /></label></div></div>
        {message && <div className={styles.message}>{message}</div>}
      </section>
      <section className={styles.preview}>
        <div className={styles.previewHead}><h2>Preview</h2><span>{ticker.outputWidth} × {ticker.outputHeight}</span></div>
        <div ref={previewRef} className={styles.previewFrame}>
          <div style={{ width: `${previewWidth}px`, height: `${previewHeight}px`, flex: "0 0 auto", position: "relative" }}>
            <div style={{ width: `${ticker.outputWidth}px`, height: `${ticker.outputHeight}px`, transform: `scale(${previewScale})`, transformOrigin: "top left" }}>
              <BroadcastTicker ticker={ticker} teams={previewTeams} />
            </div>
          </div>
        </div>
        <p>Preview is scaled proportionally to fit this panel. The actual display uses the exact Width × Height above.</p>
      </section>
    </div>
  </main>;
}
