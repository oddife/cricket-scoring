"use client";

import LeaguePanel from "@/components/LeaguePanel";

type TournamentDashboardProps = {
  selectedTournament: any;
  selectedTeamId: string | null;
  teamPlayers: any[];
  liveMatches: any[];
  completedMatches: any[];
  loadingLiveMatches: boolean;
  loadingCompletedMatches: boolean;
  expandedMatchId: string | null;
  loadingScorecard: boolean;
  formatLabels: Record<string, string>;
  openMatchSetup: () => void;
  openAddTeamModal: () => void;
  selectTeam: (teamId: string) => void;
  removeTeamFromCurrentTournament: (teamId: string, teamName: string) => Promise<void>;
  openAddPlayerModal: () => void;
  setEditingPlayerId: (value: string | null) => void;
  setPlayerName: (value: string) => void;
  setPlayerJerseyNumber: (value: string) => void;
  setPlayerBattingStyle: (value: string) => void;
  setPlayerBowlingStyle: (value: string) => void;
  setShowAddPlayer: (value: boolean) => void;
  removePlayerFromCurrentRoster: (playerId: string, playerName: string) => Promise<void>;
  loadLiveMatches: (tournamentId?: string) => Promise<void>;
  loadCompletedMatches: (tournamentId?: string) => Promise<void>;
  setExpandedMatchId: (value: string | null) => void;
  openScorecard: (matchId: string) => Promise<void>;
  resumeMatch: (matchId: string) => Promise<void>;
  resumingMatchId: string | null;
};

