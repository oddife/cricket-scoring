import AppLogoEditor from "@/components/AppLogoEditor";
import TournamentLogoEditor from "@/components/TournamentLogoEditor";

type MaintenanceMode = "CLOSED" | "PIN" | "MENU";

type MaintenanceTournament = {
  id: string;
  name: string;
  season: string | null;
  logo: string | null;
  _count: {
    matches: number;
  };
};

type MaintenanceModalProps = {
  maintenanceMode: MaintenanceMode;
  maintenancePin: string;
  maintenanceError: string;
  setMaintenanceMode: (mode: MaintenanceMode) => void;
  setMaintenancePin: (pin: string) => void;
  setMaintenanceError: (error: string) => void;
  verifyMaintenancePin: () => void;
  tournaments: MaintenanceTournament[];
  deletingTournamentId: string | null;
  deleteTournament: (
    tournamentId: string,
  ) => Promise<void> | void;
};
export default function MaintenanceModal({
  maintenanceMode,
  maintenancePin,
  maintenanceError,
  setMaintenanceMode,
  setMaintenancePin,
  setMaintenanceError,
  verifyMaintenancePin,
  tournaments,
  deletingTournamentId,
  deleteTournament,
}: MaintenanceModalProps) {
    if (maintenanceMode === "CLOSED") return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5 backdrop-blur-md">
        <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8 [color-scheme:dark]">
          {maintenanceMode === "PIN" && (
            <>
              <div className="mb-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl">LOCK</div>
                <h2 className="text-xl font-semibold">Maintenance</h2>
                <p className="mt-2 text-sm text-slate-400">Enter the maintenance PIN to continue.</p>
              </div>
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                value={maintenancePin}
                onChange={(event) => setMaintenancePin(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") verifyMaintenancePin(); }}
                placeholder="PIN"
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-center text-xl tracking-[0.4em] text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              {maintenanceError && <p className="mt-3 text-sm text-red-400">{maintenanceError}</p>}
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => { setMaintenanceMode("CLOSED"); setMaintenancePin(""); setMaintenanceError(""); }} className="h-12 flex-1 rounded-xl border border-slate-700 px-5 font-medium text-slate-300 hover:bg-slate-800 [color-scheme:dark]">Cancel</button>
                <button type="button" onClick={verifyMaintenancePin} className="h-12 flex-1 rounded-xl bg-emerald-500 px-5 font-semibold text-slate-950 hover:bg-emerald-400">Unlock</button>
              </div>
            </>
          )}

          {maintenanceMode === "MENU" && (
            <>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">TOOLS</div>
                  <h2 className="text-xl font-semibold">Tournament Management</h2>
                  <p className="mt-2 text-sm text-slate-400">Maintenance tools</p>
                </div>
                <button type="button" onClick={() => setMaintenanceMode("CLOSED")} className="rounded-xl border border-slate-700 px-3 py-2 text-slate-400 hover:bg-slate-800 [color-scheme:dark]">-</button>
              </div>

              <div className="mb-4">
                <AppLogoEditor maintenancePin={maintenancePin} />
              </div>

              <div className="max-h-[55vh] space-y-3 overflow-y-auto">
                {tournaments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500 [color-scheme:dark]">No tournaments found.</div>
                ) : (
                  tournaments.map((tournament) => (
                    <div key={tournament.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 [color-scheme:dark]">
                      <div className="mb-3">
                        <p className="font-semibold text-slate-200">{tournament.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                           {tournament.season ? `${tournament.season}  -  ` : ""}
                           {tournament._count.matches} matches
                        </p>
                      </div>

                      <TournamentLogoEditor
                        tournamentId={tournament.id}
                        currentLogo={tournament.logo}
                        maintenancePin={maintenancePin}
                      />
                      <button
                        type="button"
                        disabled={deletingTournamentId === tournament.id}
                        onClick={() => void deleteTournament(tournament.id)}
                        className="h-10 w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:dark]"
                      >
                        {deletingTournamentId === tournament.id ? "Deleting..." : "Delete Tournament"}
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button type="button" onClick={() => setMaintenanceMode("CLOSED")} className="mt-6 h-12 w-full rounded-xl border border-slate-700 font-medium text-slate-300 hover:bg-slate-800 [color-scheme:dark]">Close</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
