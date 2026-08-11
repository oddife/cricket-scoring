from pathlib import Path

FILE = Path("src/app/page.tsx")
source = FILE.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global source
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected 1 match, found {count}")
    source = source.replace(old, new, 1)


replace_once(
'''  const [liveOddOvers, setLiveOddOvers] = useState(false);
  const [liveRefreshLoading, setLiveRefreshLoading] = useState(false);''',
'''  const [liveOddOvers, setLiveOddOvers] = useState(false);
  const [liveRefreshLoading, setLiveRefreshLoading] = useState(false);

  type LiveTab = "LIVE" | "SCORECARD" | "PLAYERS" | "OVERS" | "PARTNERSHIPS" | "WAGON_WHEEL" | "MATCH_INFO";
  const [liveTab, setLiveTab] = useState<LiveTab>("LIVE");
  const [liveInningsNumber, setLiveInningsNumber] = useState(1);
  const [nextInningsStrikerId, setNextInningsStrikerId] = useState("");
  const [nextInningsNonStrikerId, setNextInningsNonStrikerId] = useState("");
  const [nextInningsBowlerAId, setNextInningsBowlerAId] = useState("");
  const [nextInningsBowlerBId, setNextInningsBowlerBId] = useState("");''',
"live tab state",
)

replace_once(
'''      setLiveInningsComplete(false);
      setLiveNeedsManualSwap(false);
      setNextOverBowlerAId("");''',
'''      setLiveInningsComplete(false);
      setLiveInningsNumber(1);
      setLiveTab("LIVE");
      setLiveNeedsManualSwap(false);
      setNextOverBowlerAId("");''',
"first innings state",
)

replace_once(
'''      setLiveInningsComplete(innings.status === "COMPLETED");
      setLiveStrikerId(innings.currentStrikerId ?? liveStrikerId);''',
'''      setLiveInningsComplete(innings.status === "COMPLETED");
      setLiveInningsNumber(Number(innings.inningsNumber ?? liveInningsNumber));
      setLiveStrikerId(innings.currentStrikerId ?? liveStrikerId);''',
"refresh innings number",
)

start_next = '''  async function startNextInnings() {
    if (!createdMatchId || !liveInningsComplete) {
      return;
    }

    const nextNumber = liveInningsNumber + 1;
    if (nextNumber > inningsPerMatch) {
      setPageMode("DASHBOARD");
      if (selectedTournament) {
        void loadLiveMatches(selectedTournament.id);
        void loadCompletedMatches(selectedTournament.id);
      }
      return;
    }

    if (
      !nextInningsStrikerId ||
      !nextInningsNonStrikerId ||
      !nextInningsBowlerAId ||
      !nextInningsBowlerBId
    ) {
      setError("Select two different opening batsmen and two different opening bowlers.");
      return;
    }

    if (
      nextInningsStrikerId === nextInningsNonStrikerId ||
      nextInningsBowlerAId === nextInningsBowlerBId
    ) {
      setError("Opening batsmen and bowlers must be different.");
      return;
    }

    const battingTeamId = liveBowlingTeamId;
    const bowlingTeamId = liveBattingTeamId;

    try {
      setLoadingStartInnings(true);
      setError("");

      const response = await fetch(
        `/api/matches/${createdMatchId}/innings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inningsNumber: nextNumber,
            battingTeamId,
            bowlingTeamId,
            strikerId: nextInningsStrikerId,
            nonStrikerId: nextInningsNonStrikerId,
            bowlerAId: nextInningsBowlerAId,
            bowlerBId: nextInningsBowlerBId,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to start next innings.");
      }

      setLiveInningsId(data.id);
      setLiveInningsNumber(nextNumber);
      setLiveBattingTeamId(battingTeamId);
      setLiveBowlingTeamId(bowlingTeamId);
      setLiveRuns(Number(data.totalRuns ?? 0));
      setLiveWickets(Number(data.wickets ?? 0));
      setLiveLegalBalls(Number(data.legalBalls ?? 0));
      setLiveStrikerId(data.currentStrikerId ?? nextInningsStrikerId);
      setLiveNonStrikerId(data.currentNonStrikerId ?? nextInningsNonStrikerId);
      setLiveBowlerAId(data.currentBowlerAId ?? nextInningsBowlerAId);
      setLiveBowlerBId(data.currentBowlerBId ?? nextInningsBowlerBId);
      setLiveBowlerId(data.currentBowlerAId ?? nextInningsBowlerAId);
      setLivePreviousBowlerAId("");
      setLivePreviousBowlerBId("");
      setLiveDeliveryCount(0);
      setLiveCurrentOver(1);
      setLiveCurrentBall(1);
      setLiveOverRuns([]);
      setLiveDeliveries([]);
      setLiveInningsComplete(false);
      setLiveNeedsManualSwap(false);
      setNextOverBowlerAId("");
      setNextOverBowlerBId("");
      setLiveOddOvers(
        bowlingMode === "DOUBLE" && oversPerInnings % 2 === 1,
      );
      setNextInningsStrikerId("");
      setNextInningsNonStrikerId("");
      setNextInningsBowlerAId("");
      setNextInningsBowlerBId("");
      setLiveTab("LIVE");
      setPageMode("LIVE_SCORING");
      void refreshLiveInnings(data.id);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to start next innings.",
      );
    } finally {
      setLoadingStartInnings(false);
    }
  }

'''
replace_once(
'''  // ---------------------------------------------------------
  // Live scoring
  // ---------------------------------------------------------

  async function refreshLiveInnings''',
start_next + '''  // ---------------------------------------------------------
  // Live scoring
  // ---------------------------------------------------------

  async function refreshLiveInnings''',
"next innings function",
)

