import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "./prisma";
import { createMatch } from "./matches";
import {
  addPlayerToTeam,
  createPlayer,
  createTeam,
} from "./teams";
import {
  setupMatchPlayers,
  startInnings,
} from "./match-setup";
import { recordPersistentDelivery } from "./scoring";

async function createFixture(
  oversPerInnings = 2,
  oddOvers = false,
) {
  const teamA = await createTeam({
    name: "Team A",
  });

  const teamB = await createTeam({
    name: "Team B",
  });

  const playersA = [];
  const playersB = [];

  for (let i = 1; i <= 3; i++) {
    const a = await createPlayer({
      name: `A${i}`,
    });

    const b = await createPlayer({
      name: `B${i}`,
    });

    await addPlayerToTeam(
      teamA.id,
      a.id,
    );

    await addPlayerToTeam(
      teamB.id,
      b.id,
    );

    playersA.push(a);
    playersB.push(b);
  }

  const match = await createMatch({
    teamAId: teamA.id,
    teamBId: teamB.id,
    oversPerInnings,
    playersPerTeam: 3,
    oddOvers,
  });

  await setupMatchPlayers({
    matchId: match.id,
    teamId: teamA.id,
    players: playersA.map((p, i) => ({
      playerId: p.id,
      role:
        i === 0
          ? "CAPTAIN"
          : i === 1
            ? "VICE_CAPTAIN"
            : "PLAYER",
      isWicketKeeper: i === 2,
    })),
  });

  await setupMatchPlayers({
    matchId: match.id,
    teamId: teamB.id,
    players: playersB.map((p, i) => ({
      playerId: p.id,
      role:
        i === 0
          ? "CAPTAIN"
          : i === 1
            ? "VICE_CAPTAIN"
            : "PLAYER",
      isWicketKeeper: i === 2,
    })),
  });

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

  return {
    teamA,
    teamB,
    playersA,
    playersB,
    match,
    innings,
  };
}

async function getCurrentBatsmen(inningsId: string) {
  const innings = await prisma.innings.findUniqueOrThrow({
    where: {
      id: inningsId,
    },
  });

  if (
    !innings.currentStrikerId ||
    !innings.currentNonStrikerId
  ) {
    throw new Error(
      "Current batsmen are not set on the innings.",
    );
  }

  return {
    strikerId: innings.currentStrikerId,
    nonStrikerId: innings.currentNonStrikerId,
  };
}

