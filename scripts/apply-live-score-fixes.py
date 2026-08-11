from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: str, old: str, new: str) -> None:
    file_path = ROOT / path
    text = file_path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected exactly one match in {path}, found {count}: {old[:120]!r}")
    file_path.write_text(text.replace(old, new), encoding="utf-8")


# 1) Persist a target for innings 2/4 (and a useful chase target for any later innings).
replace_once(
    "src/lib/match-setup.ts",
    '''  if (\n    previousInnings.length !==\n    input.inningsNumber - 1\n  ) {\n    throw new Error(\n      "Innings must be started in order.",\n    );\n  }\n\n  const innings =\n''',
    '''  if (\n    previousInnings.length !==\n    input.inningsNumber - 1\n  ) {\n    throw new Error(\n      "Innings must be started in order.",\n    );\n  }\n\n  const battingTeamPreviousRuns = previousInnings\n    .filter((innings) => innings.battingTeamId === input.battingTeamId)\n    .reduce((sum, innings) => sum + innings.totalRuns, 0);\n\n  const opposingTeamPreviousRuns = previousInnings\n    .filter((innings) => innings.battingTeamId === input.bowlingTeamId)\n    .reduce((sum, innings) => sum + innings.totalRuns, 0);\n\n  // Target is the minimum score required to win. For innings 2 this is\n  // innings 1 score + 1. For innings 4 it is the opponent's aggregate\n  // total minus the batting side's previous aggregate + 1.\n  const target =\n    input.inningsNumber === 1\n      ? null\n      : Math.max(\n          1,\n          opposingTeamPreviousRuns - battingTeamPreviousRuns + 1,\n        );\n\n  const innings =\n''',
)
replace_once(
    "src/lib/match-setup.ts",
    '''        legalBalls: 0,\n        singleBatEnabled: false,\n        currentStrikerId:\n''',
    '''        legalBalls: 0,\n        singleBatEnabled: false,\n        target,\n        currentStrikerId:\n''',
)

# 2) When the final scheduled innings completes, also complete the match.
replace_once(
    "src/lib/scoring.ts",
    '''  const transactionResult =\n    await prisma.$transaction(\n''',
    '''  const transactionResult =\n    await prisma.$transaction(\n''',
)
replace_once(
    "src/lib/scoring.ts",
    '''      },\n    );\n\n  return {\n    delivery:\n''',
    '''      },\n    );\n\n  if (\n    inningsComplete &&\n    innings.inningsNumber === innings.match.inningsPerMatch\n  ) {\n    await prisma.match.update({\n      where: { id: innings.matchId },\n      data: { status: "COMPLETED" },\n    });\n  }\n\n  return {\n    delivery:\n''',
)

# 3) Add a real match-completion API so End Match actually changes persisted status.
replace_once(
    "src/app/api/matches/[matchId]/route.ts",
    '''export async function GET(\n''',
    '''export async function PATCH(\n  request: Request,\n  { params }: RouteContext,\n) {\n  try {\n    const { matchId } = await params;\n    const body = await request.json().catch(() => ({}));\n\n    if (!matchId) {\n      return NextResponse.json(\n        { error: "Match ID is required." },\n        { status: 400 },\n      );\n    }\n\n    if (String(body?.status ?? "").toUpperCase() !== "COMPLETED") {\n      return NextResponse.json(\n        { error: "Only COMPLETED status can be set from this endpoint." },\n        { status: 400 },\n      );\n    }\n\n    const match = await prisma.match.findUnique({\n      where: { id: matchId },\n      include: { innings: true },\n    });\n\n    if (!match) {\n      return NextResponse.json(\n        { error: "Match not found." },\n        { status: 404 },\n      );\n    }\n\n    const updated = await prisma.match.update({\n      where: { id: matchId },\n      data: { status: "COMPLETED" },\n    });\n\n    return NextResponse.json(updated);\n  } catch (error) {\n    console.error("PATCH /api/matches/[matchId] error:", error);\n    return NextResponse.json(\n      {\n        error: error instanceof Error\n          ? error.message\n          : "Failed to complete match.",\n      },\n      { status: 500 },\n    );\n  }\n}\n\nexport async function GET(\n''',
)

