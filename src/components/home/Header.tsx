"use client";
import AppLogo from "@/components/AppLogo";

type HeaderProps = {
  appName: string;
  selectedTournament: { name: string } | null;
  pageMode: string;
  goBackToTournaments: () => void;
  liveRefreshLoading: boolean;
  refreshLiveInnings: () => void | Promise<void>;
  handleSecretLogoTap: () => void;
};

export default function Header({
  appName,
  selectedTournament,
  pageMode,
  goBackToTournaments,
  liveRefreshLoading,
  refreshLiveInnings,
  handleSecretLogoTap,
}: HeaderProps) {
  if (pageMode === "LIVE_SCORING") {
    return (
 <header className="mb-0">
  <div className="flex h-16 items-center justify-between gap-4 rounded-xl border border-slate-700 bg-[#07182d] px-4 text-white shadow-sm sm:px-6">
        <button
            type="button"
            onClick={goBackToTournaments}
            aria-label={`${appName} - Back to tournaments`}
          className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-1 transition hover:bg-white/10 hover:ring-1 hover:ring-white/10 active:scale-[0.99]" 
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
              <AppLogo alt={appName} className="h-[135%] w-[135%] object-contain" />
            </span>

            <span className="truncate text-lg font-bold uppercase tracking-tight sm:text-xl">
              {appName}
            </span>
          </button>

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-2 text-sm sm:flex">
            <span className="max-w-[220px] truncate font-semibold">
              {selectedTournament?.name ?? "Tournament"}
            </span>
            <span className="text-slate-500">Ãƒâ€šÃ‚Â·</span>
            <span className="text-slate-300">
              Live Match
            </span>
          </div>

          <button
            type="button"
            onClick={() => void refreshLiveInnings()}
            disabled={liveRefreshLoading}
            className="shrink-0 rounded-lg border border-slate-600 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {liveRefreshLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="mb-8">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          aria-label={appName}
          onClick={handleSecretLogoTap}
          className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-1 transition hover:bg-slate-900 active:scale-[0.99]"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg">
            <AppLogo alt={appName} className="h-[135%] w-[135%] object-contain" />
          </span>

          <span className="min-w-0">
            <span className="block truncate text-2xl font-bold tracking-tight sm:text-3xl">
              {appName}
            </span>

            <span className="block text-sm text-slate-400">
              {pageMode === "TOURNAMENTS"
                ? "Tournaments"
                : pageMode === "DASHBOARD"
                  ? selectedTournament?.name || "Tournament"
                  : pageMode === "MATCH_SETUP"
                    ? "Match Setup"
                    : pageMode === "PLAYER_SELECTION"
                      ? "Player Selection"
                      : pageMode === "OPENING_PLAYERS"
                        ? "Opening Players"
                        : "Live Scoring"}
            </span>
          </span>
        </button>
      </div>
    </header>
  );
}