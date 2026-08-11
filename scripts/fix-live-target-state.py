from pathlib import Path

p = Path("src/app/page.tsx")
s = p.read_text(encoding="utf-8")

def r(old, new):
    global s
    if s.count(old) != 1:
        raise RuntimeError(f"Expected one match, found {s.count(old)}: {old[:100]!r}")
    s = s.replace(old, new)

r(
'''      setLiveInningsComplete(false);\n      setLiveInningsNumber(1);\n      setLiveInningsHistory([]);\n      setLiveTab("LIVE");\n''',
'''      setLiveInningsComplete(false);\n      setLiveInningsNumber(1);\n      setLiveInningsHistory([{\n        inningsNumber: 1,\n        totalRuns: Number(data.totalRuns ?? 0),\n        battingTeamId: data.battingTeamId ?? inningsOneBattingTeamId,\n        target: data.target ?? null,\n      }]);\n      setLiveTab("LIVE");\n''')

r(
'''      setLiveInningsHistory((current) => [\n        ...current.filter((item) => item.inningsNumber !== completedInningsSnapshot.inningsNumber),\n        completedInningsSnapshot,\n      ]);\n      setLiveInningsId(data.id);\n''',
'''      setLiveInningsHistory((current) => [\n        ...current.filter((item) => item.inningsNumber !== completedInningsSnapshot.inningsNumber && item.inningsNumber !== nextNumber),\n        completedInningsSnapshot,\n        {\n          inningsNumber: nextNumber,\n          totalRuns: Number(data.totalRuns ?? 0),\n          battingTeamId,\n          target: data.target ?? null,\n        },\n      ]);\n      setLiveInningsId(data.id);\n''')

p.write_text(s, encoding="utf-8")
print("Fixed live target state after innings transition")
