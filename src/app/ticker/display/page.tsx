"use client";

import { useEffect, useState } from "react";
import BroadcastTicker, { TickerData, TickerTeam } from "@/components/BroadcastTicker";

type DisplayData = { ticker: TickerData; teams: TickerTeam[]; slot?: number };

export default function BroadcastTickerDisplayPage() {
  const [data, setData] = useState<DisplayData | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slotValue = Number(params.get("slot") || "1");
    const slot = Number.isInteger(slotValue) && slotValue >= 1 && slotValue <= 5 ? slotValue : 1;
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(`/api/broadcast-ticker?slot=${slot}`, { cache: "no-store" });
        const json = await response.json();
        if (active && response.ok) setData(json);
      } catch { /* keep the last valid frame */ }
    };
    void load();
    const timer = window.setInterval(load, 2000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  if (!data) return <main style={{ width: "100vw", height: "100vh", background: "transparent" }} />;
  return <main style={{ width: "100vw", height: "100vh", minWidth: `${data.ticker.outputWidth ?? 1280}px`, minHeight: `${data.ticker.outputHeight ?? 150}px`, background: "transparent", display: "flex", alignItems: "flex-end", justifyContent: "flex-start", padding: 0, margin: 0, overflow: "auto" }}><BroadcastTicker ticker={data.ticker} teams={data.teams} displayOnly /></main>;
}
