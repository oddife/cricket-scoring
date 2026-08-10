import type { DeliveryExtra, WicketType } from "./types";
import {
  isIllegalDelivery,
  shouldChangeStrike,
} from "./rules";

export type InningsState = {
  inningsNumber: number;
  totalOvers: number;

  totalRuns: number;
  wickets: number;

  oversCompleted: number;
  legalBallsInCurrentOver: number;

  strikerId: string;
  nonStrikerId: string;

  /**
   * Bowlers selected for the current over.
   *
   * Normal over:
   * A B A B A B
   */
  currentBowlerAId?: string;
  currentBowlerBId?: string;

  /**
   * Bowlers who bowled the previous completed over.
   *
   * Used to enforce the cricket rule:
   * a bowler cannot bowl consecutive overs.
   */
  previousOverBowlerAId?: string;
  previousOverBowlerBId?: string;

  /**
   * Number of delivery events in the current over.
   *
   * Wides and no-balls are delivery events,
   * so they advance this counter even though
   * they do not count as legal balls.
   */
  deliveryCountInCurrentOver: number;

  /**
   * True when the innings has an odd number of overs.
   *
   * Example:
   * 15 overs -> true
   * 16 overs -> false
   */
  oddOvers: boolean;

  /**
   * Bowler selected for the special final
   * single-bowler over.
   */
  lastOverBowlerId?: string;

  inningsComplete: boolean;
};

export type RecordDeliveryInput = {
  runsBat?: number;
  runsExtra?: number;

  extraType?: DeliveryExtra;

  isWicket?: boolean;
  wicketType?: WicketType;
  dismissedPlayerId?: string;

  /**
   * When true, the caller will handle the end-of-over
   * batsman swap manually. This is used by Double Bowler
   * mode so the scorer can confirm the swap in the UI.
   * Normal mode keeps the automatic swap by default.
   */
  manualOverSwap?: boolean;
};

export type RecordDeliveryResult = {
  bowlerId: string;

  overNumber: number;
  ballNumber: number;

  inningsComplete: boolean;
  overComplete: boolean;

  strikerId: string;
  nonStrikerId: string;

  totalRuns: number;
  wickets: number;
};

/**
 * Create a new innings.
 */
export function createInningsState(params: {
  inningsNumber: number;
  totalOvers: number;

  strikerId: string;
  nonStrikerId: string;
}): InningsState {
  if (params.totalOvers <= 0) {
    throw new Error(
      "An innings must have at least one over.",
    );
  }

  return {
    inningsNumber: params.inningsNumber,
    totalOvers: params.totalOvers,

    totalRuns: 0,
    wickets: 0,

    oversCompleted: 0,
    legalBallsInCurrentOver: 0,

    strikerId: params.strikerId,
    nonStrikerId: params.nonStrikerId,

    deliveryCountInCurrentOver: 0,

    oddOvers: params.totalOvers % 2 === 1,

    inningsComplete: false,
  };
}

/**
 * Determine whether the current over is the final over.
 */
function isFinalOver(state: InningsState): boolean {
  return (
    state.oversCompleted ===
    state.totalOvers - 1
  );
}

/**
 * Select the two bowlers for a normal over.
 *
 * Rules:
 *
 * 1. Must be the start of an over.
 * 2. The final odd over must use one bowler,
 *    so this function cannot be used for it.
 * 3. The two bowlers must be different.
 * 4. Neither bowler may have bowled the previous over.
 */
