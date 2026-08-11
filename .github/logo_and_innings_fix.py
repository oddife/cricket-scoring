from pathlib import Path

page = Path('src/app/page.tsx')
text = page.read_text()

old_logo = '''          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-lg">/</div>
            <div className="text-lg font-bold uppercase tracking-tight">Cricket Scorer</div>
          </div>'''
new_logo = '''          <div className="flex items-center gap-3">
            <button type="button" aria-label="Cricket Scorer" onClick={handleSecretLogoTap} className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
              <img src="/logo_nobg.png" alt="Cricket Scorer" className="h-full w-full object-contain" />
            </button>
            <div className="text-lg font-bold uppercase tracking-tight">Cricket Scorer</div>
          </div>'''
if old_logo not in text:
    raise SystemExit('Top-bar logo block not found')
text = text.replace(old_logo, new_logo, 1)

old_start = '''                <div className="my-4 border-y border-slate-200 py-3 [color-scheme:dark]">
                  <div className="space-y-1.5">'''
start_idx = text.find(old_start)
if start_idx == -1:
    raise SystemExit('Old innings panel start not found')
old_end = '''                </div>

                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Match Format</p>'''
end_idx = text.find(old_end, start_idx)
if end_idx == -1:
    raise SystemExit('Old innings panel end not found')

new_panel = '''                <div className="my-4 overflow-hidden rounded-lg border-y border-slate-200 py-3 [color-scheme:dark]">
                  <div className="flex items-center justify-between gap-3 px-1 text-sm">
                    <span className="shrink-0 font-black text-blue-700">{selectedTournament?.teams.find((item) => item.team.id === teamAId)?.team.shortName ?? "T1"}</span>
                    <div className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden text-xs font-black">
                      {(() => {
                        const a1 = liveInningsHistory.find((item) => item.inningsNumber === 1);
                        const a2 = liveInningsHistory.find((item) => item.inningsNumber === 3);
                        const b1 = liveInningsHistory.find((item) => item.inningsNumber === 2);
                        const b2 = liveInningsHistory.find((item) => item.inningsNumber === 4);
                        const score = (history: { battingTeamId: string; totalRuns: number } | undefined, teamId: string, inningNumber: number) => {
                          if (liveInningsNumber === inningNumber && liveBattingTeamId === teamId) return `${liveRuns}/${liveWickets}`;
                          return history?.battingTeamId === teamId ? `${history.totalRuns}/-` : "—";
                        };
                        return (
                          <>
                            <span className="whitespace-nowrap text-slate-900">{score(a1, teamAId, 1)}</span>
                            {inningsPerMatch === 4 && <span className="whitespace-nowrap text-slate-500">{score(a2, teamAId, 3)}</span>}
                            <span className="mx-1 text-slate-400">VS</span>
                            <span className="whitespace-nowrap text-slate-900">{score(b1, teamBId, 2)}</span>
                            {inningsPerMatch === 4 && <span className="whitespace-nowrap text-slate-500">{score(b2, teamBId, 4)}</span>}
                          </>
                        );
                      })()}
                    </div>
                    <span className="shrink-0 font-black text-emerald-700">{selectedTournament?.teams.find((item) => item.team.id === teamBId)?.team.shortName ?? "T2"}</span>
                  </div>
                </div>

'''
text = text[:start_idx] + new_panel + text[end_idx:]
page.write_text(text)
