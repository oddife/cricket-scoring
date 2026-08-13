from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    p = Path(path)
    s = p.read_text(encoding="utf-8")
    if old not in s:
        raise SystemExit(f"{label}: expected code was not found; no changes made to that file")
    p.write_text(s.replace(old, new, 1), encoding="utf-8")


# 1) Core scoring: an innings ends on the final wicket as well as at the
# configured over limit. No schema/API change is required.
replace_once(
    "src/lib/scoring.ts",
    '''  const inningsComplete =\n    newLegalBalls >=\n    innings.match.oversPerInnings * 6;''',
    '''  // An innings also ends when the batting side is all out.\n  // A team can have at most one fewer wickets than players.\n  const maxWickets = Math.max(0, battingPlayers.length - 1);\n  const allOut =\n    result.wicket.occurred &&\n    innings.wickets + 1 >= maxWickets;\n\n  const inningsComplete =\n    newLegalBalls >=\n      innings.match.oversPerInnings * 6 ||\n    allOut;''',
    "src/lib/scoring.ts",
)

# 2) The local page already contains the verified fielder UI patch. Add the
# all-out exception so the final wicket does not require a replacement.
replace_once(
    "src/app/page.tsx",
    '''    const wicketRequiresFielder =\n      wicketType === "CAUGHT" ||\n      wicketType === "RUN_OUT" ||\n      wicketType === "STUMPED";''',
    '''    const wicketRequiresFielder =\n      wicketType === "CAUGHT" ||\n      wicketType === "RUN_OUT" ||\n      wicketType === "STUMPED";\n\n    // The final wicket ends the innings, so a replacement batsman\n    // is not required when this delivery will make the side all out.\n    const wicketWillEndInnings =\n      liveWickets + 1 >= Math.max(0, liveBattingPlayers.length - 1);''',
    "src/app/page.tsx fielder block",
)

replace_once(
    "src/app/page.tsx",
    '''disabled={!replacementPlayerId || liveLoading || (wicketRequiresFielder && !wicketFielderId)}''',
    '''disabled={(!wicketWillEndInnings && !replacementPlayerId) || liveLoading || (wicketRequiresFielder && !wicketFielderId)}''',
    "src/app/page.tsx wicket button",
)

replace_once(
    "src/app/page.tsx",
    '''onClick={() => void recordLiveDelivery({ isWicket: true, wicketType, dismissedPlayerId, replacementPlayerId, ...(wicketFielderId ? { fielderId: wicketFielderId } : {}), ...(pendingWicketExtraType ? { runsExtra: pendingWicketExtraRuns, extraType: pendingWicketExtraType } : {}) })}''',
    '''onClick={() => void recordLiveDelivery({ isWicket: true, wicketType, dismissedPlayerId, ...(replacementPlayerId ? { replacementPlayerId } : {}), ...(wicketFielderId ? { fielderId: wicketFielderId } : {}), ...(pendingWicketExtraType ? { runsExtra: pendingWicketExtraRuns, extraType: pendingWicketExtraType } : {}) })}''',
    "src/app/page.tsx wicket submit",
)

# 3) If the backend completes the whole match at the end of an innings
# (e.g. innings 3 when the batting side is still behind), do not render the
# Start Innings 4 modal. Return to the dashboard and refresh match lists.
replace_once(
    "src/app/page.tsx",
    '''      const inningsComplete =\n        Boolean(\n          data.inningsComplete ??\n            result.inningsComplete ??\n            data.innings?.status === "COMPLETED",\n        );\n\n      setLiveInningsComplete(inningsComplete);''',
    '''      const inningsComplete =\n        Boolean(\n          data.inningsComplete ??\n            result.inningsComplete ??\n            data.innings?.status === "COMPLETED",\n        );\n\n      setLiveInningsComplete(inningsComplete);\n\n      // The backend can complete the entire match when an innings ends.\n      // Do not show the next-innings setup modal for a completed match.\n      if (data.matchCompleted) {\n        setShowWicketPanel(false);\n        setShowCustomDeliveryPanel(false);\n        setPendingWicketExtraType(null);\n        setPendingWicketExtraRuns(0);\n        setDismissedPlayerId("");\n        setReplacementPlayerId("");\n        setRunOutDismissedEnd("STRIKER");\n        setPageMode("DASHBOARD");\n        if (selectedTournament) {\n          void loadLiveMatches(selectedTournament.id);\n          void loadCompletedMatches(selectedTournament.id);\n        }\n      }''',
    "src/app/page.tsx match completion",
)

print("Innings-end fixes applied successfully.")
