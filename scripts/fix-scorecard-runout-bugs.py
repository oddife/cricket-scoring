from pathlib import Path

p = Path("src/app/page.tsx")
s = p.read_text(encoding="utf-8")

def replace_once(old: str, new: str):
    global s
    count = s.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one match ({count}): {old[:200]!r}")
    s = s.replace(old, new)

# Previous-match scorecard: don't assume Prisma nested striker/bowler
# relations are present. The scorecard already has a playerName(id) helper.
replace_once(
    'fall.push({p:x.striker.name,score:score+x.runsTotal,over:`${x.overNumber}.${x.ballNumber}`})',
    'fall.push({p:playerName(x.strikerId),score:score+x.runsTotal,over:`${x.overNumber}.${x.ballNumber}`})',
)
replace_once(
    'title={`${d.bowler.name} to ${d.striker.name}`}',
    'title={`${playerName(d.bowlerId)} to ${playerName(d.strikerId)}`}',
)

# Run-out needs an explicit choice of which batsman was dismissed.
replace_once(
    '  const [dismissedPlayerId, setDismissedPlayerId] =\n    useState("");\n',
    '  const [dismissedPlayerId, setDismissedPlayerId] =\n    useState("");\n  const [runOutDismissedEnd, setRunOutDismissedEnd] =\n    useState<"STRIKER" | "NON_STRIKER">("STRIKER");\n',
)

replace_once(
    '      setShowWicketPanel(false);\n      setDismissedPlayerId("");\n      setReplacementPlayerId("");\n',
    '      setShowWicketPanel(false);\n      setDismissedPlayerId("");\n      setReplacementPlayerId("");\n      setRunOutDismissedEnd("STRIKER");\n',
)

old_wicket_button = 'onClick={() => { setDismissedPlayerId(liveStrikerId); setShowWicketPanel(true); }}'
new_wicket_button = 'onClick={() => { setDismissedPlayerId(liveStrikerId); setRunOutDismissedEnd("STRIKER"); setReplacementPlayerId(""); setWicketType("BOWLED"); setShowWicketPanel(true); }}'
replace_once(old_wicket_button, new_wicket_button)

old_modal = '''              <p className="text-xs font-bold uppercase tracking-wide text-red-600">Wicket</p>\n              <h3 className="mt-1 text-2xl font-black">{liveStriker?.name ?? "Batsman"}</h3>\n              <div className="mt-5 space-y-4">\n                <div><label htmlFor="wicketType" className="mb-2 block text-sm font-semibold">Wicket type</label><select id="wicketType" value={wicketType} onChange={(event) => setWicketType(event.target.value)} className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark] [color-scheme:dark]"><option value="BOWLED" className="bg-slate-950 text-white">Bowled</option><option value="CAUGHT" className="bg-slate-950 text-white">Caught</option><option value="LBW" className="bg-slate-950 text-white">LBW</option><option value="RUN_OUT" className="bg-slate-950 text-white">Run Out</option><option value="STUMPED" className="bg-slate-950 text-white">Stumped</option><option value="HIT_WICKET" className="bg-slate-950 text-white">Hit Wicket</option><option value="OVER_FENCE" className="bg-slate-950 text-white">Over Fence</option></select></div>\n                <div><label htmlFor="replacementPlayer" className="mb-2 block text-sm font-semibold">Replacement batsman</label><select id="replacementPlayer" value={replacementPlayerId} onChange={(event) => setReplacementPlayerId(event.target.value)} className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark] [color-scheme:dark]"><option value="">Select replacement</option>{nextBatsmen.filter((player) => player.id !== dismissedPlayerId).map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select></div>\n              </div>'''

new_modal = '''              <p className="text-xs font-bold uppercase tracking-wide text-red-600">Wicket</p>\n              <h3 className="mt-1 text-2xl font-black">{liveBattingPlayers.find((player) => player.id === dismissedPlayerId)?.name ?? "Batsman"}</h3>\n              <div className="mt-5 space-y-4">\n                <div><label htmlFor="wicketType" className="mb-2 block text-sm font-semibold">Wicket type</label><select id="wicketType" value={wicketType} onChange={(event) => { const value = event.target.value; setWicketType(value); if (value !== "RUN_OUT") { setRunOutDismissedEnd("STRIKER"); setDismissedPlayerId(liveStrikerId); } else { setRunOutDismissedEnd("STRIKER"); setDismissedPlayerId(liveStrikerId); } setReplacementPlayerId(""); }} className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark] [color-scheme:dark]"><option value="BOWLED" className="bg-slate-950 text-white">Bowled</option><option value="CAUGHT" className="bg-slate-950 text-white">Caught</option><option value="LBW" className="bg-slate-950 text-white">LBW</option><option value="RUN_OUT" className="bg-slate-950 text-white">Run Out</option><option value="STUMPED" className="bg-slate-950 text-white">Stumped</option><option value="HIT_WICKET" className="bg-slate-950 text-white">Hit Wicket</option><option value="OVER_FENCE" className="bg-slate-950 text-white">Over Fence</option></select></div>\n                {wicketType === "RUN_OUT" && (\n                  <div>\n                    <p className="mb-2 block text-sm font-semibold">Who was run out?</p>\n                    <div className="grid grid-cols-2 gap-2">\n                      <button type="button" onClick={() => { setRunOutDismissedEnd("STRIKER"); setDismissedPlayerId(liveStrikerId); setReplacementPlayerId(""); }} className={`rounded-lg border px-3 py-3 text-left transition ${runOutDismissedEnd === "STRIKER" ? "border-red-500 bg-red-500/10 text-red-300" : "border-slate-700 bg-slate-950 text-slate-300"}`}>\n                        <span className="block text-xs uppercase tracking-wide text-slate-500">Striker</span>\n                        <span className="mt-1 block font-bold">{liveStriker?.name ?? "Striker"}</span>\n                      </button>\n                      <button type="button" onClick={() => { setRunOutDismissedEnd("NON_STRIKER"); setDismissedPlayerId(liveNonStrikerId); setReplacementPlayerId(""); }} className={`rounded-lg border px-3 py-3 text-left transition ${runOutDismissedEnd === "NON_STRIKER" ? "border-red-500 bg-red-500/10 text-red-300" : "border-slate-700 bg-slate-950 text-slate-300"}`}>\n                        <span className="block text-xs uppercase tracking-wide text-slate-500">Non-striker</span>\n                        <span className="mt-1 block font-bold">{liveNonStriker?.name ?? "Non-striker"}</span>\n                      </button>\n                    </div>\n                  </div>\n                )}\n                <div><label htmlFor="replacementPlayer" className="mb-2 block text-sm font-semibold">Replacement batsman</label><select id="replacementPlayer" value={replacementPlayerId} onChange={(event) => setReplacementPlayerId(event.target.value)} className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark] [color-scheme:dark]"><option value="">Select replacement</option>{nextBatsmen.filter((player) => player.id !== dismissedPlayerId).map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select></div>\n              </div>'''
replace_once(old_modal, new_modal)

p.write_text(s, encoding="utf-8")
print("Applied scorecard null-safety and explicit run-out dismissal selection")
