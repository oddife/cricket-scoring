"use client";

import { useState } from "react";
import { notifyAppLogoUpdated } from "@/components/AppLogo";

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type AppLogoEditorProps = {
  maintenancePin: string;
};

export default function AppLogoEditor({ maintenancePin }: AppLogoEditorProps) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [version, setVersion] = useState(0);
  const [hasLogo, setHasLogo] = useState(true);

  async function upload(file: File) {
    if (!maintenancePin) {
      setMessage("Maintenance mode authentication is required.");
      return;
    }

    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
      setMessage("Only PNG, JPG and WebP images are supported.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("App logo must be 2 MB or smaller.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const logo = await readImage(file);
      const response = await fetch("/api/settings/logo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo, pin: maintenancePin }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update app logo.");
      }

      setHasLogo(true);
      setVersion((current) => current + 1);
      notifyAppLogoUpdated();
      setMessage("App logo updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update app logo.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!maintenancePin) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/settings/logo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: maintenancePin }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove app logo.");
      }

      setHasLogo(false);
      setVersion((current) => current + 1);
      notifyAppLogoUpdated();
      setMessage("Custom app logo removed. The built-in fallback will be used.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to remove app logo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 [color-scheme:dark]">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow">
          {hasLogo ? (
            <img
              key={version}
              src={`/api/settings/logo?v=${version}`}
              alt="Current app logo"
              className="h-full w-full object-contain"
              onError={() => setHasLogo(false)}
            />
          ) : (
            <span className="text-2xl" aria-hidden="true">🏏</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-semibold text-slate-200">App Logo</div>
          <div className="mt-1 text-xs text-slate-500">
            Shared across every browser and device using this server.
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <label
            className={`cursor-pointer rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 ${
              saving ? "pointer-events-none opacity-50" : "hover:bg-emerald-400"
            }`}
          >
            {saving ? "Saving…" : hasLogo ? "Change" : "Upload"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={saving || !maintenancePin}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
                event.currentTarget.value = "";
              }}
            />
          </label>

          {hasLogo && (
            <button
              type="button"
              disabled={saving || !maintenancePin}
              onClick={() => void remove()}
              className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {message && <div className="mt-3 text-xs text-slate-400">{message}</div>}
    </div>
  );
}
