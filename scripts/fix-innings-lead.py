from pathlib import Path

p = Path('src/app/page.tsx')
s = p.read_text(encoding='utf-8-sig')

old = '''    const firstInnings = liveInningsHistory.find((item) => item.inningsNumber === 1);\n    const secondInnings = liveInningsHistory.find((item) => item.inningsNumber === 2);\n    const firstInningsLeadOrDeficit =\n      liveInningsNumber >= 2 && firstInnings && secondInnings\n        ? secondInnings.totalRuns - firstInnings.totalRuns\n        : null;'''

new = '''    const firstInnings = liveInningsHistory.find((item) => item.inningsNumber === 1);\n    const secondInnings = liveInningsHistory.find((item) => item.inningsNumber === 2);\n    const currentTeamPriorRuns =\n      liveBattingTeamId === firstInnings?.battingTeamId\n        ? firstInnings?.totalRuns ?? null\n        : liveBattingTeamId === secondInnings?.battingTeamId\n          ? secondInnings?.totalRuns ?? null\n          : null;\n    const opponentPriorRuns =\n      liveBattingTeamId === firstInnings?.battingTeamId\n        ? secondInnings?.totalRuns ?? null\n        : liveBattingTeamId === secondInnings?.battingTeamId\n          ? firstInnings?.totalRuns ?? null\n          : null;\n    const firstInningsLeadOrDeficit =\n      liveInningsNumber >= 3 &&\n      currentTeamPriorRuns !== null &&\n      opponentPriorRuns !== null\n        ? currentTeamPriorRuns - opponentPriorRuns\n        : null;'''

if old not in s:
    raise SystemExit('expected innings lead block not found')

s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
print('innings lead calculation fixed')
