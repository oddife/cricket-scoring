"use client";

type InningsMode = 2 | 4;

type MatchSetupProps = {
  selectedTournament: any;
  teamAId: any;
  setTeamAId: (value: any) => void;
  teamBId: any;
  setTeamBId: (value: any) => void;
  playersPerTeam: any;
  setPlayersPerTeam: (value: any) => void;
  playersOptions: any;
  oversInput: any;
  handleOversChange: any;
  handleOversBlur: any;
  inningsPerMatch: any;
  setInningsPerMatch: (value: any) => void;
  tossWinnerId: any;
  setTossWinnerId: (value: any) => void;
  tossDecision: any;
  setTossDecision: (value: any) => void;
  bowlingMode: any;
  setBowlingMode: (value: any) => void;
  canContinue: any;
  loadingMatchCreate: any;
  handleMatchContinue: any;
  backToDashboard: any;
};

export default function MatchSetup({
  selectedTournament,
  teamAId,
  setTeamAId,
  teamBId,
  setTeamBId,
  playersPerTeam,
  setPlayersPerTeam,
  playersOptions,
  oversInput,
  handleOversChange,
  handleOversBlur,
  inningsPerMatch,
  setInningsPerMatch,
  tossWinnerId,
  setTossWinnerId,
  tossDecision,
  setTossDecision,
  bowlingMode,
  setBowlingMode,
  canContinue,
  loadingMatchCreate,
  handleMatchContinue,
  backToDashboard
}: MatchSetupProps) {
    return (
      <section>
        <div className="mb-8">
          <button
            type="button"
            onClick={backToDashboard}
            className="mb-4 text-sm text-slate-400 hover:text-emerald-400"
          >
            {String.fromCharCode(0x2190)} Back to Tournament
          </button>

          <h2 className="text-xl font-semibold">
            Create Match
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Configure the match before selecting the
            players.
          </p>

          {selectedTournament && (
            <div className="mt-4 inline-flex rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text
-emerald-400 [color-scheme:dark]">
              {String.fromCodePoint(0x1F3C6)} {selectedTournament.name}
            </div>
          )}
        </div>

        {/* Teams */}
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="teamA"
              className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
            >
              Team A
            </label>

            <select
              id="teamA"
              value={teamAId}
              onChange={(event) => {
                const value = event.target.value;
                setTeamAId(value);
                if (value === teamBId) {
                  setTeamBId("");
                }
              }}
              className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 [color-scheme:dark]"
            >
              <option value="">Select Team A</option>
              {selectedTournament?.teams.map((tournamentTeam: any) => (
                <option
                  key={tournamentTeam.team.id}
                  value={tournamentTeam.team.id}
                >
                  {tournamentTeam.team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="teamB"
              className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
            >
              Team B
            </label>

            <select
              id="teamB"
              value={teamBId}
              onChange={(event) => setTeamBId(event.target.value)}
              className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 [color-scheme:dark]"
            >
              <option value="">Select Team B</option>
              {selectedTournament?.teams.map((tournamentTeam: any) => (
                <option
                  key={tournamentTeam.team.id}
                  value={tournamentTeam.team.id}
                  disabled={tournamentTeam.team.id === teamAId}
                >
                  {tournamentTeam.team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {teamAId && teamBId && teamAId === teamBId && (
          <p className="mt-3 text-sm text-red-400">
            Team A and Team B must be different.
          </p>
        )}

        {/* Configuration */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label
              htmlFor="players"
              className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
            >
              Players per team
            </label>

            <select
              id="players"
              value={playersPerTeam}
              onChange={(event) =>
                setPlayersPerTeam(
                  Number(event.target.value),
                )
              }
              className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none focus:borde
r-emerald-500 [color-scheme:dark]"
            >
              {playersOptions.map((count: number) => (
                <option
                  key={count}
                  value={count}
                >
                  {count}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="overs"
              className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
            >
              Overs per innings
            </label>

            <input
              id="overs"
              type="number"
              min={2}
              max={50}
              step={1}
              value={oversInput}
              onChange={(event) =>
                handleOversChange(
                  event.target.value,
                )
              }
              onBlur={handleOversBlur}
              className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none transition 
focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />

            <p className="mt-2 text-xs text-slate-500">
              Enter 2{String.fromCharCode(0x2013)}50 overs
            </p>
          </div>

          <div>
            <label
              htmlFor="innings"
              className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
            >
              Match format
            </label>

            <select
              id="innings"
              value={inningsPerMatch}
              onChange={(event) =>
                setInningsPerMatch(
                  Number(
                    event.target.value,
                  ) as InningsMode,
                )
              }
              className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none focus:borde
r-emerald-500 [color-scheme:dark]"
            >
              <option value={2}>
                2 innings
              </option>

              <option value={4}>
                4 innings
              </option>
            </select>
          </div>
        </div>

        {/* Toss */}
        <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-950/70 p-5">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-slate-300">
              Toss
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Record who won the toss and what they elected to do.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="tossWinner" className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Toss Winner
              </label>
              <select
                id="tossWinner"
                value={tossWinnerId}
                onChange={(event) => setTossWinnerId(event.target.value)}
                disabled={!teamAId || !teamBId}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none focus:border-emerald-500 [color-scheme:dark]"
              >
                <option value="" className="bg-slate-950 text-white">Select toss winner</option>
                {teamAId && (
                  <option value={teamAId} className="bg-slate-950 text-white">
                    {selectedTournament?.teams.find((item: any) => item.team.id === teamAId)?.team.name ?? "Team A"}
                  </option>
                )}
                {teamBId && (
                  <option value={teamBId} className="bg-slate-950 text-white">
                    {selectedTournament?.teams.find((item: any) => item.team.id === teamBId)?.team.name ?? "Team B"}
                  </option>
                )}
              </select>
            </div>

            <div>
              <label htmlFor="tossDecision" className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Decision
              </label>
              <select
                id="tossDecision"
                value={tossDecision}
                onChange={(event) => setTossDecision(event.target.value as "BAT" | "BOWL")}
                disabled={!tossWinnerId}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none focus:border-emerald-500 [color-scheme:dark]"
              >
                <option value="BAT" className="bg-slate-950 text-white">Elected to bat</option>
                <option value="BOWL" className="bg-slate-950 text-white">Elected to bowl</option>
              </select>
            </div>
          </div>

          {tossWinnerId && (
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              <span className="font-semibold">
                {selectedTournament?.teams.find((item: any) => item.team.id === tossWinnerId)?.team.name ?? "Selected team"}
              </span>{" "}
              won the toss and elected to{" "}
              <span className="font-semibold">
                {tossDecision === "BAT" ? "bat" : "bowl"}.
              </span>
            </div>
          )}
        </div>

        {/* Bowling mode */}
        <div className="mt-8">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-slate-300 [color-scheme:dark]">
              Bowling Mode
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Normal mode does not use odd-over
              settings.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                setBowlingMode("NORMAL")
              }
              className={`rounded-2xl border p-5 text-left transition ${
                bowlingMode === "NORMAL"
                  ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20"
                  : "border-slate-700 bg-slate-950 hover:border-slate-600"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">
                    Normal
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Different bowler for each over,
                    following normal cricket rules.
                  </p>
                </div>

                <div
                  className={`mt-1 h-5 w-5 rounded-full border-2 ${
                    bowlingMode === "NORMAL"
                      ? "border-emerald-400 bg-emerald-400"
                      : "border-slate-600"
                  }`}
                />
              </div>

              <div className="mt-4 rounded-xl bg-slate-900 px-3 py-2 font-mono text-xs text-slate-400">
                Over 1 {String.fromCharCode(0x2192)} A&nbsp;&nbsp; Over 2 {String.fromCharCode(0x2192)} B
                <br />
                Over 3 {String.fromCharCode(0x2192)} A&nbsp;&nbsp; Over 4 {String.fromCharCode(0x2192)} B
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setBowlingMode("DOUBLE")
              }
              className={`rounded-2xl border p-5 text-left transition ${
                bowlingMode === "DOUBLE"
                  ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20"
                  : "border-slate-700 bg-slate-950 hover:border-slate-600"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">
                    Double
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Two bowlers alternate every ball.
                  </p>
                </div>

                <div
                  className={`mt-1 h-5 w-5 rounded-full border-2 ${
                    bowlingMode === "DOUBLE"
                      ? "border-emerald-400 bg-emerald-400"
                      : "border-slate-600"
                  }`}
                />
              </div>

              <div className="mt-4 rounded-xl bg-slate-900 px-3 py-2 font-mono text-xs text-slate-400">
                Ball 1 {String.fromCharCode(0x2192)} A&nbsp;&nbsp; Ball 2 {String.fromCharCode(0x2192)} B
                <br />
                Ball 3 {String.fromCharCode(0x2192)} A&nbsp;&nbsp; Ball 4 {String.fromCharCode(0x2192)} B
              </div>
            </button>
          </div>
        </div>

        {/* Player information */}
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 [color-scheme:dark]">
          <div className="flex gap-3">
            <span className="text-lg">
              {String.fromCodePoint(0x2139, 0xFE0F)}
            </span>

            <div>
              <p className="text-sm font-medium text-slate-300 [color-scheme:dark]">
                Player selection comes next
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                After continuing, you&apos;ll select
                the match players, opening batsmen and
                opening bowler(s). Additional eligible
                players can be added later during the
                match.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => void handleMatchContinue()}
            disabled={!canContinue || loadingMatchCreate}
            className="h-12 w-full rounded-xl bg-emerald-500 px-6 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 sm:w-auto"
          >
            {loadingMatchCreate
              ? "Creating Match..."
              : `Continue to Player Selection ${String.fromCharCode(0x2192)}`}
          </button>
        </div>
      </section>
    );
  }

