import { prisma } from "./prisma";
import { processDelivery } from "../scoring/delivery";
import type {
  DeliveryExtra,
  WicketType,
} from "../scoring/types";

export type RecordPersistentDeliveryInput = {
  inningsId: string;
  bowlerId: string;
  strikerId: string;
  nonStrikerId: string;

  runsBat?: number;
  runsExtra?: number;
  extraType?: DeliveryExtra;

  isWicket?: boolean;
  wicketType?: WicketType;
  dismissedPlayerId?: string;
  replacementPlayerId?: string;
  fielderId?: string;
};

function previousOverBowlers(
  deliveries: Array<{
    overNumber: number;
    bowlerId: string;
  }>,
  currentOver: number,
): string[] {
  const previous = deliveries.filter(
    (delivery) =>
      delivery.overNumber === currentOver - 1,
  );

  return [
    ...new Set(
      previous.map(
        (delivery) => delivery.bowlerId,
      ),
    ),
  ];
}

function getNextBattingState(input: {
  strikerId: string;
  nonStrikerId: string;
  strikerChanged: boolean;
  overCompleted: boolean;
  manualOverSwap: boolean;
  dismissedPlayerId?: string;
  replacementPlayerId?: string;
}) {
  let strikerId = input.strikerId;
  let nonStrikerId = input.nonStrikerId;

  /*
   * Normal strike rotation.
   */
  if (input.strikerChanged) {
    [strikerId, nonStrikerId] = [
      nonStrikerId,
      strikerId,
    ];
  }

  /*
   * End of over changes ends.
   */
  if (
    input.overCompleted &&
    !input.manualOverSwap
  ) {
    [strikerId, nonStrikerId] = [
      nonStrikerId,
      strikerId,
    ];
  }

  /*
   * If there was a wicket, replace the
   * dismissed player wherever that player
   * is in the resulting batting state.
   *
   * This gives us a deterministic first
   * implementation without attempting to
   * infer special crossing rules.
   */
  if (
    input.dismissedPlayerId &&
    input.replacementPlayerId
  ) {
    if (
      strikerId ===
      input.dismissedPlayerId
    ) {
      strikerId =
        input.replacementPlayerId;
    }

    if (
      nonStrikerId ===
      input.dismissedPlayerId
    ) {
      nonStrikerId =
        input.replacementPlayerId;
    }
  }

  return {
    strikerId,
    nonStrikerId,
  };
}

