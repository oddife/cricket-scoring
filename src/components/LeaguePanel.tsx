"use client";

import { useEffect, useState } from "react";

type Props = { tournamentId: string; format: string };
type Tournament = {
  id: string;
  status: "ACTIVE" | "COMPLETED";
  winPoints: number;
  lossPoints: number;
  allowTie: boolean;
  tiePoints: number;
  allowNoResult: boolean;
  noResultPoints: number;
};
type Row = {
  position: number;
  teamId: string;
  teamName: string;
  shortName: string | null;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  nrr: number;
};
type Candidate = { player: { id: string; name: string; jerseyNumber: number | null }; runs: number; wickets: number; score: number };

export default function LeaguePanel({ tournamentId, format }: Props) {
  const showLeague = format === "LEAGUE" || format === "LEAGUE_KNOCKOUT";
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [awardedPlayerId, setAwardedPlayerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const tournamentResponse = await fetch(`/api/tournaments/${tournamentId}`);
      const tournamentData = await tournamentResponse.json();
      if (!tournamentResponse.ok) throw new Error(tournamentData?.error || "Failed to load tournament.");
      setTournament(tournamentData);

      if (showLeague) {
        const pointsResponse = await fetch(`/api/tournaments/${tournamentId}/points`);
        const pointsData = await pointsResponse.json();
        if (!pointsResponse.ok) throw new Error(pointsData?.error || "Failed to load points table.");
        setRows(pointsData);
      }

      const awardResponse = await fetch(`/api/tournaments/${tournamentId}/award`);
      const awardData = await awardResponse.json();
      if (awardResponse.ok) {
        setCandidates(awardData.candidates ?? []);
        setAwardedPlayerId(awardData.award?.awardedPlayerId ?? "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load league information.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [tournamentId, showLeague]);

  async function saveRules() {
    if (!tournament) return;
    try {
      setSaving(true); setError(""); setMessage("");
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tournament),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to save points rules.");
      setTournament(data); setMessage("Points rules saved.");
      if (showLeague) {
        const points = await fetch(`/api/tournaments/${tournamentId}/points`).then((r) => r.json());
        setRows(points);
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save points rules."); }
    finally { setSaving(false); }
  }

  async function completeTournament() {
    try {
      setCompleting(true); setError(""); setMessage("");
      const response = await fetch(`/api/tournaments/${tournamentId}/complete`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to complete tournament.");
      setTournament((current) => current ? { ...current, status: "COMPLETED" } : current);
      setCandidates(data.shortlist ?? []);
      setMessage("Tournament completed. Man of the Series shortlist generated.");
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to complete tournament."); }
    finally { setCompleting(false); }
  }

  async function saveSeriesAward() {
    if (!awardedPlayerId) return;
    try {
      setSaving(true); setError(""); setMessage("");
      const response = await fetch(`/api/tournaments/${tournamentId}/award`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: awardedPlayerId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to save Man of the Series.");
      setMessage(`Man of the Series: ${data.awardedPlayer?.name ?? "saved"}.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save Man of the Series."); }
    finally { setSaving(false); }
  }

  if (loading && !tournament) return <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-sm text-slate-500">Loading league information...</div>;

  return (
    <section className="mt-8 space-y-5">
      {showLeague && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 [color-scheme:dark]">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div><h3 className="font-semibold">Points Table</h3><p className="mt-1 text-sm text-slate-500">League-stage matches only. NRR is shown as a tiebreaker/information field.</p></div>
            <button type="button" onClick={() => void load()} className="h-10 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 hover:bg-slate-900">Refresh</button>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500"><th className="px-3 py-3">Pos</th><th className="px-3 py-3">Team</th><th className="px-3 py-3">P</th><th className="px-3 py-3">W</th><th className="px-3 py-3">L</th><th className="px-3 py-3">T</th><th className="px-3 py-3">NR</th><th className="px-3 py-3">Pts</th><th className="px-3 py-3">NRR</th></tr></thead>
              <tbody>{rows.map((row) => <tr key={row.teamId} className="border-b border-slate-900"><td className="px-3 py-3 font-bold text-slate-400">{row.position}</td><td className="px-3 py-3 font-semibold text-slate-200">{row.teamName}{row.shortName ? <span className="ml-2 text-xs text-slate-500">({row.shortName})</span> : null}</td><td className="px-3 py-3">{row.played}</td><td className="px-3 py-3">{row.won}</td><td className="px-3 py-3">{row.lost}</td><td className="px-3 py-3">{row.tied}</td><td className="px-3 py-3">{row.noResult}</td><td className="px-3 py-3 font-black text-emerald-400">{row.points}</td><td className="px-3 py-3 font-semibold">{row.nrr >= 0 ? "+" : ""}{row.nrr.toFixed(3)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 [color-scheme:dark]">
        <div><h3 className="font-semibold">Points Rules</h3><p className="mt-1 text-sm text-slate-500">Tie and No Result are off by default and must be enabled for tournaments that use them.</p></div>
        {tournament && <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="rounded-xl border border-slate-800 bg-slate-900 p-4"><span className="block text-xs uppercase text-slate-500">Win points</span><input type="number" min="0" value={tournament.winPoints} onChange={(e) => setTournament({ ...tournament, winPoints: Number(e.target.value) })} className="mt-2 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white" /></label>
          <label className="rounded-xl border border-slate-800 bg-slate-900 p-4"><span className="block text-xs uppercase text-slate-500">Loss points</span><input type="number" min="0" value={tournament.lossPoints} onChange={(e) => setTournament({ ...tournament, lossPoints: Number(e.target.value) })} className="mt-2 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white" /></label>
          <label className="rounded-xl border border-slate-800 bg-slate-900 p-4"><span className="flex items-center justify-between text-xs uppercase text-slate-500">Tie <input type="checkbox" checked={tournament.allowTie} onChange={(e) => setTournament({ ...tournament, allowTie: e.target.checked })} /></span><input type="number" min="0" value={tournament.tiePoints} disabled={!tournament.allowTie} onChange={(e) => setTournament({ ...tournament, tiePoints: Number(e.target.value) })} className="mt-2 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white disabled:opacity-40" /></label>
          <label className="rounded-xl border border-slate-800 bg-slate-900 p-4"><span className="flex items-center justify-between text-xs uppercase text-slate-500">No Result <input type="checkbox" checked={tournament.allowNoResult} onChange={(e) => setTournament({ ...tournament, allowNoResult: e.target.checked })} /></span><input type="number" min="0" value={tournament.noResultPoints} disabled={!tournament.allowNoResult} onChange={(e) => setTournament({ ...tournament, noResultPoints: Number(e.target.value) })} className="mt-2 h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white disabled:opacity-40" /></label>
          <div className="flex items-end"><button type="button" disabled={saving || tournament.status === "COMPLETED"} onClick={() => void saveRules()} className="h-10 w-full rounded-xl bg-emerald-500 px-4 font-semibold text-slate-950 disabled:opacity-40">{saving ? "Saving..." : "Save Points Rules"}</button></div>
        </div>}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 [color-scheme:dark]">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h3 className="font-semibold">Tournament Awards</h3><p className="mt-1 text-sm text-slate-500">Man of the Series is generated from tournament-wide performance and can be overridden by the organizer.</p></div>{tournament?.status === "ACTIVE" && <button type="button" disabled={completing} onClick={() => void completeTournament()} className="h-10 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-slate-950 disabled:opacity-40">{completing ? "Completing..." : "Complete Tournament"}</button>}</div>
        {tournament?.status === "COMPLETED" && <div className="mt-5 space-y-3"><p className="text-xs font-bold uppercase tracking-wide text-amber-400">Man of the Series shortlist</p>{candidates.length === 0 ? <p className="text-sm text-slate-500">No player statistics available.</p> : candidates.map((candidate) => <button type="button" key={candidate.player.id} onClick={() => setAwardedPlayerId(candidate.player.id)} className={`flex w-full items-center justify-between rounded-xl border p-4 text-left ${awardedPlayerId === candidate.player.id ? "border-amber-400 bg-amber-400/10" : "border-slate-800 bg-slate-900"}`}><span><span className="block font-semibold text-slate-200">{candidate.player.name}</span><span className="text-xs text-slate-500">{candidate.runs} runs · {candidate.wickets} wickets</span></span><span className="text-xs font-bold text-amber-400">{awardedPlayerId === candidate.player.id ? "SELECTED" : "SELECT"}</span></button>)}<button type="button" disabled={!awardedPlayerId || saving} onClick={() => void saveSeriesAward()} className="h-11 w-full rounded-xl bg-amber-400 font-bold text-slate-950 disabled:opacity-40">{saving ? "Saving..." : "Confirm Man of the Series"}</button></div>}
      </div>

      {(error || message) && <div className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-red-900 bg-red-950/30 text-red-300" : "border-emerald-900 bg-emerald-950/30 text-emerald-300"}`}>{error || message}</div>}
    </section>
  );
}