# 4) Client: keep the innings history so target/lead information survives navigation/resume.
replace_once(
    "src/app/page.tsx",
    '''  const [liveInningsNumber, setLiveInningsNumber] = useState(1);\n  const [nextInningsStrikerId, setNextInningsStrikerId] = useState("");\n''',
    '''  type LiveInningsHistory = {\n    inningsNumber: number;\n    totalRuns: number;\n    battingTeamId: string;\n    target: number | null;\n  };\n\n  const [liveInningsNumber, setLiveInningsNumber] = useState(1);\n  const [liveInningsHistory, setLiveInningsHistory] = useState<LiveInningsHistory[]>([]);\n  const [nextInningsStrikerId, setNextInningsStrikerId] = useState("");\n''',
)
replace_once(
    "src/app/page.tsx",
    '''      setLiveInningsId(currentInnings.id);\n      setLiveRuns(\n''',
    '''      setLiveInningsHistory(\n        innings.map((item: { inningsNumber: number; totalRuns: number; battingTeamId: string; target?: number | null }) => ({\n          inningsNumber: Number(item.inningsNumber),\n          totalRuns: Number(item.totalRuns ?? 0),\n          battingTeamId: item.battingTeamId,\n          target: item.target ?? null,\n        })),\n      );\n\n      setLiveInningsId(currentInnings.id);\n      setLiveRuns(\n''',
)
replace_once(
    "src/app/page.tsx",
    '''      setLiveInningsComplete(false);\n      setLiveInningsNumber(1);\n      setLiveTab("LIVE");\n''',
    '''      setLiveInningsComplete(false);\n      setLiveInningsNumber(1);\n      setLiveInningsHistory([]);\n      setLiveTab("LIVE");\n''',
)
replace_once(
    "src/app/page.tsx",
    '''    const battingTeamId = liveBowlingTeamId;\n    const bowlingTeamId = liveBattingTeamId;\n\n    try {\n''',
    '''    const battingTeamId = liveBowlingTeamId;\n    const bowlingTeamId = liveBattingTeamId;\n    const completedInningsSnapshot: LiveInningsHistory = {\n      inningsNumber: liveInningsNumber,\n      totalRuns: liveRuns,\n      battingTeamId: liveBattingTeamId,\n      target: liveInningsHistory.find((item) => item.inningsNumber === liveInningsNumber)?.target ?? null,\n    };\n\n    try {\n''',
)
replace_once(
    "src/app/page.tsx",
    '''      setLiveInningsId(data.id);\n      setLiveInningsNumber(nextNumber);\n      setLiveBattingTeamId(battingTeamId);\n''',
    '''      setLiveInningsHistory((current) => [\n        ...current.filter((item) => item.inningsNumber !== completedInningsSnapshot.inningsNumber),\n        completedInningsSnapshot,\n      ]);\n      setLiveInningsId(data.id);\n      setLiveInningsNumber(nextNumber);\n      setLiveBattingTeamId(battingTeamId);\n''',
)

# 5) Client: end-match action calls the API before leaving live scoring.
replace_once(
    "src/app/page.tsx",
    '''  function LiveScoring() {\n    const battingTeam = selectedTournament?.teams.find(\n''',
    '''  async function endCurrentMatch() {\n    if (!createdMatchId) {\n      setError("Match ID is not available.");\n      return;\n    }\n\n    if (!window.confirm("End this match? It will be moved to Previous Matches.")) {\n      return;\n    }\n\n    try {\n      setLiveLoading(true);\n      setError("");\n      const response = await fetch(`/api/matches/${createdMatchId}`, {\n        method: "PATCH",\n        headers: { "Content-Type": "application/json" },\n        body: JSON.stringify({ status: "COMPLETED" }),\n      });\n      const data = await response.json();\n      if (!response.ok) {\n        throw new Error(data?.error || "Failed to end match.");\n      }\n\n      setPageMode("DASHBOARD");\n      if (selectedTournament) {\n        await loadLiveMatches(selectedTournament.id);\n        await loadCompletedMatches(selectedTournament.id);\n      }\n    } catch (err) {\n      console.error(err);\n      setError(err instanceof Error ? err.message : "Failed to end match.");\n    } finally {\n      setLiveLoading(false);\n    }\n  }\n\n  function LiveScoring() {\n    const battingTeam = selectedTournament?.teams.find(\n''',
)