record_marker = '''    const recordButton = (label: string, className: string, action: () => void, disabled = false) => ('''
record_pos = source.index(record_marker)
return_pos = source.index("    return (", record_pos)
helper = '''    const liveTabTarget: Record<LiveTab, string> = {
      LIVE: "live-top",
      SCORECARD: "live-scorecard",
      PLAYERS: "live-players",
      OVERS: "live-overs",
      PARTNERSHIPS: "live-partnership",
      WAGON_WHEEL: "live-deliveries",
      MATCH_INFO: "live-match-info",
    };

    const selectLiveTab = (tab: LiveTab) => {
      setLiveTab(tab);
      window.setTimeout(() => {
        document.getElementById(liveTabTarget[tab])?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
    };

'''
source = source[:return_pos] + helper + source[return_pos:]

replace_once(
'''        <div className="grid min-h-[calc(100vh-10rem)] lg:grid-cols-[150px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="hidden border-r border-slate-800 bg-[#07182d] p-3 text-white lg:flex lg:flex-col [color-scheme:dark]">
            [
              ["Live Scoring", true],
              ["Scorecard", false],
              ["Players", false],
              ["Overs", false],
              ["Partnerships", false],
              ["Wagon Wheel", false],
              ["Match Info", false],
            ].map(([label, active]) => (
              <div
                key={String(label)}
                className={`mb-2 rounded-lg px-3 py-4 text-sm font-semibold ${active ? "bg-blue-600" : "text-slate-300 hover:bg-white/5"}`}
              >
                {String(label)}
              </div>
            ))}
            <div className="mt-auto rounded-lg bg-red-500 px-3 py-3 text-center text-sm font-bold">
              End Match
            </div>
          </aside>''',
'''        <div id="live-top" className="grid min-h-[calc(100vh-10rem)] lg:grid-cols-[150px_minmax(0,1fr)]">
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
              <button
                type="button"
                key={tab}
                onClick={() => selectLiveTab(tab as LiveTab)}
                className={`mb-2 rounded-lg px-3 py-4 text-left text-sm font-semibold transition ${liveTab === tab ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5"}`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                if (window.confirm("End this match?")) {
                  setPageMode("DASHBOARD");
                  if (selectedTournament) {
                    void loadLiveMatches(selectedTournament.id);
                    void loadCompletedMatches(selectedTournament.id);
                  }
                }
              }}
              className="mt-auto rounded-lg bg-red-500 px-3 py-3 text-center text-sm font-bold hover:bg-red-600"
            >
              End Match
            </button>
          </aside>''',
"sidebar tabs",
)

replace_once(
'''              <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Match</p>''',
'''              <aside id="live-match-info" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Match</p>''',
"match info anchor",
)

