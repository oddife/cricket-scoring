import { prisma } from "./prisma";

export type LeagueRow = {
  position: number;
  teamId: string;
  teamName: string;
  shortName: string | null;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  nrr: number;
};

type TeamStats = Omit<LeagueRow, "position" | "nrr"> & {
  runsFor: number;
  ballsFor: number;
  runsAgainst: number;
  ballsAgainst: number;
};

function addInningsStats(
  stats: TeamStats,
  runsFor: number,
  ballsFor: number,
  runsAgainst: number,
  ballsAgainst: number,
) {
  stats.runsFor += runsFor;
  stats.ballsFor += ballsFor;
  stats.runsAgainst += runsAgainst;
  stats.ballsAgainst += ballsAgainst;
}

function effectiveBalls(legalBalls: number, allOut: boolean, quotaBalls: number) {
  if (allOut && legalBalls < quotaBalls) return quotaBalls;
  return legalBalls;
}

export async function getLeagueTable(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      teams: { include: { team: true } },
      matches: {
        where: {
          status: "COMPLETED",
          stage: "LEAGUE",
        },
        include: {
          innings: { orderBy: { inningsNumber: "asc" } },
        },
      },
    },
  });

  if (!tournament) throw new Error("Tournament not found.");

  const stats = new Map<string, TeamStats>();
  for (const membership of tournament.teams) {
    stats.set(membership.teamId, {
      teamId: membership.teamId,
      teamName: membership.team.name,
      shortName: membership.team.shortName,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      noResult: 0,
      points: 0,
      runsFor: 0,
      ballsFor: 0,
      runsAgainst: 0,
      ballsAgainst: 0,
    });
  }

  for (const match of tournament.matches) {
    const a = stats.get(match.teamAId);
    const b = stats.get(match.teamBId);
    if (!a || !b) continue;

    a.played += 1;
    b.played += 1;

    if (match.result === "TIE") {
      a.tied += 1;
      b.tied += 1;
      if (tournament.allowTie) {
        a.points += tournament.tiePoints;
        b.points += tournament.tiePoints;
      }
    } else if (match.result === "NO_RESULT") {
      a.noResult += 1;
      b.noResult += 1;
      if (tournament.allowNoResult) {
        a.points += tournament.noResultPoints;
        b.points += tournament.noResultPoints;
      }
    } else if (match.winnerId === match.teamAId) {
      a.won += 1;
      b.lost += 1;
      a.points += tournament.winPoints;
      b.points += tournament.lossPoints;
    } else if (match.winnerId === match.teamBId) {
      b.won += 1;
      a.lost += 1;
      b.points += tournament.winPoints;
      a.points += tournament.lossPoints;
    }

    const quotaBalls = match.oversPerInnings * 6;
    for (const innings of match.innings) {
      const batting = stats.get(innings.battingTeamId);
      const bowling = stats.get(innings.bowlingTeamId);
      if (!batting || !bowling) continue;

      const balls = effectiveBalls(
        innings.legalBalls,
        innings.wickets >= 10,
        quotaBalls,
      );

      addInningsStats(
        batting,
        innings.totalRuns,
        balls,
        0,
        0,
      );
      addInningsStats(
        bowling,
        0,
        0,
        innings.totalRuns,
        balls,
      );
    }
  }

  const rows = [...stats.values()].map((row) => ({
    ...row,
    nrr:
      row.ballsFor > 0 && row.ballsAgainst > 0
        ? (row.runsFor / row.ballsFor) * 6 -
          (row.runsAgainst / row.ballsAgainst) * 6
        : 0,
  }));

  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.nrr - a.nrr ||
      b.won - a.won ||
      a.teamName.localeCompare(b.teamName),
  );

  return rows.map((row, index) => {
    const { runsFor, ballsFor, runsAgainst, ballsAgainst, ...publicRow } = row;
    return { ...publicRow, position: index + 1 };
  });
}

