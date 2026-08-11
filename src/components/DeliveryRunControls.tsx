"use client";

import { useState } from "react";

export type DeliveryExtraType = "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE";

export type DeliveryControlValue = {
  runsBat?: number;
  runsExtra?: number;
  extraType?: DeliveryExtraType;
};

type Props = {
  disabled?: boolean;
  onRecord: (value: DeliveryControlValue) => void;
};

export default function DeliveryRunControls({ disabled = false, onRecord }: Props) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customRuns, setCustomRuns] = useState("5");
  const [extraType, setExtraType] = useState<DeliveryExtraType>("WIDE");

  const submitCustom = () => {
    const runs = Number(customRuns);
    if (!Number.isInteger(runs) || runs < 0) return;

    if (extraType) {
      onRecord({ runsExtra: runs, extraType });
    } else {
      onRecord({ runsBat: runs });
    }
    setCustomOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
        {[0, 1, 2, 3, 4, 5, 6].map((runs) => (
          <button
            key={runs}
            type="button"
            disabled={disabled}
            onClick={() => onRecord({ runsBat: runs })}
            className={`h-16 rounded-xl border text-base font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              runs === 4 || runs === 6
                ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
            }`}
          >
            {runs}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["WIDE", "NO_BALL", "BYE", "LEG_BYE"] as const).map((type) => (
          <button
            key={type}
            type="button"
            disabled={disabled}
            onClick={() => {
              setExtraType(type);
              setCustomRuns(type === "WIDE" || type === "NO_BALL" ? "1" : "1");
              setCustomOpen(true);
            }}
            className="h-16 rounded-xl bg-violet-600 text-sm font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {type === "NO_BALL" ? "NO BALL" : type.replace("_", " ")}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setExtraType("WIDE");
          setCustomRuns("5");
          setCustomOpen(true);
        }}
        className="h-12 w-full rounded-xl border border-slate-300 bg-slate-100 text-sm font-bold text-slate-800 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Custom / Overthrow / Multi-Run Extra
      </button>

      {customOpen && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto] sm:items-end">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Delivery type
              </label>
              <select
                value={extraType}
                onChange={(event) => setExtraType(event.target.value as DeliveryExtraType)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900"
              >
                <option value="WIDE">Wide</option>
                <option value="NO_BALL">No Ball</option>
                <option value="BYE">Bye</option>
                <option value="LEG_BYE">Leg Bye</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Runs
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={customRuns}
                onChange={(event) => setCustomRuns(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCustomOpen(false)}
                className="h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitCustom}
                className="h-11 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"
              >
                Record
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Wides and no-balls remain illegal deliveries even when multiple runs are recorded.
          </p>
        </div>
      )}
    </div>
  );
}
