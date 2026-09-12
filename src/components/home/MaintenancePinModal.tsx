"use client";

type MaintenancePinModalProps = {
  maintenancePin: string;
  maintenanceError: string;
  setMaintenancePin: (value: string) => void;
  close: () => void;
  verify: () => void;
};

export default function MaintenancePinModal({
  maintenancePin,
  maintenanceError,
  setMaintenancePin,
  close,
  verify,
}: MaintenancePinModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8 [color-scheme:dark]">
        <div className="mb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl">
            LOCK
          </div>
          <h2 className="text-xl font-semibold">Maintenance</h2>
          <p className="mt-2 text-sm text-slate-400">
            Enter the maintenance PIN to continue.
          </p>
        </div>

        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={maintenancePin}
          onChange={(event) => setMaintenancePin(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") verify();
          }}
          className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />

        {maintenanceError && (
          <p className="mt-3 text-sm text-red-400">{maintenanceError}</p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={close}
            className="h-12 flex-1 rounded-xl border border-slate-700 px-5 font-medium text-slate-300 hover:bg-slate-800 [color-scheme:dark]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={verify}
            className="h-12 flex-1 rounded-xl bg-emerald-500 px-5 font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
}
