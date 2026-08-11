from pathlib import Path
import re

p = Path('src/app/page.tsx')
s = p.read_text(encoding='utf-8-sig')

# Add compact wicket checkbox state.
needle = '  const [customDeliveryRuns, setCustomDeliveryRuns] = useState("5");\n'
insert = needle + '  const [customDeliveryWicket, setCustomDeliveryWicket] = useState(false);\n'
if needle in s and 'customDeliveryWicket' not in s:
    s = s.replace(needle, insert, 1)

# Replace custom delivery openers and submission logic.
start = s.index('  function openWicketPanel(')
end = s.index('  async function recordLiveDelivery(', start)
new_logic = '''  function openWicketPanel(\n    extraType: "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE" | null = null,\n    runsExtra = 0,\n  ) {\n    setPendingWicketExtraType(extraType);\n    setPendingWicketExtraRuns(runsExtra);\n    setDismissedPlayerId(liveStrikerId);\n    setRunOutDismissedEnd("STRIKER");\n    setReplacementPlayerId("");\n    setWicketType(extraType ? "RUN_OUT" : "BOWLED");\n    setShowWicketPanel(true);\n  }\n\n  function openCustomDeliveryPanel() {\n    setCustomDeliveryType("BAT");\n    setCustomDeliveryRuns("5");\n    setCustomDeliveryWicket(false);\n    setShowCustomDeliveryPanel(true);\n  }\n\n  function openExtraDeliveryPanel(\n    type: "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE",\n  ) {\n    setCustomDeliveryType(type);\n    setCustomDeliveryRuns(\n      type === "WIDE" || type === "NO_BALL" ? "0" : "1",\n    );\n    setCustomDeliveryWicket(false);\n    setShowCustomDeliveryPanel(true);\n  }\n\n  async function submitCustomDelivery(includeWicket = customDeliveryWicket) {\n    const parsedRuns = Number(customDeliveryRuns);\n\n    if (!Number.isInteger(parsedRuns) || parsedRuns < 0 || parsedRuns > 99) {\n      setError("Runs must be a whole number from 0 to 99.");\n      return;\n    }\n\n    let totalExtraRuns = parsedRuns;\n\n    if (customDeliveryType === "WIDE" || customDeliveryType === "NO_BALL") {\n      if (parsedRuns > 98) {\n        setError("Additional runs must be between 0 and 98.");\n        return;\n      }\n      totalExtraRuns = parsedRuns + 1;\n    } else if (customDeliveryType === "BYE" || customDeliveryType === "LEG_BYE") {\n      if (parsedRuns < 1) {\n        setError("Bye and leg-bye runs must be at least 1.");\n        return;\n      }\n    }\n\n    setShowCustomDeliveryPanel(false);\n\n    if (includeWicket && customDeliveryType !== "BAT") {\n      openWicketPanel(customDeliveryType, totalExtraRuns);\n      return;\n    }\n\n    if (customDeliveryType === "BAT") {\n      await recordLiveDelivery({ runsBat: parsedRuns });\n      return;\n    }\n\n    await recordLiveDelivery({\n      runsExtra: totalExtraRuns,\n      extraType: customDeliveryType,\n    });\n  }\n\n'''
s = s[:start] + new_logic + s[end:]

# Make the four extra buttons open the compact dialog rather than record immediately.
lines = s.splitlines()
out = []
for line in lines:
    stripped = line.strip()
    if 'recordButton("WIDE"' in stripped:
        line = re.sub(r'\(\)\s*=>\s*[^)]*', '() => openExtraDeliveryPanel("WIDE")', line)
    elif 'recordButton("NO BALL"' in stripped:
        line = re.sub(r'\(\)\s*=>\s*[^)]*', '() => openExtraDeliveryPanel("NO_BALL")', line)
    elif 'recordButton("BYE"' in stripped and '+ WICKET' not in stripped:
        line = re.sub(r'\(\)\s*=>\s*[^)]*', '() => openExtraDeliveryPanel("BYE")', line)
    elif 'recordButton("LEG BYE"' in stripped and '+ WICKET' not in stripped:
        line = re.sub(r'\(\)\s*=>\s*[^)]*', '() => openExtraDeliveryPanel("LEG_BYE")', line)
    if any(f'recordButton("{label}"' in stripped for label in ["WIDE + WICKET", "NO BALL + WICKET", "BYE + WICKET", "LEG BYE + WICKET"]):
        continue
    out.append(line)
s = '\n'.join(out) + ('\n' if s.endswith('\n') else '')

# Make WICKET wider than MORE RUNS in the existing button helper layout.
lines = s.splitlines()
for i, line in enumerate(lines):
    if 'recordButton("WICKET"' in line:
        line = re.sub(r'("WICKET",\s*"[^"]*)"', lambda m: m.group(1) + ' col-span-2"', line, count=1)
        lines[i] = line
    if 'recordButton("MORE RUNS"' in line:
        line = re.sub(r'("MORE RUNS",\s*"[^"]*)"', lambda m: m.group(1) + ' col-span-1"', line, count=1)
        lines[i] = line
