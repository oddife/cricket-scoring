import { prisma } from "./prisma";

/** Persist the manual batsman swap required at the end of a Double Bowler over. */
export async function swapPersistentStrikers(inningsId: string) {
  if (!inningsId) throw new Error("Innings ID is required.");

  const innings = await prisma.innings.findUnique({
    where: { id: inningsId },
    select: {
      id: true,
      status: true,
      currentStrikerId: true,
      currentNonStrikerId: true,
      totalRuns: true,
      wickets: true,
      legalBalls: true,
      currentBowlerAId: true,
      currentBowlerBId: true,
      previousOverBowlerAId: true,
      previousOverBowlerBId: true,
      completedAt: true,
    },
  });

  if (!innings) throw new Error("Innings not found.");
  if (innings.status !== "LIVE") throw new Error("Innings is not live.");
  if (!innings.currentStrikerId || !innings.currentNonStrikerId) {
    throw new Error("Both current batsmen must be selected before swapping.");
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
      currentStrikerId: innings.currentNonStrikerId,
      currentNonStrikerId: innings.currentStrikerId,
      undoState,
    },
    select: {
      currentStrikerId: true,
      currentNonStrikerId: true,
    },
  });

  return {
    strikerId: updated.currentStrikerId,
    nonStrikerId: updated.currentNonStrikerId,
  };
}

export type ManualStateChange = "STRIKER" | "NON_STRIKER" | "BOWLER_A" | "BOWLER_B";

export async function manualChangePersistentState(
  inningsId: string,
  change: ManualStateChange,
  playerId: string,
) {
  if (!inningsId || !playerId) throw new Error("Innings and player are required.");

  const innings = await prisma.innings.findUnique({
    where: { id: inningsId },
    select: {
      id: true,
      status: true,
      matchId: true,
      battingTeamId: true,
      bowlingTeamId: true,
      totalRuns: true,
      wickets: true,
      legalBalls: true,
      currentStrikerId: true,
      currentNonStrikerId: true,
      currentBowlerAId: true,
      currentBowlerBId: true,
      previousOverBowlerAId: true,
      previousOverBowlerBId: true,
      completedAt: true,
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

  if (
    (change === "STRIKER" && playerId === innings.currentNonStrikerId) ||
    (change === "NON_STRIKER" && playerId === innings.currentStrikerId)
  ) {
    throw new Error("The selected player is already the other batsman.");
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

  const data: Record<string, string | null> = { undoState };
  if (change === "STRIKER") data.currentStrikerId = playerId;
  if (change === "NON_STRIKER") data.currentNonStrikerId = playerId;
  if (change === "BOWLER_A") data.currentBowlerAId = playerId;
  if (change === "BOWLER_B") data.currentBowlerBId = playerId;

  return prisma.innings.update({
    where: { id: innings.id },
    data,
    select: {
      currentStrikerId: true,
      currentNonStrikerId: true,
      currentBowlerAId: true,
      currentBowlerBId: true,
    },
  });
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
  try {
    snapshot = JSON.parse(innings.undoState);
  } catch {
    throw new Error("Undo history is invalid.");
  }

  await prisma.$transaction(async (tx) => {
    if (snapshot.action === "DELIVERY" && snapshot.deliveryId) {
      await tx.delivery.delete({ where: { id: snapshot.deliveryId } });
    }

    await tx.innings.update({
      where: { id: innings.id },
      data: {
        totalRuns: snapshot.totalRuns,
        wickets: snapshot.wickets,
        legalBalls: snapshot.legalBalls,
        currentStrikerId: snapshot.currentStrikerId ?? null,
        currentNonStrikerId: snapshot.currentNonStrikerId ?? null,
        currentBowlerAId: snapshot.currentBowlerAId ?? null,
        currentBowlerBId: snapshot.currentBowlerBId ?? null,
        previousOverBowlerAId: snapshot.previousOverBowlerAId ?? null,
        previousOverBowlerBId: snapshot.previousOverBowlerBId ?? null,
        status: snapshot.status ?? "LIVE",
        completedAt: snapshot.completedAt ? new Date(snapshot.completedAt) : null,
        undoState: null,
      },
    });

    if (snapshot.action === "DELIVERY") {
      await tx.match.update({
        where: { id: innings.matchId },
        data: { status: "LIVE" },
      });
    }
  });

  return { ok: true, action: snapshot.action };
}
