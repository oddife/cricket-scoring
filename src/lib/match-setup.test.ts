import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "./prisma";
import { createMatch } from "./matches";
import {
  addPlayerToTeam,
  createPlayer,
  createTeam,
} from "./teams";
import {
  hasValidMatchPlayers,
  setupMatchPlayers,
  startInnings,
} from "./match-setup";

describe("Match setup and innings", () => {
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

  async function createTeamsAndMatch(
    playersPerTeam: number,
    inningsPerMatch: 2 | 4 = 2,
  ) {
    const teamA = await createTeam({ name: "Team A" });
    const teamB = await createTeam({ name: "Team B" });

    const match = await createMatch({
      teamAId: teamA.id,
      teamBId: teamB.id,
      oversPerInnings: 10,
      inningsPerMatch,
      playersPerTeam,
    });

    return { teamA, teamB, match };
  }

  async function addPlayers(
    teamId: string,
    count: number,
    prefix: string,
  ) {
    const players = [];

    for (let i = 1; i <= count; i += 1) {
      const player = await createPlayer({
        name: `${prefix} ${i}`,
      });

      await addPlayerToTeam(teamId, player.id);
      players.push(player);
    }

    return players;
  }

  async function setupBothMatchPlayers(
    playersPerTeam: number,
    inningsPerMatch: 2 | 4 = 2,
  ) {
    const { teamA, teamB, match } =
      await createTeamsAndMatch(
        playersPerTeam,
        inningsPerMatch,
      );

    const playersA = await addPlayers(
      teamA.id,
      playersPerTeam,
      "A",
    );

    const playersB = await addPlayers(
      teamB.id,
      playersPerTeam,
      "B",
    );

    await setupMatchPlayers({
      matchId: match.id,
      teamId: teamA.id,
      players: playersA.map((player, index) => ({
        playerId: player.id,
        role:
          index === 0
            ? "CAPTAIN"
            : index === 1
              ? "VICE_CAPTAIN"
              : "PLAYER",
        isWicketKeeper: index === 2,
      })),
    });

    await setupMatchPlayers({
      matchId: match.id,
      teamId: teamB.id,
      players: playersB.map((player, index) => ({
        playerId: player.id,
        role:
          index === 0
            ? "CAPTAIN"
            : index === 1
              ? "VICE_CAPTAIN"
              : "PLAYER",
        isWicketKeeper: index === 2,
      })),
    });

    return {
      teamA,
      teamB,
      match,
      playersA,
      playersB,
    };
  }

  it("accepts match players sized from playersPerTeam", async () => {
    const { teamA, match } =
      await createTeamsAndMatch(7);

    const players = await addPlayers(
      teamA.id,
      7,
      "A",
    );

    const result = await setupMatchPlayers({
      matchId: match.id,
      teamId: teamA.id,
      players: players.map((player, index) => ({
        playerId: player.id,
        role:
          index === 0
            ? "CAPTAIN"
            : index === 1
              ? "VICE_CAPTAIN"
              : "PLAYER",
        isWicketKeeper: index === 2,
      })),
    });

    expect(result).toHaveLength(7);

    expect(
      await hasValidMatchPlayers(
        match.id,
        teamA.id,
      ),
    ).toBe(true);
  });

  it("rejects match players that are larger than playersPerTeam", async () => {
    const { teamA, match } =
      await createTeamsAndMatch(7);

    const players = await addPlayers(
      teamA.id,
      8,
      "A",
    );

    await expect(
      setupMatchPlayers({
        matchId: match.id,
        teamId: teamA.id,
        players: players.map((player, index) => ({
          playerId: player.id,
          role:
            index === 0
              ? "CAPTAIN"
              : index === 1
                ? "VICE_CAPTAIN"
                : "PLAYER",
          isWicketKeeper: index === 0,
        })),
      }),
    ).rejects.toThrow(
      "A match player group must contain exactly 7 players.",
    );
  });

  it("allows the captain to also be the wicketkeeper", async () => {
    const { teamA, match } =
      await createTeamsAndMatch(7);

    const players = await addPlayers(
      teamA.id,
      7,
      "A",
    );

    await setupMatchPlayers({
      matchId: match.id,
      teamId: teamA.id,
      players: players.map((player, index) => ({
        playerId: player.id,
        role:
          index === 0
            ? "CAPTAIN"
            : index === 1
              ? "VICE_CAPTAIN"
              : "PLAYER",
        isWicketKeeper: index === 0,
      })),
    });

    expect(
      await hasValidMatchPlayers(
        match.id,
        teamA.id,
      ),
    ).toBe(true);

    const keeper =
      await prisma.matchPlayer.findUnique({
        where: {
          matchId_playerId: {
            matchId: match.id,
            playerId: players[0].id,
          },
        },
      });

    expect(keeper?.role).toBe("CAPTAIN");
    expect(keeper?.isWicketKeeper).toBe(true);
  });

  it("allows 7 players in a four-innings match", async () => {
    const { match } =
      await setupBothMatchPlayers(7, 4);

    expect(match.inningsPerMatch).toBe(4);
  });

  it("starts innings 1 with Team A batting", async () => {
    const {
      teamA,
      teamB,
      match,
      playersA,
      playersB,
    } = await setupBothMatchPlayers(7, 2);

    const innings = await startInnings({
      matchId: match.id,
      inningsNumber: 1,
      battingTeamId: teamA.id,
      bowlingTeamId: teamB.id,
      strikerId: playersA[0].id,
      nonStrikerId: playersA[1].id,
      bowlerAId: playersB[0].id,
      bowlerBId: playersB[1].id,
    });

    expect(innings.inningsNumber).toBe(1);
    expect(innings.battingTeamId).toBe(teamA.id);
    expect(innings.bowlingTeamId).toBe(teamB.id);

    expect(innings.currentStrikerId).toBe(
      playersA[0].id,
    );

    expect(innings.currentNonStrikerId).toBe(
      playersA[1].id,
    );

    expect(innings.currentBowlerAId).toBe(
      playersB[0].id,
    );

    expect(innings.currentBowlerBId).toBe(
      playersB[1].id,
    );
  });

  it("starts innings 2 with Team B batting", async () => {
    const {
      teamA,
      teamB,
      match,
      playersA,
      playersB,
    } = await setupBothMatchPlayers(7, 2);

    const innings = await startInnings({
      matchId: match.id,
      inningsNumber: 2,
      battingTeamId: teamB.id,
      bowlingTeamId: teamA.id,
      strikerId: playersB[0].id,
      nonStrikerId: playersB[1].id,
      bowlerAId: playersA[0].id,
      bowlerBId: playersA[1].id,
    });

    expect(innings.inningsNumber).toBe(2);
    expect(innings.battingTeamId).toBe(teamB.id);
    expect(innings.bowlingTeamId).toBe(teamA.id);

    expect(innings.currentStrikerId).toBe(
      playersB[0].id,
    );

    expect(innings.currentNonStrikerId).toBe(
      playersB[1].id,
    );

    expect(innings.currentBowlerAId).toBe(
      playersA[0].id,
    );

    expect(innings.currentBowlerBId).toBe(
      playersA[1].id,
    );
  });

  it("supports innings 3 and 4 in a four-innings match", async () => {
    const {
      teamA,
      teamB,
      match,
      playersA,
      playersB,
    } = await setupBothMatchPlayers(7, 4);

    const innings3 = await startInnings({
      matchId: match.id,
      inningsNumber: 3,
      battingTeamId: teamA.id,
      bowlingTeamId: teamB.id,
      strikerId: playersA[0].id,
      nonStrikerId: playersA[1].id,
      bowlerAId: playersB[0].id,
      bowlerBId: playersB[1].id,
    });

    const innings4 = await startInnings({
      matchId: match.id,
      inningsNumber: 4,
      battingTeamId: teamB.id,
      bowlingTeamId: teamA.id,
      strikerId: playersB[0].id,
      nonStrikerId: playersB[1].id,
      bowlerAId: playersA[0].id,
      bowlerBId: playersA[1].id,
    });

    expect(innings3.battingTeamId).toBe(
      teamA.id,
    );

    expect(innings4.battingTeamId).toBe(
      teamB.id,
    );

    expect(innings3.currentStrikerId).toBe(
      playersA[0].id,
    );

    expect(innings3.currentNonStrikerId).toBe(
      playersA[1].id,
    );

    expect(innings3.currentBowlerAId).toBe(
      playersB[0].id,
    );

    expect(innings3.currentBowlerBId).toBe(
      playersB[1].id,
    );

    expect(innings4.currentStrikerId).toBe(
      playersB[0].id,
    );

    expect(innings4.currentNonStrikerId).toBe(
      playersB[1].id,
    );

    expect(innings4.currentBowlerAId).toBe(
      playersA[0].id,
    );

    expect(innings4.currentBowlerBId).toBe(
      playersA[1].id,
    );
  });

  it("rejects innings 3 in a two-innings match", async () => {
    const {
      teamA,
      teamB,
      match,
      playersA,
      playersB,
    } = await setupBothMatchPlayers(7, 2);

    await expect(
      startInnings({
        matchId: match.id,
        inningsNumber: 3,
        battingTeamId: teamA.id,
        bowlingTeamId: teamB.id,
        strikerId: playersA[0].id,
        nonStrikerId: playersA[1].id,
        bowlerAId: playersB[0].id,
        bowlerBId: playersB[1].id,
      }),
    ).rejects.toThrow(
      "This match has only 2 innings.",
    );
  });

  it("rejects the wrong batting team for an innings number", async () => {
    const {
      teamA,
      teamB,
      match,
      playersA,
      playersB,
    } = await setupBothMatchPlayers(7, 4);

    await expect(
      startInnings({
        matchId: match.id,
        inningsNumber: 2,
        battingTeamId: teamA.id,
        bowlingTeamId: teamB.id,
        strikerId: playersA[0].id,
        nonStrikerId: playersA[1].id,
        bowlerAId: playersB[0].id,
        bowlerBId: playersB[1].id,
      }),
    ).rejects.toThrow(
      "Innings 2 must be played by the expected batting team.",
    );
  });

  it("accepts the minimum of 3 match players", async () => {
    const { teamA, match } =
      await createTeamsAndMatch(3);

    const players = await addPlayers(
      teamA.id,
      3,
      "A",
    );

    const result = await setupMatchPlayers({
      matchId: match.id,
      teamId: teamA.id,
      players: players.map((player, index) => ({
        playerId: player.id,
        role:
          index === 0
            ? "CAPTAIN"
            : index === 1
              ? "VICE_CAPTAIN"
              : "PLAYER",
        isWicketKeeper: index === 0,
      })),
    });

    expect(result).toHaveLength(3);
  });

  it("accepts the maximum of 18 match players", async () => {
    const { teamA, match } =
      await createTeamsAndMatch(18);

    const players = await addPlayers(
      teamA.id,
      18,
      "A",
    );

    const result = await setupMatchPlayers({
      matchId: match.id,
      teamId: teamA.id,
      players: players.map((player, index) => ({
        playerId: player.id,
        role:
          index === 0
            ? "CAPTAIN"
            : index === 1
              ? "VICE_CAPTAIN"
              : "PLAYER",
        isWicketKeeper: index === 0,
      })),
    });

    expect(result).toHaveLength(18);
  });
});