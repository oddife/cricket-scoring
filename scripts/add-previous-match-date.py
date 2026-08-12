from pathlib import Path

p = Path('src/app/page.tsx')
s = p.read_text(encoding='utf-8-sig')

old_type = '''  status: string;\n  bowlingMode: BowlingMode;'''
new_type = '''  status: string;\n  createdAt: string;\n  bowlingMode: BowlingMode;'''
if old_type not in s:
    raise SystemExit('LiveMatchSummary status block not found')
s = s.replace(old_type, new_type, 1)

old_markup = '''                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">\n                    <div className="min-w-0">\n                      <p className="text-lg font-bold text-slate-100">\n                        {match.teamA.name} <span className="text-slate-600">vs</span> {match.teamB.name}\n                      </p>'''
new_markup = '''                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">\n                    <div className="min-w-0 flex-1">\n                      <div className="flex items-center justify-between gap-3">\n                        <p className="truncate text-lg font-bold text-slate-100">\n                          {match.teamA.name} <span className="text-slate-600">vs</span> {match.teamB.name}\n                        </p>\n                        <span className="whitespace-nowrap text-xs font-medium text-slate-500">\n                          {new Date(match.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}\n                        </span>\n                      </div>'''
if old_markup not in s:
    raise SystemExit('Previous Matches header markup not found')
s = s.replace(old_markup, new_markup, 1)

p.write_text(s, encoding='utf-8')
print('Added previous-match date beside team names.')
