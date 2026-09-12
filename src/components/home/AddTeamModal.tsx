"use client";

type AddTeamModalProps = {
  showAddTeam: boolean;
  selectedTournament: any;
  globalTeams: any[];
  loadingGlobalTeams: boolean;
  addTeamMode: "EXISTING" | "NEW";
  selectedExistingTeamId: string;
  teamName: string;
  teamShortName: string;
  loadingTeamCreate: boolean;
  setAddTeamMode: (value: "EXISTING" | "NEW") => void;
  setSelectedExistingTeamId: (value: string) => void;
  setTeamName: (value: string) => void;
  setTeamShortName: (value: string) => void;
  setShowAddTeam: (value: boolean) => void;
  setError: (value: string) => void;
  addExistingTeamToTournament: () => Promise<void>;
  createTeam: () => Promise<void>;
};

export default function AddTeamModal(props: AddTeamModalProps) {
  const {
    showAddTeam,
    selectedTournament,
    globalTeams,
    loadingGlobalTeams,
    addTeamMode,
    selectedExistingTeamId,
    teamName,
    teamShortName,
    loadingTeamCreate,
    setAddTeamMode,
    setSelectedExistingTeamId,
    setTeamName,
    setTeamShortName,
    setShowAddTeam,
    setError,
    addExistingTeamToTournament,
    createTeam,
  } = props;

  if (!showAddTeam) {
    return null;
  }

  const tournamentTeamIds = new Set(
    selectedTournament?.teams.map(
      (tournamentTeam: any) => tournamentTeam.team.id,
    ) ?? [],
  );

  const availableExistingTeams = globalTeams;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8 [color-scheme:dark]">
        <div className="mb-6">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl">
            {String.fromCodePoint(0x1F3CF)}
          </div>
          <h2 className="text-xl font-semibold">Add Team</h2>
          <p className="mt-1 text-sm text-slate-400">
            Add a team to{" "}
            <span className="font-medium text-slate-300 [color-scheme:dark]">
              {selectedTournament?.name}
            </span>.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-xl border border-slate-700 bg-slate-950 p-1 [color-scheme:dark]">
          <button
            type="button"
            onClick={() => {
              setAddTeamMode("EXISTING");
              setError("");
            }}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              addTeamMode === "EXISTING"
                ? "bg-emerald-500 text-slate-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Existing Team
          </button>
          <button
            type="button"
            onClick={() => {
              setAddTeamMode("NEW");
              setError("");
            }}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              addTeamMode === "NEW"
                ? "bg-emerald-500 text-slate-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Create New
          </button>
        </div>

        {addTeamMode === "EXISTING" ? (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="existingTeam"
                className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
              >
                Select Existing Team
              </label>
              <select
                id="existingTeam"
                autoFocus
                value={selectedExistingTeamId}
                onChange={(event) =>
                  setSelectedExistingTeamId(event.target.value)
                }
                disabled={
                  loadingGlobalTeams ||
                  availableExistingTeams.length === 0
                }
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none transition focus:border-emerald-500 disabled:opacity-50 [color-scheme:dark]"
              >
                <option value="">
                  {loadingGlobalTeams
                    ? "Loading teams..."
                    : availableExistingTeams.length === 0
                      ? "No teams available"
                      : "Select a team"}
                </option>
                {availableExistingTeams.map((team) => {
                  const alreadyInTournament = tournamentTeamIds.has(team.id);
                  return (
                    <option key={team.id} value={team.id} disabled={alreadyInTournament}>
                      {team.name}
                      {team.shortName ? ` (${team.shortName})` : ""}
                      {alreadyInTournament ? " - already in tournament" : ""}
                    </option>
                  );
                })}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                All existing teams are shown. Teams already in this tournament are disabled.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label
                htmlFor="teamName"
                className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
              >
                Team Name
              </label>
              <input
                id="teamName"
                type="text"
                autoFocus
                value={teamName}
                onChange={(event) =>
                  setTeamName(event.target.value)
                }
                placeholder="e.g. Mumbai Warriors"
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500"
              />
            </div>
            <div>
              <label
                htmlFor="teamShortName"
                className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
              >
                Short Name
              </label>
              <input
                id="teamShortName"
                type="text"
                maxLength={8}
                value={teamShortName}
                onChange={(event) =>
                  setTeamShortName(event.target.value)
                }
                placeholder="e.g. MW"
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none placeholder:text-slate-600 focus:border-emerald-500"
              />
              <p className="mt-2 text-xs text-slate-600">
                Optional {String.fromCharCode(0x2014)} maximum 8 characters.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            disabled={loadingTeamCreate}
            onClick={() => {
              setShowAddTeam(false);
              setSelectedExistingTeamId("");
              setTeamName("");
              setTeamShortName("");
              setError("");
            }}
            className="h-12 flex-1 rounded-xl border border-slate-700 px-5 font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50 [color-scheme:dark]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={
              loadingTeamCreate ||
              (addTeamMode === "EXISTING"
                ? !selectedExistingTeamId
                : !teamName.trim())
            }
            onClick={() =>
              addTeamMode === "EXISTING"
                ? void addExistingTeamToTournament()
                : void createTeam()
            }
            className="h-12 flex-1 rounded-xl bg-emerald-500 px-5 font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {loadingTeamCreate
              ? "Adding..."
              : addTeamMode === "EXISTING"
                ? "Add Existing Team"
                : "Create Team"}
          </button>
        </div>
      </div>
    </div>
  );
}
