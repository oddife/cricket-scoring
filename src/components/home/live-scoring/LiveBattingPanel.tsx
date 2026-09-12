"use client";

type LiveBattingPanelProps = {
  liveStriker: any;
  liveNonStriker: any;
  battingStats: any[];
  nextBatsmen: any[];
};

export default function LiveBattingPanel({
  liveStriker,
  liveNonStriker,
  battingStats,
  nextBatsmen,
}: LiveBattingPanelProps) {
  const activeBatsmen = [
    { player: liveStriker, label: "Now Batting - Striker" },
    { player: liveNonStriker, label: "Now Batting - Non-Striker" },
  ];

  return (
    <>
      <div id="live-players" className="grid gap-3 md:grid-cols-2">
        {activeBatsmen.map(({ player, label }) => {
          if (!player) return null;

          const stat = battingStats.find(
            (item) => item.player.id === player.id,
          );

          return (
            <div
              key={player.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]"
            >
              <p className="text-xs font-bold uppercase text-slate-500">
                {label}
              </p>

              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-black">{player.name}</p>
                  <p className="text-xs text-slate-500">
                    {stat?.runs ?? 0}* ({stat?.balls ?? 0})
                  </p>
                </div>

                <div className="text-right text-xs font-semibold text-slate-500">
                  {stat?.fours ?? 0} Fours&nbsp; - &nbsp;
                  {stat?.sixes ?? 0} Sixes
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
          Next Batsman
        </p>

        {nextBatsmen[0] ? (
          <div className="mt-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white [color-scheme:dark]">
              {nextBatsmen[0].jerseyNumber ?? ""}
            </span>

            <div>
              <p className="font-bold">{nextBatsmen[0].name}</p>
              <p className="text-xs text-slate-500">
                {nextBatsmen[0].battingStyle ?? "Batting"}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">
            No eligible batsman available.
          </p>
        )}
      </div>
    </>
  );
}