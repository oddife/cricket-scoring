"use client";

type LiveBattingPanelProps = {
  battingStats: any[];
  bowlingStats: any[];
  liveStrikerId: string | null;
  liveBowlerId: string | null;
  liveDismissalText: (playerId: string) => string;
  extras: {
    total: number;
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
  };
  liveRuns: number;
  liveWickets: number;
  overDisplay: string;
  partnershipRuns: number;
  partnershipBalls: number;
};

export default function LiveBattingPanel({
  battingStats,
  bowlingStats,
  liveStrikerId,
  liveBowlerId,
  liveDismissalText,
  extras,
  liveRuns,
  liveWickets,
  overDisplay,
  partnershipRuns,
  partnershipBalls,
}: LiveBattingPanelProps) {
  return (
    <div id="live-scorecard" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="mb-3 grid grid-cols-[1fr_50px_50px_45px_45px_65px] gap-2 border-b border-slate-200 pb-2 text-xs font-bold uppercase text-slate-500 [color-scheme:dark]">
            <span>Batsmen</span><span>R</span><span>B</span><span>4s</span><span>6s</span><span>SR</span>
          </div>
          <div className="space-y-2">
            {battingStats.map((stat) => (
              <div key={stat.player.id} className={`grid grid-cols-[1fr_50px_50px_45px_45px_65px] items-center gap-2 rounded-lg px-2 py-2 text-sm ${stat.player.id === liveStrikerId ? "bg-emerald-50" : ""}`}>
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white [color-scheme:dark] ${stat.dismissed ? "bg-red-600" : "bg-emerald-600"}`}>{stat.player.jerseyNumber ?? ""}</span>
                  <div className="min-w-0">
                    <span className="block truncate font-bold">{stat.player.name}{stat.player.id === liveStrikerId ? " *" : ""}</span>
                    <span className="block truncate whitespace-pre text-[9px] text-slate-400">{stat.dismissed ? liveDismissalText(stat.player.id) : "NOT OUT"}</span>
                  </div>
                </div>
                <b>{stat.runs}</b><span>{stat.balls}</span><span>{stat.fours}</span><span>{stat.sixes}</span><span>{stat.strikeRate}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 grid grid-cols-[1fr_45px_45px_45px_45px_55px] gap-1 border-b border-slate-200 pb-2 text-xs font-bold uppercase text-slate-500 [color-scheme:dark]">
            <span>Bowler</span><span>O</span><span>M</span><span>R</span><span>W</span><span>ECON</span>
          </div>
          <div className="space-y-2">
            {bowlingStats.map((stat) => (
              <div key={stat.player.id} className={`grid grid-cols-[1fr_45px_45px_45px_45px_55px] items-center gap-1 rounded-lg px-2 py-2 text-sm ${stat.player.id === liveBowlerId ? "bg-blue-50" : ""}`}>
                <div className="truncate font-bold">{stat.player.name}</div>
                <span>{stat.overs}</span><span>0</span><span>{stat.runs}</span><span>{stat.wickets}</span><span>{stat.economy}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-3 [color-scheme:dark]">
        <div><p className="text-xs font-bold uppercase text-slate-500">Extras</p><p className="mt-1 text-sm font-semibold">{extras.total} (W {extras.wides}, NB {extras.noBalls}, B {extras.byes}, LB {extras.legByes})</p></div>
        <div><p className="text-xs font-bold uppercase text-slate-500">Total</p><p className="mt-1 text-lg font-black">{liveRuns} / {liveWickets} <span className="text-xs font-medium">({overDisplay} overs)</span></p></div>
        <div id="live-partnership"><p className="text-xs font-bold uppercase text-slate-500">Partnership</p><p className="mt-1 text-sm font-semibold">{partnershipRuns} runs off {partnershipBalls} balls</p></div>
      </div>
    </div>
  );
}
