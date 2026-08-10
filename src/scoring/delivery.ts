import type {
  DeliveryInput,
  DeliveryResult,
  WicketType,
} from "./types";

/**
 * Determines whether the striker changes ends as a result
 * of the runs scored from the bat.
 *
 * Odd number of bat runs = batsmen swap.
 * Even number = no swap.
 *
 * Note:
 * Extras such as wides have separate cricket rules and
 * are handled independently.
 */
function batRunsChangeStrike(runsBat: number): boolean {
  return runsBat % 2 === 1;
}

/**
 * Determine whether the wicket is credited to the bowler.
 *
 * Standard dismissals such as bowled, caught, LBW and
 * hit wicket are credited to the bowler.
 *
 * Run out, retired out, etc. are not.
 *
 * Your custom OVER_FENCE dismissal is specifically
 * credited to the bowler.
 */
function wicketCreditedToBowler(
  wicketType?: WicketType,
): boolean {
  if (!wicketType) {
    return false;
  }

  switch (wicketType) {
    case "BOWLED":
    case "CAUGHT":
    case "LBW":
    case "STUMPED":
    case "HIT_WICKET":
    case "OVER_FENCE":
      return true;

    case "RUN_OUT":
    case "RETIRED_OUT":
    case "RETIRED_HURT":
    case "OTHER":
      return false;

    default:
      return false;
  }
}

/**
 * Process one delivery.
 *
 * This function does not write to the database.
 * It only calculates what happened on the delivery.
 */
export function processDelivery(
  input: DeliveryInput,
): DeliveryResult {
  const runsBat = Math.max(0, input.runsBat ?? 0);
  const runsExtra = Math.max(0, input.runsExtra ?? 0);

  const runsTotal = runsBat + runsExtra;

  const isLegal = input.isLegal ?? true;

  const wicketOccurred = input.isWicket ?? false;

  const strikerChanged = batRunsChangeStrike(runsBat);

  const wicket = {
    occurred: wicketOccurred,
    type: input.wicketType,
    dismissedPlayerId: input.dismissedPlayerId,
    creditedToBowler: wicketOccurred
      ? wicketCreditedToBowler(input.wicketType)
      : false,
  };

  return {
    runsBat,
    runsExtra,
    runsTotal,

    isLegal,

    strikerChanged,

    /*
     * We only know that an over is complete when this
     * delivery is the sixth legal delivery.
     *
     * The caller supplies ballNumber.
     */
    overCompleted:
      isLegal && input.ballNumber === 6,

    wicket,
  };
}