import { describe, expect, it } from "vitest";

import { calculateLiveScoringStats } from "./stats";

const player = (id: string) => ({
  id,
  name: id,
  jerseyNumber: null,
});

const delivery = (overNumber: number, ballNumber: number, overrides: Partial<Parameters<typeof calculateLiveScoringStats>[0][number]> = {}) => ({
  id: `${overNumber}-${ballNumber}`,
  overNumber,
  ballNumber,
  bowlerId: "bowler-1",
  strikerId: "bat-1",
  nonStrikerId: "bat-2",
  runsBat: 0,
  runsExtra: 0,
  runsTotal: 0,
  isLegal: true,
  extraType: null,
  isWicket: false,
  createdAt: `2026-09-11T00:00:${String(ballNumber).padStart(2, "0")}Z`,
  wicket: null,
  ...overrides,
});

describe("calculateLiveScoringStats", () => {
  it("aggregates batting, bowling, extras and partnership in one result", () => {
    const stats = calculateLiveScoringStats(
      [
        delivery(1, 1, { runsBat: 4, runsTotal: 4 }),
        delivery(1, 2, { runsExtra: 1, runsTotal: 1, isLegal: false, extraType: "WIDE" }),
        delivery(1, 2, { runsBat: 6, runsTotal: 6 }),
      ],
      [player("bat-1"), player("bat-2")],
      [player("bowler-1")],
    );

    expect(stats.batting[0]).toMatchObject({ runs: 10, balls: 2, fours: 1, sixes: 1 });
    expect(stats.bowling[0]).toMatchObject({ runs: 11, legalBalls: 2 });
    expect(stats.extras).toMatchObject({ wides: 1, total: 1 });
    expect(stats.partnership).toEqual({ runs: 11, balls: 2 });
  });

  it("starts a new partnership after a wicket without counting the wicket ball", () => {
    const stats = calculateLiveScoringStats(
      [
        delivery(1, 1, { runsBat: 3, runsTotal: 3 }),
        delivery(1, 2, {
          runsBat: 2,
          runsTotal: 2,
          isWicket: true,
          wicket: {
            type: "CAUGHT",
            dismissedPlayerId: "bat-1",
            bowlerId: "bowler-1",
          },
        }),
        delivery(1, 3, { runsBat: 4, runsTotal: 4 }),
      ],
      [player("bat-1"), player("bat-2")],
      [player("bowler-1")],
    );

    expect(stats.partnership).toEqual({ runs: 4, balls: 1 });
    expect(stats.fallOfWickets).toHaveLength(1);
    expect(stats.fallOfWickets[0]).toMatchObject({ playerId: "bat-1", runs: 5 });
  });
});
