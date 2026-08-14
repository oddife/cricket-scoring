"use client";

import { use, useEffect, useMemo, useState } from "react";

type Player = { id: string; name: string; jerseyNumber?: number | null };
type Team = { id: string; name: string; shortName?: string | null };
type Delivery = {
  id: string; overNumber: number; ballNumber: number; runsTotal: number; runsBat: number; runsExtra: number;
  isLegal: boolean; strikerId: string; nonStrikerId: string; bowlerId: string; extraType?: string | null;
  isWicket?: boolean; wicket?: { type: string; dismissedPlayerId: string; bowlerId?: string | null; fielderId?: string | null } | null;
  striker?: Player; bowler?: Player;
};
type Innings = {
  id: string; inningsNumber: number; battingTeamId: string; bowlingTeamId: string; totalRuns: number; wickets: number;
  legalBalls: number; target?: number | null; status: string; deliveries: Delivery[];
};
type MatchPlayer = { playerId: string; teamId: string; player: Player };
type MatchData = {
  id: string; status: string; oversPerInnings: number; inningsPerMatch: number; bowlingMode: "NORMAL" | "DOUBLE";
  teamA: Team; teamB: Team; players: MatchPlayer[]; innings: Innings[]; tossWinner?: Team | null; tossDecision?: string | null;
  winner?: Team | null; result?: string | null;
};

function formatOvers(balls: number) { return `${Math.floor(balls / 6)}.${balls % 6}`; }
function getTeam(match: MatchData, id: string) { return id === match.teamA.id ? match.teamA : id === match.teamB.id ? match.teamB : undefined; }
function getPlayer(match: MatchData, id: string) { return match.players.find((entry) => entry.playerId === id)?.player; }
function deliveryLabel(d: Delivery) {
  if (d.isWicket || d.wicket) return "W";
  if (d.extraType === "WIDE") return d.runsExtra > 1 ? `Wd${d.runsExtra}` : "Wd";
  if (d.extraType === "NO_BALL") return d.runsBat > 0 ? `Nb+${d.runsBat}` : "Nb";
  if (d.extraType === "BYE") return `B${d.runsExtra || d.runsTotal}`;
  if (d.extraType === "LEG_BYE") return `Lb${d.runsExtra || d.runsTotal}`;
  return String(d.runsTotal);
}