export async function recordPersistentDelivery(
  input: RecordPersistentDeliveryInput,
) {
  if (!input.inningsId) {
    throw new Error(
      "Innings ID is required.",
    );
  }

  const innings =
    await prisma.innings.findUnique({
      where: {
        id: input.inningsId,
      },
      include: {
        match: true,
        deliveries: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            overNumber: true,
            bowlerId: true,
            strikerId: true,
            nonStrikerId: true,
          },
        },
      },
    });

  if (!innings) {
    throw new Error(
      "Innings not found.",
    );
  }

  if (innings.status !== "LIVE") {
    throw new Error(
      "Innings is not live.",
    );
  }

  if (
    innings.legalBalls >=
    innings.match.oversPerInnings * 6
  ) {
    throw new Error(
      "Innings is already complete.",
    );
  }

  const battingPlayers =
    await prisma.matchPlayer.findMany({
      where: {
        matchId: innings.matchId,
        teamId: innings.battingTeamId,
      },
      select: {
        playerId: true,
      },
    });

  const bowlingPlayers =
    await prisma.matchPlayer.findMany({
      where: {
        matchId: innings.matchId,
        teamId: innings.bowlingTeamId,
      },
      select: {
        playerId: true,
      },
    });

  const battingIds = new Set(
    battingPlayers.map(
      (player) => player.playerId,
    ),
  );

  const bowlingIds = new Set(
    bowlingPlayers.map(
      (player) => player.playerId,
    ),
  );

  if (!battingIds.has(input.strikerId)) {
    throw new Error(
      "Striker is not a match player for the batting team.",
    );
  }

  if (
    !battingIds.has(input.nonStrikerId)
  ) {
    throw new Error(
      "Non-striker is not a match player for the batting team.",
    );
  }

  if (
    input.strikerId ===
    input.nonStrikerId
  ) {
    throw new Error(
      "Striker and non-striker must be different players.",
    );
  }

  if (!bowlingIds.has(input.bowlerId)) {
    throw new Error(
      "Bowler is not a match player for the bowling team.",
    );
  }

  /*
   * Wicket validation.
   */
  if (input.isWicket) {
    if (!input.wicketType) {
      throw new Error(
        "A wicket requires a wicket type.",
      );
    }

    if (!input.dismissedPlayerId) {
      throw new Error(
        "A wicket requires a dismissed player.",
      );
    }

    if (!input.replacementPlayerId) {
      throw new Error(
        "A wicket requires a replacement player.",
      );
    }

    if (
      input.dismissedPlayerId !==
        input.strikerId &&
      input.dismissedPlayerId !==
        input.nonStrikerId
    ) {
      throw new Error(
        "Dismissed player must be the striker or non-striker.",
      );
    }

    if (
      !battingIds.has(
        input.dismissedPlayerId,
      )
    ) {
      throw new Error(
        "Dismissed player is not a match player for the batting team.",
      );
    }

    if (
      !battingIds.has(
        input.replacementPlayerId,
      )
    ) {
      throw new Error(
        "Replacement player is not a match player for the batting team.",
      );
    }

    if (
      input.replacementPlayerId ===
      input.dismissedPlayerId
    ) {
      throw new Error(
        "Replacement player cannot be the dismissed player.",
      );
    }

    if (
      input.replacementPlayerId ===
        input.strikerId ||
      input.replacementPlayerId ===
        input.nonStrikerId
    ) {
      throw new Error(
        "Replacement player is already on the field.",
      );
    }

    /*
     * A player already dismissed in this innings
     * cannot return as the replacement.
     */
    const previousDismissal =
      await prisma.wicket.findFirst({
        where: {
          dismissedPlayerId:
            input.replacementPlayerId,
          delivery: {
            inningsId:
              input.inningsId,
          },
        },
      });

    if (previousDismissal) {
      throw new Error(
        "Replacement player has already been dismissed in this innings.",
      );
    }
  } else if (
    input.dismissedPlayerId ||
    input.replacementPlayerId
  ) {
    throw new Error(
      "Dismissed and replacement players require a wicket.",
    );
  }

  const currentOver =
    Math.floor(
      innings.legalBalls / 6,
    ) + 1;

  const currentBall =
    (innings.legalBalls % 6) + 1;

  const overDeliveries =
    innings.deliveries.filter(
      (delivery) =>
        delivery.overNumber ===
        currentOver,
    );

  const finalOver =
    currentOver ===
    innings.match.oversPerInnings;

  const doubleBowler =
    innings.match.bowlingMode === "DOUBLE";

  const previousBowlers =
    previousOverBowlers(
      innings.deliveries,
      currentOver,
    );

  /*
   * First delivery establishes the first
   * bowler of the over.
   *
   * DOUBLE mode uses a fixed pair for two
   * consecutive overs:
   *
   *   Over 1 -> A B A B A B
   *   Over 2 -> A B A B A B
   *   Over 3 -> C D C D C D
   *
   * A pair therefore bowls 12 combined legal
   * balls before it must rotate out.
   */
  if (overDeliveries.length === 0) {
    if (
      doubleBowler &&
      !finalOver &&
      currentOver > 1 &&
      currentOver % 2 === 0
    ) {
      // Second over of the pair: reuse the
      // same pair as the previous over.
      if (
        !previousBowlers.includes(
          input.bowlerId,
        )
      ) {
        throw new Error(
          "Double Bowler mode requires the same bowling pair for the second over.",
        );
      }
    } else if (
      doubleBowler &&
      !finalOver &&
      currentOver > 1 &&
      currentOver % 2 === 1
    ) {
      // New pair after 12 combined legal balls.
      if (
        previousBowlers.includes(
          input.bowlerId,
        )
      ) {
        throw new Error(
          "This bowling pair has completed 12 combined legal balls and cannot bowl the next over.",
        );
      }
    } else if (
      previousBowlers.includes(
        input.bowlerId,
      )
    ) {
      throw new Error(
        "Bowler cannot bowl consecutive overs.",
      );
    }
  } else if (
    innings.match.oddOvers &&
    finalOver
  ) {
    if (
      input.bowlerId !==
      overDeliveries[0].bowlerId
    ) {
      throw new Error(
        "The final odd over requires one bowler.",
      );
    }
  } else {
    const firstBowler =
      overDeliveries[0].bowlerId;

    if (
      overDeliveries.length % 2 === 1
    ) {
      if (
        input.bowlerId ===
        firstBowler
      ) {
        throw new Error(
          "The two bowlers must alternate during an over.",
        );
      }
    } else {
      if (
        input.bowlerId !==
        firstBowler
      ) {
        throw new Error(
          "The two bowlers must alternate during an over.",
        );
      }
    }

    // Normal mode blocks the previous pair.
    // Double mode intentionally allows the same
    // pair to bowl the second over.
    if (
      !doubleBowler &&
      previousBowlers.includes(
        input.bowlerId,
      )
    ) {
      throw new Error(
        "Bowler cannot bowl consecutive overs.",
      );
    }
  }

  const result = processDelivery({
    inningsId: input.inningsId,
    overNumber: currentOver,
    ballNumber: currentBall,
    bowlerId: input.bowlerId,
    strikerId: input.strikerId,
    nonStrikerId:
      input.nonStrikerId,
    runsBat: input.runsBat,
    runsExtra: input.runsExtra,
    extraType: input.extraType,
    isWicket: input.isWicket,
    wicketType: input.wicketType,
    dismissedPlayerId:
      input.dismissedPlayerId,
    isLegal:
      !(
        input.extraType === "WIDE" ||
        input.extraType === "NO_BALL"
      ),
  });

  const overCompleted =
    result.isLegal &&
    currentBall === 6;

  const nextBatting =
    getNextBattingState({
      strikerId:
        input.strikerId,
      nonStrikerId:
        input.nonStrikerId,
      strikerChanged:
        result.strikerChanged,
      overCompleted,
      manualOverSwap:
        doubleBowler && overCompleted,
      dismissedPlayerId:
        input.dismissedPlayerId,
      replacementPlayerId:
        input.replacementPlayerId,
    });

  const newLegalBalls =
    innings.legalBalls +
    (result.isLegal ? 1 : 0);

  const inningsComplete =
    newLegalBalls >=
    innings.match.oversPerInnings * 6;

  const currentOverFirstBowler =
    overDeliveries.length > 0
      ? overDeliveries[0].bowlerId
      : input.bowlerId;

  const currentOverSecondBowler =
    overDeliveries.find(
      (delivery) =>
        delivery.bowlerId !==
        currentOverFirstBowler,
    )?.bowlerId ??
    (
      input.bowlerId !==
      currentOverFirstBowler
        ? input.bowlerId
        : null
    );

  const undoSnapshot = JSON.stringify({
    action: "DELIVERY",
    deliveryId: "__PENDING__",
    totalRuns: innings.totalRuns,
    wickets: innings.wickets,
    legalBalls: innings.legalBalls,
    currentStrikerId: innings.currentStrikerId,
    currentNonStrikerId: innings.currentNonStrikerId,
    currentBowlerAId: innings.currentBowlerAId,
    currentBowlerBId: innings.currentBowlerBId,
    previousOverBowlerAId: innings.previousOverBowlerAId,
    previousOverBowlerBId: innings.previousOverBowlerBId,
    status: innings.status,
    completedAt: innings.completedAt ? innings.completedAt.toISOString() : null,
  });

  const transactionResult =
    await prisma.$transaction(
      async (tx) => {
        const created =
          await tx.delivery.create({
            data: {
              inningsId:
                input.inningsId,
              overNumber:
                currentOver,
              ballNumber:
                currentBall,
              bowlerId:
                input.bowlerId,
              strikerId:
                input.strikerId,
              nonStrikerId:
                input.nonStrikerId,
              runsBat:
                result.runsBat,
              runsExtra:
                result.runsExtra,
              runsTotal:
                result.runsTotal,
              isLegal:
                result.isLegal,
              extraType:
                input.extraType ??
                null,
              isWicket:
                result.wicket.occurred,
            },
          });

        if (result.wicket.occurred) {
          await tx.wicket.create({
            data: {
              deliveryId:
                created.id,
              type:
                result.wicket.type!,
              dismissedPlayerId:
                input.dismissedPlayerId!,
              bowlerId:
                result.wicket
                  .creditedToBowler
                  ? input.bowlerId
                  : null,
              fielderId:
                input.fielderId ??
                null,
            },
          });
        }

        if (overCompleted) {
          const keepDoublePair =
            doubleBowler &&
            !inningsComplete &&
            currentOver % 2 === 1;

          const updated =
            await tx.innings.update({
              where: {
                id: innings.id,
              },
              data: {
                totalRuns: {
                  increment:
                    result.runsTotal,
                },

                wickets: {
                  increment:
                    result.wicket
                      .occurred
                      ? 1
                      : 0,
                },

                legalBalls:
                  newLegalBalls,

                currentStrikerId:
                  nextBatting.strikerId,

                currentNonStrikerId:
                  nextBatting.nonStrikerId,

                currentBowlerAId:
                  keepDoublePair
                    ? currentOverFirstBowler
                    : null,

                currentBowlerBId:
                  keepDoublePair
                    ? currentOverSecondBowler
                    : null,

                previousOverBowlerAId:
                  currentOverFirstBowler,

                previousOverBowlerBId:
                  currentOverSecondBowler,

                status:
                  inningsComplete
                    ? "COMPLETED"
                    : "LIVE",

                completedAt:
                  inningsComplete
                    ? new Date()
                    : null,

                undoState:
                  undoSnapshot.replace("__PENDING__", created.id),
              },
            });

          return {
            created,
            updated,
          };
        }

        const firstDeliveryOfOver = overDeliveries.length === 0;

        const bowlerA =
          firstDeliveryOfOver
            ? currentOverFirstBowler
            : innings.currentBowlerAId ?? currentOverFirstBowler;

        const bowlerB =
          innings.currentBowlerBId ?? currentOverSecondBowler;

        const updated =
          await tx.innings.update({
            where: {
              id: innings.id,
            },
            data: {
              totalRuns: {
                increment:
                  result.runsTotal,
              },

              wickets: {
                increment:
                  result.wicket.occurred
                    ? 1
                    : 0,
              },

              legalBalls:
                newLegalBalls,

              currentStrikerId:
                nextBatting.strikerId,

              currentNonStrikerId:
                nextBatting.nonStrikerId,

              currentBowlerAId:
                bowlerA,

              currentBowlerBId:
                bowlerB,

              status:
                inningsComplete
                  ? "COMPLETED"
                  : "LIVE",

              completedAt:
                inningsComplete
                  ? new Date()
                  : null,

              undoState:
                undoSnapshot.replace("__PENDING__", created.id),
            },
          });

        return {
          created,
          updated,
        };
      },
    );

  if (
    inningsComplete &&
    innings.inningsNumber === innings.match.inningsPerMatch
  ) {
    await prisma.match.update({
      where: { id: innings.matchId },
      data: { status: "COMPLETED" },
    });
  }

  return {
    delivery:
      transactionResult.created,
    result,
    currentOver,
    currentBall,

    // True only when this delivery was the 6th legal
    // delivery of the over. Wides and no-balls cannot
    // trigger this because they are not legal balls.
    overCompleted,
    completedOver: overCompleted
      ? currentOver
      : null,

    // NORMAL mode applies the end-of-over swap
    // automatically. DOUBLE mode leaves the
    // batsmen in place and asks the scorer to use
    // the existing Swap button.
    needsManualStrikeSwap:
      doubleBowler &&
      overCompleted &&
      !inningsComplete,

    nextStrikerId:
      nextBatting.strikerId,
    nextNonStrikerId:
      nextBatting.nonStrikerId,

    // State for the next delivery. The final over has
    // no next over, so keep the current over number there.
    nextOver:
      overCompleted && !inningsComplete
        ? currentOver + 1
        : currentOver,
    nextBall:
      overCompleted
        ? 1
        : currentBall + 1,

    inningsComplete,
  };
}

