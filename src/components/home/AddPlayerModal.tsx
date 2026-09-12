"use client";

type AddPlayerModalProps = {
  showAddPlayer: boolean;
  selectedTournament: any;
  selectedTeamId: string | null;
  teamPlayers: any[];
  availablePlayers: any[];
  selectedExistingPlayerId: string;
  loadingAvailablePlayers: boolean;
  editingPlayerId: string | null;
  addPlayerMode: "EXISTING" | "NEW";
  playerName: string;
  playerJerseyNumber: string;
  playerBattingStyle: string;
  playerBowlingStyle: string;
  loadingPlayerCreate: boolean;
  loadingPlayerUpdate: boolean;
  setShowAddPlayer: (value: boolean) => void;
  setEditingPlayerId: (value: string | null) => void;
  setSelectedExistingPlayerId: (value: string) => void;
  setAddPlayerMode: (value: "EXISTING" | "NEW") => void;
  resetPlayerForm: () => void;
  setError: (value: string) => void;
  loadAvailablePlayers: () => Promise<void>;
  setPlayerName: (value: string) => void;
  setPlayerJerseyNumber: (value: string) => void;
  setPlayerBattingStyle: (value: string) => void;
  setPlayerBowlingStyle: (value: string) => void;
  updatePlayerForTeam: () => Promise<void>;
  addExistingPlayerToTeam: () => Promise<void>;
  createPlayerForTeam: () => Promise<void>;
};

