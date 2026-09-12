"use client";

import { memo } from "react";

type LiveScoreHeaderProps = {
  battingTeamName: string;
  liveRuns: number;
  liveWickets: number;
  overDisplay: string;
  runRate: string;
  projected: number;
  oversRemaining: number;
  liveTarget: number | null;
  runsNeeded: number | null;
  firstInningsLeadOrDeficit: number | null;
};

function LiveScoreHeader({
  battingTeamName,
  liveRuns,
  liveWickets,
  overDisplay,
  runRate,
  projected,
  oversRemaining,
  liveTarget,
  runsNeeded,
  firstInningsLeadOrDeficit,
}: LiveScoreHeaderProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm [color-scheme:dark]">
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-5 text-white sm:px-7 [color-scheme:dark]">
        <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <div>
            <p className="text-xl font-bold">{battingTeamName}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-blue-100">
              Batting
            </p>
          </div>

          <div className="text-center">
            <div className="text-5xl font-black tracking-tight">
              {liveRuns} / {liveWickets}
            </div>
            <div className="mt-1 text-sm font-semibold">{overDisplay} overs</div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-2xl font-black">RR {runRate}</div>
            <div className="mt-1 text-xs text-blue-100">CRR: {runRate}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-2 px-5 py-3 text-center text-xs font-semibold sm:grid-cols-4 sm:px-7">
        <div>
          CRR: <span className="font-bold">{runRate}</span>
        </div>
        <div>
          PROJECTED: <span className="font-bold">{projected}</span>
        </div>
        <div>
          Overs Remaining: <span className="font-bold">{oversRemaining}</span>
        </div>
        <div>
          {liveTarget !== null ? (
            <>
              TARGET: <span className="font-black">{liveTarget}</span> - NEED{" "}
              <span className="font-black">{runsNeeded}</span>
            </>
          ) : firstInningsLeadOrDeficit !== null ? (
            <>
              {firstInningsLeadOrDeficit >= 0 ? "1ST INN LEAD" : "1ST INN DEFICIT"}: {" "}
              <span className="font-black">{Math.abs(firstInningsLeadOrDeficit)}</span>
            </>
          ) : (
            <>1ST INNINGS</>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(LiveScoreHeader);
