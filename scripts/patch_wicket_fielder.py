from pathlib import Path
import re

p = Path('src/app/page.tsx')
s = p.read_text()

def replace_once(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'Patch target not found: {label}')
    s = s.replace(old, new, 1)

replace_once(
    '  const [wicketType, setWicketType] =\n    useState("BOWLED");',
    '  const [wicketType, setWicketType] =\n    useState("BOWLED");\n  const [wicketFielderId, setWicketFielderId] = useState("");',
    'wicket fielder state',
)

replace_once(
    '    setReplacementPlayerId("");\n    setWicketType(extraType ? "RUN_OUT" : "BOWLED");',
    '    setReplacementPlayerId("");\n    setWicketFielderId("");\n    setWicketType(extraType ? "RUN_OUT" : "BOWLED");',
    'reset fielder on open',
)

marker = '''    const nextBatsmen = liveBattingPlayers.filter(\n      (player) =>\n        !activeBatters.has(player.id) &&\n        !dismissedIds.has(player.id),\n    );'''
insert = marker + '''\n\n    const wicketFielders = liveBowlingPlayers.filter((player) =>\n      wicketType === "STUMPED"\n        ? player.id === wicketKeeperA || player.id === wicketKeeperB\n        : true,\n    );\n\n    const wicketRequiresFielder =\n      wicketType === "CAUGHT" ||\n      wicketType === "RUN_OUT" ||\n      wicketType === "STUMPED";'''
replace_once(marker, insert, 'fielder options')

replace_once(
    'const value = event.target.value; setWicketType(value); if (value !== "RUN_OUT") { setRunOutDismissedEnd("STRIKER"); setDismissedPlayerId(liveStrikerId); } else { setRunOutDismissedEnd("STRIKER"); setDismissedPlayerId(liveStrikerId); } setReplacementPlayerId("");',
    'const value = event.target.value; setWicketType(value); setRunOutDismissedEnd("STRIKER"); setDismissedPlayerId(liveStrikerId); setReplacementPlayerId(""); setWicketFielderId("");',
    'reset fielder on type change',
)

runout = '''                {wicketType === "RUN_OUT" && (\n                  <div>\n                    <p className="mb-2 block text-sm font-semibold">Who was run out?</p>\n                    <div className="grid grid-cols-2 gap-2">\n                      <button type="button" onClick={() => { setRunOutDismissedEnd("STRIKER"); setDismissedPlayerId(liveStrikerId); setReplacementPlayerId(""); }} className={`rounded-lg border px-3 py-3 text-left transition ${runOutDismissedEnd === "STRIKER" ? "border-red-500 bg-red-500/10 text-red-300" : "border-slate-700 bg-slate-950 text-slate-300"}`}>\n                        <span className="block text-xs uppercase tracking-wide text-slate-500">Striker</span>\n                        <span className="mt-1 block font-bold">{liveStriker?.name ?? "Striker"}</span>\n                      </button>\n                      <button type="button" onClick={() => { setRunOutDismissedEnd("NON_STRIKER"); setDismissedPlayerId(liveNonStrikerId); setReplacementPlayerId(""); }} className={`rounded-lg border px-3 py-3 text-left transition ${runOutDismissedEnd === "NON_STRIKER" ? "border-red-500 bg-red-500/10 text-red-300" : "border-slate-700 bg-slate-950 text-slate-300"}`}>\n                        <span className="block text-xs uppercase tracking-wide text-slate-500">Non-striker</span>\n                        <span className="mt-1 block font-bold">{liveNonStriker?.name ?? "Non-striker"}</span>\n                      </button>\n                    </div>\n                  </div>\n                )}'''

fielder = '''                {wicketRequiresFielder && (\n                  <div>\n                    <label htmlFor="wicketFielder" className="mb-2 block text-sm font-semibold">\n                      {wicketType === "CAUGHT" ? "Caught by" : wicketType === "STUMPED" ? "Wicketkeeper" : "Run out by"}\n                    </label>\n                    <select id="wicketFielder" value={wicketFielderId} onChange={(event) => setWicketFielderId(event.target.value)} className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]">\n                      <option value="">Select {wicketType === "CAUGHT" ? "catcher" : wicketType === "STUMPED" ? "wicketkeeper" : "fielder"}</option>\n                      {wicketFielders.map((player) => (\n                        <option key={player.id} value={player.id}>{player.name}</option>\n                      ))}\n                    </select>\n                  </div>\n                )}'''
replace_once(runout, runout + '\n' + fielder, 'fielder selector')

replace_once(
    'disabled={!replacementPlayerId || liveLoading} onClick={() => void recordLiveDelivery({ isWicket: true, wicketType, dismissedPlayerId, replacementPlayerId, ...(pendingWicketExtraType ? { runsExtra: pendingWicketExtraRuns, extraType: pendingWicketExtraType } : {}) })}',
    'disabled={!replacementPlayerId || liveLoading || (wicketRequiresFielder && !wicketFielderId)} onClick={() => void recordLiveDelivery({ isWicket: true, wicketType, dismissedPlayerId, replacementPlayerId, ...(wicketFielderId ? { fielderId: wicketFielderId } : {}), ...(pendingWicketExtraType ? { runsExtra: pendingWicketExtraRuns, extraType: pendingWicketExtraType } : {}) })}',
    'submit fielder',
)

replace_once(
    'setReplacementPlayerId("");\n      setRunOutDismissedEnd("STRIKER");',
    'setReplacementPlayerId("");\n      setWicketFielderId("");\n      setRunOutDismissedEnd("STRIKER");',
    'clear fielder after delivery',
)

replace_once(
    'wicket: { type: string; dismissedPlayerId: string; bowlerId: string | null } | null;',
    'wicket: { type: string; dismissedPlayerId: string; bowlerId: string | null; fielderId: string | null } | null;',
    'delivery wicket type',
)

replace_once(
    'if (x.isWicket && x.wicket?.dismissedPlayerId === x.strikerId) { a.out = true; a.d = x.wicket.type.replaceAll("_", " ");',
    'if (x.isWicket && x.wicket?.dismissedPlayerId === x.strikerId) { a.out = true; const dismissal = x.wicket.type.replaceAll("_", " "); const fielder = x.wicket.fielderId ? playerName(x.wicket.fielderId) : ""; a.d = fielder ? `${dismissal} (${fielder})` : dismissal;',
    'scorecard dismissal text',
)

p.write_text(s)
print('wicket fielder UI patch applied')