/**
 * Persist the manual batsman swap required at the
 * end of a Double Bowler over.
 */
export async function swapPersistentStrikers(
  inningsId: string,
) {
  if (!inningsId) {
    throw new Error("Innings ID is required.");
  }

  const innings = await prisma.innings.findUnique({
    where: { id: inningsId },
    select: {
      id: true,
      status: true,
      legalBalls: true,
      currentStrikerId: true,
      currentNonStrikerId: true,
      totalRuns: true,
      wickets: true,
      currentBowlerAId: true,
      currentBowlerBId: true,
      previousOverBowlerAId: true,
      previousOverBowlerBId: true,
      completedAt: true,
      match: {
        select: {
          bowlingMode: true,
        },
      },
    },
  });

  if (!innings) {
    throw new Error("Innings not found.");
  }

  if (innings.status !== "LIVE") {
    throw new Error("Innings is not live.");
  }

  if (
    !innings.currentStrikerId ||
    !innings.currentNonStrikerId
  ) {
    throw new Error(
      "Both current batsmen must be selected before swapping.",
    );
  }

  const undoState = JSON.stringify({
    action: "MANUAL",
    totalRuns: innings.totalRuns,
    wickets: innings.wickets,
    legalBalls: innings.legalBalls,
    currentStrikerId: innings.currentStrikerId,
    currentNonStrikerId: innings.currentNonStrikerId,
    currentBowlerAId: innings.currentBowlerAId,
    currentBowlerBId: innings.currentBowlerBId,
    previousOverBowlerAId: innings.previousOverBowlerAId,
    previousOverBowlerBId: innings.previousOverBowlerBId,
    status: innings.status,
    completedAt: innings.completedAt ? innings.completedAt.toISOString() : null,
  });

  const updated = await prisma.innings.update({
    where: { id: innings.id },
    data: {
      currentStrikerId:
        innings.currentNonStrikerId,
      currentNonStrikerId:
        innings.currentStrikerId,
      undoState,
    },
    select: {
      currentStrikerId: true,
      currentNonStrikerId: true,
    },
  });

  return {
    strikerId: updated.currentStrikerId,
    nonStrikerId:
      updated.currentNonStrikerId,
  };
}

