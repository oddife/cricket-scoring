"use client";

import { useEffect, useState } from "react";
import BroadcastTicker, { TickerData, TickerTeam } from "@/components/BroadcastTicker";

export default function BroadcastTickerDisplayPage() {
  const [data, setData] = useState<{ ticker: TickerData; teams: TickerTeam[] } | null>(null);
  useEffect(() => { fetch("/api/broadcast-ticker", { cache: "no-store" }).then((response) => response.json()).then(setData).catch(() => undefined); }, []);
  if (!data) return <main style={{ width: "100vw", height: "100vh", background: "transparent" }} />;
  return <main style={{ width: "100vw", height: "100vh", minWidth: `${data.ticker.outputWidth ?? 1280}px`, minHeight: `${data.ticker.outputHeight ?? 150}px`, background: "transparent", display: "flex", alignItems: "flex-end", justifyContent: "flex-start", padding: 0, margin: 0, overflow: "auto" }}><BroadcastTicker ticker={data.ticker} teams={data.teams} displayOnly /></main>;
}
