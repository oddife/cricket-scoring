"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type Profile = {
  player: {
    id: string;
    name: string;
    photo: string | null;
    jerseyNumber: number | null;
    battingStyle: string | null;
    bowlingStyle: string | null;
  };
  teams: Array<{ id: string; name: string; shortName: string | null; logo: string | null }>;
  tournaments: Array<{ id: string; name: string; season: string | null; teamId: string; teamName: string }>;
  stats: { matches: number; runs: number; battingBalls: number; wickets: number; dismissals: number };
  recentMatches: Array<{ id: string; addedAt: string; role: string; teamId: string; teamName: string; teamA: string; teamB: string; tournamentName: string | null; status: string }>;
};

export default function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pin, setPin] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    params.then(({ id }) => fetch(`/api/players/${id}`))
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load profile.");
        if (!cancelled) setProfile(data);
      })
      .catch((error) => !cancelled && setMessage(error.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [params]);

  async function changePhoto(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setMessage("Photo must be 2 MB or smaller.");
      return;
    }
    setSavingPhoto(true);
    setMessage("");
    try {
      const photo = await readImage(file);
      const response = await fetch(`/api/players/${profile!.player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save photo.");
      setProfile((current) => current ? { ...current, player: { ...current.player, photo: data.photo } } : current);
      setMessage("Photo updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save photo.");
    } finally {
      setSavingPhoto(false);
    }
  }

  async function deletePlayer() {
    if (!profile || !pin) return;
    setDeleting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/players/${profile.player.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to archive player.");
      window.location.href = "/";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to archive player.");
      setDeleting(false);
    }
  }

  if (loading) return <main className="min-h-screen bg-slate-950 p-6 text-slate-100">Loading player profile…</main>;
  if (!profile) return <main className="min-h-screen bg-slate-950 p-6 text-slate-100"><p>{message || "Player not found."}</p><Link className="underline" href="/">Back</Link></main>;

  const { player, stats } = profile;
  const strikeRate = stats.battingBalls ? ((stats.runs / stats.battingBalls) * 100).toFixed(1) : "0.0";

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm">← Back</Link>
          <h1 className="text-xl font-bold">Player Profile</h1>
          <button onClick={() => setShowDelete(true)} className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700">Delete</button>
        </div>

        {message && <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm">{message}</div>}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border bg-slate-800">
              {player.photo ? <img src={player.photo} alt={player.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-4xl font-bold text-slate-400">{player.name.charAt(0).toUpperCase()}</div>}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-3xl font-bold">{player.name}</h2>
              <p className="mt-1 text-sm text-slate-400">{player.jerseyNumber != null ? `Jersey #${player.jerseyNumber}` : "No jersey number"}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                {player.battingStyle && <span className="rounded-full bg-slate-800 px-3 py-1">Batting: {player.battingStyle}</span>}
                {player.bowlingStyle && <span className="rounded-full bg-slate-800 px-3 py-1">Bowling: {player.bowlingStyle}</span>}
              </div>
            </div>
            <label className="cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white">
              {savingPhoto ? "Saving…" : player.photo ? "Change Photo" : "Add Photo"}
              <input type="file" accept="image/*" className="hidden" disabled={savingPhoto} onChange={(event) => { const file = event.target.files?.[0]; if (file) void changePhoto(file); event.currentTarget.value = ""; }} />
            </label>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[["Matches", stats.matches], ["Runs", stats.runs], ["Balls", stats.battingBalls], ["Strike Rate", strikeRate], ["Wickets", stats.wickets]].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center shadow-sm"><div className="text-2xl font-bold">{value}</div><div className="text-xs text-slate-400">{label}</div></div>
          ))}
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
            <h3 className="font-semibold">Teams</h3>
            <div className="mt-3 space-y-2">{profile.teams.length ? profile.teams.map((team) => <Link key={team.id} href={`/profile/team/${team.id}`} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-slate-200 hover:bg-slate-800"><span>{team.name}</span><span className="text-xs text-slate-400">Open →</span></Link>) : <p className="text-sm text-slate-400">No teams recorded.</p>}</div>
          </section>
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
            <h3 className="font-semibold">Tournaments</h3>
            <div className="mt-3 space-y-2">{profile.tournaments.length ? profile.tournaments.map((tournament) => <div key={`${tournament.id}-${tournament.teamId}`} className="rounded-lg border border-slate-700 bg-slate-950/60 p-3"><div className="font-medium">{tournament.name}</div><div className="text-xs text-slate-400">{tournament.season || ""} · {tournament.teamName}</div></div>) : <p className="text-sm text-slate-400">No tournaments recorded.</p>}</div>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <h3 className="font-semibold">Recent matches</h3>
          <div className="mt-3 divide-y">{profile.recentMatches.length ? profile.recentMatches.map((match) => <div key={match.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-medium">{match.teamA} vs {match.teamB}</div><div className="text-xs text-slate-400">{match.tournamentName || "Standalone match"} · {match.teamName} · {match.role}</div></div><span className="text-xs text-slate-400">{match.status}</span></div>) : <p className="py-3 text-sm text-slate-400">No matches recorded.</p>}</div>
        </section>

        {showDelete && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl"><h3 className="text-lg font-bold">Archive {player.name}?</h3><p className="mt-2 text-sm text-slate-300">This uses the existing Maintenance PIN. The player will be removed from active rosters while all historical scoring data and this profile remain intact.</p><input autoFocus inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="Maintenance PIN" className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" /><div className="mt-4 flex justify-end gap-2"><button onClick={() => setShowDelete(false)} className="rounded-lg border px-4 py-2">Cancel</button><button disabled={!pin || deleting} onClick={() => void deletePlayer()} className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50">{deleting ? "Archiving…" : "Confirm Archive"}</button></div></div></div>}
      </div>
    </main>
  );
}