export default function AddPlayerModal({
  showAddPlayer,
  selectedTournament,
  selectedTeamId,
  teamPlayers,
  availablePlayers,
  selectedExistingPlayerId,
  loadingAvailablePlayers,
  editingPlayerId,
  addPlayerMode,
  playerName,
  playerJerseyNumber,
  playerBattingStyle,
  playerBowlingStyle,
  loadingPlayerCreate,
  loadingPlayerUpdate,
  setShowAddPlayer,
  setEditingPlayerId,
  setSelectedExistingPlayerId,
  setAddPlayerMode,
  resetPlayerForm,
  setError,
  loadAvailablePlayers,
  setPlayerName,
  setPlayerJerseyNumber,
  setPlayerBattingStyle,
  setPlayerBowlingStyle,
  updatePlayerForTeam,
  addExistingPlayerToTeam,
  createPlayerForTeam,
}: AddPlayerModalProps) {
  const selectedTeam =
    selectedTournament?.teams.find(
      (tournamentTeam: any) => tournamentTeam.team.id === selectedTeamId,
    )?.team ?? null;

  const currentTeamPlayerIds = new Set(
    teamPlayers.map((membership: any) => membership.player.id),
  );

  const availableExistingPlayers = availablePlayers.filter(
    (player: any) => !currentTeamPlayerIds.has(player.id),
  );

  if (!showAddPlayer || !selectedTeam) return null;

  const close = () => {
    setShowAddPlayer(false);
    setEditingPlayerId(null);
    setSelectedExistingPlayerId("");
    setAddPlayerMode("EXISTING");
    resetPlayerForm();
    setError("");
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8 [color-scheme:dark]">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">{editingPlayerId ? "Edit Player" : "Add Player"}</h2>
          <p className="mt-2 text-sm text-slate-400">
            {editingPlayerId ? "Update player details for " : "Add a player to "}
            <span className="font-medium text-slate-300">{selectedTeam.name}</span>.
          </p>
        </div>

        {!editingPlayerId && (
          <div className="mb-5 grid grid-cols-2 rounded-xl border border-slate-700 bg-slate-950 p-1">
            <button type="button" onClick={() => { setAddPlayerMode("EXISTING"); setSelectedExistingPlayerId(""); setError(""); void loadAvailablePlayers(); }} className={`rounded-lg px-3 py-2 text-sm font-medium ${addPlayerMode === "EXISTING" ? "bg-emerald-500 text-slate-950" : "text-slate-400"}`}>Existing Player</button>
            <button type="button" onClick={() => { setAddPlayerMode("NEW"); setSelectedExistingPlayerId(""); resetPlayerForm(); setError(""); }} className={`rounded-lg px-3 py-2 text-sm font-medium ${addPlayerMode === "NEW" ? "bg-emerald-500 text-slate-950" : "text-slate-400"}`}>Create New</button>
          </div>
        )}

        {!editingPlayerId && addPlayerMode === "EXISTING" ? (
          <div>
            <label htmlFor="existingPlayer" className="mb-2 block text-sm font-medium text-slate-300">Select Existing Player</label>
            <select id="existingPlayer" autoFocus value={selectedExistingPlayerId} onChange={(event) => setSelectedExistingPlayerId(event.target.value)} disabled={loadingAvailablePlayers || availableExistingPlayers.length === 0} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white [color-scheme:dark]">
              <option value="">{loadingAvailablePlayers ? "Loading players..." : availableExistingPlayers.length === 0 ? "No existing players available" : "Select a player"}</option>
              {availableExistingPlayers.map((player: any) => (
                <option key={player.id} value={player.id}>
                  {player.jerseyNumber != null ? `#${player.jerseyNumber} ` : ""}{player.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">Players already registered with {selectedTeam.name} are hidden.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="playerName" className="mb-2 block text-sm font-medium text-slate-300">Player Name</label>
              <input id="playerName" type="text" autoFocus value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="e.g. Rahul Sharma" className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white placeholder:text-slate-600" />
            </div>
            <div>
              <label htmlFor="playerJerseyNumber" className="mb-2 block text-sm font-medium text-slate-300">Jersey Number</label>
              <input id="playerJerseyNumber" type="text" inputMode="numeric" pattern="[0-9]*" value={playerJerseyNumber} onChange={(event) => setPlayerJerseyNumber(event.target.value.replace(/\D/g, ""))} placeholder="Optional" className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white placeholder:text-slate-600" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="playerBattingStyle" className="mb-2 block text-sm font-medium text-slate-300">Batting Hand</label>
                <select id="playerBattingStyle" value={playerBattingStyle} onChange={(event) => setPlayerBattingStyle(event.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white [color-scheme:dark]"><option value="">Select hand</option><option value="Right-handed">Right-handed</option><option value="Left-handed">Left-handed</option></select>
              </div>
              <div>
                <label htmlFor="playerBowlingStyle" className="mb-2 block text-sm font-medium text-slate-300">Bowling Arm</label>
                <select id="playerBowlingStyle" value={playerBowlingStyle} onChange={(event) => setPlayerBowlingStyle(event.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white [color-scheme:dark]"><option value="">Select arm</option><option value="Right-arm">Right-arm</option><option value="Left-arm">Left-arm</option></select>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button type="button" disabled={loadingPlayerCreate || loadingPlayerUpdate} onClick={close} className="h-12 flex-1 rounded-xl border border-slate-700 px-5 font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50">Cancel</button>
          <button type="button" disabled={loadingPlayerCreate || loadingPlayerUpdate || (editingPlayerId ? !playerName.trim() : addPlayerMode === "EXISTING" ? !selectedExistingPlayerId : !playerName.trim())} onClick={() => void (editingPlayerId ? updatePlayerForTeam() : addPlayerMode === "EXISTING" ? addExistingPlayerToTeam() : createPlayerForTeam())} className="h-12 flex-1 rounded-xl bg-emerald-500 px-5 font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500">
            {editingPlayerId ? (loadingPlayerUpdate ? "Saving..." : "Save Changes") : addPlayerMode === "EXISTING" ? (loadingPlayerCreate ? "Adding..." : "Add Existing Player") : (loadingPlayerCreate ? "Adding..." : "Add Player")}
          </button>
        </div>
      </div>
    </div>
  );
}
