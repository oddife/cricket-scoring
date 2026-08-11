from pathlib import Path
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

# ONLY compact the Match Format / Match Details / status section below the score strip.
# Do not modify the score strip or anything below the status bar.
format_start = text.find('                  <div className="mt-4 grid gap-3 md:grid-cols-2">')
format_end = text.find('        <div className="mt-5 space-y-5">', format_start)

if format_start == -1 or format_end == -1:
    raise SystemExit("Current Match Format section not found")

new_format = '''                  <div className="mt-4 grid gap-3 md:grid-cols-2">\n                    <section>\n                      <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Match Format</h3>\n                      <dl className="mt-2 grid gap-y-2 text-sm">\n                        <div className="flex justify-between gap-4">\n                          <dt>Overs per Innings</dt>\n                          <dd className="font-bold">{match.oversPerInnings}</dd>\n                        </div>\n                        <div className="flex justify-between gap-4">\n                          <dt>Innings</dt>\n                          <dd className="font-bold">{match.inningsPerMatch}</dd>\n                        </div>\n                      </dl>\n                    </section>\n\n                    <section>\n                      <h3 className="sr-only">Match Details</h3>\n                      <dl className="grid gap-y-2 text-sm">\n                        <div className="flex justify-between gap-4">\n                          <dt>Toss</dt>\n                          <dd className="text-right font-bold">{tossText}</dd>\n                        </div>\n                        <div className="flex justify-between gap-4">\n                          <dt>Bowling</dt>\n                          <dd className="text-right font-bold">{bowlingText}</dd>\n                        </div>\n                      </dl>\n                    </section>\n                  </div>\n\n                  <div className={`mt-3 flex flex-col gap-2 rounded-xl px-3 py-2.5 text-sm font-bold sm:flex-row sm:items-center sm:justify-between ${matchStatus === "COMPLETED" ? "bg-slate-100 text-slate-700" : "bg-emerald-50 text-emerald-700"}`}>\n                    <div className="flex items-center gap-3 whitespace-nowrap">\n                      <span>{matchStatus === "COMPLETED" ? "✓ COMPLETED" : "● LIVE"}</span>\n                      <span>{resultText}</span>\n                    </div>\n                    {target != null && (\n                      <div className="text-xs font-semibold text-slate-700 sm:text-right">\n                        Target for <b>{targetTeam}</b> (batting last) in <b>inning {match.inningsPerMatch}</b>: <b className="text-emerald-700">{target} runs</b>\n                      </div>\n                    )}\n                  </div>\n\n'''

text = text[:format_start] + new_format + text[format_end:]

# Keep the actual logo available to Next.js from /public.
source = Path("logo_nobg.png")
destination = Path("public/logo_nobg.png")
if not source.exists():
    raise SystemExit("Repository logo_nobg.png not found")
destination.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(source, destination)

page.write_text(text, encoding="utf-8")
print("Header/logo preserved; ONLY Match Format and status section compacted")
