from pathlib import Path

page = Path("src/app/page.tsx")
text = page.read_text()

marker = '  async function resumeMatch(matchId: string) {'
export_fn = '''  function exportScorecardPdf() {
    if (!scorecardMatch) return;

    const previousTitle = document.title;
    document.title = `${scorecardMatch.teamA.name} vs ${scorecardMatch.teamB.name} - Scorecard`;

    window.setTimeout(() => {
      window.print();
      window.setTimeout(() => {
        document.title = previousTitle;
      }, 500);
    }, 50);
  }

'''
if "function exportScorecardPdf()" not in text:
    if marker not in text:
        raise SystemExit("Could not find resumeMatch insertion marker")
    text = text.replace(marker, export_fn + marker, 1)

old_match_info = '''                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Match</p>
                <div className="mt-2 rounded-lg bg-slate-100 px-3 py-2 font-semibold">
                  {selectedTournament?.name ?? "Tournament"}
                </div>
                <p className="mt-2 text-sm text-slate-500">Innings {1} of {inningsPerMatch}</p>

                <div className="my-5 border-y border-slate-200 py-5 [color-scheme:dark]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100" />
                    <div>
                      <p className="font-bold text-blue-700">{battingTeam?.team.shortName ?? battingTeam?.team.name ?? "Team A"}</p>
                      <p className="text-xs font-semibold text-blue-600">Batting</p>
                    </div>
                  </div>
                  <div className="py-3 text-center text-xs font-bold text-slate-400">VS</div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100" />
                    <div>
                      <p className="font-bold text-emerald-700">{bowlingTeam?.team.shortName ?? bowlingTeam?.team.name ?? "Team B"}</p>
                      <p className="text-xs font-semibold text-emerald-600">Bowling</p>
                    </div>
                  </div>
                </div>
'''
new_match_info = '''                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Match</p>
                <div className="mt-2 rounded-lg bg-slate-100 px-3 py-2 font-semibold">
                  {selectedTournament?.name ?? "Tournament"}
                </div>
                <p className="mt-2 text-sm text-slate-500">Innings {liveInningsNumber} of {inningsPerMatch}</p>

                <div className="my-4 border-y border-slate-200 py-3 [color-scheme:dark]">
                  <div className="space-y-1.5">
                    {Array.from({ length: inningsPerMatch }, (_, index) => {
                      const inningNumber = index + 1;
                      const history = liveInningsHistory.find(
                        (item) => item.inningsNumber === inningNumber,
                      );
                      const isCurrent = inningNumber === liveInningsNumber;
                      const battingTeamId = isCurrent
                        ? liveBattingTeamId
                        : history?.battingTeamId ?? "";
                      const bowlingTeamId = battingTeamId === teamAId
                        ? teamBId
                        : battingTeamId === teamBId
                          ? teamAId
                          : "";
                      const batting = selectedTournament?.teams.find(
                        (item) => item.team.id === battingTeamId,
                      )?.team;
                      const bowling = selectedTournament?.teams.find(
                        (item) => item.team.id === bowlingTeamId,
                      )?.team;
                      const score = isCurrent
                        ? `${liveRuns}/${liveWickets}`
                        : history
                          ? `${history.totalRuns}/-`
                          : "—";

                      return (
                        <div
                          key={inningNumber}
                          className={`grid grid-cols-[22px_minmax(0,1fr)_auto_18px_minmax(0,1fr)] items-center gap-1 rounded-md px-2 py-1.5 text-xs ${
                            isCurrent ? "bg-emerald-50" : ""
                          }`}
                        >
                          <span className="font-black text-slate-500">{inningNumber}</span>
                          <span className={`truncate font-bold ${isCurrent ? "text-blue-700" : "text-slate-700"}`}>
                            {batting?.shortName ?? batting?.name ?? "—"}
                          </span>
                          <span className="font-black text-slate-900">{score}</span>
                          <span className="text-center font-black text-slate-400">VS</span>
                          <span className="truncate text-right font-bold text-emerald-700">
                            {bowling?.shortName ?? bowling?.name ?? "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
'''
if old_match_info not in text:
    raise SystemExit("Could not find live match information block")
text = text.replace(old_match_info, new_match_info, 1)

old_modal_open = '''      {scorecardMatch && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6">'''
new_modal_open = '''      {scorecardMatch && (
        <div className="scorecard-print-root fixed inset-0 z-[80] overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6">'''
if old_modal_open not in text:
    raise SystemExit("Could not find scorecard modal wrapper")
text = text.replace(old_modal_open, new_modal_open, 1)

old_modal_header = '''                <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Match Scorecard</p><h2 className="mt-1 text-2xl font-black">{match.teamA.name} <span className="text-slate-600">vs</span> {match.teamB.name}</h2><p className="mt-2 text-sm text-slate-500">{match.oversPerInnings} overs · {match.inningsPerMatch} innings</p></div><button type="button" onClick={() => setScorecardMatch(null)} className="h-10 rounded-xl border border-slate-700 px-4 font-semibold text-slate-300">Close</button></div>'''
new_modal_header = '''                <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-start"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Match Scorecard</p><h2 className="mt-1 text-2xl font-black">{match.teamA.name} <span className="text-slate-600">vs</span> {match.teamB.name}</h2><p className="mt-2 text-sm text-slate-500">{match.oversPerInnings} overs · {match.inningsPerMatch} innings</p></div><div className="scorecard-no-print flex shrink-0 gap-2"><button type="button" onClick={exportScorecardPdf} className="h-10 rounded-xl bg-emerald-500 px-4 font-semibold text-slate-950 transition hover:bg-emerald-400">Export PDF</button><button type="button" onClick={() => setScorecardMatch(null)} className="h-10 rounded-xl border border-slate-700 px-4 font-semibold text-slate-300">Close</button></div></div>'''
if old_modal_header not in text:
    raise SystemExit("Could not find scorecard modal header")
text = text.replace(old_modal_header, new_modal_header, 1)

page.write_text(text)

css = Path("src/app/globals.css")
css_text = css.read_text()
if "@media print" not in css_text:
    css.write_text(css_text + '''

@media print {
  @page {
    size: A4;
    margin: 10mm;
  }

  body * {
    visibility: hidden !important;
  }

  .scorecard-print-root,
  .scorecard-print-root * {
    visibility: visible !important;
  }

  .scorecard-print-root {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    min-height: 0 !important;
    overflow: visible !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #111827 !important;
  }

  .scorecard-print-root > div {
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    background: #ffffff !important;
    box-shadow: none !important;
  }

  .scorecard-print-root .scorecard-no-print {
    display: none !important;
  }

  .scorecard-print-root [class*="bg-slate-"] {
    background: #ffffff !important;
  }

  .scorecard-print-root [class*="text-white"],
  .scorecard-print-root [class*="text-slate-"] {
    color: #111827 !important;
  }

  .scorecard-print-root [class*="border-slate-"] {
    border-color: #d1d5db !important;
  }
}
''')
