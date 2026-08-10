from pathlib import Path

page = Path('src/app/page.tsx')
text = page.read_text(encoding='utf-8-sig')

old = '''    const battingTeam = selectedTournament?.teams.find(
      (team) => team.team.id === teamAId,
    );
    const bowlingTeam = selectedTournament?.teams.find(
      (team) => team.team.id === teamBId,
    );'''
new = '''    const battingTeam = selectedTournament?.teams.find(
      (team) => team.team.id === liveBattingTeamId,
    );
    const bowlingTeam = selectedTournament?.teams.find(
      (team) => team.team.id === liveBowlingTeamId,
    );'''
if old not in text:
    raise SystemExit('LiveScoring team lookup not found')
text = text.replace(old, new, 1)

old = '''    const activeBowlerA = teamBPlayers.find(
      (player) => player.id === liveBowlerAId,
    );
    const activeBowlerB = teamBPlayers.find(
      (player) => player.id === liveBowlerBId,
    );'''
new = '''    const activeBowlerA = liveBowlingPlayers.find(
      (player) => player.id === liveBowlerAId,
    );
    const activeBowlerB = liveBowlingPlayers.find(
      (player) => player.id === liveBowlerBId,
    );'''
if old not in text:
    raise SystemExit('Active bowler lookup not found')
text = text.replace(old, new, 1)

old = '''      const refreshedBowlerAId = innings.currentBowlerAId ?? "";
      const refreshedBowlerBId = innings.currentBowlerBId ?? "";
      const refreshedOverNumber = Math.floor(Number(innings.legalBalls ?? 0) / 6) + 1;
      const refreshedOverDeliveries = deliveries.filter(
        (delivery: LiveDeliveryView) =>
          delivery.overNumber === refreshedOverNumber,
      );'''
new = '''      const refreshedOverNumber = Math.floor(Number(innings.legalBalls ?? 0) / 6) + 1;
      const refreshedOverDeliveries = deliveries.filter(
        (delivery: LiveDeliveryView) =>
          delivery.overNumber === refreshedOverNumber,
      );
      const refreshedBowlerAId = innings.currentBowlerAId ?? "";
      const refreshedBowlerBId =
        innings.currentBowlerBId ??
        (refreshedOverDeliveries.length > 0 ? liveBowlerBId : "");'''
if old not in text:
    raise SystemExit('Refresh bowler block not found')
text = text.replace(old, new, 1)

text = text.replace('â€¢', '•').replace('Â·', '·')
page.write_text(text, encoding='utf-8')

scoring = Path('src/lib/scoring.ts')
text = scoring.read_text(encoding='utf-8-sig')
old = '''        const bowlerA =
          innings.currentBowlerAId ??
          currentOverFirstBowler;

        const bowlerB =
          innings.currentBowlerBId ??
          currentOverSecondBowler;'''
new = '''        const firstDeliveryOfOver = overDeliveries.length === 0;

        const bowlerA =
          firstDeliveryOfOver
            ? currentOverFirstBowler
            : innings.currentBowlerAId ?? currentOverFirstBowler;

        const bowlerB =
          firstDeliveryOfOver
            ? null
            : innings.currentBowlerBId ?? currentOverSecondBowler;'''
if old not in text:
    raise SystemExit('Scoring bowler state block not found')
text = text.replace(old, new, 1)
scoring.write_text(text, encoding='utf-8')

print('Bowler state repair applied successfully.')