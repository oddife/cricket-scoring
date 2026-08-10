import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import {
  addPlayerToTeam,
  createPlayer,
  createTeam,
  getTeam,
  getTeamPlayers,
  removePlayerFromTeam,
  updatePlayer,
  updateTeam,
} from "./teams";

describe("Team and Player service", () => {
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

  it("creates a team", async () => {
    const team = await createTeam({
      name: "Mumbai Warriors",
      shortName: "MW",
    });

    expect(team.name).toBe("Mumbai Warriors");
    expect(team.shortName).toBe("MW");
  });

  it("rejects an empty team name", async () => {
    await expect(
      createTeam({
        name: "   ",
      }),
    ).rejects.toThrow(
      "Team name is required.",
    );
  });

  it("creates a player", async () => {
    const player = await createPlayer({
      name: "Rahul Sharma",
      jerseyNumber: 18,
      battingStyle: "Right Hand",
      bowlingStyle: "Right Arm Medium",
    });

    expect(player.name).toBe("Rahul Sharma");
    expect(player.jerseyNumber).toBe(18);
  });

  it("rejects an empty player name", async () => {
    await expect(
      createPlayer({
        name: "   ",
      }),
    ).rejects.toThrow(
      "Player name is required.",
    );
  });

  it("adds a player to a team", async () => {
    const team = await createTeam({
      name: "Mumbai Warriors",
    });

    const player = await createPlayer({
      name: "Rahul Sharma",
    });

    const membership =
      await addPlayerToTeam(
        team.id,
        player.id,
      );

    expect(membership.teamId).toBe(team.id);
    expect(membership.playerId).toBe(
      player.id,
    );
    expect(membership.player.name).toBe(
      "Rahul Sharma",
    );
  });

  it("prevents adding the same player twice", async () => {
    const team = await createTeam({
      name: "Mumbai Warriors",
    });

    const player = await createPlayer({
      name: "Rahul Sharma",
    });

    await addPlayerToTeam(
      team.id,
      player.id,
    );

    await expect(
      addPlayerToTeam(
        team.id,
        player.id,
      ),
    ).rejects.toThrow(
      "Player is already in this team.",
    );
  });

  it("allows a player to belong to multiple teams", async () => {
    const teamA = await createTeam({
      name: "Mumbai Warriors",
    });

    const teamB = await createTeam({
      name: "Delhi Kings",
    });

    const player = await createPlayer({
      name: "Rahul Sharma",
    });

    await addPlayerToTeam(
      teamA.id,
      player.id,
    );

    await addPlayerToTeam(
      teamB.id,
      player.id,
    );

    const teamAPlayers =
      await getTeamPlayers(teamA.id);

    const teamBPlayers =
      await getTeamPlayers(teamB.id);

    expect(teamAPlayers).toHaveLength(1);
    expect(teamBPlayers).toHaveLength(1);
    expect(teamAPlayers[0].id).toBe(
      player.id,
    );
    expect(teamBPlayers[0].id).toBe(
      player.id,
    );
  });

  it("returns the team roster", async () => {
    const team = await createTeam({
      name: "Mumbai Warriors",
    });

    const playerA = await createPlayer({
      name: "Player A",
    });

    const playerB = await createPlayer({
      name: "Player B",
    });

    await addPlayerToTeam(
      team.id,
      playerA.id,
    );

    await addPlayerToTeam(
      team.id,
      playerB.id,
    );

    const result = await getTeam(
      team.id,
    );

    expect(result).not.toBeNull();
    expect(result?.name).toBe(
      "Mumbai Warriors",
    );
    expect(result?.players).toHaveLength(2);
  });

  it("allows a player to be added later", async () => {
    const team = await createTeam({
      name: "Mumbai Warriors",
    });

    const playerA = await createPlayer({
      name: "Player A",
    });

    await addPlayerToTeam(
      team.id,
      playerA.id,
    );

    const before =
      await getTeamPlayers(team.id);

    expect(before).toHaveLength(1);

    const playerB = await createPlayer({
      name: "Player B",
    });

    await addPlayerToTeam(
      team.id,
      playerB.id,
    );

    const after =
      await getTeamPlayers(team.id);

    expect(after).toHaveLength(2);
  });

  it("removes a player from a team", async () => {
    const team = await createTeam({
      name: "Mumbai Warriors",
    });

    const player = await createPlayer({
      name: "Rahul Sharma",
    });

    await addPlayerToTeam(
      team.id,
      player.id,
    );

    await removePlayerFromTeam(
      team.id,
      player.id,
    );

    const players =
      await getTeamPlayers(team.id);

    expect(players).toHaveLength(0);
  });

  it("updates a player", async () => {
    const player = await createPlayer({
      name: "Rahul Sharma",
    });

    const updated =
      await updatePlayer(
        player.id,
        {
          name: "Rahul S.",
          jerseyNumber: 10,
        },
      );

    expect(updated.name).toBe(
      "Rahul S.",
    );
    expect(updated.jerseyNumber).toBe(10);
  });

  it("updates a team", async () => {
    const team = await createTeam({
      name: "Mumbai Warriors",
    });

    const updated =
      await updateTeam(
        team.id,
        {
          name: "Mumbai Super Warriors",
          shortName: "MSW",
        },
      );

    expect(updated.name).toBe(
      "Mumbai Super Warriors",
    );
    expect(updated.shortName).toBe("MSW");
  });

  it("rejects adding a player to a nonexistent team", async () => {
    const player = await createPlayer({
      name: "Rahul Sharma",
    });

    await expect(
      addPlayerToTeam(
        "missing-team",
        player.id,
      ),
    ).rejects.toThrow(
      "Team not found.",
    );
  });

  it("rejects adding a nonexistent player", async () => {
    const team = await createTeam({
      name: "Mumbai Warriors",
    });

    await expect(
      addPlayerToTeam(
        team.id,
        "missing-player",
      ),
    ).rejects.toThrow(
      "Player not found.",
    );
  });

  it("rejects removing a player who is not in the team", async () => {
    const team = await createTeam({
      name: "Mumbai Warriors",
    });

    const player = await createPlayer({
      name: "Rahul Sharma",
    });

    await expect(
      removePlayerFromTeam(
        team.id,
        player.id,
      ),
    ).rejects.toThrow(
      "Player is not a member of this team.",
    );
  });
});