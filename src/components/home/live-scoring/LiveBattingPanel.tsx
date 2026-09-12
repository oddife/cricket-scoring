"use client";

type LiveBattingPanelProps = {
  nextBatsmen: any[];
};

export default function LiveBattingPanel({
  nextBatsmen,
}: LiveBattingPanelProps) {
  return (
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
  );
}