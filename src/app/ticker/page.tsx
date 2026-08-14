"use client";

import { useEffect, useMemo, useState } from "react";
import BroadcastTicker, { TickerData, TickerTeam } from "@/components/BroadcastTicker";
import styles from "./ticker.module.css";

type Team = TickerTeam & { players: { player: { id: string; name: string } }[] };
type SavedResponse = { ticker: TickerData; teams: TickerTeam[] };

const EMPTY: TickerData = {
  style: "compact", teamAId: "", teamBId: "", score: "14-0", overs: "2.0", target: "",
  batsman1: { name: "", runs: "0", balls: "0" }, batsman2: { name: "", runs: "0", balls: "0" },
  bowler: { name: "", figures: "0-0" }, lastSix: ["1", "1", "4", "0", "2", "6"], toss: "", venue: "", status: "LIVE",
};

export default function BroadcastTickerPage() {
  const [ticker, setTicker] = useState<TickerData>(EMPTY);
  const [teams, setTeams] = useState<Team[]>([]);
  const [savedTeams, setSavedTeams] = useState<TickerTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/teams", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/broadcast-ticker", { cache: "no-store" }).then((response) => response.json()),
    ]).then(([teamData, tickerData]: [Team[], SavedResponse]) => {
      setTeams(Array.isArray(teamData) ? teamData : []);
      if (tickerData?.ticker) setTicker({ ...EMPTY, ...tickerData.ticker });
      setSavedTeams(tickerData?.teams ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const teamA = teams.find((team) => team.id === ticker.teamAId);
  const teamB = teams.find((team) => team.id === ticker.teamBId);
  const playerOptionsA = useMemo(() => teamA?.players.map(({ player }) => player) ?? [], [teamA]);
  const playerOptionsB = useMemo(() => teamB?.players.map(({ player }) => player) ?? [], [teamB]);
  const playerOptions = useMemo(() => Array.from(new Map([...playerOptionsA, ...playerOptionsB].map((player) => [player.id, player])).values()), [playerOptionsA, playerOptionsB]);
  const previewTeams = [teamA, teamB].filter(Boolean) as TickerTeam[];
  const displayTeams = previewTeams.length ? previewTeams : savedTeams;

  function update<K extends keyof TickerData>(key: K, value: TickerData[K]) { setTicker((current) => ({ ...current, [key]: value })); }
  function updatePlayer(key: "batsman1" | "batsman2" | "bowler", field: string, value: string) { setTicker((current) => ({ ...current, [key]: { ...current[key], [field]: value } })); }

  async function save() {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/broadcast-ticker", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ticker) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save ticker.");
      setMessage("Ticker saved."); setSavedTeams(previewTeams);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Failed to save ticker."); }
    finally { setSaving(false); }
  }

  function openDisplay() { window.open("/ticker/display", "_blank", "noopener,noreferrer"); }
  if (loading) return <main className={styles.page}><div className={styles.loading}>Loading broadcast ticker…</div></main>;

  return (
    <main className={styles.page}>
      <div className={styles.header}><div><p className={styles.kicker}>BROADCAST GRAPHICS</p><h1>Compact Cricket Ticker</h1><p>Static broadcast strip. Nothing is connected to a live match.</p></div><div className={styles.actions}><button onClick={openDisplay}>Open Ticker</button><button className={styles.primary} onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Ticker"}</button></div></div>
      <div className={styles.layout}>
        <section className={styles.editor}>
          <div className={styles.section}><h2>Design</h2><div className={styles.styleButtons}><button className={ticker.style === "compact" ? styles.selected : ""} onClick={() => update("style", "compact")}>Style 1</button><button className={ticker.style === "wide" ? styles.selected : ""} onClick={() => update("style", "wide")}>Style 2</button></div></div>
          <div className={styles.section}><h2>Teams</h2><div className={styles.grid2}><label className={styles.fieldLabel}>Team A<select className={styles.fieldControl} value={ticker.teamAId} onChange={(e) => update("teamAId", e.target.value)}><option value="">Select team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label><label className={styles.fieldLabel}>Team B<select className={styles.fieldControl} value={ticker.teamBId} onChange={(e) => update("teamBId", e.target.value)}><option value="">Select team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label></div></div>
          <div className={styles.section}><h2>Score</h2><div className={styles.grid3}><label className={styles.fieldLabel}>Score<input className={styles.fieldControl} value={ticker.score} onChange={(e) => update("score", e.target.value)} placeholder="14-0" /></label><label className={styles.fieldLabel}>Overs<input className={styles.fieldControl} value={ticker.overs} onChange={(e) => update("overs", e.target.value)} placeholder="2.0" /></label><label className={styles.fieldLabel}>Target<input className={styles.fieldControl} value={ticker.target} onChange={(e) => update("target", e.target.value)} placeholder="134" /></label></div></div>
          <div className={styles.section}><h2>Batsmen</h2><div className={styles.playerGrid}>{(["batsman1", "batsman2"] as const).map((key, index) => <div className={styles.playerCard} key={key}><strong>Batsman {index + 1}</strong><select className={styles.fieldControl} value={ticker[key].name} onChange={(e) => updatePlayer(key, "name", e.target.value)}><option value="">Select player</option>{playerOptions.map((player) => <option key={player.id} value={player.name}>{player.name}</option>)}</select><div className={styles.grid2}><label className={styles.fieldLabel}>Runs<input className={styles.fieldControl} value={ticker[key].runs} onChange={(e) => updatePlayer(key, "runs", e.target.value)} /></label><label className={styles.fieldLabel}>Balls<input className={styles.fieldControl} value={ticker[key].balls} onChange={(e) => updatePlayer(key, "balls", e.target.value)} /></label></div></div>)}</div></div>
          <div className={styles.section}><h2>Bowler</h2><div className={styles.grid2}><label className={styles.fieldLabel}>Name<select className={styles.fieldControl} value={ticker.bowler.name} onChange={(e) => updatePlayer("bowler", "name", e.target.value)}><option value="">Select player</option>{playerOptions.map((player) => <option key={player.id} value={player.name}>{player.name}</option>)}</select></label><label className={styles.fieldLabel}>Figures<input className={styles.fieldControl} value={ticker.bowler.figures} onChange={(e) => updatePlayer("bowler", "figures", e.target.value)} placeholder="0-4 (1)" /></label></div></div>
          <div className={styles.section}><h2>Last 6 balls</h2><div className={styles.ballInputs}>{ticker.lastSix.map((ball, index) => <input className={styles.fieldControl} key={index} value={ball} onChange={(e) => { const next = [...ticker.lastSix]; next[index] = e.target.value; update("lastSix", next); }} placeholder="0" maxLength={3} />)}</div><p className={styles.hint}>Use 0, 1, 2, 3, 4, 6, W, Wd or Nb.</p></div>
          <div className={styles.section}><h2>Broadcast text</h2><div className={styles.grid2}><label className={styles.fieldLabel}>Toss / label<input className={styles.fieldControl} value={ticker.toss} onChange={(e) => update("toss", e.target.value)} placeholder="TOSS  IND" /></label><label className={styles.fieldLabel}>Venue / location<input className={styles.fieldControl} value={ticker.venue} onChange={(e) => update("venue", e.target.value)} placeholder="LIVE FROM SHARJAH CRICKET STADIUM" /></label></div><label className={styles.fieldLabel}>Status<input className={styles.fieldControl} value={ticker.status} onChange={(e) => update("status", e.target.value)} placeholder="LIVE" /></label></div>
          {message && <div className={styles.message}>{message}</div>}
        </section>
        <section className={styles.preview}><div className={styles.previewHead}><h2>Preview</h2><span>STATIC</span></div><div className={styles.previewFrame}><BroadcastTicker ticker={ticker} teams={displayTeams} /></div><p>Save the ticker, then use <strong>Open Ticker</strong> for the clean broadcast-only page.</p></section>
      </div>
    </main>
  );
}
