"use client";

import { useEffect, useRef, useState } from "react";
import BroadcastTicker, { TickerData, TickerTeam } from "@/components/BroadcastTicker";

type DisplayData = { ticker: TickerData; teams: TickerTeam[] };
const REFRESH_OPTIONS = [1, 2, 3, 5, 10];

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
      <div
        ref={refreshRef}
        onMouseEnter={() => setRefreshHover(true)}
        onMouseLeave={() => { setRefreshHover(false); setRefreshOpen(false); }}
        style={{ position: "fixed", top: 8, right: 8, zIndex: 1000, font: "12px Arial, sans-serif", opacity: refreshHover ? 1 : 0, transition: "opacity .2s ease", pointerEvents: "auto" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 7px", borderRadius: 5, background: "rgba(0,0,0,.65)", color: "#fff" }}>
          <span>Refresh</span>
          <button type="button" aria-haspopup="listbox" aria-expanded={refreshOpen} onClick={() => setRefreshOpen((open) => !open)} style={{ minWidth: 42, background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,.25)", borderRadius: 3, padding: "1px 4px", font: "12px Arial, sans-serif", cursor: "pointer" }}>
            {refreshSeconds}s <span style={{ fontSize: 9, marginLeft: 3 }}>▼</span>
          </button>
        </div>
        {refreshOpen && <div role="listbox" aria-label="Refresh interval" style={{ position: "absolute", top: "100%", right: 0, marginTop: 3, minWidth: 48, padding: 2, border: "1px solid rgba(255,255,255,.22)", borderRadius: 4, background: "rgba(10,10,10,.78)", backdropFilter: "blur(4px)", boxShadow: "0 4px 12px rgba(0,0,0,.35)" }}>
          {REFRESH_OPTIONS.map((seconds) => <button type="button" role="option" aria-selected={refreshSeconds === seconds} key={seconds} onClick={() => { setRefreshSeconds(seconds); setRefreshOpen(false); }} style={{ display: "block", width: "100%", border: 0, borderRadius: 2, background: refreshSeconds === seconds ? "rgba(255,255,255,.18)" : "transparent", color: "#fff", padding: "3px 6px", textAlign: "left", font: "12px Arial, sans-serif", cursor: "pointer" }}>{seconds}s</button>)}
        </div>}
      </div>
    </main>
  );
}
