"use client";

type RecentDelivery = {
  id: string | number;
  overNumber: number;
  ballNumber: number;
  isWicket: boolean;
  runsTotal: number;
  bowlerId?: string | null;
  [key: string]: any;
};

type RecentDeliveriesProps = {
  recentDeliveries: RecentDelivery[];
  deliveryLabel: (delivery: RecentDelivery) => string;
  doubleMode: boolean;
  liveBowlerAId: string | null | undefined;
};

export default function RecentDeliveries({
  recentDeliveries,
  deliveryLabel,
  doubleMode,
  liveBowlerAId,
}: RecentDeliveriesProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
        Recent Deliveries
      </p>
      <div className="mt-3 space-y-2">
        {recentDeliveries.map((delivery) => (
          <div
            key={delivery.id}
            className="grid grid-cols-[45px_38px_1fr_30px] items-center gap-2 text-xs"
          >
            <span className="text-slate-500">
              {delivery.overNumber}.{delivery.ballNumber}
            </span>

            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full font-bold ${
                delivery.isWicket
                  ? "bg-red-500 text-white"
                  : delivery.runsTotal === 4 || delivery.runsTotal === 6
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100"
              }`}
            >
              {deliveryLabel(delivery)}
            </span>

            <span className="truncate">
              {delivery.isWicket
                ? "Wicket"
                : delivery.runsTotal === 0
                  ? "Dot ball"
                  : `${delivery.runsTotal} run${delivery.runsTotal === 1 ? "" : "s"}`}
            </span>

            <span className="font-bold text-slate-500">
              {doubleMode
                ? delivery.bowlerId === liveBowlerAId
                  ? "B1"
                  : "B2"
                : ""}
            </span>
          </div>
        ))}

        {recentDeliveries.length === 0 && (
          <p className="text-sm text-slate-400">No deliveries yet.</p>
        )}
      </div>
    </div>
  );
}
