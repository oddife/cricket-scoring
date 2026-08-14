"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

type Player = {
  id: string;
  name: string;
  jerseyNumber?: number | null;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
};

type Team = {
  id: string;
  name: string;
  shortName?: string | null;
};

type MatchPlayer = {
  playerId: string;
  teamId: string;
  player: Player;
};

type MatchData = {
  id: string;
  status: string;
  teamA: Team;
  teamB: Team;
  players: MatchPlayer[];
  innings: Array<{ id: string; inningsNumber: number; battingTeamId: string; bowlingTeamId: string; totalRuns: number; wickets: number; legalBalls: number }>;
};

export default function PublicTeamProfilePage({
  params,
}: {
  params: Promise<{ matchId: string; teamId: string }>;
}) {
  const { matchId, teamId } = use(params);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/matches/${matchId}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Failed to load team profile.");
        setMatch(data.match ?? data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load team profile.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [matchId]);

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#06172a] text-white">Loading team profile…</main>;
  if (!match) return <main className="grid min-h-screen place-items-center bg-[#06172a] px-4 text-white"><div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-6 text-center">{error || "Team not found."}</div></main>;

  const team = match.teamA.id === teamId ? match.teamA : match.teamB.id === teamId ? match.teamB : null;
  const players = match.players.filter((entry) => entry.teamId === teamId);

  if (!team) return <main className="grid min-h-screen place-items-center bg-[#06172a] px-4 text-white"><div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-6 text-center">Team not found.</div></main>;

  return (
    <main className="min-h-screen bg-[#06172a] text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-700 bg-[#07182d] p-5 shadow-xl">
          <Link href={`/score/${matchId}`} className="text-sm font-semibold text-emerald-400 underline underline-offset-2">← Back to Live Score</Link>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Team Profile</p>
          <h1 className="mt-1 text-3xl font-black">{team.name}</h1>
          {team.shortName && <p className="mt-1 text-sm text-slate-400">{team.shortName}</p>}
        </header>

        <section className="mt-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">Players</h2><span className="text-xs uppercase tracking-wide text-slate-500">{players.length} players</span></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((entry) => (
              <Link key={entry.playerId} href={`/score/${matchId}/player/${entry.playerId}`} className="rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-emerald-500/40 hover:bg-slate-900">
                <p className="font-bold text-emerald-300 underline underline-offset-2 decoration-emerald-400/50">{entry.player.name}</p>
                {entry.player.jerseyNumber != null && <p className="mt-1 text-xs text-slate-500">#{entry.player.jerseyNumber}</p>}
                {entry.player.battingStyle && <p className="mt-2 text-xs text-slate-400">Batting: {entry.player.battingStyle}</p>}
                {entry.player.bowlingStyle && <p className="mt-1 text-xs text-slate-400">Bowling: {entry.player.bowlingStyle}</p>}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
