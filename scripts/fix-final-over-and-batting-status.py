from pathlib import Path

p = Path('src/app/page.tsx')
s = p.read_text(encoding='utf-8-sig')

old_double = '''        if (bowlingMode === "DOUBLE") {\n          setLiveBowlerId(\n            liveBowlerId === liveBowlerAId\n              ? liveBowlerBId\n              : liveBowlerAId,\n          );\n        }\n'''
new_double = '''        const finalOddOverInProgress =\n          liveOddOvers &&\n          liveCurrentOver >= oversPerInnings;\n\n        if (bowlingMode === "DOUBLE" && !finalOddOverInProgress) {\n          setLiveBowlerId(\n            liveBowlerId === liveBowlerAId\n              ? liveBowlerBId\n              : liveBowlerAId,\n          );\n        } else if (finalOddOverInProgress && liveBowlerId) {\n          // Odd final over: the scorer selects one bowler and that bowler\n          // remains active for the entire over. Do not alternate or clear it.\n          setLiveBowlerId(liveBowlerId);\n        }\n'''
if old_double not in s:
    raise SystemExit('double-bowler delivery block not found')
s = s.replace(old_double, new_double, 1)

old_end = '''        if (\n          bowlingMode === "DOUBLE" &&\n          !finalOddOver &&\n          !mustSelectFreshDoublePair &&\n          liveBowlerAId &&\n          liveBowlerBId\n        ) {\n          setLiveBowlerId(liveBowlerAId);\n        } else {\n          setLiveBowlerId("");\n          setLiveBowlerAId("");\n          setLiveBowlerBId("");\n        }\n'''
new_end = '''        if (finalOddOver && liveBowlerId) {\n          // Preserve the manually selected single bowler for an odd final over.\n          setLiveBowlerAId(liveBowlerId);\n          setLiveBowlerBId("");\n          setLiveBowlerId(liveBowlerId);\n        } else if (\n          bowlingMode === "DOUBLE" &&\n          !finalOddOver &&\n          !mustSelectFreshDoublePair &&\n          liveBowlerAId &&\n          liveBowlerBId\n        ) {\n          setLiveBowlerId(liveBowlerAId);\n        } else {\n          setLiveBowlerId("");\n          setLiveBowlerAId("");\n          setLiveBowlerBId("");\n        }\n'''
if old_end not in s:
    raise SystemExit('over-complete bowler block not found')
s = s.replace(old_end, new_end, 1)

old_filter = '''    }).filter(\n      (stat) =>\n        stat.runs > 0 ||\n        stat.balls > 0 ||\n        activeBatters.has(stat.player.id),\n    );\n'''
new_filter = '''    }).filter(\n      (stat) =>\n        stat.dismissed ||\n        activeBatters.has(stat.player.id),\n    );\n'''
if old_filter not in s:
    raise SystemExit('batting filter block not found')
s = s.replace(old_filter, new_filter, 1)

old_batter = '''                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white [color-scheme:dark]">{stat.player.jerseyNumber ?? ""}</span>\n                              <span className="truncate font-bold">{stat.player.name}{stat.player.id === liveStrikerId ? " *" : ""}</span>\n'''
new_batter = '''                              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white [color-scheme:dark] ${stat.dismissed ? "bg-red-600" : "bg-emerald-600"}`}>{stat.player.jerseyNumber ?? ""}</span>\n                              <span className="truncate font-bold">{stat.player.name}{stat.player.id === liveStrikerId ? " *" : ""}{stat.dismissed ? " OUT" : ""}</span>\n'''
if old_batter not in s:
    raise SystemExit('batting row block not found')
s = s.replace(old_batter, new_batter, 1)

p.write_text(s, encoding='utf-8')
print('patched odd final over and batting status')
