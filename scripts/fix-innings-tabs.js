const fs = require("fs");

const file = "src/app/page.tsx";
let source = fs.readFileSync(file, "utf8");

function replaceOnce(oldText, newText, label) {
  const count = source.split(oldText).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: expected exactly 1 match, found ${count}`);
  }
  source = source.replace(oldText, newText);
}

replaceOnce(
`  const [liveOddOvers, setLiveOddOvers] = useState(false);\n  const [liveRefreshLoading, setLiveRefreshLoading] = useState(false);`,
`  const [liveOddOvers, setLiveOddOvers] = useState(false);\n  const [liveRefreshLoading, setLiveRefreshLoading] = useState(false);\n  type LiveTab = "LIVE" | "SCORECARD" | "PLAYERS" | "OVERS" | "PARTNERSHIPS" | "WAGON_WHEEL" | "MATCH_INFO";\n  const [liveTab, setLiveTab] = useState<LiveTab>("LIVE");\n  const [liveInningsNumber, setLiveInningsNumber] = useState(1);\n  const [nextInningsStrikerId, setNextInningsStrikerId] = useState("");\n  const [nextInningsNonStrikerId, setNextInningsNonStrikerId] = useState("");\n  const [nextInningsBowlerAId, setNextInningsBowlerAId] = useState("");\n  const [nextInningsBowlerBId, setNextInningsBowlerBId] = useState("");`,
"live tab state",
);

replaceOnce(
`      setLiveInningsComplete(false);\n      setLiveNeedsManualSwap(false);`,
`      setLiveInningsComplete(false);\n      setLiveInningsNumber(1);\n      setLiveTab("LIVE");\n      setLiveNeedsManualSwap(false);`,
"first innings state",
);

replaceOnce(
`      setLiveInningsComplete(\n        currentInnings.status === "COMPLETED",\n      );\n      setLiveNeedsManualSwap(false);`,
`      setLiveInningsComplete(\n        currentInnings.status === "COMPLETED",\n      );\n      setLiveInningsNumber(Number(currentInnings.inningsNumber ?? 1));\n      setLiveTab("LIVE");\n      setLiveNeedsManualSwap(false);`,
"resume innings number",
);

replaceOnce(
`      setLiveInningsComplete(innings.status === "COMPLETED");\n      setLiveStrikerId(innings.currentStrikerId ?? liveStrikerId);`,
`      setLiveInningsComplete(innings.status === "COMPLETED");\n      setLiveInningsNumber(Number(innings.inningsNumber ?? liveInningsNumber));\n      setLiveStrikerId(innings.currentStrikerId ?? liveStrikerId);`,
"refresh innings number",
);

replaceOnce(
`  function LiveScoring() {`,
`  async function startNextInnings() {\n    if (!createdMatchId || !liveInningsComplete) {\n      return;\n    }\n\n    const nextNumber = liveInningsNumber + 1;\n\n    if (nextNumber > inningsPerMatch) {\n      setPageMode("DASHBOARD");\n      if (selectedTournament) {\n        void loadLiveMatches(selectedTournament.id);\n        void loadCompletedMatches(selectedTournament.id);\n      }\n      return;\n    }\n\n    if (!nextInningsStrikerId || !nextInningsNonStrikerId || !nextInningsBowlerAId || !nextInningsBowlerBId) {\n      setError("Select two different opening batsmen and two different opening bowlers.");\n      return;\n    }\n\n    if (nextInningsStrikerId === nextInningsNonStrikerId || nextInningsBowlerAId === nextInningsBowlerBId) {\n      setError("Opening batsmen and bowlers must be different.");\n      return;\n    }\n\n    const battingTeamId = liveBowlingTeamId;\n    const bowlingTeamId = liveBattingTeamId;\n\n    try {\n      setLoadingStartInnings(true);\n      setError("");\n\n      const response = await fetch(`/api/matches/${createdMatchId}/innings`, {\n        method: "POST",\n        headers: { "Content-Type": "application/json" },\n        body: JSON.stringify({\n          inningsNumber: nextNumber,\n          battingTeamId,\n          bowlingTeamId,\n          strikerId: nextInningsStrikerId,\n          nonStrikerId: nextInningsNonStrikerId,\n          bowlerAId: nextInningsBowlerAId,\n          bowlerBId: nextInningsBowlerBId,\n        }),\n      });\n\n      const data = await response.json();\n      if (!response.ok) {\n        throw new Error(data?.error || "Failed to start next innings.");\n      }\n\n      setLiveInningsId(data.id);\n      setLiveInningsNumber(nextNumber);\n      setLiveBattingTeamId(battingTeamId);\n      setLiveBowlingTeamId(bowlingTeamId);\n      setLiveRuns(0);\n      setLiveWickets(0);\n      setLiveLegalBalls(0);\n      setLiveStrikerId(data.currentStrikerId ?? nextInningsStrikerId);\n      setLiveNonStrikerId(data.currentNonStrikerId ?? nextInningsNonStrikerId);\n      setLiveBowlerAId(data.currentBowlerAId ?? nextInningsBowlerAId);\n      setLiveBowlerBId(data.currentBowlerBId ?? nextInningsBowlerBId);\n      setLiveBowlerId(data.currentBowlerAId ?? nextInningsBowlerAId);\n      setLivePreviousBowlerAId("");\n      setLivePreviousBowlerBId("");\n      setLiveDeliveryCount(0);\n      setLiveCurrentOver(1);\n      setLiveCurrentBall(1);\n      setLiveOverRuns([]);\n      setLiveDeliveries([]);\n      setLiveInningsComplete(false);\n      setLiveNeedsManualSwap(false);\n      setLiveOddOvers(bowlingMode === "DOUBLE" && oversPerInnings % 2 === 1);\n      setNextInningsStrikerId("");\n      setNextInningsNonStrikerId("");\n      setNextInningsBowlerAId("");\n      setNextInningsBowlerBId("");\n      setLiveTab("LIVE");\n      void refreshLiveInnings(data.id);\n    } catch (err) {\n      console.error(err);\n      setError(err instanceof Error ? err.message : "Failed to start next innings.");\n    } finally {\n      setLoadingStartInnings(false);\n    }\n  }\n\n  function LiveScoring() {`,
"next innings function",
);

replaceOnce(
`    const recordButton = (label: string, className: string, action: () => void, disabled = false) => (\n      <button\n        type="button"\n        disabled={liveLoading || liveInningsComplete || disabled}\n        onClick={action}\n        className={`h-20 rounded-xl border text-base font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}\n      >\n        {label}\n      </button>\n    );\n\n    return (`,
`    const recordButton = (label: string, className: string, action: () => void, disabled = false) => (\n      <button\n        type="button"\n        disabled={liveLoading || liveInningsComplete || disabled}\n        onClick={action}\n        className={`h-20 rounded-xl border text-base font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}\n      >\n        {label}\n      </button>\n    );\n\n    const liveTabTarget: Record<LiveTab, string> = {\n      LIVE: "live-top",\n      SCORECARD: "live-scorecard",\n      PLAYERS: "live-players",\n      OVERS: "live-overs",\n      PARTNERSHIPS: "live-partnership",\n      WAGON_WHEEL: "live-deliveries",\n      MATCH_INFO: "live-match-info",\n    };\n\n    const selectLiveTab = (tab: LiveTab) => {\n      setLiveTab(tab);\n      window.setTimeout(() => {\n        document.getElementById(liveTabTarget[tab])?.scrollIntoView({ behavior: "smooth", block: "start" });\n      }, 0);\n    };\n\n    return (`,
"live tab navigation helpers",
);

replaceOnce(
`        <div className="grid min-h-[calc(100vh-10rem)] lg:grid-cols-[150px_minmax(0,1fr)]">\n          {/* Sidebar */}\n          <aside className="hidden border-r border-slate-800 bg-[#07182d] p-3 text-white lg:flex lg:flex-col [color-scheme:dark]">\n            {[\n              ["Live Scoring", true],\n              ["Scorecard", false],\n              ["Players", false],\n              ["Overs", false],\n              ["Partnerships", false],\n              ["Wagon Wheel", false],\n              ["Match Info", false],\n            ].map(([label, active]) => (\n              <div\n                key={String(label)}\n                className={`mb-2 rounded-lg px-3 py-4 text-sm font-semibold ${active ? "bg-blue-600" : "text-slate-300 hover:bg-white/5"}`}\n              >\n                {String(label)}\n              </div>\n            ))}\n            <div className="mt-auto rounded-lg bg-red-500 px-3 py-3 text-center text-sm font-bold">\n              End Match\n            </div>\n          </aside>`,
`        <div id="live-top" className="grid min-h-[calc(100vh-10rem)] lg:grid-cols-[150px_minmax(0,1fr)]">\n          {/* Sidebar */}\n          <aside className="hidden border-r border-slate-800 bg-[#07182d] p-3 text-white lg:flex lg:flex-col [color-scheme:dark]">\n            {[\n              ["LIVE", "Live Scoring"],\n              ["SCORECARD", "Scorecard"],\n              ["PLAYERS", "Players"],\n              ["OVERS", "Overs"],\n              ["PARTNERSHIPS", "Partnerships"],\n              ["WAGON_WHEEL", "Wagon Wheel"],\n              ["MATCH_INFO", "Match Info"],\n            ].map(([tab, label]) => (\n              <button\n                type="button"\n                key={tab}\n                onClick={() => selectLiveTab(tab as LiveTab)}\n                className={`mb-2 rounded-lg px-3 py-4 text-left text-sm font-semibold transition ${liveTab === tab ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/5"}`}\n              >\n                {label}\n              </button>\n            ))}\n            <button\n              type="button"\n              onClick={() => {\n                if (window.confirm("End this match?")) {\n                  setPageMode("DASHBOARD");\n                  if (selectedTournament) {\n                    void loadLiveMatches(selectedTournament.id);\n                    void loadCompletedMatches(selectedTournament.id);\n                  }\n                }\n              }}\n              className="mt-auto rounded-lg bg-red-500 px-3 py-3 text-center text-sm font-bold hover:bg-red-600"\n            >\n              End Match\n            </button>\n          </aside>`,
"sidebar tabs",
);

replaceOnce(
`              <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">\n                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Match</p>`,
`              <aside id="live-match-info" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">\n                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Match</p>`,
"match info anchor",
);

replaceOnce(
`                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">\n                  <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">`,
`                <div id="live-scorecard" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">\n                  <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">`,
"scorecard anchor",
);

replaceOnce(
`                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">\n                  <div className="flex flex-wrap items-center justify-between gap-3">\n                    <div>\n                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current Over</p>`,
`                <div id="live-overs" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">\n                  <div className="flex flex-wrap items-center justify-between gap-3">\n                    <div>\n                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current Over</p>`,
"overs anchor",
);

replaceOnce(
`                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">\n                  <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-slate-600">Record Delivery</p>`,
`                <div id="live-deliveries" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm [color-scheme:dark]">\n                  <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-slate-600">Record Delivery</p>`,
"delivery anchor",
);

replaceOnce(
`                <div className="grid gap-3 md:grid-cols-2">\n                  {[liveStriker, liveNonStriker].map`,
`                <div id="live-players" className="grid gap-3 md:grid-cols-2">\n                  {[liveStriker, liveNonStriker].map`,
"players anchor",
);

replaceOnce(
`                    <div><p className="text-xs font-bold uppercase text-slate-500">Partnership</p><p className="mt-1 text-sm font-semibold">{partnershipRuns} runs off {partnershipBalls} balls</p></div>`,
`                    <div id="live-partnership"><p className="text-xs font-bold uppercase text-slate-500">Partnership</p><p className="mt-1 text-sm font-semibold">{partnershipRuns} runs off {partnershipBalls} balls</p></div>`,
"partnership anchor",
);

replaceOnce(
`      await refreshLiveInnings(liveInningsId);\n\n      setShowWicketPanel(false);`,
`      await refreshLiveInnings(liveInningsId);\n\n      if (inningsComplete) {\n        setLiveTab("LIVE");\n        setNextInningsStrikerId("");\n        setNextInningsNonStrikerId("");\n        setNextInningsBowlerAId("");\n        setNextInningsBowlerBId("");\n      }\n\n      setShowWicketPanel(false);`,
"completed innings cleanup",
);

replaceOnce(
`      setLiveInningsComplete(inningsComplete);\n\n      if (overCompleted) {`,
`      setLiveInningsComplete(inningsComplete);\n\n      if (inningsComplete) {\n        setLiveBowlerId("");\n        setLiveBowlerAId("");\n        setLiveBowlerBId("");\n      }\n\n      if (overCompleted) {`,
"completed innings bowler lock",
);

replaceOnce(
`    return (\n      <section className="-m-5 min-h-[calc(100vh-6rem)] bg-[#f4f6f8] text-slate-900 sm:-m-8">`,
`    return (\n      <section className="-m-5 min-h-[calc(100vh-6rem)] bg-[#f4f6f8] text-slate-900 sm:-m-8">\n        {liveInningsComplete && (\n          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">\n            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl [color-scheme:dark] sm:p-8">\n              <p className="text-xs font-black uppercase tracking-widest text-blue-600">Innings Complete</p>\n              <h2 className="mt-2 text-3xl font-black">End of Innings {liveInningsNumber}</h2>\n              <p className="mt-2 text-slate-500">{battingTeam?.team.name ?? "Batting team"} finished on <b>{liveRuns}/{liveWickets}</b> after {oversPerInnings} overs.</p>\n              {liveInningsNumber < inningsPerMatch ? (\n                <div className="mt-6 space-y-4">\n                  <div className="rounded-xl bg-slate-100 p-4">\n                    <p className="text-sm font-bold">Innings {liveInningsNumber + 1}: {bowlingTeam?.team.name ?? "Next batting team"} will bat</p>\n                  </div>\n                  <div className="grid gap-3 sm:grid-cols-2">\n                    <select value={nextInningsStrikerId} onChange={(e) => setNextInningsStrikerId(e.target.value)} className="h-12 rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]"><option value="">Select striker</option>{liveBowlingPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>\n                    <select value={nextInningsNonStrikerId} onChange={(e) => setNextInningsNonStrikerId(e.target.value)} className="h-12 rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]"><option value="">Select non-striker</option>{liveBowlingPlayers.filter((p) => p.id !== nextInningsStrikerId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>\n                    <select value={nextInningsBowlerAId} onChange={(e) => setNextInningsBowlerAId(e.target.value)} className="h-12 rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]"><option value="">Select bowler A</option>{liveBattingPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>\n                    <select value={nextInningsBowlerBId} onChange={(e) => setNextInningsBowlerBId(e.target.value)} className="h-12 rounded-lg border border-slate-700 bg-slate-950 px-3 text-white [color-scheme:dark]"><option value="">Select bowler B</option>{liveBattingPlayers.filter((p) => p.id !== nextInningsBowlerAId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>\n                  </div>\n                  <button type="button" disabled={loadingStartInnings} onClick={() => void startNextInnings()} className="h-12 w-full rounded-lg bg-blue-600 font-bold text-white hover:bg-blue-700 disabled:opacity-40">{loadingStartInnings ? "Starting..." : `Start Innings ${liveInningsNumber + 1}`}</button>\n                </div>\n              ) : (\n                <button type="button" onClick={() => { setPageMode("DASHBOARD"); if (selectedTournament) { void loadLiveMatches(selectedTournament.id); void loadCompletedMatches(selectedTournament.id); } }} className="mt-6 h-12 w-full rounded-lg bg-emerald-600 font-bold text-white hover:bg-emerald-700">Back to Dashboard</button>\n              )}\n            </div>\n          </div>\n        )}`,
"innings completion overlay",
);

fs.writeFileSync(file, source, "utf8");
console.log("Innings transition and sidebar tabs patch applied successfully.");
