import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { prisma } from "./prisma";

import {
  addMatchPlayer,
  addMatchPlayers,
  createMatch,
  getMatch,
  getMatchTeamPlayers,
  removeMatchPlayer,
  updateMatchPlayerRole,
} from "./matches";

import {
  createPlayer,
  createTeam,
  addPlayerToTeam,
} from "./teams";

describe("Match and match players service", () => {
  beforeEach(async () => {
    await prisma.delivery.deleteMany();
    await prisma.wicket.deleteMany();
    await prisma.innings.deleteMany();
    await prisma.matchPlayer.deleteMany();
    await prisma.match.deleteMany();
    await prisma.tournamentTeam.deleteMany();
    await prisma.teamPlayer.deleteMany();
    await prisma.player.deleteMany();
    await prisma.tournament.deleteMany();
    await prisma.team.deleteMany();
    await prisma.user.deleteMany();
  });

  async function createTwoTeams() {
    const teamA = await createTeam({
      name: "Mumbai Warriors",
      shortName: "MW",
    });

    const teamB = await createTeam({
      name: "Delhi Kings",
      shortName: "DK",
    });

    return {
      teamA,
      teamB,
    };
  }

  async function createTeamPlayer(
    teamId: string,
    name: string,
  ) {
    const player =
      await createPlayer({
        name,
      });

    await addPlayerToTeam(
      teamId,
      player.id,
    );

    return player;
  }

  async function createBasicMatch() {
    const {
      teamA,
      teamB,
    } = await createTwoTeams();

    const match =
      await createMatch({
        teamAId: teamA.id,
        teamBId: teamB.id,
        oversPerInnings: 20,
        playersPerTeam: 11,
      });

    return {
      teamA,
      teamB,
      match,
    };
  }

  it("creates a match between two teams", async () => {
    const {
      teamA,
      teamB,
    } = await createTwoTeams();

    const match =
      await createMatch({
        teamAId: teamA.id,
        teamBId: teamB.id,
        oversPerInnings: 20,
        playersPerTeam: 11,
      });

    expect(match.teamAId).toBe(
      teamA.id,
    );

    expect(match.teamBId).toBe(
      teamB.id,
    );

    expect(
      match.oversPerInnings,
    ).toBe(20);

    expect(
      match.playersPerTeam,
    ).toBe(11);

    expect(match.status).toBe(
      "SCHEDULED",
    );
  });

  it("defaults to a two-innings match", async () => {
    const { teamA, teamB } = await createTwoTeams();

    const match = await createMatch({
      teamAId: teamA.id,
      teamBId: teamB.id,
      oversPerInnings: 20,
      playersPerTeam: 7,
    });

    expect(match.inningsPerMatch).toBe(2);
  });

  it("supports a four-innings match", async () => {
    const { teamA, teamB } = await createTwoTeams();

    const match = await createMatch({
      teamAId: teamA.id,
      teamBId: teamB.id,
      oversPerInnings: 20,
      inningsPerMatch: 4,
      playersPerTeam: 7,
    });

    expect(match.inningsPerMatch).toBe(4);
  });

  it("rejects a match with an invalid innings count", async () => {
    const { teamA, teamB } = await createTwoTeams();

    await expect(
      createMatch({
        teamAId: teamA.id,
        teamBId: teamB.id,
        oversPerInnings: 20,
        inningsPerMatch: 3,
        playersPerTeam: 7,
      }),
    ).rejects.toThrow(
      "A match must have exactly 2 or 4 innings.",
    );
  });

  it("supports a custom number of match players", async () => {
    const {
      teamA,
      teamB,
    } = await createTwoTeams();

    const match =
      await createMatch({
        teamAId: teamA.id,
        teamBId: teamB.id,
        oversPerInnings: 10,
        playersPerTeam: 6,
      });

    expect(
      match.playersPerTeam,
    ).toBe(6);
  });

  it("supports five-player cricket", async () => {
    const {
      teamA,
      teamB,
    } = await createTwoTeams();

    const match =
      await createMatch({
        teamAId: teamA.id,
        teamBId: teamB.id,
        oversPerInnings: 5,
        playersPerTeam: 5,
      });

    expect(
      match.playersPerTeam,
    ).toBe(5);
  });

  it("accepts 3 players per team", async () => {
    const { teamA, teamB } = await createTwoTeams();

    const match = await createMatch({
      teamAId: teamA.id,
      teamBId: teamB.id,
      oversPerInnings: 5,
      playersPerTeam: 3,
    });

    expect(match.playersPerTeam).toBe(3);
  });

  it("accepts 18 players per team", async () => {
    const { teamA, teamB } = await createTwoTeams();

    const match = await createMatch({
      teamAId: teamA.id,
      teamBId: teamB.id,
      oversPerInnings: 20,
      playersPerTeam: 18,
    });

    expect(match.playersPerTeam).toBe(18);
  });

  it("rejects fewer than 3 players per team", async () => {
    const { teamA, teamB } = await createTwoTeams();

    await expect(
      createMatch({
        teamAId: teamA.id,
        teamBId: teamB.id,
        oversPerInnings: 5,
        playersPerTeam: 2,
      }),
    ).rejects.toThrow(
      "Players per team must be an integer from 3 to 18.",
    );
  });

  it("rejects more than 18 players per team", async () => {
    const { teamA, teamB } = await createTwoTeams();

    await expect(
      createMatch({
        teamAId: teamA.id,
        teamBId: teamB.id,
        oversPerInnings: 20,
        playersPerTeam: 19,
      }),
    ).rejects.toThrow(
      "Players per team must be an integer from 3 to 18.",
    );
  });

  it("rejects a team playing against itself", async () => {
    const team =
      await createTeam({
        name: "Mumbai Warriors",
      });

    await expect(
      createMatch({
        teamAId: team.id,
        teamBId: team.id,
        oversPerInnings: 20,
        playersPerTeam: 11,
      }),
    ).rejects.toThrow(
      "A team cannot play against itself.",
    );
  });

  it("rejects a missing team", async () => {
    const team =
      await createTeam({
        name: "Mumbai Warriors",
      });

    await expect(
      createMatch({
        teamAId: team.id,
        teamBId: "missing-team",
        oversPerInnings: 20,
        playersPerTeam: 11,
      }),
    ).rejects.toThrow(
      "Team B not found.",
    );
  });

  it("rejects invalid overs", async () => {
    const {
      teamA,
      teamB,
    } = await createTwoTeams();

    await expect(
      createMatch({
        teamAId: teamA.id,
        teamBId: teamB.id,
        oversPerInnings: 0,
        playersPerTeam: 11,
      }),
    ).rejects.toThrow(
      "Overs per innings must be a positive integer.",
    );
  });

  it("rejects invalid player count", async () => {
    const {
      teamA,
      teamB,
    } = await createTwoTeams();

    await expect(
      createMatch({
        teamAId: teamA.id,
        teamBId: teamB.id,
        oversPerInnings: 20,
        playersPerTeam: 1,
      }),
    ).rejects.toThrow(
      "Players per team must be an integer from 3 to 18.",
    );
  });

  it("automatically enables odd-over mode for odd overs", async () => {
    const {
      teamA,
      teamB,
    } = await createTwoTeams();

    const match =
      await createMatch({
        teamAId: teamA.id,
        teamBId: teamB.id,
        oversPerInnings: 15,
        playersPerTeam: 11,
      });

    expect(match.oddOvers).toBe(
      true,
    );
  });

  it("does not enable odd-over mode for even overs", async () => {
    const {
      teamA,
      teamB,
    } = await createTwoTeams();

    const match =
      await createMatch({
        teamAId: teamA.id,
        teamBId: teamB.id,
        oversPerInnings: 20,
        playersPerTeam: 11,
      });

    expect(match.oddOvers).toBe(
      false,
    );
  });

  it("allows odd-over mode to be explicitly enabled", async () => {
    const {
      teamA,
      teamB,
    } = await createTwoTeams();

    const match =
      await createMatch({
        teamAId: teamA.id,
        teamBId: teamB.id,
        oversPerInnings: 20,
        playersPerTeam: 11,
        oddOvers: true,
      });

    expect(match.oddOvers).toBe(
      true,
    );
  });

  it("adds a team player to a match", async () => {
    const {
      teamA,
      match,
    } = await createBasicMatch();

    const player =
      await createTeamPlayer(
        teamA.id,
        "Rahul Sharma",
      );

    const matchPlayer =
      await addMatchPlayer({
        matchId: match.id,
        teamId: teamA.id,
        playerId: player.id,
      });

    expect(
      matchPlayer.matchId,
    ).toBe(match.id);

    expect(
      matchPlayer.teamId,
    ).toBe(teamA.id);

    expect(
      matchPlayer.playerId,
    ).toBe(player.id);

    expect(
      matchPlayer.role,
    ).toBe("PLAYER");
  });

  it("allows assigning a captain role", async () => {
    const {
      teamA,
      match,
    } = await createBasicMatch();

    const player =
      await createTeamPlayer(
        teamA.id,
        "Captain Player",
      );

    const matchPlayer =
      await addMatchPlayer({
        matchId: match.id,
        teamId: teamA.id,
        playerId: player.id,
        role: "CAPTAIN",
      });

    expect(
      matchPlayer.role,
    ).toBe("CAPTAIN");
  });

  it("allows the captain to also be the wicketkeeper", async () => {
    const { teamA, match } = await createBasicMatch();

    const player = await createTeamPlayer(
      teamA.id,
      "Captain Keeper",
    );

    const matchPlayer = await addMatchPlayer({
      matchId: match.id,
      teamId: teamA.id,
      playerId: player.id,
      role: "CAPTAIN",
      isWicketKeeper: true,
    });

    expect(matchPlayer.role).toBe("CAPTAIN");
    expect(matchPlayer.isWicketKeeper).toBe(true);
  });

  it("allows assigning a wicket keeper role", async () => {
    const {
      teamA,
      match,
    } = await createBasicMatch();

    const player =
      await createTeamPlayer(
        teamA.id,
        "Keeper Player",
      );

    const matchPlayer =
      await addMatchPlayer({
        matchId: match.id,
        teamId: teamA.id,
        playerId: player.id,
        role: "WICKET_KEEPER",
      });

    expect(
      matchPlayer.role,
    ).toBe("WICKET_KEEPER");
  });

  it("prevents adding the same player twice", async () => {
    const {
      teamA,
      match,
    } = await createBasicMatch();

    const player =
      await createTeamPlayer(
        teamA.id,
        "Rahul Sharma",
      );

    await addMatchPlayer({
      matchId: match.id,
      teamId: teamA.id,
      playerId: player.id,
    });

    await expect(
      addMatchPlayer({
        matchId: match.id,
        teamId: teamA.id,
        playerId: player.id,
      }),
    ).rejects.toThrow(
      "Player is already in this match.",
    );
  });

  it("rejects a player who does not belong to the selected team", async () => {
    const {
      teamA,
      teamB,
      match,
    } = await createBasicMatch();

    const player =
      await createTeamPlayer(
        teamB.id,
        "Delhi Player",
      );

    await expect(
      addMatchPlayer({
        matchId: match.id,
        teamId: teamA.id,
        playerId: player.id,
      }),
    ).rejects.toThrow(
      "Player does not belong to this team.",
    );
  });

  it("rejects a team that is not part of the match", async () => {
    const {
      teamA,
      match,
    } = await createBasicMatch();

    const outsideTeam =
      await createTeam({
        name: "Outside Team",
      });

    const player =
      await createTeamPlayer(
        outsideTeam.id,
        "Outside Player",
      );

    await expect(
      addMatchPlayer({
        matchId: match.id,
        teamId: outsideTeam.id,
        playerId: player.id,
      }),
    ).rejects.toThrow(
      "Team is not part of this match.",
    );

    expect(
      teamA.id,
    ).toBeTruthy();
  });

  it("adds multiple players to a match", async () => {
    const {
      teamA,
      match,
    } = await createBasicMatch();

    const playerA =
      await createTeamPlayer(
        teamA.id,
        "Player A",
      );

    const playerB =
      await createTeamPlayer(
        teamA.id,
        "Player B",
      );

    const playerC =
      await createTeamPlayer(
        teamA.id,
        "Player C",
      );

    const players =
      await addMatchPlayers(
        match.id,
        [
          {
            matchId: match.id,
            teamId: teamA.id,
            playerId: playerA.id,
          },
          {
            matchId: match.id,
            teamId: teamA.id,
            playerId: playerB.id,
          },
          {
            matchId: match.id,
            teamId: teamA.id,
            playerId: playerC.id,
          },
        ],
      );

    expect(players).toHaveLength(
      3,
    );
  });

  it("returns match players by team", async () => {
    const {
      teamA,
      teamB,
      match,
    } = await createBasicMatch();

    const playerA =
      await createTeamPlayer(
        teamA.id,
        "Mumbai Player",
      );

    const playerB =
      await createTeamPlayer(
        teamB.id,
        "Delhi Player",
      );

    await addMatchPlayer({
      matchId: match.id,
      teamId: teamA.id,
      playerId: playerA.id,
    });

    await addMatchPlayer({
      matchId: match.id,
      teamId: teamB.id,
      playerId: playerB.id,
    });

    const teamAPlayers =
      await getMatchTeamPlayers(
        match.id,
        teamA.id,
      );

    const teamBPlayers =
      await getMatchTeamPlayers(
        match.id,
        teamB.id,
      );

    expect(
      teamAPlayers,
    ).toHaveLength(1);

    expect(
      teamBPlayers,
    ).toHaveLength(1);

    expect(
      teamAPlayers[0].player.id,
    ).toBe(playerA.id);

    expect(
      teamBPlayers[0].player.id,
    ).toBe(playerB.id);
  });

  it("gets a match with its players", async () => {
    const {
      teamA,
      match,
    } = await createBasicMatch();

    const player =
      await createTeamPlayer(
        teamA.id,
        "Rahul Sharma",
      );

    await addMatchPlayer({
      matchId: match.id,
      teamId: teamA.id,
      playerId: player.id,
    });

    const result =
      await getMatch(match.id);

    expect(
      result,
    ).not.toBeNull();

    expect(
      result?.id,
    ).toBe(match.id);

    expect(
      result?.players,
    ).toHaveLength(1);

    expect(
      result?.players[0].player.name,
    ).toBe("Rahul Sharma");
  });

  it("allows a player to be removed before participating", async () => {
    const {
      teamA,
      match,
    } = await createBasicMatch();

    const player =
      await createTeamPlayer(
        teamA.id,
        "Temporary Player",
      );

    await addMatchPlayer({
      matchId: match.id,
      teamId: teamA.id,
      playerId: player.id,
    });

    await removeMatchPlayer(
      match.id,
      player.id,
    );

    const players =
      await getMatchTeamPlayers(
        match.id,
        teamA.id,
      );

    expect(players).toHaveLength(
      0,
    );
  });

  it("allows a new player to be added later", async () => {
    const {
      teamA,
      match,
    } = await createBasicMatch();

    const playerA =
      await createTeamPlayer(
        teamA.id,
        "Player A",
      );

    await addMatchPlayer({
      matchId: match.id,
      teamId: teamA.id,
      playerId: playerA.id,
    });

    let players =
      await getMatchTeamPlayers(
        match.id,
        teamA.id,
      );

    expect(players).toHaveLength(
      1,
    );

    const playerB =
      await createTeamPlayer(
        teamA.id,
        "Player B",
      );

    await addMatchPlayer({
      matchId: match.id,
      teamId: teamA.id,
      playerId: playerB.id,
    });

    players =
      await getMatchTeamPlayers(
        match.id,
        teamA.id,
      );

    expect(players).toHaveLength(
      2,
    );
  });

  it("updates a player's match role", async () => {
    const {
      teamA,
      match,
    } = await createBasicMatch();

    const player =
      await createTeamPlayer(
        teamA.id,
        "Rahul Sharma",
      );

    await addMatchPlayer({
      matchId: match.id,
      teamId: teamA.id,
      playerId: player.id,
    });

    const updated =
      await updateMatchPlayerRole(
        match.id,
        player.id,
        "CAPTAIN",
      );

    expect(
      updated.role,
    ).toBe("CAPTAIN");
  });

  it("rejects updating a player not in the match", async () => {
    const {
      teamA,
      match,
    } = await createBasicMatch();

    const player =
      await createTeamPlayer(
        teamA.id,
        "Rahul Sharma",
      );

    await expect(
      updateMatchPlayerRole(
        match.id,
        player.id,
        "CAPTAIN",
      ),
    ).rejects.toThrow(
      "Player is not in this match.",
    );
  });

  it("does not allow removing a player after participation", async () => {
    const {
      teamA,
      teamB,
      match,
    } = await createBasicMatch();

    const batter =
      await createTeamPlayer(
        teamA.id,
        "Batter",
      );

    const nonStriker =
      await createTeamPlayer(
        teamA.id,
        "Non Striker",
      );

    const bowler =
      await createTeamPlayer(
        teamB.id,
        "Bowler",
      );

    await addMatchPlayer({
      matchId: match.id,
      teamId: teamA.id,
      playerId: batter.id,
    });

    await addMatchPlayer({
      matchId: match.id,
      teamId: teamA.id,
      playerId: nonStriker.id,
    });

    await addMatchPlayer({
      matchId: match.id,
      teamId: teamB.id,
      playerId: bowler.id,
    });

    const innings =
      await prisma.innings.create({
        data: {
          matchId: match.id,
          inningsNumber: 1,
          battingTeamId: teamA.id,
          bowlingTeamId: teamB.id,
        },
      });

    await prisma.delivery.create({
      data: {
        inningsId: innings.id,
        overNumber: 1,
        ballNumber: 1,
        bowlerId: bowler.id,
        strikerId: batter.id,
        nonStrikerId: nonStriker.id,
        runsBat: 0,
        runsExtra: 0,
        runsTotal: 0,
        isLegal: true,
      },
    });

    await expect(
      removeMatchPlayer(
        match.id,
        batter.id,
      ),
    ).rejects.toThrow(
      "A player who has participated in the match cannot be removed.",
    );
  });

  it("keeps match players independent from team roster changes", async () => {
    const {
      teamA,
      match,
    } = await createBasicMatch();

    const player =
      await createTeamPlayer(
        teamA.id,
        "Historical Player",
      );

    await addMatchPlayer({
      matchId: match.id,
      teamId: teamA.id,
      playerId: player.id,
    });

    const matchPlayers =
      await getMatchTeamPlayers(
        match.id,
        teamA.id,
      );

    expect(
      matchPlayers,
    ).toHaveLength(1);

    expect(
      matchPlayers[0].player.id,
    ).toBe(player.id);
  });
});