export type ManualStateChange =
  | "STRIKER"
  | "NON_STRIKER"
  | "BOWLER_A"
  | "BOWLER_B";

export async function manualChangePersistentState(
  inningsId: string,
  change: ManualStateChange,
  playerId: string,
) {
  if (!inningsId || !playerId) throw new Error("Innings and player are required.");

  const innings = await prisma.innings.findUnique({
    where: { id: inningsId },
    select: {
      id: true, status: true, matchId: true, battingTeamId: true, bowlingTeamId: true,
      totalRuns: true, wickets: true, legalBalls: true,
      currentStrikerId: true, currentNonStrikerId: true,
      currentBowlerAId: true, currentBowlerBId: true,
      previousOverBowlerAId: true, previousOverBowlerBId: true, completedAt: true,
    },
  });
  if (!innings) throw new Error("Innings not found.");
  if (innings.status !== "LIVE") throw new Error("Innings is not live.");

  const teamId = change === "STRIKER" || change === "NON_STRIKER"
    ? innings.battingTeamId
    : innings.bowlingTeamId;

  const matchPlayer = await prisma.matchPlayer.findFirst({
    where: { matchId: innings.matchId, teamId, playerId },
  });
  if (!matchPlayer) throw new Error("Selected player is not part of this match team.");

  if ((change === "STRIKER" && playerId === innings.currentNonStrikerId) ||
      (change === "NON_STRIKER" && playerId === innings.currentStrikerId)) {
    throw new Error("The selected player is already the other batsman.");
  }

  const undoState = JSON.stringify({
    action: "MANUAL", totalRuns: innings.totalRuns, wickets: innings.wickets, legalBalls: innings.legalBalls,
    currentStrikerId: innings.currentStrikerId, currentNonStrikerId: innings.currentNonStrikerId,
    currentBowlerAId: innings.currentBowlerAId, currentBowlerBId: innings.currentBowlerBId,
    previousOverBowlerAId: innings.previousOverBowlerAId, previousOverBowlerBId: innings.previousOverBowlerBId,
    status: innings.status, completedAt: innings.completedAt ? innings.completedAt.toISOString() : null,
  });

  const data: Record<string, string | null> = { undoState };
  if (change === "STRIKER") data.currentStrikerId = playerId;
  if (change === "NON_STRIKER") data.currentNonStrikerId = playerId;
  if (change === "BOWLER_A") data.currentBowlerAId = playerId;
  if (change === "BOWLER_B") data.currentBowlerBId = playerId;

  const updated = await prisma.innings.update({
    where: { id: innings.id }, data,
    select: { currentStrikerId: true, currentNonStrikerId: true, currentBowlerAId: true, currentBowlerBId: true },
  });

  return updated;
}

