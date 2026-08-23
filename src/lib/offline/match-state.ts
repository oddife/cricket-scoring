import type { DeliveryExtra, WicketType } from "@/scoring/types";

export type OfflineDelivery = {
  id: string;
  overNumber: number;
  ballNumber: number;
  bowlerId: string;
  strikerId: string;
  nonStrikerId: string;
  runsBat: number;
  runsExtra: number;
  runsTotal: number;
  isLegal: boolean;
  extraType: DeliveryExtra | null;
  isWicket: boolean;
  wicketType?: WicketType | null;
  dismissedPlayerId?: string | null;
};

export type OfflineMatchState = {
  matchId: string;
  inningsId: string;
  battingTeamId: string;
  bowlingTeamId: string;
  oversPerInnings: number;
  totalRuns: number;
  wickets: number;
  legalBalls: number;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  deliveries: OfflineDelivery[];
  undoState: Omit<OfflineMatchState, "undoState"> | null;
};

export type OfflineDeliveryInput = {
  runsBat?: number;
  runsExtra?: number;
  extraType?: DeliveryExtra | null;
  isWicket?: boolean;
  wicketType?: WicketType | null;
  dismissedPlayerId?: string | null;
};

/**
 * Small deterministic client-side reducer used while disconnected.
 * It deliberately contains only the state transitions needed by the scorer;
 * validation of player/team membership remains a server concern when syncing.
 */
export function applyOfflineDelivery(
  state: OfflineMatchState,
  input: OfflineDeliveryInput,
): OfflineMatchState {
  const runsBat = Math.max(0, Math.trunc(input.runsBat ?? 0));
  const runsExtra = Math.max(0, Math.trunc(input.runsExtra ?? 0));
  const isLegal = input.extraType !== "WIDE" && input.extraType !== "NO_BALL";
  const currentOver = Math.floor(state.legalBalls / 6) + 1;
  const currentBall = (state.legalBalls % 6) + 1;
  const nextLegalBalls = state.legalBalls + (isLegal ? 1 : 0);
  const wicket = input.isWicket === true;

  let strikerId = state.strikerId;
  let nonStrikerId = state.nonStrikerId;

  // Odd runs change ends; an over completion changes ends as well.
  if (isLegal && runsBat % 2 === 1) {
    [strikerId, nonStrikerId] = [nonStrikerId, strikerId];
  }

  if (isLegal && nextLegalBalls % 6 === 0) {
    [strikerId, nonStrikerId] = [nonStrikerId, strikerId];
  }

  if (input.dismissedPlayerId) {
    // A replacement is deliberately not inferred here. The scorer will set
    // the replacement/current player explicitly after the wicket panel.
    if (strikerId === input.dismissedPlayerId) strikerId = "";
    if (nonStrikerId === input.dismissedPlayerId) nonStrikerId = "";
  }

  const delivery: OfflineDelivery = {
    id: crypto.randomUUID(),
    overNumber: currentOver,
    ballNumber: currentBall,
    bowlerId: state.bowlerId,
    strikerId: state.strikerId,
    nonStrikerId: state.nonStrikerId,
    runsBat,
    runsExtra,
    runsTotal: runsBat + runsExtra,
    isLegal,
    extraType: input.extraType ?? null,
    isWicket: wicket,
    wicketType: input.wicketType ?? null,
    dismissedPlayerId: input.dismissedPlayerId ?? null,
  };

  const previousState: Omit<OfflineMatchState, "undoState"> = {
    ...state,
    deliveries: [...state.deliveries],
  };

  return {
    ...state,
    totalRuns: state.totalRuns + runsBat + runsExtra,
    wickets: state.wickets + (wicket ? 1 : 0),
    legalBalls: nextLegalBalls,
    strikerId,
    nonStrikerId,
    deliveries: [...state.deliveries, delivery],
    undoState: previousState,
  };
}

export function undoOfflineDelivery(state: OfflineMatchState): OfflineMatchState {
  if (!state.undoState) return state;
  return {
    ...state.undoState,
    undoState: null,
  };
}
