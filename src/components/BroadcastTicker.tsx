"use client";

import { useEffect, useState } from "react";
import styles from "@/app/ticker/ticker.module.css";

export type TickerData = {
  style: "compact" | "wide";
  teamAId: string;
  teamBId: string;
  score: string;
  overs: string;
  target: string;
  batsman1: { name: string; runs: string; balls: string };
  batsman2: { name: string; runs: string; balls: string };
  bowler: { name: string; figures: string };
  lastSix: string[];
  toss: string;
  venue: string;
  status: string;
};

export type TickerTeam = {
  id: string;
  name: string;
  shortName: string | null;
  logo: string | null;
};

type Props = {
  ticker: TickerData;
  teams: TickerTeam[];
  displayOnly?: boolean;
};

function TeamMark({ team, fallback }: { team?: TickerTeam; fallback: string }) {
  if (team?.logo) return <img className={styles["broadcast-team-logo"]} src={team.logo} alt="" />;
  return <span className={styles["broadcast-team-fallback"]}>{team?.shortName || fallback}</span>;
}

function Balls({ values }: { values: string[] }) {
  return (
    <div className={styles["broadcast-last-six"]} aria-label="Last six balls">
      {values.slice(0, 6).map((value, index) => {
        const normalized = String(value || "0").toUpperCase();
        const cls = normalized === "W" ? styles.wicket : normalized === "4" || normalized === "6" ? styles.boundary : normalized === "0" ? styles.dot : styles.run;
        return <span className={`${styles["broadcast-ball"]} ${cls}`} key={`${index}-${normalized}`}>{normalized}</span>;
      })}
    </div>
  );
}

export default function BroadcastTicker({ ticker, teams, displayOnly = false }: Props) {
  const teamA = teams.find((team) => team.id === ticker.teamAId);
  const teamB = teams.find((team) => team.id === ticker.teamBId);
  const stripClass = ticker.style === "wide" ? styles["broadcast-strip-wide"] : "";

  return (
    <div className={`${styles["broadcast-stage"]} ${displayOnly ? styles["broadcast-display"] : ""}`}>
      <div className={`${styles["broadcast-strip"]} ${stripClass}`}>
        <div className={styles["broadcast-team-block"]}>
          <TeamMark team={teamA} fallback="A" />
          <div className={styles["broadcast-team-copy"]}>
            <strong>{teamA?.shortName || "TEAM A"}</strong>
            <span>{ticker.status || "LIVE"}</span>
          </div>
        </div>
        <div className={styles["broadcast-score-block"]}><strong>{ticker.score || "0-0"}</strong><span>{ticker.overs || "0.0"} OV</span></div>
        {ticker.target && <div className={styles["broadcast-mini-block"]}><span>TARGET</span><strong>{ticker.target}</strong></div>}
        <div className={styles["broadcast-player-block"]}><strong>{ticker.batsman1.name || "BATSMAN 1"}</strong><span>{ticker.batsman1.runs || "0"} ({ticker.batsman1.balls || "0"})</span></div>
        <div className={`${styles["broadcast-player-block"]} ${styles.secondary}`}><strong>{ticker.batsman2.name || "BATSMAN 2"}</strong><span>{ticker.batsman2.runs || "0"} ({ticker.batsman2.balls || "0"})</span></div>
        <Balls values={ticker.lastSix} />
        <div className={styles["broadcast-bowler-block"]}><span>BOWLER</span><strong>{ticker.bowler.name || "BOWLER"}</strong><small>{ticker.bowler.figures || "0-0"}</small></div>
        <div className={`${styles["broadcast-team-block"]} ${styles["right-team"]}`}>
          <div className={`${styles["broadcast-team-copy"]} ${styles.right}`}><strong>{teamB?.shortName || "TEAM B"}</strong><span>{ticker.toss || ""}</span></div>
          <TeamMark team={teamB} fallback="B" />
        </div>
        {(ticker.venue || ticker.toss) && <div className={styles["broadcast-footer-text"]}>{ticker.toss && <span>{ticker.toss}</span>}{ticker.venue && <span>{ticker.venue}</span>}</div>}
      </div>
    </div>
  );
}

export function useBroadcastTicker() {
  const [data, setData] = useState<{ ticker: TickerData; teams: TickerTeam[] } | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/broadcast-ticker", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to load ticker.");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ticker.");
    }
  }

  useEffect(() => { void load(); }, []);
  return { data, error, reload: load };
}
