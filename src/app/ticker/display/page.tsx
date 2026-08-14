"use client";

import { useEffect, useState } from "react";
import BroadcastTicker, { TickerData, TickerTeam } from "@/components/BroadcastTicker";

type DisplayData = { ticker: TickerData; teams: TickerTeam[] };
const REFRESH_OPTIONS = [1, 2, 3, 5, 10];

export default function BroadcastTickerDisplayPage() {
  const [data, setData] = useState<DisplayData | null>(null);
  const [refreshSeconds, setRefreshSeconds] = useState(2);

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
        if (response.ok) setData(json);
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

  if (!data) return <main style={{ width: "100vw", height: "100vh", background: "transparent" }} />;

  return (
    <main style={{ width: "100vw", height: "100vh", minWidth: `${data.ticker.outputWidth ?? 1280}px`, minHeight: `${data.ticker.outputHeight ?? 100}px`, background: "transparent", display: "flex", alignItems: "flex-end", justifyContent: "flex-start", padding: 0, margin: 0, overflow: "auto", position: "relative" }}>
      <BroadcastTicker ticker={data.ticker} teams={data.teams} displayOnly />
      <label style={{ position: "fixed", top: 8, right: 8, zIndex: 1000, display: "flex", alignItems: "center", gap: 5, padding: "4px 7px", borderRadius: 5, background: "rgba(0,0,0,.65)", color: "#fff", font: "12px Arial, sans-serif", opacity: .85 }}>
        Refresh
        <select
          value={refreshSeconds}
          onChange={(event) => setRefreshSeconds(Number(event.target.value))}
          style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,.25)", borderRadius: 3, font: "12px Arial, sans-serif", padding: "1px 3px", colorScheme: "dark", outline: "none" }}
        >
          {REFRESH_OPTIONS.map((seconds) => <option key={seconds} value={seconds} style={{ background: "rgba(0,0,0,.9)", color: "#fff" }}>{seconds}s</option>)}
        </select>
      </label>
    </main>
  );
}
