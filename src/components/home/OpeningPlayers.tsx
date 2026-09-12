"use client";

type OpeningPlayersProps = {
  selectedTournament: any;
  teamAId: string;
  teamBId: string;
  matchPlayersA: string[];
  matchPlayersB: string[];
  openingStrikerId: string;
  openingNonStrikerId: string;
  openingBowlerAId: string;
  openingBowlerBId: string;
  loadingStartInnings: boolean;
  openingPlayersReady: boolean;
  bowlingMode: any;
  tossWinnerId: string;
  tossDecision: string;
  teamAPlayers: any[];
  teamBPlayers: any[];
  setOpeningStrikerId: (value: string) => void;
  setOpeningNonStrikerId: (value: string) => void;
  setOpeningBowlerAId: (value: string) => void;
  setOpeningBowlerBId: (value: string) => void;
  setPageMode: (value: any) => void;
  startFirstInnings: () => Promise<void>;
};

export default function OpeningPlayers({
  selectedTournament,
  teamAId,
  teamBId,
  matchPlayersA,
  matchPlayersB,
  openingStrikerId,
  openingNonStrikerId,
  openingBowlerAId,
  openingBowlerBId,
  loadingStartInnings,
  openingPlayersReady,
  bowlingMode,
  tossWinnerId,
  tossDecision,
  teamAPlayers,
  teamBPlayers,
  setOpeningStrikerId,
  setOpeningNonStrikerId,
  setOpeningBowlerAId,
  setOpeningBowlerBId,
  setPageMode,
  startFirstInnings,
}: OpeningPlayersProps) {
const teamA = selectedTournament?.teams.find(
    (team: any) => team.team.id === teamAId,
  );

  const teamB = selectedTournament?.teams.find(
    (team: any) => team.team.id === teamBId,
  );

  // ---------------------------------------------------------
  // Determine who bats first from the toss.
  //
  // BAT:
  //   toss winner bats
  //
  // BOWL:
  //   toss winner bowls, therefore the other team bats
  // ---------------------------------------------------------

  const inningsOneBattingTeamId =
    tossWinnerId && tossDecision === "BAT"
      ? tossWinnerId
      : tossWinnerId && tossDecision === "BOWL"
        ? tossWinnerId === teamAId
          ? teamBId
          : teamAId
        : "";

  const inningsOneBowlingTeamId =
    inningsOneBattingTeamId === teamAId
      ? teamBId
      : inningsOneBattingTeamId === teamBId
        ? teamAId
        : "";

  const battingTeam =
    inningsOneBattingTeamId === teamAId
      ? teamA
      : inningsOneBattingTeamId === teamBId
        ? teamB
        : undefined;

  const bowlingTeam =
    inningsOneBowlingTeamId === teamAId
      ? teamA
      : inningsOneBowlingTeamId === teamBId
        ? teamB
        : undefined;

  const battingPlayers =
    inningsOneBattingTeamId === teamAId
      ? teamAPlayers
      : inningsOneBattingTeamId === teamBId
        ? teamBPlayers
        : [];

  const bowlingPlayers =
    inningsOneBowlingTeamId === teamAId
      ? teamAPlayers
      : inningsOneBowlingTeamId === teamBId
        ? teamBPlayers
        : [];

  const selectedStriker = battingPlayers.find(
    (player) => player.id === openingStrikerId,
  );

  const selectedNonStriker = battingPlayers.find(
    (player) => player.id === openingNonStrikerId,
  );

  const selectedBowlerA = bowlingPlayers.find(
    (player) => player.id === openingBowlerAId,
  );

  const selectedBowlerB = bowlingPlayers.find(
    (player) => player.id === openingBowlerBId,
  );

  return (
    <section>
      <button
        type="button"
        onClick={() => setPageMode("PLAYER_SELECTION")}
        className="mb-4 text-sm text-slate-400 hover:text-emerald-400"
      >
        {String.fromCharCode(0x2190)} Back to Match Players
      </button>

      <div className="mb-8">
        <p className="text-sm font-medium text-emerald-400">
          Innings 1
        </p>

        <h2 className="mt-1 text-2xl font-semibold">
          Opening Players
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Choose the two opening batsmen and the two opening bowlers
          before starting the innings.
        </p>
      </div>

      {/* ----------------------------------------------------- */}
      {/* Toss summary                                          */}
      {/* ----------------------------------------------------- */}

      <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-950 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Toss
            </p>

            <p className="mt-1 font-semibold text-slate-100">
              {tossWinnerId === teamAId
                ? teamA?.team.name
                : tossWinnerId === teamBId
                  ? teamB?.team.name
                  : "Toss winner not selected"}
              {tossWinnerId && tossDecision
                ? ` elected to ${
                    tossDecision === "BAT" ? "bat" : "bowl"
                  }`
                : ""}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-emerald-500/10 px-4 py-3">
              <p className="text-xs text-slate-500">Batting</p>
              <p className="mt-1 font-semibold text-emerald-400">
                {battingTeam?.team.name ?? "-"}
              </p>
            </div>

            <div className="rounded-xl bg-blue-500/10 px-4 py-3">
              <p className="text-xs text-slate-500">Bowling</p>
              <p className="mt-1 font-semibold text-blue-400">
                {bowlingTeam?.team.name ?? "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* --------------------------------------------------- */}
        {/* BATTING                                             */}
        {/* --------------------------------------------------- */}

        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 [color-scheme:dark]">
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
              Batting
            </p>

            <h3 className="mt-1 text-xl font-semibold">
              {battingTeam?.team.name ?? "Batting Team"}
            </h3>
          </div>

          <div className="space-y-5">
            {/* Striker */}
            <div>
              <label
                htmlFor="openingStriker"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Striker
              </label>

              <select
                id="openingStriker"
                value={openingStrikerId}
                onChange={(event) => {
                  const value = event.target.value;

                  setOpeningStrikerId(value);

                  if (value === openingNonStrikerId) {
                    setOpeningNonStrikerId("");
                  }
                }}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-white outline-none transition focus:border-emerald-500 [color-scheme:dark]"
              >
                <option value="">Select striker</option>

                {battingPlayers.map((player: any) => (
                  <option key={player.id} value={player.id}>
                    {player.jerseyNumber !== null &&
                    player.jerseyNumber !== undefined
                      ? `#${player.jerseyNumber} `
                      : ""}
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Non-striker */}
            <div>
              <label
                htmlFor="openingNonStriker"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Non-striker
              </label>

              <select
                id="openingNonStriker"
                value={openingNonStrikerId}
                onChange={(event) =>
                  setOpeningNonStrikerId(event.target.value)
                }
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-white outline-none transition focus:border-emerald-500 [color-scheme:dark]"
              >
                <option value="">Select non-striker</option>

                {battingPlayers.map((player: any) => (
                  <option
                    key={player.id}
                    value={player.id}
                    disabled={player.id === openingStrikerId}
                  >
                    {player.jerseyNumber !== null &&
                    player.jerseyNumber !== undefined
                      ? `#${player.jerseyNumber} `
                      : ""}
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Opening pair
            </p>

            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-500">
                  Striker
                </p>

                <p className="mt-1 truncate font-semibold text-slate-200">
                  {selectedStriker?.name ?? "Not selected"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-500">
                  Non-striker
                </p>

                <p className="mt-1 truncate font-semibold text-slate-200">
                  {selectedNonStriker?.name ?? "Not selected"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------- */}
        {/* BOWLING                                             */}
        {/* --------------------------------------------------- */}

        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 [color-scheme:dark]">
          <div className="mb-5">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
              Bowling
            </p>

            <h3 className="mt-1 text-xl font-semibold">
              {bowlingTeam?.team.name ?? "Bowling Team"}
            </h3>
          </div>

          <div className="space-y-5">
            {/* Bowler A */}
            <div>
              <label
                htmlFor="openingBowlerA"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Bowler A
              </label>

              <select
                id="openingBowlerA"
                value={openingBowlerAId}
                onChange={(event) => {
                  const value = event.target.value;

                  setOpeningBowlerAId(value);

                  if (value === openingBowlerBId) {
                    setOpeningBowlerBId("");
                  }
                }}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-white outline-none transition focus:border-blue-500 [color-scheme:dark]"
              >
                <option value="">Select bowler A</option>

                {bowlingPlayers.map((player: any) => (
                  <option key={player.id} value={player.id}>
                    {player.jerseyNumber !== null &&
                    player.jerseyNumber !== undefined
                      ? `#${player.jerseyNumber} `
                      : ""}
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bowler B */}
            <div>
              <label
                htmlFor="openingBowlerB"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Bowler B
              </label>

              <select
                id="openingBowlerB"
                value={openingBowlerBId}
                onChange={(event) =>
                  setOpeningBowlerBId(event.target.value)
                }
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-white outline-none transition focus:border-blue-500 [color-scheme:dark]"
              >
                <option value="">Select bowler B</option>

                {bowlingPlayers.map((player: any) => (
                  <option
                    key={player.id}
                    value={player.id}
                    disabled={player.id === openingBowlerAId}
                  >
                    {player.jerseyNumber !== null &&
                    player.jerseyNumber !== undefined
                      ? `#${player.jerseyNumber} `
                      : ""}
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Opening bowlers
            </p>

            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-500">
                  Bowler A
                </p>

                <p className="mt-1 truncate font-semibold text-slate-200">
                  {selectedBowlerA?.name ?? "Not selected"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-3">
                <p className="text-xs text-slate-500">
                  Bowler B
                </p>

                <p className="mt-1 truncate font-semibold text-slate-200">
                  {selectedBowlerB?.name ?? "Not selected"}
                </p>
              </div>
            </div>
          </div>

          {bowlingMode === "DOUBLE" && (
            <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="text-sm font-medium text-blue-300">
                Double Bowler mode
              </p>

              <p className="mt-1 text-xs text-slate-400">
                The two selected bowlers will alternate every
                delivery.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------- */}
      {/* ACTIONS                                               */}
      {/* ----------------------------------------------------- */}

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => setPageMode("PLAYER_SELECTION")}
          className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-900"
        >
          Back
        </button>

        <button
          type="button"
          onClick={() => void startFirstInnings()}
          disabled={!openingPlayersReady || loadingStartInnings}
          className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
        >
          {loadingStartInnings
            ? "Starting Innings..."
            : "Start Innings >"}
        </button>
      </div>
    </section>
  );
}








