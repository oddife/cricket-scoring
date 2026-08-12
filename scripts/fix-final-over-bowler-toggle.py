from pathlib import Path

p = Path('src/app/page.tsx')
s = p.read_text(encoding='utf-8-sig')

old = '''      const refreshedBowlerAId =
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

      setLiveBowlerId(refreshedCurrentBowlerId);
'''

new = '''      const refreshedOverIsOddFinalOver =
        bowlingMode === "DOUBLE" &&
        Boolean(innings.match?.oddOvers) &&
        refreshedOverNumber >= Number(innings.match?.oversPerInnings ?? 0);

      const refreshedBowlerAId =
        observedBowlers[0] ??
        innings.currentBowlerAId ??
        "";
      const refreshedBowlerBId = refreshedOverIsOddFinalOver
        ? ""
        : observedBowlers[1] ??
          innings.currentBowlerBId ??
          liveBowlerBId;

      setLiveBowlerAId(refreshedBowlerAId);
      setLiveBowlerBId(refreshedBowlerBId);

      const refreshedCurrentBowlerId =
        refreshedOverIsOddFinalOver
          ? refreshedBowlerAId
          : bowlingMode === "DOUBLE" &&
              refreshedOverDeliveries.length > 0
            ? refreshedOverDeliveries.length % 2 === 0
              ? refreshedBowlerAId
              : refreshedBowlerBId
            : refreshedBowlerAId;

      setLiveBowlerId(refreshedCurrentBowlerId);
'''

if old not in s:
    raise SystemExit('refresh bowler state block not found')

s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
print('refresh odd final over bowler state fixed')
