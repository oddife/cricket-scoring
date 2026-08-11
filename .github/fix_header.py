from pathlib import Path
import re
import shutil

page = Path("src/app/page.tsx")
text = page.read_text(encoding="utf-8")

# Normalize the header completely so stale/malformed logo patches cannot survive.
start = text.find("  function Header() {")
end = text.find("  // ---------------------------------------------------------\n  // Error", start)
if start == -1 or end == -1:
    raise SystemExit("Header block not found")

new_header = '''  function Header() {\n    return (\n      <header className="mb-8">\n        <div className="flex items-center justify-between gap-4">\n          <div className="flex min-w-0 items-center gap-3">\n            <button\n              type="button"\n              aria-label="Cricket Scorer"\n              onClick={handleSecretLogoTap}\n              className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg transition active:scale-95"\n            >\n              <img\n                src="/logo_nobg.png"\n                alt="Cricket Scorer"\n                className="h-full w-full object-contain"\n              />\n            </button>\n\n            <div className="min-w-0">\n              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">\n                Cricket Scorer\n              </h1>\n\n              <p className="text-sm text-slate-400">\n                {pageMode === "TOURNAMENTS"\n                  ? "Tournaments"\n                  : pageMode === "DASHBOARD"\n                    ? selectedTournament?.name || "Tournament"\n                    : pageMode === "MATCH_SETUP"\n                      ? "Match Setup"\n                      : pageMode === "PLAYER_SELECTION"\n                        ? "Player Selection"\n                        : pageMode === "OPENING_PLAYERS"\n                          ? "Opening Players"\n                          : "Live Scoring"}\n              </p>\n            </div>\n          </div>\n\n          {pageMode !== "TOURNAMENTS" && (\n            <button\n              type="button"\n              onClick={goBackToTournaments}\n              className="shrink-0 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:bg-slate-900 [color-scheme:dark]"\n            >\n              {String.fromCharCode(0x2190)} Tournaments\n            </button>\n          )}\n        </div>\n      </header>\n    );\n  }\n\n'''

text = text[:start] + new_header + text[end:]
page.write_text(text, encoding="utf-8")

# The logo currently lives at repository root. Next.js serves static assets from public/.
source = Path("logo_nobg.png")
destination = Path("public/logo_nobg.png")
if not source.exists():
    raise SystemExit("Repository logo_nobg.png not found")
destination.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(source, destination)
print("Header normalized and public/logo_nobg.png installed")
