from pathlib import Path
import shutil

page = Path("src/app/page.tsx")
text = page.read_text(encoding="utf-8")

# Keep the previously fixed scorer header/logo intact.
start = text.find("  function Header() {")
end = text.find("  // ---------------------------------------------------------\n  // Error", start)
if start == -1 or end == -1:
    raise SystemExit("Header block not found")

new_header = '''  function Header() {
    return (
      <header className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label="Cricket Scorer" onClick={handleSecretLogoTap} className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg transition active:scale-95">
              <img src="/logo_nobg.png" alt="Cricket Scorer" className="h-full w-full object-contain" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">Cricket Scorer</h1>
              <p className="text-sm text-slate-400">{pageMode === "TOURNAMENTS" ? "Tournaments" : pageMode === "DASHBOARD" ? selectedTournament?.name || "Tournament" : pageMode === "MATCH_SETUP" ? "Match Setup" : pageMode === "PLAYER_SELECTION" ? "Player Selection" : pageMode === "OPENING_PLAYERS" ? "Opening Players" : "Live Scoring"}</p>
            </div>
          </div>
          {pageMode !== "TOURNAMENTS" && <button type="button" onClick={goBackToTournaments} className="shrink-0 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:bg-slate-900 [color-scheme:dark]">{String.fromCharCode(0x2190)} Tournaments</button>}
        </div>
      </header>
    );
  }

'''
text = text[:start] + new_header + text[end:]

# Compact the Previous Matches scorecard modal's Match Format/status section.
format_start = text.find('                  <div className="mt-4 grid gap-3 md:grid-cols-2">')
format_end = text.find('        <div className="mt-5 space-y-5">', format_start)
if format_start == -1 or format_end == -1:
    raise SystemExit("Previous Matches scorecard Match Format section not found")

new_format = '''                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <section><h3 className="text-sm font-black uppercase tracking-wide text-slate-500">Match Format</h3><dl className="mt-2 grid gap-y-2 text-sm"><div className="flex justify-between gap-4"><dt>Overs per Innings</dt><dd className="font-bold">{match.oversPerInnings}</dd></div><div className="flex justify-between gap-4"><dt>Innings</dt><dd className="font-bold">{match.inningsPerMatch}</dd></div></dl></section>
                    <section><h3 className="sr-only">Match Details</h3><dl className="grid gap-y-2 text-sm"><div className="flex justify-between gap-4"><dt>Toss</dt><dd className="text-right font-bold">{tossText}</dd></div><div className="flex justify-between gap-4"><dt>Bowling</dt><dd className="text-right font-bold">{bowlingText}</dd></div></dl></section>
                  </div>
                  <div className={`mt-3 flex flex-col gap-2 rounded-xl px-3 py-2.5 text-sm font-bold sm:flex-row sm:items-center sm:justify-between ${matchStatus === "COMPLETED" ? "bg-slate-100 text-slate-700" : "bg-emerald-50 text-emerald-700"}`}><div className="flex items-center gap-3 whitespace-nowrap"><span>{matchStatus === "COMPLETED" ? "✓ COMPLETED" : "● LIVE"}</span><span>{resultText}</span></div>{target != null && <div className="text-xs font-semibold text-slate-700 sm:text-right">Target for <b>{targetTeam}</b> (batting last) in <b>inning {match.inningsPerMatch}</b>: <b className="text-emerald-700">{target} runs</b></div>}</div>

'''
text = text[:format_start] + new_format + text[format_end:]

# Compact the LIVE SCORING left Match Format panel.
live_start = text.find('                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Match Format</p>')
live_end = text.find('                <div className="mt-6 rounded-lg bg-emerald-50', live_start)
if live_start == -1 or live_end == -1:
    raise SystemExit("Live scoring Match Format section not found")