describe("Persistent delivery scoring", () => {
  beforeEach(async () => {
    await prisma.delivery.deleteMany();
    await prisma.wicket.deleteMany();
    await prisma.innings.deleteMany();
    await prisma.matchPlayer.deleteMany();
    await prisma.match.deleteMany();
    await prisma.teamPlayer.deleteMany();
    await prisma.player.deleteMany();
    await prisma.team.deleteMany();
    await prisma.tournament.deleteMany();
    await prisma.user.deleteMany();
  });

  it("persists the initial live scoring state", async () => {
    const {
      innings,
      playersA,
      playersB,
    } = await createFixture();

    expect(innings.status).toBe("LIVE");
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

  it("persists a normal delivery and updates innings totals", async () => {
    const {
      innings,
      playersA,
      playersB,
    } = await createFixture();

    const result =
      await recordPersistentDelivery({
        inningsId: innings.id,
        bowlerId: playersB[0].id,
        strikerId: playersA[0].id,
        nonStrikerId: playersA[1].id,
        runsBat: 4,
      });

    expect(result.delivery.runsTotal).toBe(4);
    expect(result.delivery.ballNumber).toBe(1);

    const updated =
      await prisma.innings.findUniqueOrThrow({
        where: {
          id: innings.id,
        },
      });

    expect(updated.totalRuns).toBe(4);
    expect(updated.legalBalls).toBe(1);
  });

  it("changes strike after an odd number of bat runs", async () => {
    const {
      innings,
      playersA,
      playersB,
    } = await createFixture();

    await recordPersistentDelivery({
      inningsId: innings.id,
      bowlerId: playersB[0].id,
      strikerId: playersA[0].id,
      nonStrikerId: playersA[1].id,
      runsBat: 1,
    });

    const updated =
      await prisma.innings.findUniqueOrThrow({
        where: {
          id: innings.id,
        },
      });

    expect(updated.currentStrikerId).toBe(
      playersA[1].id,
    );

    expect(updated.currentNonStrikerId).toBe(
      playersA[0].id,
    );
  });

  it("keeps strike after an even number of bat runs", async () => {
    const {
      innings,
      playersA,
      playersB,
    } = await createFixture();

    await recordPersistentDelivery({
      inningsId: innings.id,
      bowlerId: playersB[0].id,
      strikerId: playersA[0].id,
      nonStrikerId: playersA[1].id,
      runsBat: 2,
    });

    const updated =
      await prisma.innings.findUniqueOrThrow({
        where: {
          id: innings.id,
        },
      });

    expect(updated.currentStrikerId).toBe(
      playersA[0].id,
    );

    expect(updated.currentNonStrikerId).toBe(
      playersA[1].id,
    );
  });

  it("does not advance the legal ball for a wide", async () => {
    const {
      innings,
      playersA,
      playersB,
    } = await createFixture();

    await recordPersistentDelivery({
      inningsId: innings.id,
      bowlerId: playersB[0].id,
      strikerId: playersA[0].id,
      nonStrikerId: playersA[1].id,
      runsExtra: 1,
      extraType: "WIDE",
    });

    const updated =
      await prisma.innings.findUniqueOrThrow({
        where: {
          id: innings.id,
        },
      });

    expect(updated.legalBalls).toBe(0);

    const delivery =
      await prisma.delivery.findFirstOrThrow({
        where: {
          inningsId: innings.id,
        },
      });

    expect(delivery.ballNumber).toBe(1);
    expect(delivery.isLegal).toBe(false);
  });

  it("alternates bowlers across delivery events", async () => {
    const {
      innings,
      playersA,
      playersB,
    } = await createFixture();

    await recordPersistentDelivery({
      inningsId: innings.id,
      bowlerId: playersB[0].id,
      strikerId: playersA[0].id,
      nonStrikerId: playersA[1].id,
    });

    const batsmen =
      await getCurrentBatsmen(innings.id);

    await recordPersistentDelivery({
      inningsId: innings.id,
      bowlerId: playersB[1].id,
      strikerId: batsmen.strikerId,
      nonStrikerId: batsmen.nonStrikerId,
    });

    const deliveries =
      await prisma.delivery.findMany({
        where: {
          inningsId: innings.id,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    expect(
      deliveries.map(
        (delivery) => delivery.bowlerId,
      ),
    ).toEqual([
      playersB[0].id,
      playersB[1].id,
    ]);
  });

  it("persists both current over bowlers", async () => {
    const {
      innings,
      playersA,
      playersB,
    } = await createFixture();

    await recordPersistentDelivery({
      inningsId: innings.id,
      bowlerId: playersB[0].id,
      strikerId: playersA[0].id,
      nonStrikerId: playersA[1].id,
    });

    const updated =
      await prisma.innings.findUniqueOrThrow({
        where: {
          id: innings.id,
        },
      });

    expect(updated.currentBowlerAId).toBe(
      playersB[0].id,
    );

    expect(updated.currentBowlerBId).toBe(
      playersB[1].id,
    );
  });

  it("moves current bowlers to previous-over state after six legal balls", async () => {
    const {
      innings,
      playersB,
    } = await createFixture();

    for (let i = 0; i < 6; i++) {
      const batsmen =
        await getCurrentBatsmen(innings.id);

      await recordPersistentDelivery({
        inningsId: innings.id,
        bowlerId: playersB[i % 2].id,
        strikerId: batsmen.strikerId,
        nonStrikerId: batsmen.nonStrikerId,
      });
    }

    const updated =
      await prisma.innings.findUniqueOrThrow({
        where: {
          id: innings.id,
        },
      });

    expect(updated.previousOverBowlerAId).toBe(
      playersB[0].id,
    );

    expect(updated.previousOverBowlerBId).toBe(
      playersB[1].id,
    );
  });

  it("changes batting ends at the end of an over", async () => {
    const {
      innings,
      playersA,
      playersB,
    } = await createFixture();

    for (let i = 0; i < 6; i++) {
      const batsmen =
        await getCurrentBatsmen(innings.id);

      await recordPersistentDelivery({
        inningsId: innings.id,
        bowlerId: playersB[i % 2].id,
        strikerId: batsmen.strikerId,
        nonStrikerId: batsmen.nonStrikerId,
      });
    }

    const updated =
      await prisma.innings.findUniqueOrThrow({
        where: {
          id: innings.id,
        },
      });

    expect(updated.currentStrikerId).toBe(
      playersA[1].id,
    );

    expect(updated.currentNonStrikerId).toBe(
      playersA[0].id,
    );
  });

  it("allows a different bowler to start the next over", async () => {
    const {
      innings,
      playersA,
      playersB,
    } = await createFixture(2);

    for (let i = 0; i < 6; i++) {
      const batsmen =
        await getCurrentBatsmen(innings.id);

      await recordPersistentDelivery({
        inningsId: innings.id,
        bowlerId: playersB[i % 2].id,
        strikerId: batsmen.strikerId,
        nonStrikerId: batsmen.nonStrikerId,
      });
    }

    const batsmen =
      await getCurrentBatsmen(innings.id);

    await recordPersistentDelivery({
      inningsId: innings.id,
      bowlerId: playersB[2].id,
      strikerId: batsmen.strikerId,
      nonStrikerId: batsmen.nonStrikerId,
    });

    const deliveries =
      await prisma.delivery.findMany({
        where: {
          inningsId: innings.id,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    expect(deliveries[6].overNumber).toBe(2);
    expect(deliveries[6].bowlerId).toBe(
      playersB[2].id,
    );
  });

  it("credits a bowler wicket and persists the wicket", async () => {
    const {
      innings,
      playersA,
      playersB,
    } = await createFixture();

    const result =
      await recordPersistentDelivery({
        inningsId: innings.id,
        bowlerId: playersB[0].id,
        strikerId: playersA[0].id,
        nonStrikerId: playersA[1].id,
        isWicket: true,
        wicketType: "BOWLED",
        dismissedPlayerId: playersA[0].id,
        replacementPlayerId: playersA[2].id,
      });

    const wicket =
      await prisma.wicket.findUniqueOrThrow({
        where: {
          deliveryId: result.delivery.id,
        },
      });

    expect(wicket.type).toBe("BOWLED");

    expect(wicket.bowlerId).toBe(
      playersB[0].id,
    );
  });

  it("does not credit a run out to the bowler", async () => {
    const {
      innings,
      playersA,
      playersB,
    } = await createFixture();

    const result =
      await recordPersistentDelivery({
        inningsId: innings.id,
        bowlerId: playersB[0].id,
        strikerId: playersA[0].id,
        nonStrikerId: playersA[1].id,
        isWicket: true,
        wicketType: "RUN_OUT",
        dismissedPlayerId: playersA[0].id,
        replacementPlayerId: playersA[2].id,
      });

    const wicket =
      await prisma.wicket.findUniqueOrThrow({
        where: {
          deliveryId: result.delivery.id,
        },
      });

    expect(wicket.bowlerId).toBeNull();
  });

  it("replaces the dismissed striker with the replacement player", async () => {
    const {
      innings,
      playersA,
      playersB,
    } = await createFixture();

    await recordPersistentDelivery({
      inningsId: innings.id,
      bowlerId: playersB[0].id,
      strikerId: playersA[0].id,
      nonStrikerId: playersA[1].id,
      isWicket: true,
      wicketType: "BOWLED",
      dismissedPlayerId: playersA[0].id,
      replacementPlayerId: playersA[2].id,
    });

    const updated =
      await prisma.innings.findUniqueOrThrow({
        where: {
          id: innings.id,
        },
      });

    expect(updated.currentStrikerId).toBe(
      playersA[2].id,
    );

    expect(updated.currentNonStrikerId).toBe(
      playersA[1].id,
    );
  });

  it("rejects a replacement player who is already on the field", async () => {
    const {
      innings,
      playersA,
      playersB,
    } = await createFixture();

    await expect(
      recordPersistentDelivery({
        inningsId: innings.id,
        bowlerId: playersB[0].id,
        strikerId: playersA[0].id,
        nonStrikerId: playersA[1].id,
        isWicket: true,
        wicketType: "BOWLED",
        dismissedPlayerId: playersA[0].id,
        replacementPlayerId: playersA[1].id,
      }),
    ).rejects.toThrow(
      "Replacement player is already on the field.",
    );
  });

  it("rejects the dismissed player as their own replacement", async () => {
    const {
      innings,
      playersA,
      playersB,
    } = await createFixture();

    await expect(
      recordPersistentDelivery({
        inningsId: innings.id,
        bowlerId: playersB[0].id,
        strikerId: playersA[0].id,
        nonStrikerId: playersA[1].id,
        isWicket: true,
        wicketType: "BOWLED",
        dismissedPlayerId: playersA[0].id,
        replacementPlayerId: playersA[0].id,
      }),
    ).rejects.toThrow(
      "Replacement player cannot be the dismissed player.",
    );
  });

  it("rejects a wicket without a replacement player", async () => {
    const {
      innings,
      playersA,
      playersB,
    } = await createFixture();

    await expect(
      recordPersistentDelivery({
        inningsId: innings.id,
        bowlerId: playersB[0].id,
        strikerId: playersA[0].id,
        nonStrikerId: playersA[1].id,
        isWicket: true,
        wicketType: "BOWLED",
        dismissedPlayerId: playersA[0].id,
      }),
    ).rejects.toThrow(
      "A wicket requires a replacement player.",
    );
  });

  it("rejects a replacement player who was already dismissed", async () => {
    const {
      innings,
      playersA,
      playersB,
    } = await createFixture();

    await recordPersistentDelivery({
      inningsId: innings.id,
      bowlerId: playersB[0].id,
      strikerId: playersA[0].id,
      nonStrikerId: playersA[1].id,
      isWicket: true,
      wicketType: "BOWLED",
      dismissedPlayerId: playersA[0].id,
      replacementPlayerId: playersA[2].id,
    });

    const batsmen =
      await getCurrentBatsmen(innings.id);

    await expect(
      recordPersistentDelivery({
        inningsId: innings.id,
        bowlerId: playersB[1].id,
        strikerId: batsmen.strikerId,
        nonStrikerId: batsmen.nonStrikerId,
        isWicket: true,
        wicketType: "BOWLED",
        dismissedPlayerId: playersA[2].id,
        replacementPlayerId: playersA[0].id,
      }),
    ).rejects.toThrow(
      "Replacement player has already been dismissed in this innings.",
    );
  });

  it("completes an innings after the configured legal balls", async () => {
    const {
      innings,
      playersB,
    } = await createFixture(1);

    for (let i = 0; i < 6; i++) {
      const batsmen =
        await getCurrentBatsmen(innings.id);

      await recordPersistentDelivery({
        inningsId: innings.id,
        bowlerId: playersB[i % 2].id,
        strikerId: batsmen.strikerId,
        nonStrikerId: batsmen.nonStrikerId,
      });
    }

    const updated =
      await prisma.innings.findUniqueOrThrow({
        where: {
          id: innings.id,
        },
      });

    expect(updated.status).toBe(
      "COMPLETED",
    );

    expect(updated.legalBalls).toBe(6);
  });
});