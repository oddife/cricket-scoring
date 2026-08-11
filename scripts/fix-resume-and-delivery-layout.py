from pathlib import Path

p = Path('src/app/page.tsx')
s = p.read_text(encoding='utf-8-sig')

old_resume = '''      setLiveBowlerAId(
        currentInnings.currentBowlerAId ?? "",
      );
      setLiveBowlerBId(
        currentInnings.currentBowlerBId ?? "",
      );
      setLiveBowlerId(
        currentInnings.currentBowlerAId ??
          currentInnings.currentBowlerBId ??
          "",
      );
      setLivePreviousBowlerAId(
        currentInnings.previousOverBowlerAId ?? "",
      );
      setLivePreviousBowlerBId(
        currentInnings.previousOverBowlerBId ?? "",
      );
      setLiveDeliveryCount(
        Number(currentInnings.legalBalls ?? 0) % 6,
      );
      setLiveCurrentOver(
        Math.floor(
          Number(currentInnings.legalBalls ?? 0) / 6,
        ) + 1,
      );
      setLiveCurrentBall(
        (Number(currentInnings.legalBalls ?? 0) % 6) + 1,
      );
'''

new_resume = '''      const resumedDeliveries = Array.isArray(currentInnings.deliveries)
        ? currentInnings.deliveries
        : [];
      const lastResumedDelivery =
        resumedDeliveries[resumedDeliveries.length - 1] ?? null;
      const currentOverNumberFromData =
        lastResumedDelivery?.overNumber ?? 1;
      const currentOverDeliveriesFromData =
        resumedDeliveries.filter(
          (delivery: { overNumber: number }) =>
            delivery.overNumber === currentOverNumberFromData,
        );
      const currentOverLegalBallsFromData =
        currentOverDeliveriesFromData.filter(
          (delivery: { isLegal: boolean }) => delivery.isLegal,
        ).length;

      const observedCurrentOverBowlers = [
        ...new Set(
          currentOverDeliveriesFromData
            .map((delivery: { bowlerId: string }) => delivery.bowlerId)
            .filter(Boolean),
        ),
      ];

      const resumedBowlerAId =
        observedCurrentOverBowlers[0] ??
        currentInnings.currentBowlerAId ??
        currentInnings.currentBowlerBId ??
        "";
      const resumedBowlerBId =
        observedCurrentOverBowlers[1] ??
        currentInnings.currentBowlerBId ??
        (resumedBowlerAId !== currentInnings.currentBowlerAId
          ? currentInnings.currentBowlerAId
          : "") ??
        "";

      setLiveBowlerAId(resumedBowlerAId);
      setLiveBowlerBId(resumedBowlerBId);

      const resumedCurrentBowlerId =
        bowlingMode === "DOUBLE" &&
        !liveOddOvers &&
        resumedBowlerAId &&
        resumedBowlerBId
          ? currentOverDeliveriesFromData.length % 2 === 0
            ? resumedBowlerAId
            : resumedBowlerBId
          : resumedBowlerAId || resumedBowlerBId;

      setLiveBowlerId(resumedCurrentBowlerId);
      setLivePreviousBowlerAId(
        currentInnings.previousOverBowlerAId ?? "",
      );
      setLivePreviousBowlerBId(
        currentInnings.previousOverBowlerBId ?? "",
      );
      setLiveDeliveryCount(currentOverDeliveriesFromData.length);
      setLiveCurrentOver(
        lastResumedDelivery && currentOverLegalBallsFromData < 6
          ? currentOverNumberFromData
          : currentOverNumberFromData + 1,
      );
      setLiveCurrentBall(
        lastResumedDelivery && currentOverLegalBallsFromData < 6
          ? currentOverLegalBallsFromData + 1
          : 1,
      );
'''

if old_resume not in s:
    raise SystemExit('resume block not found')
s = s.replace(old_resume, new_resume, 1)

old_layout = '''                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {recordButton("MORE RUNS", "bg-slate-800 text-white hover:bg-slate-900 col-span-1", () => openCustomDeliveryPanel())}
                  </div>
                  <button type="button" disabled={liveLoading || liveInningsComplete || !liveBowlerId} onClick={() => openWicketPanel()} className="mt-2 h-20 w-full rounded-xl bg-red-500 text-lg font-black text-white hover:bg-red-600 disabled:opacity-40 [color-scheme:dark]">WICKET</button>
'''

new_layout = '''                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={liveLoading || liveInningsComplete || !liveBowlerId}
                      onClick={() => openWicketPanel()}
                      className="col-span-2 h-20 rounded-xl bg-red-500 text-lg font-black text-white hover:bg-red-600 disabled:opacity-40 [color-scheme:dark]"
                    >
                      WICKET
                    </button>
                    {recordButton(
                      "MORE RUNS",
                      "col-span-1 bg-slate-800 text-white hover:bg-slate-900 h-20",
                      () => openCustomDeliveryPanel(),
                    )}
                  </div>
'''

if old_layout not in s:
    raise SystemExit('delivery layout block not found')
s = s.replace(old_layout, new_layout, 1)

p.write_text(s, encoding='utf-8')
print('resume bowling and delivery layout patched')
