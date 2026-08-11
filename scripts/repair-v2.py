from pathlib import Path
import re

path = Path("scripts/apply-innings-tabs-v2.py")
text = path.read_text()
start = text.index("replace_once(\n'''        <div className=\\\"grid min-h")
end = text.index("replace_once(\n'''              <aside className", start)

pattern = re.compile(
    r"replace_once\(\n'''        <div className=\\\"grid min-h.*?\n\" +
    r"'''\,\n'''        <div id=\\\"live-top\\\".*?\n\" +
    r"'''\,\n\"sidebar tabs\",\n\)\n",
    re.S,
)

new_block = '''source = re.sub(
    r'<div className="grid min-h-\\[calc\\(100vh-10rem\\)\\] lg:grid-cols-\\[150px_minmax\\(0,1fr\\)\\]">\\s*<!-- Sidebar -->\\s*<aside.*?</aside>',
    '''<div id="live-top" className="grid min-h-[calc(100vh-10rem)] lg:grid-cols-[150px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="hidden border-r border-slate-800 bg-[#07182d] p-3 text-white lg:flex lg:flex-col [color-scheme:dark]">
            {[
              ["LIVE", "Live Scoring"],
              ["SCORECARD", "Scorecard"],
              ["PLAYERS", "Players"],
              ["OVERS", "Overs"],
              ["PARTNERSHIPS", "Partnerships"],
              ["WAGON_WHEEL", "Wagon Wheel"],
              ["MATCH_INFO", "Match Info"],
            ].map(([tab, label]) => (
              <button type="button" key={tab} onClick={() => selectLiveTab(tab as LiveTab)} className={`mb-2 rounded-lg px-3 py-4 text-left text-sm font-semibold transition ${liveTab === tab ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5"}`}>
                {label}
              </button>
            ))}
            <button type="button" onClick={() => {
              if (window.confirm("End this match?")) {
                setPageMode("DASHBOARD");
                if (selectedTournament) {
                  void loadLiveMatches(selectedTournament.id);
                  void loadCompletedMatches(selectedTournament.id);
                }
              }
            }} className="mt-auto rounded-lg bg-red-500 px-3 py-3 text-center text-sm font-bold hover:bg-red-600">
              End Match
            </button>
          </aside>''',
    source,
    count=1,
)
if 'id="live-top"' not in source:
    raise RuntimeError("Sidebar repair failed")

# Remove the old sidebar replace_once block from the patch script.
text = text[:start] + text[end:]
path.write_text(text)
print("Repaired sidebar patch logic")
