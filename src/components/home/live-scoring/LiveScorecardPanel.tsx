"use client";

type LiveScorecardPanelProps = {
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

export default function LiveScorecardPanel({
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
}: LiveScorecardPanelProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Batting</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Batter</th>
                <th className="px-3 py-2 text-right font-medium">R</th>
                <th className="px-3 py-2 text-right font-medium">B</th>
                <th className="px-3 py-2 text-right font-medium">4s</th>
                <th className="px-3 py-2 text-right font-medium">6s</th>
                <th className="px-4 py-2 text-right font-medium">SR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {battingStats.map((player) => {
                const isStriker = player.playerId === liveStrikerId;
                const strikeRate = player.balls
                  ? ((player.runs / player.balls) * 100).toFixed(1)
                  : "0.0";
                return (
                  <tr key={player.playerId} className={isStriker ? "bg-emerald-50" : ""}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        {isStriker && <span className="text-emerald-600">●</span>}
                        <span>{player.playerName}</span>
                        {liveDismissalText(player.playerId) && (
                          <span className="text-xs font-normal text-slate-500">
                            {liveDismissalText(player.playerId)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900">{player.runs}</td>
                    <td className="px-3 py-3 text-right text-slate-600">{player.balls}</td>
                    <td className="px-3 py-3 text-right text-slate-600">{player.fours}</td>
                    <td className="px-3 py-3 text-right text-slate-600">{player.sixes}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{strikeRate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Bowling</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Bowler</th>
                <th className="px-3 py-2 text-right font-medium">O</th>
                <th className="px-3 py-2 text-right font-medium">M</th>
                <th className="px-3 py-2 text-right font-medium">R</th>
                <th className="px-3 py-2 text-right font-medium">W</th>
                <th className="px-4 py-2 text-right font-medium">Econ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bowlingStats.map((player) => {
                const isBowler = player.playerId === liveBowlerId;
                const economy = player.balls
                  ? ((player.runsConceded / (player.balls / 6))).toFixed(2)
                  : "0.00";
                return (
                  <tr key={player.playerId} className={isBowler ? "bg-emerald-50" : ""}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        {isBowler && <span className="text-emerald-600">●</span>}
                        <span>{player.playerName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">{player.overs}</td>
                    <td className="px-3 py-3 text-right text-slate-600">{player.maidens}</td>
                    <td className="px-3 py-3 text-right text-slate-600">{player.runsConceded}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900">{player.wickets}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{economy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Extras</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{extras.total}</div>
          <div className="mt-2 text-xs text-slate-500">
            W {extras.wides} · NB {extras.noBalls} · B {extras.byes} · LB {extras.legByes}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{liveRuns}/{liveWickets}</div>
          <div className="mt-2 text-xs text-slate-500">{overDisplay} overs</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Partnership</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{partnershipRuns}</div>
          <div className="mt-2 text-xs text-slate-500">{partnershipBalls} balls</div>
        </div>
      </div>
    </div>
  );
}