export function setOverBowlers(
  state: InningsState,
  bowlerAId: string,
  bowlerBId: string,
): void {
  if (state.inningsComplete) {
    throw new Error(
      "Innings is already complete.",
    );
  }

  if (state.legalBallsInCurrentOver !== 0) {
    throw new Error(
      "Bowlers can only be selected at the start of an over.",
    );
  }

  const finalOver = isFinalOver(state);

  /**
   * An odd-over innings has a special final
   * single-bowler over.
   *
   * Therefore the normal two-bowler function
   * cannot be used for the final over.
   */
  if (finalOver && state.oddOvers) {
    throw new Error(
      "The final odd over requires one bowler.",
    );
  }

  /**
   * Normal over requires two different bowlers.
   */
  if (bowlerAId === bowlerBId) {
    throw new Error(
      "A normal over requires two different bowlers.",
    );
  }

  /**
   * A bowler cannot bowl consecutive overs.
   */
  if (
    bowlerAId === state.previousOverBowlerAId ||
    bowlerAId === state.previousOverBowlerBId
  ) {
    throw new Error(
      "Bowler A cannot bowl consecutive overs.",
    );
  }

  if (
    bowlerBId === state.previousOverBowlerAId ||
    bowlerBId === state.previousOverBowlerBId
  ) {
    throw new Error(
      "Bowler B cannot bowl consecutive overs.",
    );
  }

  state.currentBowlerAId = bowlerAId;
  state.currentBowlerBId = bowlerBId;

  /**
   * A normal over is not using the special
   * final-over bowler.
   */
  state.lastOverBowlerId = undefined;
}

/**
 * Select the single bowler for the final odd over.
 *
 * Example:
 *
 * 15-over innings
 *
 * Over 14 -> A / B
 * Over 15 -> C C C C C C
 */
export function setLastOverBowler(
  state: InningsState,
  bowlerId: string,
): void {
  if (state.inningsComplete) {
    throw new Error(
      "Innings is already complete.",
    );
  }

  if (!state.oddOvers) {
    throw new Error(
      "This innings does not have an odd number of overs.",
    );
  }

  if (!isFinalOver(state)) {
    throw new Error(
      "The innings is not at the final over.",
    );
  }

  if (state.legalBallsInCurrentOver !== 0) {
    throw new Error(
      "The final-over bowler can only be selected before the over starts.",
    );
  }

  /**
   * The final-over bowler also cannot have bowled
   * the immediately previous over.
   */
  if (
    bowlerId === state.previousOverBowlerAId ||
    bowlerId === state.previousOverBowlerBId
  ) {
    throw new Error(
      "The final-over bowler cannot bowl consecutive overs.",
    );
  }

  state.lastOverBowlerId = bowlerId;

  /**
   * Clear the normal two-bowler selection.
   */
  state.currentBowlerAId = undefined;
  state.currentBowlerBId = undefined;
}

/**
 * Return the bowler for the next delivery.
 *
 * Normal over:
 *
 * A B A B A B
 *
 * Final odd over:
 *
 * A A A A A A
 */
export function getCurrentBowler(
  state: InningsState,
): string {
  const finalOver =
    state.oddOvers &&
    isFinalOver(state);

  /**
   * Special final single-bowler over.
   */
  if (finalOver) {
    if (!state.lastOverBowlerId) {
      throw new Error(
        "A final-over bowler has not been selected.",
      );
    }

    return state.lastOverBowlerId;
  }

  /**
   * Normal over requires two selected bowlers.
   */
  if (
    !state.currentBowlerAId ||
    !state.currentBowlerBId
  ) {
    throw new Error(
      "Two bowlers must be selected before starting the over.",
    );
  }

  /**
   * Alternate based on deliveries in THIS over.
   *
   * 0 -> A
   * 1 -> B
   * 2 -> A
   * 3 -> B
   */
  return state.deliveryCountInCurrentOver % 2 === 0
    ? state.currentBowlerAId
    : state.currentBowlerBId;
}

/**
 * Record one delivery.
 */
