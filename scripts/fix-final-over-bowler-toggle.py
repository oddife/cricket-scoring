from pathlib import Path

p = Path('src/app/page.tsx')
s = p.read_text(encoding='utf-8-sig')

old = '''        if (bowlingMode === "DOUBLE") {
          setLiveBowlerId(
            liveBowlerId === liveBowlerAId
              ? liveBowlerBId
              : liveBowlerAId,
          );
        }
'''

new = '''        if (bowlingMode === "DOUBLE") {
          const currentOverIsOddFinalOver =
            liveOddOvers &&
            liveCurrentOver >= oversPerInnings;

          if (currentOverIsOddFinalOver) {
            // Odd final over is intentionally bowled by the single
            // bowler selected for the over. Do not toggle to empty B.
            setLiveBowlerId(liveBowlerAId || liveBowlerId);
          } else {
            setLiveBowlerId(
              liveBowlerId === liveBowlerAId
                ? liveBowlerBId
                : liveBowlerAId,
            );
          }
        }
'''

if old not in s:
    raise SystemExit('double-bowler toggle block not found')

s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')
print('final odd-over bowler toggle fixed')
