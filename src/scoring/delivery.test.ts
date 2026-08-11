import { describe, expect, it } from "vitest";

import { processDelivery } from "./delivery";

describe("Delivery scoring combinations", () => {
  const base = {
    inningsId: "INNINGS_1",
    overNumber: 1,
    ballNumber: 1,
    bowlerId: "BOWLER_1",
    strikerId: "BATTER_1",
    nonStrikerId: "BATTER_2",
  };

  it("allows five or more bat runs, including an overthrow", () => {
    const result = processDelivery({
      ...base,
      runsBat: 5,
    });

    expect(result.runsBat).toBe(5);
    expect(result.runsExtra).toBe(0);
    expect(result.runsTotal).toBe(5);
    expect(result.strikerChanged).toBe(true);
  });

  it("allows multiple wides and keeps the delivery illegal", () => {
    const result = processDelivery({
      ...base,
      runsExtra: 5,
      extraType: "WIDE",
      isLegal: false,
    });

    expect(result.runsExtra).toBe(5);
    expect(result.runsTotal).toBe(5);
    expect(result.isLegal).toBe(false);
    expect(result.overCompleted).toBe(false);
  });

  it("allows multiple no-ball runs and keeps the delivery illegal", () => {
    const result = processDelivery({
      ...base,
      runsBat: 4,
      runsExtra: 1,
      extraType: "NO_BALL",
      isLegal: false,
    });

    expect(result.runsBat).toBe(4);
    expect(result.runsExtra).toBe(1);
    expect(result.runsTotal).toBe(5);
    expect(result.isLegal).toBe(false);
  });

  it("allows multiple byes on a legal delivery", () => {
    const result = processDelivery({
      ...base,
      runsExtra: 4,
      extraType: "BYE",
      isLegal: true,
    });

    expect(result.runsTotal).toBe(4);
    expect(result.isLegal).toBe(true);
    expect(result.strikerChanged).toBe(false);
  });

  it("allows multiple leg-byes on a legal delivery", () => {
    const result = processDelivery({
      ...base,
      runsExtra: 3,
      extraType: "LEG_BYE",
      isLegal: true,
    });

    expect(result.runsTotal).toBe(3);
    expect(result.isLegal).toBe(true);
    expect(result.strikerChanged).toBe(false);
  });

  it("allows a wicket on a wide without making the wide legal", () => {
    const result = processDelivery({
      ...base,
      runsExtra: 2,
      extraType: "WIDE",
      isLegal: false,
      isWicket: true,
      wicketType: "RUN_OUT",
      dismissedPlayerId: "BATTER_1",
    });

    expect(result.runsTotal).toBe(2);
    expect(result.isLegal).toBe(false);
    expect(result.wicket.occurred).toBe(true);
    expect(result.wicket.type).toBe("RUN_OUT");
    expect(result.wicket.dismissedPlayerId).toBe("BATTER_1");
  });

  it("allows a wicket on a no-ball without making the no-ball legal", () => {
    const result = processDelivery({
      ...base,
      runsExtra: 1,
      extraType: "NO_BALL",
      isLegal: false,
      isWicket: true,
      wicketType: "RUN_OUT",
      dismissedPlayerId: "BATTER_2",
    });

    expect(result.runsTotal).toBe(1);
    expect(result.isLegal).toBe(false);
    expect(result.wicket.occurred).toBe(true);
    expect(result.wicket.type).toBe("RUN_OUT");
    expect(result.wicket.dismissedPlayerId).toBe("BATTER_2");
  });
});