replace_once(
'''                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
                  <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">''',
'''                <div id="live-scorecard" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
                  <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">''',
"scorecard anchor",
)

replace_once(
'''                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current Over</p>''',
'''                <div id="live-overs" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current Over</p>''',
"overs anchor",
)

replace_once(
'''                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
                  <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-slate-600">Record Delivery</p>''',
'''                <div id="live-deliveries" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">
                  <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-slate-600">Record Delivery</p>''',
"delivery anchor",
)

replace_once(
'''                <div className="grid gap-3 md:grid-cols-2">
                  {[liveStriker, liveNonStriker].map''',
'''                <div id="live-players" className="grid gap-3 md:grid-cols-2">
                  {[liveStriker, liveNonStriker].map''',
"players anchor",
)

replace_once(
'''                    <div><p className="text-xs font-bold uppercase text-slate-500">Partnership</p><p className="mt-1 text-sm font-semibold">{partnershipRuns} runs off {partnershipBalls} balls</p></div>''',
'''                    <div id="live-partnership"><p className="text-xs font-bold uppercase text-slate-500">Partnership</p><p className="mt-1 text-sm font-semibold">{partnershipRuns} runs off {partnershipBalls} balls</p></div>''',
"partnership anchor",
)

overlay = '''        {liveInningsComplete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl [color-scheme:dark] sm:p-8">
              <p className="text-xs font-black uppercase tracking-widest text-blue-600">Innings Complete</p>
              <h2 className="mt-2 text-3xl font-black">End of Innings {liveInningsNumber}</h2>
              <p className="mt-2 text-slate-500">
                {battingTeam?.team.name ?? "Batting team"} finished on <b>{liveRuns}/{liveWickets}</b> after {oversPerInnings} overs.
              </p>
              {liveInningsNumber < inningsPerMatch ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl bg-slate-100 p-4">
                    <p className="text-sm font-bold">Innings {liveInningsNumber + 1}: {bowlingTeam?.team.name ?? "Next batting team"} will bat</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select value={nextInningsStrikerId} onChange={(e) => setNextInningsStrikerId(e.target.value)} className="h-12 rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]">
                      <option value="">Select striker</option>
                      {liveBowlingPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select value={nextInningsNonStrikerId} onChange={(e) => setNextInningsNonStrikerId(e.target.value)} className="h-12 rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]">
                      <option value="">Select non-striker</option>
                      {liveBowlingPlayers.filter((p) => p.id !== nextInningsStrikerId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select value={nextInningsBowlerAId} onChange={(e) => setNextInningsBowlerAId(e.target.value)} className="h-12 rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]">
                      <option value="">Select bowler A</option>
                      {liveBattingPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select value={nextInningsBowlerBId} onChange={(e) => setNextInningsBowlerBId(e.target.value)} className="h-12 rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]">
                      <option value="">Select bowler B</option>
                      {liveBattingPlayers.filter((p) => p.id !== nextInningsBowlerAId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <button type="button" disabled={loadingStartInnings} onClick={() => void startNextInnings()} className="h-12 w-full rounded-lg bg-blue-600 font-bold text-white hover:bg-blue-700 disabled:opacity-40">
                    {loadingStartInnings ? "Starting..." : `Start Innings ${liveInningsNumber + 1}`}
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => {
                  setPageMode("DASHBOARD");
                  if (selectedTournament) {
                    void loadLiveMatches(selectedTournament.id);
                    void loadCompletedMatches(selectedTournament.id);
                  }
                }} className="mt-6 h-12 w-full rounded-lg bg-emerald-600 font-bold text-white hover:bg-emerald-700">
                  Back to Dashboard
                </button>
              )}
            </div>
          </div>
        )}
'''

replace_once(
'''    return (
      <section className="-m-5 min-h-[calc(100vh-6rem)] bg-[#f4f6f8] text-slate-900 sm:-m-8">''',
'''    return (
      <section className="-m-5 min-h-[calc(100vh-6rem)] bg-[#f4f6f8] text-slate-900 sm:-m-8">
''' + overlay,
"innings completion overlay",
)

FILE.write_text(source)
print("Applied innings transition and sidebar tab patch v2")
