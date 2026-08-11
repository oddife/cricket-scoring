from pathlib import Path
import re
import shutil

page = Path("src/app/page.tsx")
text = page.read_text(encoding="utf-8")

# Keep the previously fixed scorer header/logo intact.
start = text.find("  function Header() {")
end = text.find("  // ---------------------------------------------------------\n  // Error", start)
if start == -1 or end == -1:
    raise SystemExit("Header block not found")

new_header = '''  function Header() {\n    return (\n      <header className="mb-8">\n        <div className="flex items-center justify-between gap-4">\n          <div className="flex min-w-0 items-center gap-3">\n            <button\n              type="button"\n              aria-label="Cricket Scorer"\n              onClick={handleSecretLogoTap}\n              className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg transition active:scale-95"\n            >\n              <img\n                src="/logo_nobg.png"\n                alt="Cricket Scorer"\n                className="h-full w-full object-contain"\n              />\n            </button>\n\n            <div className="min-w-0">\n              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">\n                Cricket Scorer\n              </h1>\n\n              <p className="text-sm text-slate-400">\n                {pageMode === "TOURNAMENTS"\n                  ? "Tournaments"\n                  : pageMode === "DASHBOARD"\n                    ? selectedTournament?.name || "Tournament"\n                    : pageMode === "MATCH_SETUP"\n                      ? "Match Setup"\n                      : pageMode === "PLAYER_SELECTION"\n                        ? "Player Selection"\n                        : pageMode === "OPENING_PLAYERS"\n                          ? "Opening Players"\n                          : "Live Scoring"}\n              </p>\n            </div>\n          </div>\n\n          {pageMode !== "TOURNAMENTS" && (\n            <button\n              type="button"\n              onClick={goBackToTournaments}\n              className="shrink-0 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:bg-slate-900 [color-scheme:dark]"\n            >\n              {String.fromCharCode(0x2190)} Tournaments\n            </button>\n          )}\n        </div>\n      </header>\n    );\n  }\n\n'''
text = text[:start] + new_header + text[end:]

# ONLY replace the compact innings-summary strip in the Previous Match scorecard.
# The match-format section and everything below it remain unchanged.
strip_start = text.find('<div className={`mt-3 grid items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white')
strip_end = text.find('<div className="mt-4 grid gap-5 md:grid-cols-[0.9fr_1.1fr]">', strip_start)

if strip_start == -1 or strip_end == -1:
    raise SystemExit("Current scorecard summary strip not found")

new_strip = '''<div className="mt-3 grid items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto]">\n                    <div className="flex items-center px-2 text-sm font-black text-blue-700 sm:px-3 sm:text-base">\n                      {teamShortName(match.teamA.id)}\n                    </div>\n\n                    <div className={`grid min-w-0 ${match.inningsPerMatch === 4 ? "grid-cols-2" : "grid-cols-1"}`}>\n                      {Array.from({ length: match.inningsPerMatch === 4 ? 2 : 1 }, (_, index) => {\n                        const inning = teamAInnings[index];\n                        return (\n                          <div key={`a-${index}`} className="border-l border-slate-100 px-2 py-2 text-center sm:px-3">\n                            <p className="truncate text-sm font-black sm:text-base">{scoreText(inning)}</p>\n                            <p className="text-[10px] text-slate-400">({index + 1})</p>\n                          </div>\n                        );\n                      })}\n                    </div>\n\n                    <div className="flex items-center justify-center px-2 text-xs font-black text-slate-400 sm:text-sm">VS</div>\n\n                    <div className={`grid min-w-0 ${match.inningsPerMatch === 4 ? "grid-cols-2" : "grid-cols-1"}`}>\n                      {Array.from({ length: match.inningsPerMatch === 4 ? 2 : 1 }, (_, index) => {\n                        const inning = teamBInnings[index];\n                        return (\n                          <div key={`b-${index}`} className="border-l border-slate-100 px-2 py-2 text-center sm:px-3">\n                            <p className="truncate text-sm font-black sm:text-base">{scoreText(inning)}</p>\n                            <p className="text-[10px] text-slate-400">({index + 1})</p>\n                          </div>\n                        );\n                      })}\n                    </div>\n\n                    <div className="flex items-center justify-end px-2 text-sm font-black text-emerald-700 sm:px-3 sm:text-base">\n                      {teamShortName(match.teamB.id)}\n                    </div>\n                  </div>\n\n                  '''

text = text[:strip_start] + new_strip + text[strip_end:]
page.write_text(text, encoding="utf-8")

# Keep the actual logo available to Next.js from /public.
source = Path("logo_nobg.png")
destination = Path("public/logo_nobg.png")
if not source.exists():
    raise SystemExit("Repository logo_nobg.png not found")
destination.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(source, destination)
print("Header normalized and ONLY the scorecard summary strip updated")
