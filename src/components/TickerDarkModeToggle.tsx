"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "ticker-editor-theme";

export default function TickerDarkModeToggle() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (pathname !== "/ticker") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const initial = saved === "dark";
    setDark(initial);
    document.documentElement.dataset.tickerTheme = initial ? "dark" : "light";
    return () => {
      delete document.documentElement.dataset.tickerTheme;
    };
  }, [pathname]);

  if (pathname !== "/ticker") return null;

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.tickerTheme = next ? "dark" : "light";
    window.localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      style={{
        position: "fixed",
        top: 18,
        right: 18,
        zIndex: 2000,
        border: "1px solid rgba(255,255,255,.18)",
        borderRadius: 9,
        padding: "8px 11px",
        background: dark ? "#18232d" : "#ffffff",
        color: dark ? "#f2f6f8" : "#26343f",
        boxShadow: "0 5px 18px rgba(0,0,0,.14)",
        cursor: "pointer",
        font: "600 12px Arial, sans-serif",
      }}
    >
      {dark ? "☀ Light" : "☾ Dark"}
    </button>
  );
}
