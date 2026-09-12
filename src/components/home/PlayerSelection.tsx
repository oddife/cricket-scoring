"use client";

type GlobalPlayer = {
  id: string;
  name: string;
  photo?: string | null;
  jerseyNumber?: number | null;
  battingStyle?: string | null;
  bowlingStyle?: string | null;
};
type PlayerSelectionProps = {
  selectedTournament: any;
  teamAId: string;
  teamBId: string;
  matchPlayersA: string[];
  matchPlayersB: string[];
  captainA: string;
  captainB: string;
  viceCaptainA: string;
  viceCaptainB: string;
  wicketKeeperA: string;
  wicketKeeperB: string;
  teamAPlayers: any[];
  teamBPlayers: any[];
  playersPerTeam: number;
  teamASelectionValid: boolean;
  teamBSelectionValid: boolean;
  canSaveMatchPlayers: boolean;
  loadingMatchPlayers: boolean;
  setMatchPlayersA: (value: string[]) => void;
  setMatchPlayersB: (value: string[]) => void;
  setCaptainA: (value: string) => void;
  setCaptainB: (value: string) => void;
  setViceCaptainA: (value: string) => void;
  setViceCaptainB: (value: string) => void;
  setWicketKeeperA: (value: string) => void;
  setWicketKeeperB: (value: string) => void;
  setPageMode: (value: any) => void;
  saveMatchPlayers: () => Promise<void>;
  toggleMatchPlayer: (
    team: "A" | "B",
    playerId: string,
  ) => void;};

export default function PlayerSelection({
  selectedTournament,
  teamAId,
  teamBId,
  matchPlayersA,
  matchPlayersB,
  captainA,
  captainB,
  viceCaptainA,
  viceCaptainB,
  wicketKeeperA,
  wicketKeeperB,
  teamAPlayers,
  teamBPlayers,
  playersPerTeam,
  teamASelectionValid,
  teamBSelectionValid,
  canSaveMatchPlayers,
  loadingMatchPlayers,
  setMatchPlayersA,
  setMatchPlayersB,
  setCaptainA,
  setCaptainB,
  setViceCaptainA,
  setViceCaptainB,
  setWicketKeeperA,
  setWicketKeeperB,
  setPageMode,
  saveMatchPlayers,
  toggleMatchPlayer,
}: PlayerSelectionProps) {
const teamA = selectedTournament?.teams.find(
      (team: any) => team.team.id === teamAId,
    );

    const teamB = selectedTournament?.teams.find(
      (team: any) => team.team.id === teamBId,
    );

    function renderPlayerCard(
      player: GlobalPlayer,
      team: "A" | "B",
    ) {
      const selected =
        team === "A"
          ? matchPlayersA.includes(player.id)
          : matchPlayersB.includes(player.id);

      const captain =
        team === "A"
          ? captainA === player.id
          : captainB === player.id;

      const viceCaptain =
        team === "A"
          ? viceCaptainA === player.id
          : viceCaptainB === player.id;

      const wicketKeeper =
        team === "A"
          ? wicketKeeperA === player.id
          : wicketKeeperB === player.id;

      return (
        <div
          key={player.id}
          className={`rounded-2xl border p-4 transition ${
            selected
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-slate-700 bg-slate-950 hover:border-slate-600"
          }`}
        >
          <button
            type="button"
            onClick={() =>
              toggleMatchPlayer(team, player.id)
            }
            className="flex w-full items-center gap-4 text-left"
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                selected
                  ? "border-emerald-400 bg-emerald-500 text-slate-950"
                  : "border-slate-700 bg-slate-900 text-slate-400"
              }`}
            >
              {player.jerseyNumber ??
                String.fromCharCode(0x2022)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-semibold">
                {player.name}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                {player.battingStyle ||
                  "Batting style N/A"}
                {"  -  "}
                {player.bowlingStyle ||
                  "Bowling style N/A"}
              </div>
            </div>

            <div
              className={`h-5 w-5 rounded border ${
                selected
                  ? "border-emerald-400 bg-emerald-400"
                  : "border-slate-600"
              }`}
            />
          </button>

          {selected && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (team === "A") {
                    setCaptainA(
                      captain ? "" : player.id,
                    );
                  } else {
                    setCaptainB(
                      captain ? "" : player.id,
                    );
                  }
                }}
                className={`rounded-lg px-2 py-2 text-xs font-medium ${
                  captain
                    ? "bg-amber-400 text-slate-950"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                Captain
              </button>

              <button
                type="button"
                onClick={() => {
                  if (team === "A") {
                    setViceCaptainA(
                      viceCaptain ? "" : player.id,
                    );
                  } else {
                    setViceCaptainB(
                      viceCaptain ? "" : player.id,
                    );
                  }
                }}
                className={`rounded-lg px-2 py-2 text-xs font-medium ${
                  viceCaptain
                    ? "bg-blue-400 text-slate-950"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                Vice
              </button>

              <button
                type="button"
                onClick={() => {
                  if (team === "A") {
                    setWicketKeeperA(
                      wicketKeeper ? "" : player.id,
                    );
                  } else {
                    setWicketKeeperB(
                      wicketKeeper ? "" : player.id,
                    );
                  }
                }}
                className={`rounded-lg px-2 py-2 text-xs font-medium ${
                  wicketKeeper
                    ? "bg-purple-400 text-slate-950"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                WK
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <section>
        <button
          type="button"
          onClick={() => setPageMode("MATCH_SETUP")}
          className="mb-4 text-sm text-slate-400 hover:text-emerald-400"
        >
          {String.fromCharCode(0x2190)} Back to Match Setup
        </button>

        <h2 className="text-2xl font-semibold">
          Select Match Players
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Select at least 3 and up to {playersPerTeam} players for each team
          and assign the captain, vice-captain and
          wicketkeeper.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 [color-scheme:dark]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {teamA?.team.name ?? "Team A"}
                </h3>
                <p className="text-xs text-slate-500">
                  {matchPlayersA.length} / {playersPerTeam} players
                </p>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  teamASelectionValid
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {teamASelectionValid
                  ? "Ready"
                  : "Incomplete"}
              </div>
            </div>

            <div className="space-y-3">
              {teamAPlayers.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No players available for this team.
                </p>
              ) : (
                teamAPlayers.map((player) =>
                  renderPlayerCard(player, "A"),
                )
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 [color-scheme:dark]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {teamB?.team.name ?? "Team B"}
                </h3>
                <p className="text-xs text-slate-500">
                  {matchPlayersB.length} / {playersPerTeam} players
                </p>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  teamBSelectionValid
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {teamBSelectionValid
                  ? "Ready"
                  : "Incomplete"}
              </div>
            </div>

            <div className="space-y-3">
              {teamBPlayers.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No players available for this team.
                </p>
              ) : (
                teamBPlayers.map((player) =>
                  renderPlayerCard(player, "B"),
                )
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => void saveMatchPlayers()}
            disabled={
              !canSaveMatchPlayers ||
              loadingMatchPlayers
            }
            className="h-12 w-full rounded-xl bg-emerald-500 px-6 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 sm:w-auto"
          >
            {loadingMatchPlayers
              ? "Saving Players..."
              : "Continue to Opening Players >"}
          </button>
        </div>
      </section>
    );
  }

  // ---------------------------------------------------------



