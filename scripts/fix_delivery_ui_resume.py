from pathlib import Path

p = Path('src/app/page.tsx')
s = p.read_text(encoding='utf-8-sig')

old_resume = '''      const refreshedBowlerAId = innings.currentBowlerAId ?? "";
      const refreshedBowlerBId =
        innings.currentBowlerBId ??
        liveBowlerBId;

      setLiveBowlerAId(refreshedBowlerAId);
      setLiveBowlerBId(refreshedBowlerBId);
      const lastOverDelivery =
        refreshedOverDeliveries[refreshedOverDeliveries.length - 1];

      const refreshedCurrentBowlerId =
        bowlingMode === "DOUBLE" &&
        refreshedBowlerAId &&
        refreshedBowlerBId &&
        lastOverDelivery
          ? lastOverDelivery.bowlerId === refreshedBowlerAId
            ? refreshedBowlerBId
            : refreshedBowlerAId
          : refreshedBowlerAId;
'''
new_resume = '''      // Rebuild the active bowling pair from the actual deliveries
      // in the current over. This makes resume/reload deterministic
      // even if the persisted UI pair is stale.
      const observedBowlers = [
        ...new Set(
          refreshedOverDeliveries.map(
            (delivery: LiveDeliveryView) => delivery.bowlerId,
          ),
        ),
      ];

      const refreshedBowlerAId =
        observedBowlers[0] ??
        innings.currentBowlerAId ??
        "";
      const refreshedBowlerBId =
        observedBowlers[1] ??
        innings.currentBowlerBId ??
        liveBowlerBId;

      setLiveBowlerAId(refreshedBowlerAId);
      setLiveBowlerBId(refreshedBowlerBId);

      const refreshedCurrentBowlerId =
        bowlingMode === "DOUBLE" &&
        refreshedOverDeliveries.length > 0
          ? refreshedOverDeliveries.length % 2 === 0
            ? refreshedBowlerAId
            : refreshedBowlerBId
          : refreshedBowlerAId;
'''
if old_resume not in s:
    raise SystemExit('resume bowler block not found')
s = s.replace(old_resume, new_resume, 1)

old_custom_wicket = '''              {(customDeliveryType === "WIDE" || customDeliveryType === "NO_BALL") && (
                <button
                  type="button"
                  disabled={liveLoading || liveInningsComplete || !liveBowlerId}
                  onClick={() => void submitCustomDelivery(true)}
                  className="mt-3 h-12 w-full rounded-lg bg-violet-700 font-bold text-white disabled:opacity-40 [color-scheme:dark]"
                >
                  Continue as {customDeliveryType === "WIDE" ? "Wide" : "No Ball"} + Wicket
                </button>
              )}
'''
new_custom_wicket = '''              {customDeliveryType !== "BAT" && (
                <button
                  type="button"
                  disabled={liveLoading || liveInningsComplete || !liveBowlerId}
                  onClick={() => void submitCustomDelivery(true)}
                  className="mt-3 h-12 w-full rounded-lg bg-violet-700 font-bold text-white disabled:opacity-40 [color-scheme:dark]"
                >
                  Continue as {customDeliveryType === "WIDE" ? "Wide" : customDeliveryType === "NO_BALL" ? "No Ball" : customDeliveryType === "BYE" ? "Bye" : "Leg Bye"} + Wicket
                </button>
              )}
'''
if old_custom_wicket not in s:
    raise SystemExit('custom wicket button block not found')
s = s.replace(old_custom_wicket, new_custom_wicket, 1)

old_pending = '''                  This delivery will be recorded as {pendingWicketExtraType === "WIDE" ? "Wide" : "No Ball"} + {pendingWicketExtraRuns} extra run{pendingWicketExtraRuns === 1 ? "" : "s"} + wicket.
'''
new_pending = '''                  This delivery will be recorded as {pendingWicketExtraType === "WIDE" ? "Wide" : pendingWicketExtraType === "NO_BALL" ? "No Ball" : pendingWicketExtraType === "BYE" ? "Bye" : "Leg Bye"} + {pendingWicketExtraRuns} extra run{pendingWicketExtraRuns === 1 ? "" : "s"} + wicket.
'''
if old_pending not in s:
    raise SystemExit('pending wicket text not found')
s = s.replace(old_pending, new_pending, 1)

old_extra_buttons = '''                    {recordButton("WIDE + WICKET", "bg-violet-900 text-white hover:bg-violet-950", () => openWicketPanel("WIDE", 1))}
                    {recordButton("NO BALL + WICKET", "bg-violet-900 text-white hover:bg-violet-950", () => openWicketPanel("NO_BALL", 1))}
'''
new_extra_buttons = '''                    {recordButton("WIDE + WICKET", "bg-violet-900 text-white hover:bg-violet-950", () => openWicketPanel("WIDE", 1))}
                    {recordButton("NO BALL + WICKET", "bg-violet-900 text-white hover:bg-violet-950", () => openWicketPanel("NO_BALL", 1))}
                    {recordButton("BYE + WICKET", "bg-orange-600 text-white hover:bg-orange-700", () => openWicketPanel("BYE", 1))}
                    {recordButton("LEG BYE + WICKET", "bg-orange-600 text-white hover:bg-orange-700", () => openWicketPanel("LEG_BYE", 1))}
'''
if old_extra_buttons not in s:
    raise SystemExit('direct extra wicket buttons not found')
s = s.replace(old_extra_buttons, new_extra_buttons, 1)

s = s.replace('â†¶ Undo', 'Undo')
s = s.replace('â‡„ Swap Batsmen', 'Swap Batsmen')
s = s.replace('â†”', ' / ')

p.write_text(s, encoding='utf-8')
print('Patched page.tsx successfully')