export function recordDelivery(
  state: InningsState,
  input: RecordDeliveryInput,
): RecordDeliveryResult {
  if (state.inningsComplete) {
    throw new Error(
      "Innings is already complete.",
    );
  }

  const runsBat = Math.max(
    0,
    input.runsBat ?? 0,
  );

  const runsExtra = Math.max(
    0,
    input.runsExtra ?? 0,
  );

  const totalRuns =
    runsBat + runsExtra;

  const illegal = isIllegalDelivery(
    input.extraType ?? null,
  );

  /**
   * Determine the bowler BEFORE changing any
   * delivery counters.
   */
  const currentBowler =
    getCurrentBowler(state);

  const overNumber =
    state.oversCompleted + 1;

  const ballNumber =
    state.legalBallsInCurrentOver + 1;

  /**
   * Add runs.
   */
  state.totalRuns += totalRuns;

  /**
   * Add wicket.
   */
  if (input.isWicket) {
    state.wickets += 1;
  }

  /**
   * Strike rotation caused by the delivery.
   */
  const changeStrike =
    shouldChangeStrike(
      runsBat,
      runsExtra,
      input.extraType ?? null,
    );

  if (changeStrike) {
    swapStrike(state);
  }

  /**
   * Every delivery event advances the bowling
   * sequence.
   *
   * Therefore a wide/no-ball still changes:
   *
   * A -> B
   *
   * even though it does not count as a legal ball.
   */
  state.deliveryCountInCurrentOver += 1;

  /**
   * Only legal deliveries count toward the
   * six-ball over.
   */
  if (!illegal) {
    state.legalBallsInCurrentOver += 1;
  }

  let overComplete = false;

  /**
   * Six legal balls complete the over.
   */
  if (state.legalBallsInCurrentOver >= 6) {
    overComplete = true;

    /**
     * Save the bowlers who just completed
     * this over BEFORE clearing them.
     */
    if (state.lastOverBowlerId) {
      state.previousOverBowlerAId =
        state.lastOverBowlerId;

      state.previousOverBowlerBId =
        undefined;
    } else {
      state.previousOverBowlerAId =
        state.currentBowlerAId;

      state.previousOverBowlerBId =
        state.currentBowlerBId;
    }

    /**
     * Advance over.
     */
    state.oversCompleted += 1;

    /**
     * Reset current-over counters.
     */
    state.legalBallsInCurrentOver = 0;
    state.deliveryCountInCurrentOver = 0;

    /**
     * Clear the current normal pair.
     *
     * The next over must explicitly select
     * its bowlers.
     */
    state.currentBowlerAId = undefined;
    state.currentBowlerBId = undefined;

    /**
     * The special final-over bowler is only
     * relevant to that final over.
     */
    if (
      state.oversCompleted <
      state.totalOvers
    ) {
      state.lastOverBowlerId =
        undefined;
    }

    /**
     * Normal mode changes ends automatically.
     *
     * Double Bowler mode can request a manual
     * swap so the scorer can confirm it in the UI.
     */
    if (!input.manualOverSwap) {
      swapStrike(state);
    }
  }

  /**
   * Final over completed -> innings complete.
   */
  if (
    overComplete &&
    state.oversCompleted >=
      state.totalOvers
  ) {
    state.inningsComplete = true;
  }

  return {
    bowlerId: currentBowler,

    overNumber,
    ballNumber,

    inningsComplete:
      state.inningsComplete,

    overComplete,

    strikerId: state.strikerId,
    nonStrikerId:
      state.nonStrikerId,

    totalRuns: state.totalRuns,
    wickets: state.wickets,
  };
}

/**
 * Swap striker and non-striker.
 */
function swapStrike(
  state: InningsState,
): void {
  const temporary =
    state.strikerId;

  state.strikerId =
    state.nonStrikerId;

  state.nonStrikerId =
    temporary;
}

/**
 * Replace a dismissed batsman.
 *
 * The scoring engine does not automatically
 * choose the replacement.
 *
 * The UI/scorer will select the incoming player.
 */
export function replaceDismissedBatsman(
  state: InningsState,
  dismissedPlayerId: string,
  replacementPlayerId: string,
): void {
  if (
    state.strikerId ===
    dismissedPlayerId
  ) {
    state.strikerId =
      replacementPlayerId;

    return;
  }

  if (
    state.nonStrikerId ===
    dismissedPlayerId
  ) {
    state.nonStrikerId =
      replacementPlayerId;

    return;
  }

  throw new Error(
    `Dismissed player ${dismissedPlayerId} is not currently batting.`,
  );
}