"use client";

type LiveOverPanelProps = {
  doubleMode: boolean;
  oddFinalOver: boolean;
  currentOverNumber: number;
  currentOverDeliveries: any[];
  deliveryLabel: (delivery: any) => string;
  liveBowlerId: string | null;
  liveBowlerAId: string | null;
  liveBowlerBId: string | null;
  activeBowlerA: any;
  activeBowlerB: any;
  bowlerBallsThisOver: (bowlerId: string | null) => number;
};

export default function LiveOverPanel({
  doubleMode,
  oddFinalOver,
  currentOverNumber,
  currentOverDeliveries,
  deliveryLabel,
  liveBowlerId,
  liveBowlerAId,
  liveBowlerBId,
  activeBowlerA,
  activeBowlerB,
  bowlerBallsThisOver,
}: LiveOverPanelProps) {
  return (
    <div id="live-overs" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current Over</p>
          <p className="mt-1 text-lg font-black">Over {currentOverNumber}</p>
        </div>
        <div className={`rounded-lg px-3 py-2 text-xs font-bold ${doubleMode ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-700"}`}>
          {doubleMode ? "DOUBLE BOWLER" : "NORMAL BOWLING"}
        </div>
        {oddFinalOver && <div className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800">ODD FINAL OVER - ONE BOWLER</div>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {currentOverDeliveries.map((delivery) => (
          <div key={delivery.id} className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-xs font-bold ${delivery.isWicket ? "bg-red-500 text-white" : delivery.runsTotal === 4 || delivery.runsTotal === 6 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-800"}`} title={delivery.bowler.name}>
            {deliveryLabel(delivery)}
          </div>
        ))}
        {currentOverDeliveries.length === 0 && <span className="text-sm text-slate-400">No deliveries yet</span>}
      </div>
      {doubleMode && !oddFinalOver && (
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div className={`rounded-lg px-3 py-2 ${liveBowlerId === liveBowlerAId ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-600"}`}><b>{activeBowlerA?.name ?? "Bowler A"}</b><span className="float-right">{bowlerBallsThisOver(liveBowlerAId)} balls</span></div>
          <div className={`rounded-lg px-3 py-2 ${liveBowlerId === liveBowlerBId ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-600"}`}><b>{activeBowlerB?.name ?? "Bowler B"}</b><span className="float-right">{bowlerBallsThisOver(liveBowlerBId)} balls</span></div>
        </div>
      )}
    </div>
  );
}
