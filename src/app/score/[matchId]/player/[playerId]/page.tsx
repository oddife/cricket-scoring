"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

type Player = {
  id: string;
  name: string;
  jerseyNumber?: number | null;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
};

type Team = { id: string; name: string; shortName?: string | null };
type MatchPlayer = { playerId: string; teamId: string; player: Player };
type Delivery = { strikerId: string; bowlerId: string; runsBat: number; runsTotal: number; isLegal: boolean; isWicket?: boolean; wicket?: { dismissedPlayerId: string } | null };
type MatchData = {
  id: string;
  teamA: Team;
  teamB: Team;
  players: MatchPlayer[];
  innings: Array<{ inningsNumber: number; battingTeamId: string; bowlingTeamId: string; deliveries: Delivery[] }>;
};

export default function PublicPlayerProfilePage({
  params,
}: {
  params: Promise<{ matchId: string; playerId: string }>;
}) {
  const { matchId, playerId } = use(params);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/matches/${matchId}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Failed to load player profile.");
        setMatch(data.match ?? data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load player profile.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [matchId]);

  const playerEntry = match?.players.find((entry) => entry.playerId === playerId);

  const stats = useMemo(() => {
    if (!match || !playerEntry) return { runs: 0, balls: 0, fours: 0, sixes: 0, wickets: 0, overs: "0.0" };
    let runs = 0, balls = 0, fours = 0, sixes = 0, wickets = 0, legalBowls = 0;
    for (const innings of match.innings) {
      for (const delivery of innings.deliveries) {
        if (delivery.strikerId === playerId) {
          runs += delivery.runsBat;
          if (delivery.isLegal) balls += 1;
          if (delivery.runsBat === 4) fours += 1;
          if (delivery.runsBat === 6) sixes += 1;
        }
        if (delivery.bowlerId === playerId) {
          if (delivery.isLegal) legalBowls += 1;
          if (delivery.wicket?.dismissedPlayerId) wickets += 1;
        }
      }
    }
    return { runs, balls, fours, sixes, wickets, overs: `${Math.floor(legalBowls / 6)}.${legalBowls % 6}` };
  }, [match, playerId, playerEntry]);

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#06172a] text-white">Loading player profile…</main>;
  if (!match || !playerEntry) return <main className="grid min-h-screen place-items-center bg-[#06172a] px-4 text-white"><div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-6 text-center">{error || "Player not found."}</div></main>;

  const team = match.teamA.id === playerEntry.teamId ? match.teamA : match.teamB;

  return (
    <main className="min-h-screen bg-[#06172a] text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-700 bg-[#07182d] p-5 shadow-xl">
          <Link href={`/score/${matchId}`} className="text-sm font-semibold text-emerald-400 underline underline-offset-2">← Back to Live Score</Link>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Player Profile</p>
          <h1 className="mt-1 text-3xl font-black">{playerEntry.player.name}</h1>
          <Link href={`/score/${matchId}/team/${team.id}`} className="mt-1 inline-block text-sm text-emerald-300 underline underline-offset-2">{team.name}</Link>
          {playerEntry.player.jerseyNumber != null && <p className="mt-1 text-sm text-slate-500">#{playerEntry.player.jerseyNumber}</p>}
        </header>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[["Runs", stats.runs], ["Balls", stats.balls], ["Fours", stats.fours], ["Sixes", stats.sixes]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-700 bg-slate-900 p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></div>)}
        </section>

        <section className="mt-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
          <h2 className="text-xl font-black">Bowling</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-950 p-4"><p className="text-xs text-slate-500">Overs</p><p className="mt-1 text-2xl font-black">{stats.overs}</p></div><div className="rounded-xl bg-slate-950 p-4"><p className="text-xs text-slate-500">Wickets</p><p className="mt-1 text-2xl font-black">{stats.wickets}</p></div></div>
        </section>
      </div>
    </main>
  );
}