# 6) Client: calculate live target / first-innings lead and show it prominently.
replace_once(
    "src/app/page.tsx",
    '''    const projected = legalBalls > 0\n      ? Math.round((liveRuns / legalBalls) * oversPerInnings * 6)\n      : 0;\n\n    const currentOverNumber = completedOvers + 1;\n''',
    '''    const projected = legalBalls > 0\n      ? Math.round((liveRuns / legalBalls) * oversPerInnings * 6)\n      : 0;\n\n    const currentInningsRecord = liveInningsHistory.find(\n      (item) => item.inningsNumber === liveInningsNumber,\n    );\n    const liveTarget = currentInningsRecord?.target ?? null;\n    const runsNeeded = liveTarget !== null\n      ? Math.max(liveTarget - liveRuns, 0)\n      : null;\n\n    const firstInnings = liveInningsHistory.find((item) => item.inningsNumber === 1);\n    const secondInnings = liveInningsHistory.find((item) => item.inningsNumber === 2);\n    const firstInningsLeadOrDeficit =\n      liveInningsNumber >= 2 && firstInnings && secondInnings\n        ? secondInnings.totalRuns - firstInnings.totalRuns\n        : null;\n\n    const currentOverNumber = completedOvers + 1;\n''',
)
replace_once(
    "src/app/page.tsx",
    '''                  <div className="grid grid-cols-3 gap-3 px-5 py-3 text-center text-xs font-semibold sm:px-7">\n                    <div>CRR: <span className="font-bold">{runRate}</span></div>\n                    <div>PROJECTED: <span className="font-bold">{projected}</span></div>\n                    <div>Overs Remaining: <span className="font-bold">{oversRemaining}</span></div>\n                  </div>\n''',
    '''                  <div className="grid gap-2 px-5 py-3 text-center text-xs font-semibold sm:grid-cols-4 sm:px-7">\n                    <div>CRR: <span className="font-bold">{runRate}</span></div>\n                    <div>PROJECTED: <span className="font-bold">{projected}</span></div>\n                    <div>Overs Remaining: <span className="font-bold">{oversRemaining}</span></div>\n                    <div>\n                      {liveTarget !== null ? (\n                        <>TARGET: <span className="font-black">{liveTarget}</span> · NEED <span className="font-black">{runsNeeded}</span></>\n                      ) : firstInningsLeadOrDeficit !== null ? (\n                        <>{firstInningsLeadOrDeficit >= 0 ? "1ST INN LEAD" : "1ST INN DEFICIT"}: <span className="font-black">{Math.abs(firstInningsLeadOrDeficit)}</span></>\n                      ) : (\n                        <>1ST INNINGS</>\n                      )}\n                    </div>\n                  </div>\n''',
)

# 7) Move Swap Batsmen immediately above the delivery controls.
replace_once(
    "src/app/page.tsx",
    '''                {/* Delivery controls */}\n                <div id="live-deliveries"''',
    '''                {liveNeedsManualSwap && (\n                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm [color-scheme:dark]">\n                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">\n                      <div>\n                        <p className="text-xs font-black uppercase tracking-wide text-amber-800">Over Complete</p>\n                        <p className="mt-1 text-sm font-semibold text-amber-900">Swap batsmen before recording the next delivery.</p>\n                      </div>\n                      <button type="button" onClick={() => void manuallySwapStrikers()} disabled={liveLoading} className="h-11 shrink-0 rounded-lg bg-amber-500 px-5 font-bold text-white hover:bg-amber-600 disabled:opacity-40 [color-scheme:dark]">Swap Batsmen</button>\n                    </div>\n                  </div>\n                )}\n\n                {/* Delivery controls */}\n                <div id="live-deliveries"''',
)
replace_once(
    "src/app/page.tsx",
    '''                {liveNeedsManualSwap && (\n                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm [color-scheme:dark]">\n                    <p className="text-xs font-black uppercase tracking-wide text-amber-800">Over Complete</p>\n                    <p className="mt-1 text-sm font-semibold text-amber-900">Double Bowler over finished. Swap batsmen for the next over.</p>\n                    <button type="button" onClick={() => void manuallySwapStrikers()} disabled={liveLoading} className="mt-3 h-11 w-full rounded-lg bg-amber-500 font-bold text-white hover:bg-amber-600 disabled:opacity-40 [color-scheme:dark]">Swap Batsmen</button>\n                  </div>\n                )}\n\n''',
    '''''',
)

# 8) Replace the non-functional End Match button with the real action.
replace_once(
    "src/app/page.tsx",
    '''            <button type="button" onClick={() => {\n              if (window.confirm("End this match?")) {\n                setPageMode("DASHBOARD");\n                if (selectedTournament) {\n                  void loadLiveMatches(selectedTournament.id);\n                  void loadCompletedMatches(selectedTournament.id);\n                }\n              }\n            }} className="mt-auto rounded-lg bg-red-500 px-3 py-3 text-center text-sm font-bold hover:bg-red-600">\n              End Match\n            </button>\n''',
    '''            <button type="button" onClick={() => void endCurrentMatch()} disabled={liveLoading} className="mt-auto rounded-lg bg-red-500 px-3 py-3 text-center text-sm font-bold hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50">\n              {liveLoading ? "Ending..." : "End Match"}\n            </button>\n''',
)

print("Applied live score/target/end-match fixes")