export async function undoPersistentAction(inningsId: string) {
  if (!inningsId) throw new Error("Innings ID is required.");

  const innings = await prisma.innings.findUnique({
    where: { id: inningsId },
    select: { id: true, matchId: true, status: true, undoState: true },
  });
  if (!innings) throw new Error("Innings not found.");
  if (!innings.undoState) throw new Error("There is no action to undo.");

  let snapshot: any;
  try { snapshot = JSON.parse(innings.undoState); } catch { throw new Error("Undo history is invalid."); }

  await prisma.$transaction(async (tx) => {
    if (snapshot.action === "DELIVERY" && snapshot.deliveryId) {
      await tx.delivery.delete({ where: { id: snapshot.deliveryId } });
    }

    await tx.innings.update({
      where: { id: innings.id },
      data: {
        totalRuns: snapshot.totalRuns, wickets: snapshot.wickets, legalBalls: snapshot.legalBalls,
        currentStrikerId: snapshot.currentStrikerId ?? null, currentNonStrikerId: snapshot.currentNonStrikerId ?? null,
        currentBowlerAId: snapshot.currentBowlerAId ?? null, currentBowlerBId: snapshot.currentBowlerBId ?? null,
        previousOverBowlerAId: snapshot.previousOverBowlerAId ?? null, previousOverBowlerBId: snapshot.previousOverBowlerBId ?? null,
        status: snapshot.status ?? "LIVE", completedAt: snapshot.completedAt ? new Date(snapshot.completedAt) : null,
        undoState: null,
      },
    });

    if (snapshot.action === "DELIVERY") {
      await tx.match.update({ where: { id: innings.matchId }, data: { status: "LIVE" } });
    }
  });

  return { ok: true, action: snapshot.action };
}