export async function getMatchAwardSuggestions(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      players: { include: { player: true } },
      innings: {
        include: {
          deliveries: {
            include: { wicket: true },
          },
        },
      },
      award: true,
    },
  });

  if (!match) throw new Error("Match not found.");

  const playerIds = new Set(match.players.map((p) => p.playerId));
  const stats = new Map<string, { runs: number; wickets: number; balls: number; score: number }>();

  for (const id of playerIds) {
    stats.set(id, { runs: 0, wickets: 0, balls: 0, score: 0 });
  }

  for (const innings of match.innings) {
    for (const delivery of innings.deliveries) {
      const striker = stats.get(delivery.strikerId);
      if (striker) {
        striker.runs += delivery.runsBat;
        if (delivery.isLegal) striker.balls += 1;
      }
      if (delivery.wicket?.bowlerId) {
        const bowler = stats.get(delivery.wicket.bowlerId);
        if (bowler) bowler.wickets += 1;
      }
    }
  }

  const candidates = match.players
    .map(({ player }) => {
      const stat = stats.get(player.id) ?? { runs: 0, wickets: 0, balls: 0, score: 0 };
      // A transparent heuristic: batting runs + 20 points per wicket,
      // with a small bonus for strike rate once a player has faced a ball.
      const strikeRateBonus = stat.balls > 0 ? Math.min(10, (stat.runs / stat.balls) * 10) : 0;
      stat.score = stat.runs + stat.wickets * 20 + strikeRateBonus;
      return {
        playerId: player.id,
        player: { id: player.id, name: player.name, jerseyNumber: player.jerseyNumber },
        runs: stat.runs,
        wickets: stat.wickets,
        score: Number(stat.score.toFixed(2)),
      };
    })
    .sort((a, b) => b.score - a.score || b.runs - a.runs || b.wickets - a.wickets)
    .slice(0, 5);

  const suggestedPlayerId = candidates[0]?.playerId ?? null;

  return { candidates, suggestedPlayerId, award: match.award };
}

export async function getTournamentAwardShortlist(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      teams: true,
      matches: {
        where: { status: "COMPLETED" },
        include: {
          players: { include: { player: true } },
          innings: { include: { deliveries: { include: { wicket: true } } } },
        },
      },
      award: true,
    },
  });

  if (!tournament) throw new Error("Tournament not found.");

  const allowedTeams = new Set(tournament.teams.map((team) => team.teamId));
  const stats = new Map<string, { player: { id: string; name: string; jerseyNumber: number | null }; runs: number; wickets: number; balls: number; score: number }>();

  for (const match of tournament.matches) {
    for (const matchPlayer of match.players) {
      if (!allowedTeams.has(matchPlayer.teamId)) continue;
      if (!stats.has(matchPlayer.playerId)) {
        stats.set(matchPlayer.playerId, {
          player: {
            id: matchPlayer.player.id,
            name: matchPlayer.player.name,
            jerseyNumber: matchPlayer.player.jerseyNumber,
          },
          runs: 0,
          wickets: 0,
          balls: 0,
          score: 0,
        });
      }
    }

    for (const innings of match.innings) {
      for (const delivery of innings.deliveries) {
        const striker = stats.get(delivery.strikerId);
        if (striker) {
          striker.runs += delivery.runsBat;
          if (delivery.isLegal) striker.balls += 1;
        }
        if (delivery.wicket?.bowlerId) {
          const bowler = stats.get(delivery.wicket.bowlerId);
          if (bowler) bowler.wickets += 1;
        }
      }
    }
  }

  const candidates = [...stats.values()]
    .map((stat) => ({
      player: stat.player,
      runs: stat.runs,
      wickets: stat.wickets,
      score: Number((stat.runs + stat.wickets * 20 + (stat.balls ? Math.min(10, (stat.runs / stat.balls) * 10) : 0)).toFixed(2)),
    }))
    .sort((a, b) => b.score - a.score || b.runs - a.runs || b.wickets - a.wickets)
    .slice(0, 10);

  return { candidates, award: tournament.award };
}
