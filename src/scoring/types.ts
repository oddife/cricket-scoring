export type DeliveryRuns = {
  bat: number;
  extra: number;
  total: number;
};

export type DeliveryExtra =
  | "WIDE"
  | "NO_BALL"
  | "BYE"
  | "LEG_BYE"
  | "PENALTY"
  | null;

export type WicketType =
  | "BOWLED"
  | "CAUGHT"
  | "LBW"
  | "RUN_OUT"
  | "STUMPED"
  | "HIT_WICKET"
  | "RETIRED_OUT"
  | "RETIRED_HURT"
  | "OVER_FENCE"
  | "OTHER";

export type DeliveryInput = {
  inningsId: string;

  overNumber: number;
  ballNumber: number;

  bowlerId: string;
  strikerId: string;
  nonStrikerId: string;

  runsBat?: number;
  runsExtra?: number;

  extraType?: DeliveryExtra;

  isWicket?: boolean;
  wicketType?: WicketType;
  dismissedPlayerId?: string;

  /**
   * true when the delivery counts as one of
   * the six legal deliveries in an over.
   */
  isLegal?: boolean;
};

export type DeliveryResult = {
  runsBat: number;
  runsExtra: number;
  runsTotal: number;

  isLegal: boolean;

  strikerChanged: boolean;
  overCompleted: boolean;

  wicket: {
    occurred: boolean;
    type?: WicketType;
    dismissedPlayerId?: string;
    creditedToBowler: boolean;
  };
};