s = '\n'.join(lines) + ('\n' if s.endswith('\n') else '')

# Replace the custom delivery modal with one compact panel: quick run choices + manual + wicket checkbox.
pattern = re.compile(r'\n\s*\{showCustomDeliveryPanel && \(\n.*?\n\s*\)\}\n\s*\{showWicketPanel && \(', re.S)
replacement = '''\n        {showCustomDeliveryPanel && (\n          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">\n            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl [color-scheme:dark]">\n              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">\n                {customDeliveryType === "BAT" ? "More Runs" : customDeliveryType.replace("_", " ")}\n              </p>\n              <h3 className="mt-1 text-2xl font-black">\n                {customDeliveryType === "BAT" ? "Record any run value" : "Additional delivery runs"}\n              </h3>\n\n              {customDeliveryType !== "BAT" ? (\n                <div className="mt-5 space-y-4">\n                  <div className="grid grid-cols-4 gap-2">\n                    {(customDeliveryType === "WIDE" || customDeliveryType === "NO_BALL"\n                      ? [0, 1, 2]\n                      : [1, 2, 3]\n                    ).map((runs) => (\n                      <button\n                        key={runs}\n                        type="button"\n                        onClick={() => setCustomDeliveryRuns(String(runs))}\n                        className={`h-14 rounded-xl border text-lg font-black ${\n                          Number(customDeliveryRuns) === runs\n                            ? "border-blue-600 bg-blue-600 text-white"\n                            : "border-slate-300 bg-white text-slate-900"\n                        }`}\n                      >\n                        {customDeliveryType === "WIDE" || customDeliveryType === "NO_BALL" ? `+${runs}` : runs}\n                      </button>\n                    ))}\n                    <button\n                      type="button"\n                      onClick={() => {\n                        const value = window.prompt(\n                          customDeliveryType === "WIDE" || customDeliveryType === "NO_BALL"\n                            ? "Enter additional runs (0-98):"\n                            : "Enter total bye/leg-bye runs (1-99):",\n                          customDeliveryRuns,\n                        );\n                        if (value !== null) setCustomDeliveryRuns(value);\n                      }}\n                      className="h-14 rounded-xl border border-slate-300 bg-slate-100 text-sm font-black text-slate-900"\n                    >\n                      MANUAL\n                    </button>\n                  </div>\n\n                  <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">\n                    {customDeliveryType === "WIDE" || customDeliveryType === "NO_BALL"\n                      ? `Base 1 run + ${customDeliveryRuns || "0"} additional = ${Number(customDeliveryRuns || 0) + 1} total runs.`\n                      : `${customDeliveryRuns || "0"} total ${customDeliveryType === "BYE" ? "bye" : "leg-bye"} runs.`}\n                  </div>\n\n                  <label className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-900">\n                    <input\n                      type="checkbox"\n                      checked={customDeliveryWicket}\n                      onChange={(event) => setCustomDeliveryWicket(event.target.checked)}\n                      className="h-5 w-5 accent-red-500"\n                    />\n                    Wicket on this delivery\n                  </label>\n                </div>\n              ) : (\n                <div className="mt-5">\n                  <label htmlFor="customDeliveryRuns" className="mb-2 block text-sm font-semibold">Bat runs</label>\n                  <input\n                    id="customDeliveryRuns"\n                    type="number"\n                    min={0}\n                    max={99}\n                    step={1}\n                    inputMode="numeric"\n                    value={customDeliveryRuns}\n                    onChange={(event) => setCustomDeliveryRuns(event.target.value)}\n                    className="h-12 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]"\n                  />\n                </div>\n              )}\n\n              <div className="mt-6 grid grid-cols-2 gap-3">\n                <button\n                  type="button"\n                  onClick={() => { setShowCustomDeliveryPanel(false); setCustomDeliveryWicket(false); }}\n                  className="h-12 rounded-lg border border-slate-300 font-semibold [color-scheme:dark]"\n                >\n                  Cancel\n                </button>\n                <button\n                  type="button"\n                  disabled={liveLoading || liveInningsComplete || !liveBowlerId}\n                  onClick={() => void submitCustomDelivery()}\n                  className="h-12 rounded-lg bg-blue-600 font-bold text-white disabled:opacity-40 [color-scheme:dark]"\n                >\n                  {customDeliveryWicket ? "Continue to Wicket" : "Record Delivery"}\n                </button>\n              </div>\n            </div>\n          </div>\n        )}\n\n        {showWicketPanel && ('''
new_s, count = pattern.subn(replacement, s, count=1)
if count != 1:
    raise SystemExit('custom delivery modal block not found')
s = new_s

p.write_text(s, encoding='utf-8')
print('record delivery layout patched')