export default function TournamentDashboard({
  selectedTournament,
  selectedTeamId,
  teamPlayers,
  liveMatches,
  completedMatches,
  loadingLiveMatches,
  loadingCompletedMatches,
  expandedMatchId,
  loadingScorecard,
  formatLabels,
  openMatchSetup,
  openAddTeamModal,
  selectTeam,
  removeTeamFromCurrentTournament,
  openAddPlayerModal,
  setEditingPlayerId,
  setPlayerName,
  setPlayerJerseyNumber,
  setPlayerBattingStyle,
  setPlayerBowlingStyle,
  setShowAddPlayer,
  removePlayerFromCurrentRoster,
  loadLiveMatches,
  loadCompletedMatches,
  setExpandedMatchId,
  openScorecard,
  resumeMatch,
  resumingMatchId,
}: TournamentDashboardProps) {
  if (!selectedTournament) return null;

  const selectedTeam = selectedTournament.teams.find(
    (item: any) => item.team.id === selectedTeamId,
  )?.team;

  return (
    <section>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm text-emerald-400">Tournament</p>
          <h2 className="mt-1 text-2xl font-bold">{selectedTournament.name}</h2>
          <p className="mt-2 text-sm text-slate-400">
            Season : {selectedTournament.season ?? "-"} {"   "}
            Format : {formatLabels[selectedTournament.format]}
          </p>
        </div>
        <button type="button" onClick={openMatchSetup} className="h-12 rounded-xl bg-emerald-500 px-6 font-semibold text-slate-950 transition hover:bg-emerald-400">
          + New Match
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 [color-scheme:dark]"><p className="text-sm text-slate-500">Teams</p><p className="mt-2 text-3xl font-bold text-slate-200">{selectedTournament.teams.length}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 [color-scheme:dark]"><p className="text-sm text-slate-500">Matches</p><p className="mt-2 text-3xl font-bold text-slate-200">{selectedTournament._count.matches}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 [color-scheme:dark]"><p className="text-sm text-slate-500">Format</p><p className="mt-2 text-lg font-semibold text-slate-200">{formatLabels[selectedTournament.format]}</p></div>
      </div>

      <LeaguePanel tournamentId={selectedTournament.id} format={selectedTournament.format} />

      <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 [color-scheme:dark]">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div><h3 className="font-semibold">Live Matches</h3><p className="mt-1 text-sm text-slate-500">Resume a match that is already in progress.</p></div>
          <button type="button" onClick={() => { void loadLiveMatches(selectedTournament.id); void loadCompletedMatches(selectedTournament.id); }} disabled={loadingLiveMatches} className="h-10 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 hover:bg-slate-900 disabled:opacity-50 [color-scheme:dark]">{loadingLiveMatches ? "Refreshing..." : "Refresh"}</button>
        </div>
        <div className="mt-5 space-y-3">
          {liveMatches.map((match: any) => {
            const innings = [...match.innings].reverse().find((item: any) => item.status === "LIVE") ?? match.innings[match.innings.length - 1];
            return (
              <div key={match.id} className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between [color-scheme:dark]">
                <div>
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><span className="text-xs font-bold uppercase tracking-wider text-emerald-400">LIVE</span></div>
                  <p className="mt-2 text-lg font-bold">{match.teamA.name}{" vs "}{match.teamB.name}</p>
                  {innings && <p className="mt-1 text-sm text-slate-400">{innings.totalRuns}/{innings.wickets}{"  "}<span className="text-slate-600">-</span>{"  "}{Math.floor(innings.legalBalls / 6)}.{innings.legalBalls % 6}{" overs"}{"   -   "}{match.bowlingMode === "DOUBLE" ? "Double Bowler" : "Normal"}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => window.open(`/score/${match.id}`, "_blank", "noopener,noreferrer")} className="h-11 rounded-xl border border-slate-600 bg-slate-900 px-4 font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800">Open Live Score</button>
                  <button type="button" onClick={async () => { const url = `${window.location.origin}/score/${match.id}`; try { if (navigator.share) { await navigator.share({ title: `${match.teamA.name} vs ${match.teamB.name}`, text: "Live Score", url }); return; } await navigator.clipboard.writeText(url); } catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; console.error("Share live score error:", error); } }} className="h-11 rounded-xl border border-slate-600 bg-slate-900 px-4 font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800">Share</button>
                  <button type="button" onClick={() => void resumeMatch(match.id)} disabled={resumingMatchId === match.id} className="h-11 rounded-xl bg-emerald-500 px-5 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">{resumingMatchId === match.id ? "Opening..." : "Resume Match"}</button>
                </div>
              </div>
            );
          })}
          {!loadingLiveMatches && liveMatches.length === 0 && <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500 [color-scheme:dark]">No live matches in this tournament.</div>}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 [color-scheme:dark]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div><h3 className="font-semibold">Teams</h3><p className="mt-1 text-sm text-slate-500">Teams participating in this tournament.</p></div>
          <button type="button" onClick={openAddTeamModal} className="h-10 rounded-xl border border-emerald-500/50 px-4 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/10 [color-scheme:dark]">+ Add Team</button>
        </div>
        {selectedTournament.teams.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-800 p-8 text-center [color-scheme:dark]"><div className="text-3xl">{String.fromCodePoint(0x1F3CF)}</div><p className="mt-3 font-medium text-slate-300 [color-scheme:dark]">No teams yet</p><p className="mt-1 text-sm text-slate-500">Add at least two teams before creating a match.</p><button type="button" onClick={openAddTeamModal} className="mt-5 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400">+ Add First Team</button></div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selectedTournament.teams.map((tournamentTeam: any) => (
              <div key={tournamentTeam.id} onClick={() => selectTeam(tournamentTeam.team.id)} className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900 p-4 [color-scheme:dark]">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-semibold text-slate-200">{tournamentTeam.team.name}</p>{tournamentTeam.team.shortName && <p className="mt-1 text-xs font-medium text-emerald-400">{tournamentTeam.team.shortName}</p>}</div>
                  <div className="flex shrink-0 items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-lg">{String.fromCodePoint(0x1F3CF)}</div><button type="button" title="Remove team from this tournament" aria-label={`Remove ${tournamentTeam.team.name} from this tournament`} onClick={(event) => { event.stopPropagation(); void removeTeamFromCurrentTournament(tournamentTeam.team.id, tournamentTeam.team.name); }} className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-lg font-bold text-red-400 transition hover:bg-red-500/20">−</button></div>
                </div>
                <div className="mt-4 border-t border-slate-800 pt-3 [color-scheme:dark]"><p className="text-xs text-slate-500">{tournamentTeam.team._count?.players ?? 0} players</p></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTeamId && (
        <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-slate-950/70 p-6 [color-scheme:dark]">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm text-emerald-400">Team Players</p><h3 className="mt-1 font-semibold text-slate-200">{selectedTeam?.name}</h3><p className="mt-1 text-sm text-slate-500">Manage the registered players for this team.</p></div><button type="button" onClick={openAddPlayerModal} className="h-10 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">+ Add Player</button></div>
          {teamPlayers.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-800 p-6 text-center [color-scheme:dark]"><div className="text-3xl">PLAYER</div><p className="mt-3 font-medium text-slate-300 [color-scheme:dark]">No players yet</p><p className="mt-1 text-sm text-slate-500">Add the players registered for this team.</p></div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {teamPlayers.map((membership: any) => (
                <div key={membership.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 [color-scheme:dark]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-slate-200">{membership.player.name}</p><div className="mt-2 flex flex-wrap gap-2 text-xs">{membership.player.jerseyNumber !== null && <span className="rounded-lg bg-slate-800 px-2 py-1 text-slate-400">#{membership.player.jerseyNumber}</span>}{membership.player.battingStyle && <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-emerald-400">Bat: {membership.player.battingStyle}</span>}{membership.player.bowlingStyle && <span className="rounded-lg bg-slate-800 px-2 py-1 text-slate-400">Bowl: {membership.player.bowlingStyle}</span>}</div></div>
                  <div className="flex shrink-0 items-center gap-2"><button type="button" onClick={() => { setEditingPlayerId(membership.player.id); setPlayerName(membership.player.name); setPlayerJerseyNumber(membership.player.jerseyNumber !== null ? String(membership.player.jerseyNumber) : ""); setPlayerBattingStyle(membership.player.battingStyle || ""); setPlayerBowlingStyle(membership.player.bowlingStyle || ""); setShowAddPlayer(true); }} className="flex h-10 items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm font-medium text-slate-300 transition hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400 [color-scheme:dark]">EDIT</button><button type="button" title="Remove player from current roster" aria-label={`Remove ${membership.player.name} from current roster`} onClick={() => void removePlayerFromCurrentRoster(membership.player.id, membership.player.name)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-xl font-bold text-red-400 transition hover:bg-red-500/20">−</button></div>
                </div></div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 [color-scheme:dark]">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h3 className="font-semibold">Previous Matches</h3><p className="mt-1 text-sm text-slate-500">Completed matches from this tournament.</p></div><button type="button" onClick={() => void loadCompletedMatches(selectedTournament.id)} disabled={loadingCompletedMatches} className="h-10 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 hover:bg-slate-900 disabled:opacity-50 [color-scheme:dark]">{loadingCompletedMatches ? "Refreshing..." : "Refresh"}</button></div>
        <div className="mt-5 space-y-3">
          {completedMatches.map((match: any) => {
            const innings = [...match.innings].sort((a: any, b: any) => a.inningsNumber - b.inningsNumber);
            const expanded = expandedMatchId === match.id;
            const formatScore = (item: any) => `${item.totalRuns}/${item.wickets} (${Math.floor(item.legalBalls / 6)}.${item.legalBalls % 6})`;
            const teamName = (teamId: string) => teamId === match.teamA.id ? match.teamA.name : match.teamB.name;
            const winnerName = match.winnerId === match.teamA.id ? match.teamA.name : match.winnerId === match.teamB.id ? match.teamB.name : null;
            return (
              <div key={match.id} className={`rounded-2xl border border-slate-800 bg-slate-950 transition ${expanded ? "p-4" : "p-3"}`}>
                <button type="button" onClick={() => setExpandedMatchId(expanded ? null : match.id)} className="w-full text-left" aria-expanded={expanded}><div className="flex min-w-0 items-center justify-between gap-3"><p className="truncate text-base font-bold text-slate-100">{match.teamA.name} <span className="text-slate-600">vs</span> {match.teamB.name}</p><div className="flex shrink-0 items-center gap-3"><span className="whitespace-nowrap text-xs font-medium text-slate-500">{new Date(match.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span><span className="text-xs text-slate-500">{expanded ? "Collapse" : "Expand"}</span></div></div></button>
                {expanded && <div className="mt-3 border-t border-slate-800 pt-3"><div className="space-y-1.5 text-sm">{innings.map((item: any) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2"><span className="text-slate-300">{teamName(item.battingTeamId)}</span><span className="font-bold text-slate-100">{formatScore(item)}</span></div>)}</div><div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3 text-xs"><div className="flex flex-wrap items-center gap-2">{winnerName ? <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-400">{winnerName} won</span> : <span className="rounded-lg bg-slate-800 px-2.5 py-1 font-semibold text-slate-400">Match drawn / tied</span>}<span className="rounded-lg bg-slate-800 px-2.5 py-1 text-slate-500">{match.oversPerInnings} overs</span><span className="rounded-lg bg-slate-800 px-2.5 py-1 text-slate-500">{match.inningsPerMatch} innings</span></div><button type="button" onClick={(event) => { event.stopPropagation(); void openScorecard(match.id); }} disabled={loadingScorecard} className="h-10 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50">{loadingScorecard ? "Loading..." : "Scorecard"}</button></div></div>}
              </div>
            );
          })}
          {!loadingCompletedMatches && completedMatches.length === 0 && <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500 [color-scheme:dark]">No completed matches in this tournament.</div>}
        </div>
      </div>
    </section>
  );
}
