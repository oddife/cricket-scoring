"use client";

import { useEffect } from "react";
import { startOfflineSync } from "@/lib/offline/sync";

export default function OfflineRuntime() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" });
    }

    return startOfflineSync();
  }, []);

  return null;
}
