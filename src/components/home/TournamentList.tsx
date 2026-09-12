"use client";

type TournamentTeam = {
  id: string;
  team: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;
    _count?: {
      players: number;
    };
  };
};

type Tournament = {
  id: string;
  name: string;
  season: string | null;
  format: string;
  logo: string | null;
  startDate: string | null;
  endDate: string | null;
  status: "ACTIVE" | "COMPLETED";
  winner: {
    id: string;
    name: string;
    shortName: string | null;
    logo: string | null;
  } | null;
  teams: TournamentTeam[];
  _count: {
    matches: number;
  };
};

type TournamentListProps = {
  tournaments: Tournament[];
  loadingTournaments: boolean;
  formatLabels: Record<string, string>;
  openTournament: (tournament: Tournament) => void;
  setShowCreateTournament: (show: boolean) => void;
  setError: (error: string) => void;
};

export default function TournamentList({
  tournaments,
  loadingTournaments,
  formatLabels,
  openTournament,
  setShowCreateTournament,
  setError,
}: TournamentListProps) {
  return (
    <section>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Tournament</h2>
        <p className="mt-1 text-sm text-slate-400">
          Select an existing tournament or create a new one.
        </p>
      </div>

      <div className="mb-6">
        <label
          htmlFor="tournament"
          className="mb-2 block text-sm font-medium text-slate-300 [color-scheme:dark]"
        >
          Select existing tournament
        </label>

        <select
          id="tournament"
          defaultValue=""
          disabled={loadingTournaments}
          onChange={(event) => {
            const tournament = tournaments.find(
              (item) => item.id === event.target.value,
            );

            if (tournament) {
              openTournament(tournament);
            }
          }}
          className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 [color-scheme:dark]"
        >
          <option value="">
            {loadingTournaments
              ? "Loading tournaments..."
              : tournaments.length === 0
                ? "No tournaments available"
                : "Select a tournament"}
          </option>

          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name}
              {tournament.season ? ` — ${tournament.season}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-900 px-4 text-xs uppercase tracking-wider text-slate-600">
            or
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setShowCreateTournament(true);
          setError("");
        }}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-500 px-6 font-semibold text-slate-950 transition hover:bg-emerald-400"
      >
        + Create New Tournament
      </button>

      {tournaments.length === 0 && !loadingTournaments && (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-center [color-scheme:dark]">
          <div className="mb-2 text-3xl">{String.fromCodePoint(0x1F3C6)}</div>
          <p className="font-medium text-slate-300 [color-scheme:dark]">
            No tournaments yet
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Create your first tournament to get started.
          </p>
        </div>
      )}

      {tournaments.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-medium text-slate-400">
            Existing Tournaments
          </h3>

          <div className="space-y-3">
            {tournaments.map((tournament) => (
              <button
                type="button"
                key={tournament.id}
                onClick={() => openTournament(tournament)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left transition hover:border-emerald-500/50 hover:bg-slate-950 [color-scheme:dark]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-200">
                      {tournament.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {tournament.season
                        ? `${tournament.season} ${String.fromCharCode(0x2022)} `
                        : ""}
                      {formatLabels[tournament.format]}
                    </p>

                    {tournament.status === "COMPLETED" && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-400">
                          COMPLETED
                        </span>
                        {tournament.winner && (
                          <span className="text-xs font-medium text-slate-300">
                            Winner: {tournament.winner.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-right text-xs text-slate-500">
                    <div>{tournament.teams.length} teams</div>
                    <div>{tournament._count.matches} matches</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