export default function PublicLiveScorePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function loadMatch() {
    try {
      setError("");
      const response = await fetch(`/api/matches/${matchId}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to load match.");
      setMatch(data.match ?? data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load match.");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    void loadMatch();
    const timer = window.setInterval(() => void loadMatch(), 5000);
    return () => window.clearInterval(timer);
  }, [matchId]);

  const currentInnings = useMemo(() => {
    if (!match) return null;
    return [...match.innings].reverse().find((item) => item.status === "LIVE") ?? match.innings.at(-1) ?? null;
  }, [match]);

  const currentOver = useMemo(() => {
    if (!currentInnings) return [];
    const last = currentInnings.deliveries.at(-1);
    return last ? currentInnings.deliveries.filter((d) => d.overNumber === last.overNumber) : [];
  }, [currentInnings]);

  async function shareLiveScore() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: match ? `${match.teamA.name} vs ${match.teamB.name}` : "Live Score", text: "Live cricket score", url });
      else { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error(err);
    }
  }

  if (loading && !match) return <main className="min-h-screen bg-slate-950 text-white grid place-items-center">Loading live score…</main>;
  if (!match) return <main className="min-h-screen bg-slate-950 text-white grid place-items-center px-4"><div className="w-full max-w-xl rounded-2xl border border-red-900/50 bg-red-950/30 p-6 text-center"><h1 className="text-xl font-bold">Live Score Unavailable</h1><p className="mt-2 text-sm text-red-300">{error || "Match not found."}</p></div></main>;

  const battingTeam = currentInnings ? getTeam(match, currentInnings.battingTeamId) : undefined;
  const bowlingTeam = currentInnings ? getTeam(match, currentInnings.bowlingTeamId) : undefined;
  const lastDelivery = currentInnings?.deliveries.at(-1);
  const striker = lastDelivery ? getPlayer(match, lastDelivery.strikerId) : undefined;
  const nonStriker = lastDelivery ? getPlayer(match, lastDelivery.nonStrikerId) : undefined;
  const bowler = lastDelivery ? getPlayer(match, lastDelivery.bowlerId) : undefined;

  return (
    <main className="min-h-screen bg-[#06172a] text-white">
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-5 lg:px-8">
        <header className="rounded-2xl border border-slate-700 bg-[#07182d] p-4 shadow-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Live Score</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">{match.teamA.name} <span className="text-slate-500">vs</span> {match.teamB.name}</h1></div>
            <button type="button" onClick={() => void shareLiveScore()} className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800">{copied ? "Link Copied" : "Share Live Score"}</button>
          </div>
        </header>

        {currentInnings && <>
          <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl sm:p-7">
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div><p className="text-sm font-semibold text-slate-400">{battingTeam?.name ?? "Batting"}</p><div className="mt-1 flex items-baseline gap-2"><span className="text-6xl font-black">{currentInnings.totalRuns}</span><span className="text-3xl font-bold text-slate-500">/</span><span className="text-5xl font-black">{currentInnings.wickets}</span></div><p className="mt-2 text-sm text-slate-400">{formatOvers(currentInnings.legalBalls)} overs</p></div>
                <div className="text-right"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Bowling</p><p className="mt-1 text-lg font-bold">{bowlingTeam?.name ?? "—"}</p>{currentInnings.target != null && <p className="mt-1 text-xs text-slate-500">Target {currentInnings.target}</p>}</div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl"><p className="text-xs font-black uppercase tracking-wider text-slate-500">Current Over</p><div className="mt-4 flex flex-wrap gap-2">{currentOver.length === 0 ? <span className="text-sm text-slate-500">No deliveries yet</span> : currentOver.map((d) => <div key={d.id} className={`flex h-11 min-w-11 items-center justify-center rounded-full border px-3 font-black ${d.isWicket || d.wicket ? "border-red-500/40 bg-red-500/15 text-red-300" : d.runsTotal === 4 || d.runsTotal === 6 ? "border-blue-500/40 bg-blue-500/15 text-blue-300" : "border-slate-700 bg-slate-950 text-slate-200"}`}>{deliveryLabel(d)}</div>)}</div></div>
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5"><p className="text-xs font-black uppercase tracking-wider text-slate-500">Striker</p><p className="mt-2 text-xl font-black">{striker?.name ?? "—"} *</p></div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5"><p className="text-xs font-black uppercase tracking-wider text-slate-500">Non-Striker</p><p className="mt-2 text-xl font-black">{nonStriker?.name ?? "—"}</p></div>
            <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5"><p className="text-xs font-black uppercase tracking-wider text-slate-500">Current Bowler</p><p className="mt-2 text-xl font-black">{bowler?.name ?? "—"}</p></div>
          </section>
        </>}

        <section className="mt-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-slate-500">Teams</p><h2 className="mt-1 text-xl font-black">Match Players</h2></div><span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-300">Read-only</span></div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">{[match.teamA, match.teamB].map((team) => <div key={team.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4"><h3 className="text-lg font-black text-emerald-300 underline underline-offset-2 decoration-emerald-400/50">{team.name}</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{match.players.filter((entry) => entry.teamId === team.id).map((entry) => <div key={entry.playerId} className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-3"><p className="font-semibold text-emerald-300 underline underline-offset-2 decoration-emerald-400/50">{entry.player.name}</p>{entry.player.jerseyNumber != null && <p className="mt-1 text-xs text-slate-500">#{entry.player.jerseyNumber}</p>}</div>)}</div></div>)}</div>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">Innings Summary</h2><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{match.innings.length} innings</span></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Innings</th><th className="px-3 py-3">Batting</th><th className="px-3 py-3">Score</th><th className="px-3 py-3">Overs</th><th className="px-3 py-3">Status</th></tr></thead><tbody>{match.innings.map((innings) => <tr key={innings.id} className="border-b border-slate-800/80 last:border-0"><td className="px-3 py-3 font-bold">{innings.inningsNumber}</td><td className="px-3 py-3">{getTeam(match, innings.battingTeamId)?.name ?? "—"}</td><td className="px-3 py-3 font-black">{innings.totalRuns}/{innings.wickets}</td><td className="px-3 py-3">{formatOvers(innings.legalBalls)}</td><td className="px-3 py-3 text-slate-400">{innings.status}</td></tr>)}</tbody></table></div></section>
        <footer className="py-8 text-center text-xs text-slate-600">Cricket Scorer • Live Score</footer>
      </div>
    </main>
  );
}
