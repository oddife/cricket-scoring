from pathlib import Path

path = Path("scripts/apply-innings-tabs-v2.py")
text = path.read_text()
start_marker = 'replace_once(\n\'\'\'        <div className="grid min-h'
end_marker = 'replace_once(\n\'\'\'              <aside className'
start = text.index(start_marker)
end = text.index(end_marker, start)

new_lines = [
    "import re",
    "",
    "sidebar_pattern = re.compile(r'<div className=\"grid min-h-\\[calc\\(100vh-10rem\\)\\] lg:grid-cols-\\[150px_minmax\\(0,1fr\\)\\]\">.*?<\\/aside>', re.S)",
    "sidebar_replacement = \"\\n\".join([",
    "    '        <div id=\"live-top\" className=\"grid min-h-[calc(100vh-10rem)] lg:grid-cols-[150px_minmax(0,1fr)]\">',",
    "    '          {/* Sidebar */}',",
    "    '          <aside className=\"hidden border-r border-slate-800 bg-[#07182d] p-3 text-white lg:flex lg:flex-col [color-scheme:dark]\">',",
    "    '            {[',",
    "    '              [\"LIVE\", \"Live Scoring\"],',",
    "    '              [\"SCORECARD\", \"Scorecard\"],',",
    "    '              [\"PLAYERS\", \"Players\"],',",
    "    '              [\"OVERS\", \"Overs\"],',",
    "    '              [\"PARTNERSHIPS\", \"Partnerships\"],',",
    "    '              [\"WAGON_WHEEL\", \"Wagon Wheel\"],',",
    "    '              [\"MATCH_INFO\", \"Match Info\"],',",
    "    '            ].map(([tab, label]) => (',",
    "    '              <button type=\"button\" key={tab} onClick={() => selectLiveTab(tab as LiveTab)} className={`mb-2 rounded-lg px-3 py-4 text-left text-sm font-semibold transition ${liveTab === tab ? \"bg-blue-600 text-white\" : \"text-slate-300 hover:bg-white/5\"}`}>',",
    "    '                {label}',",
    "    '              </button>',",
    "    '            ))}',",
    "    '            <button type=\"button\" onClick={() => {',",
    "    '              if (window.confirm(\"End this match?\")) {',",
    "    '                setPageMode(\"DASHBOARD\");',",
    "    '                if (selectedTournament) {',",
    "    '                  void loadLiveMatches(selectedTournament.id);',",
    "    '                  void loadCompletedMatches(selectedTournament.id);',",
    "    '                }',",
    "    '              }',",
    "    '            }} className=\"mt-auto rounded-lg bg-red-500 px-3 py-3 text-center text-sm font-bold hover:bg-red-600\">',",
    "    '              End Match',",
    "    '            </button>',",
    "    '          </aside>',",
    "])" ,
    "source = sidebar_pattern.sub(sidebar_replacement, source, count=1)",
    "if 'id=\"live-top\"' not in source:",
    "    raise RuntimeError(\"Sidebar replacement did not match page source\")",
    "",
]
new_block = "\n".join(new_lines)
text = text[:start] + new_block + text[end:]
path.write_text(text)
print("Repaired sidebar patch logic")
