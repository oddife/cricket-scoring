"use client";

import { useState } from "react";

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function TournamentLogoEditor({ tournamentId, currentLogo }: { tournamentId: string; currentLogo: string | null }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [pin, setPin] = useState("");

  async function upload(file: File) {
    if (!pin) {
      setMessage("Enter the maintenance PIN first.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Tournament photo must be 2 MB or smaller.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const logo = await readImage(file);
      const response = await fetch(`/api/tournaments/${tournamentId}/logo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo, pin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update tournament photo.");
      setMessage("Tournament photo updated.");
      setPin("");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update tournament photo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-xl border bg-slate-100">
          {currentLogo ? <img src={currentLogo} alt="Tournament" className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center text-xs text-slate-400">No photo</div>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium">Tournament photo</div>
          <div className="text-xs text-slate-500">Upload or change the tournament photo.</div>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="Maintenance PIN"
            className="mt-2 h-9 w-full max-w-[180px] rounded-lg border px-3 text-sm"
          />
        </div>
        <label className={`cursor-pointer rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white ${saving ? "pointer-events-none opacity-50" : ""}`}>
          {saving ? "Saving…" : currentLogo ? "Change" : "Upload"}
          <input type="file" accept="image/*" className="hidden" disabled={saving || !pin} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.currentTarget.value = ""; }} />
        </label>
      </div>
      {message && <div className="mt-3 text-xs text-slate-600">{message}</div>}
    </div>
  );
}
