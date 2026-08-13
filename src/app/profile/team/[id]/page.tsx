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
  team: { id: string; name: string; shortName: string | null; logo: string | null };
  players: Array<{ id: string; name: string; photo: string | null; jerseyNumber: number | null }>;
  tournaments: Array<{ id: string; name: string; season: string | null; status: string; logo: string | null }>;
  stats: { matches: number; wins: number; losses: number; runs: number; wicketsLost: number; innings: number };
  recentMatches: Array<{ id: string; createdAt: string; status: string; opponent: string; opponentId: string; winnerId: string | null; tournamentName: string | null }>;
};

export default function TeamProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingLogo, setSavingLogo] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pin, setPin] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    params.then(({ id }) => fetch(`/api/teams/${id}`))
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load profile.");
        if (!cancelled) setProfile(data);
      })
      .catch((error) => !cancelled && setMessage(error.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [params]);

  async function changeLogo(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setMessage("Team logo must be 2 MB or smaller.");
      return;
    }
    setSavingLogo(true);
    setMessage("");
    try {
      const logo = await readImage(file);
      const response = await fetch(`/api/teams/${profile!.team.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logo }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save logo.");
      setProfile((current) => current ? { ...current, team: { ...current.team, logo: data.logo } } : current);
      setMessage("Team logo updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save logo.");
    } finally {
      setSavingLogo(false);
    }
  }

  async function deleteTeam() {
    if (!profile || !pin) return;
    setDeleting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/teams/${profile.team.id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete team.");
      window.location.href = "/";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete team.");
      setDeleting(false);
    }
  }

  if (loading) return <main className="min-h-screen p-6">Loading team profile…</main>;
  if (!profile) return <main className="min-h-screen p-6"><p>{message || "Team not found."}</p><Link className="underline" href="/">Back</Link></main>;

  const { team, stats } = profile;
  const winRate = stats.matches ? `${((stats.wins / stats.matches) * 100).toFixed(1)}%` : "0.0%";

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex items-center justify-between gap-3"><Link href="/" className="rounded-lg border bg-white px-3 py-2 text-sm">← Back</Link><h1 className="text-xl font-bold">Team Profile</h1><button onClick={() => setShowDelete(true)} className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700">Delete</button></div>
        {message && <div className="rounded-lg border bg-white p-3 text-sm">{message}</div>}

        <section className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border bg-slate-100">{team.logo ? <img src={team.logo} alt={team.name} className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center text-3xl font-bold text-slate-400">{team.shortName || team.name.slice(0, 2).toUpperCase()}</div>}</div>
          <div className="min-w-0 flex-1"><h2 className="text-3xl font-bold">{team.name}</h2>{team.shortName && <p className="mt-1 text-sm text-slate-500">{team.shortName}</p>}</div>
          <label className="cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white">{savingLogo ? "Saving…" : team.logo ? "Change Logo" : "Add Logo"}<input type="file" accept="image/*" className="hidden" disabled={savingLogo} onChange={(event) => { const file = event.target.files?.[0]; if (file) void changeLogo(file); event.currentTarget.value = ""; }} /></label>
        </div></section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-6">{[["Matches", stats.matches], ["Wins", stats.wins], ["Losses", stats.losses], ["Win Rate", winRate], ["Runs", stats.runs], ["Innings", stats.innings]].map(([label, value]) => <div key={String(label)} className="rounded-xl border bg-white p-4 text-center shadow-sm"><div className="text-2xl font-bold">{value}</div><div className="text-xs text-slate-500">{label}</div></div>)}</section>

        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border bg-white p-5 shadow-sm"><h3 className="font-semibold">Players</h3><div className="mt-3 space-y-2">{profile.players.length ? profile.players.map((player) => <Link key={player.id} href={`/profile/player/${player.id}`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50"><div className="h-9 w-9 overflow-hidden rounded-full bg-slate-100">{player.photo ? <img src={player.photo} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs font-bold">{player.name.charAt(0)}</div>}</div><span className="flex-1">{player.name}</span>{player.jerseyNumber != null && <span className="text-xs text-slate-500">#{player.jerseyNumber}</span>}</Link>) : <p className="text-sm text-slate-500">No players recorded.</p>}</div></section>
          <section className="rounded-2xl border bg-white p-5 shadow-sm"><h3 className="font-semibold">Tournaments</h3><div className="mt-3 space-y-2">{profile.tournaments.length ? profile.tournaments.map((tournament) => <div key={tournament.id} className="rounded-lg border p-3"><div className="font-medium">{tournament.name}</div><div className="text-xs text-slate-500">{tournament.season || ""} · {tournament.status}</div></div>) : <p className="text-sm text-slate-500">No tournaments recorded.</p>}</div></section>
        </div>

        <section className="rounded-2xl border bg-white p-5 shadow-sm"><h3 className="font-semibold">Recent matches</h3><div className="mt-3 divide-y">{profile.recentMatches.length ? profile.recentMatches.map((match) => <div key={match.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-medium">vs {match.opponent}</div><div className="text-xs text-slate-500">{match.tournamentName || "Standalone match"}</div></div><span className="text-xs text-slate-500">{match.winnerId === team.id ? "Won" : match.winnerId ? "Lost" : match.status}</span></div>) : <p className="py-3 text-sm text-slate-500">No matches recorded.</p>}</div></section>

        {showDelete && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"><h3 className="text-lg font-bold">Delete {team.name}?</h3><p className="mt-2 text-sm text-slate-600">This uses the existing Maintenance PIN. Historical scoring data is protected; teams with historical match data cannot be physically deleted.</p><input autoFocus inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="Maintenance PIN" className="mt-4 w-full rounded-lg border px-3 py-2" /><div className="mt-4 flex justify-end gap-2"><button onClick={() => setShowDelete(false)} className="rounded-lg border px-4 py-2">Cancel</button><button disabled={!pin || deleting} onClick={() => void deleteTeam()} className="rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50">{deleting ? "Deleting…" : "Confirm Delete"}</button></div></div></div>}
      </div>
    </main>
  );
}
