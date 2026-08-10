import type { DeliveryExtra } from "./types";

/**
 * Returns true when an extra delivery is illegal.
 *
 * Wides and no-balls do NOT count as legal balls.
 */
export function isIllegalDelivery(
  extraType: DeliveryExtra,
): boolean {
  return (
    extraType === "WIDE" ||
    extraType === "NO_BALL"
  );
}

/**
 * Determines whether batsmen change ends because of
 * the result of a delivery.
 *
 * Bat runs:
 *   1, 3, 5... → swap
 *   0, 2, 4, 6 → don't swap
 *
 * Wides:
 *   The batsmen normally change ends only when the
 *   total completed runs from the wide delivery are odd.
 *
 * No-balls:
 *   Bat runs determine normal strike rotation.
 *   The no-ball itself does not count as a legal ball.
 */
export function shouldChangeStrike(
  runsBat: number,
  runsExtra: number,
  extraType: DeliveryExtra,
): boolean {
  if (extraType === "WIDE") {
    return runsExtra % 2 === 1;
  }

  if (extraType === "NO_BALL") {
    return runsBat % 2 === 1;
  }

  // Normal delivery, bye or leg-bye.
  if (
    extraType === "BYE" ||
    extraType === "LEG_BYE"
  ) {
    return runsExtra % 2 === 1;
  }

  return runsBat % 2 === 1;
}

/**
 * Returns the next ball number.
 *
 * Illegal deliveries do not advance the legal ball count.
 */
export function nextBallNumber(
  currentBallNumber: number,
  isLegal: boolean,
): number {
  if (!isLegal) {
    return currentBallNumber;
  }

  return currentBallNumber + 1;
}

/**
 * Determines whether the over has completed.
 *
 * Six legal deliveries complete an over.
 */
export function isOverComplete(
  legalBallNumber: number,
): boolean {
  return legalBallNumber >= 6;
}