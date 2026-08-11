from pathlib import Path

page = Path('src/app/page.tsx')
text = page.read_text()
old = '''                {liveNeedsManualSwap && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm [color-scheme:dark]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-amber-800">Over Complete</p>
                        <p className="mt-1 text-sm font-semibold text-amber-900">Swap batsmen before recording the next delivery.</p>
                      </div>
                      <button type="button" onClick={() => void manuallySwapStrikers()} disabled={liveLoading} className="h-11 shrink-0 rounded-lg bg-amber-500 px-5 font-bold text-white hover:bg-amber-600 disabled:opacity-40 [color-scheme:dark]">Swap Batsmen</button>
                    </div>
                  </div>
                )}
'''
new = '''                <div className={`rounded-xl border p-3 shadow-sm transition-all [color-scheme:dark] ${liveNeedsManualSwap ? "border-amber-300 bg-amber-50 ring-2 ring-amber-200/80" : "border-slate-200 bg-white"}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className={`text-xs font-black uppercase tracking-wide ${liveNeedsManualSwap ? "text-amber-800" : "text-slate-500"}`}>
                        {liveNeedsManualSwap ? "Over Complete · Strike Change" : "Batsmen"}
                      </p>
                      <p className={`mt-1 text-sm font-semibold ${liveNeedsManualSwap ? "text-amber-900" : "text-slate-700"}`}>
                        {liveNeedsManualSwap ? "Swap batsmen before recording the next delivery." : "Use this anytime to correct the striker and non-striker."}
                      </p>
                    </div>
                    <button type="button" onClick={() => void manuallySwapStrikers()} disabled={liveLoading} className={`h-11 shrink-0 rounded-lg px-5 font-bold transition disabled:opacity-40 [color-scheme:dark] ${liveNeedsManualSwap ? "bg-amber-500 text-white hover:bg-amber-600 shadow-md" : "border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200"}`}>
                      ⇄ Swap Batsmen
                    </button>
                  </div>
                </div>
'''
if old not in text:
    raise SystemExit('Could not find conditional swap batsmen panel')
text = text.replace(old, new, 1)
page.write_text(text)
