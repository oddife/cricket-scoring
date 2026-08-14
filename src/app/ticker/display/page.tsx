"use client";

import { useEffect, useState } from "react";
import BroadcastTicker, { TickerData, TickerTeam } from "@/components/BroadcastTicker";

export default function BroadcastTickerDisplayPage() {
  const [data, setData] = useState<{ ticker: TickerData; teams: TickerTeam[] } | null>(null);

  useEffect(() => {
    fetch("/api/broadcast-ticker", { cache: "no-store" })
      .then((response) => response.json())
      .then(setData)
      .catch(() => undefined);
  }, []);

  if (!data) return <main style={{ minHeight: "100vh", background: "transparent" }} />;

  return <main style={{ minHeight: "100vh", background: "transparent", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0 }}><BroadcastTicker ticker={data.ticker} teams={data.teams} displayOnly /></main>;
}
