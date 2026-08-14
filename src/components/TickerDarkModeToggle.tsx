"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import tickerStyles from "@/app/ticker/ticker.module.css";

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

  const pageClass = `.${tickerStyles.page}`;
  const darkCss = `
    html[data-ticker-theme="dark"] ${pageClass}{background:#0b1117;color:#e6edf3}
    html[data-ticker-theme="dark"] ${pageClass} .header p{color:#9aa8b5}
    html[data-ticker-theme="dark"] ${pageClass} .kicker{color:#55aee0!important}
    html[data-ticker-theme="dark"] ${pageClass} .editor,
    html[data-ticker-theme="dark"] ${pageClass} .preview{background:#121b24;border-color:#263542;box-shadow:0 8px 28px #0008}
    html[data-ticker-theme="dark"] ${pageClass} .section{border-bottom-color:#24313c}
    html[data-ticker-theme="dark"] ${pageClass} .section h2,
    html[data-ticker-theme="dark"] ${pageClass} .preview h2{color:#e6edf3}
    html[data-ticker-theme="dark"] ${pageClass} .fieldLabel{color:#aab7c2}
    html[data-ticker-theme="dark"] ${pageClass} .fieldControl{background:#0d151d;color:#edf3f7;border-color:#344654}
    html[data-ticker-theme="dark"] ${pageClass} .fieldControl::placeholder{color:#687986}
    html[data-ticker-theme="dark"] ${pageClass} .checkItem{background:#0d151d;color:#aab7c2;border-color:#2c3b47}
    html[data-ticker-theme="dark"] ${pageClass} .playerCard,
    html[data-ticker-theme="dark"] ${pageClass} .autoGrid>div{background:#0d151d;border-color:#2c3b47}
    html[data-ticker-theme="dark"] ${pageClass} .playerCard strong,
    html[data-ticker-theme="dark"] ${pageClass} .autoGrid strong{color:#edf3f7}
    html[data-ticker-theme="dark"] ${pageClass} .hint,
    html[data-ticker-theme="dark"] ${pageClass} .preview>p{color:#81909d!important}
    html[data-ticker-theme="dark"] ${pageClass} .styleCard{background:#0d151d;border-color:#2c3b47;color:#e6edf3}
    html[data-ticker-theme="dark"] ${pageClass} .styleCard strong{color:#edf3f7}
    html[data-ticker-theme="dark"] ${pageClass} .styleCard small{color:#8a99a6}
    html[data-ticker-theme="dark"] ${pageClass} .styleCardSelected{background:#10283a;border-color:#2992ce}
    html[data-ticker-theme="dark"] ${pageClass} .actions button{background:#18232d;color:#edf3f7;border-color:#344654}
    html[data-ticker-theme="dark"] ${pageClass} .actions .primary{background:#1477b9;color:#fff;border-color:#1477b9}
    html[data-ticker-theme="dark"] ${pageClass} .message{background:#12351e;color:#8fe0a2}
    html[data-ticker-theme="dark"] ${pageClass} .autoBall{background:#18242e;border-color:#344654;color:#edf3f7}
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: darkCss }} />
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
    </>
  );
}