live_new = '''                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Match Format</p>
                <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2"><span>Overs per Innings</span><b>{oversPerInnings}</b></div>
                  <div className="flex items-center justify-between gap-2"><span>Toss</span><b className="text-right">{tossWinnerId ? `${selectedTournament?.teams.find((item) => item.team.id === tossWinnerId)?.team.name ?? "Team"} won · elected to ${tossDecision === "BAT" ? "bat" : "bowl"}` : "Not recorded"}</b></div>
                  <div className="flex items-center justify-between gap-2"><span>Innings</span><b>{inningsPerMatch}</b></div>
                  <div className="flex items-center justify-between gap-2"><span>Bowling</span><b className="text-right">{doubleMode ? "Double Bowler" : "Normal"}</b></div>
                </div>

'''
text = text[:live_start] + live_new + text[live_end:]

# Compact the LIVE SCORING top team/innings score summary.
top_start = text.find('                <div className="my-4 overflow-hidden rounded-lg border-y border-slate-200 py-3 [color-scheme:dark]">')
top_end = text.find('                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Match Format</p>', top_start)
if top_start == -1 or top_end == -1:
    raise SystemExit("Live score summary strip not found")

new_top = '''                <div className="my-3 overflow-hidden rounded-lg border-y border-slate-200 py-2.5 [color-scheme:dark]">
                  <div className="grid grid-cols-[minmax(42px,auto)_minmax(0,1fr)_auto_minmax(0,1fr)_minmax(42px,auto)] items-center gap-1 px-1 text-sm">
                    <span className="truncate font-black text-blue-700">{selectedTournament?.teams.find((item) => item.team.id === teamAId)?.team.shortName ?? "T1"}</span>
                    <div className={`grid min-w-0 ${inningsPerMatch === 4 ? "grid-cols-2" : "grid-cols-1"}`}>
                      {[1, ...(inningsPerMatch === 4 ? [3] : [])].map((inningNumber) => { const history = liveInningsHistory.find((item) => item.inningsNumber === inningNumber); const isCurrent = liveInningsNumber === inningNumber && liveBattingTeamId === teamAId; const value = isCurrent ? `${liveRuns}/${liveWickets}` : history?.battingTeamId === teamAId ? `${history.totalRuns}/-` : "—/—"; return <div key={`live-a-${inningNumber}`} className="text-center"><div className="whitespace-nowrap font-black text-slate-900">{value}</div><div className="text-[10px] font-medium text-slate-400">({inningNumber === 1 ? 1 : 2})</div></div>; })}
                    </div>
                    <span className="px-1 text-xs font-black text-slate-400">VS</span>
                    <div className={`grid min-w-0 ${inningsPerMatch === 4 ? "grid-cols-2" : "grid-cols-1"}`}>
                      {[2, ...(inningsPerMatch === 4 ? [4] : [])].map((inningNumber) => { const history = liveInningsHistory.find((item) => item.inningsNumber === inningNumber); const isCurrent = liveInningsNumber === inningNumber && liveBattingTeamId === teamBId; const value = isCurrent ? `${liveRuns}/${liveWickets}` : history?.battingTeamId === teamBId ? `${history.totalRuns}/-` : "—/—"; return <div key={`live-b-${inningNumber}`} className="text-center"><div className="whitespace-nowrap font-black text-slate-900">{value}</div><div className="text-[10px] font-medium text-slate-400">({inningNumber === 2 ? 1 : 2})</div></div>; })}
                    </div>
                    <span className="truncate text-right font-black text-emerald-700">{selectedTournament?.teams.find((item) => item.team.id === teamBId)?.team.shortName ?? "T2"}</span>
                  </div>
                </div>

'''
text = text[:top_start] + new_top + text[top_end:]

source = Path("logo_nobg.png")
destination = Path("public/logo_nobg.png")
if not source.exists():
    raise SystemExit("Repository logo_nobg.png not found")
destination.parent.mkdir(parents=True, exist_ok=True)
shutil.copyfile(source, destination)

page.write_text(text, encoding="utf-8")
print("Preserved header/logo; compacted live score summary and Match Format only")
