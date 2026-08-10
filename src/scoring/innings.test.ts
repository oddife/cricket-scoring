import { describe, expect, it } from "vitest";

import {
  createInningsState,
  getCurrentBowler,
  recordDelivery,
  replaceDismissedBatsman,
  setLastOverBowler,
  setOverBowlers,
} from "./innings";

function createNormalInnings(totalOvers = 10) {
  const state = createInningsState({
    inningsNumber: 1,
    totalOvers,
    strikerId: "BAT_A",
    nonStrikerId: "BAT_B",
  });

  setOverBowlers(
    state,
    "BOWLER_A",
    "BOWLER_B",
  );

  return state;
}

describe("Bowling rotation", () => {
  it("alternates two bowlers every delivery", () => {
    const state = createNormalInnings();

    const bowlers: string[] = [];

    for (let i = 0; i < 6; i++) {
      const result = recordDelivery(state, {
        runsBat: 0,
      });

      bowlers.push(result.bowlerId);
    }

    expect(bowlers).toEqual([
      "BOWLER_A",
      "BOWLER_B",
      "BOWLER_A",
      "BOWLER_B",
      "BOWLER_A",
      "BOWLER_B",
    ]);
  });

  it("starts with Bowler A", () => {
    const state = createNormalInnings();

    expect(getCurrentBowler(state)).toBe(
      "BOWLER_A",
    );
  });

  it("uses a new pair of bowlers for the next over", () => {
    const state = createNormalInnings();

    for (let i = 0; i < 6; i++) {
      recordDelivery(state, {
        runsBat: 0,
      });
    }

    setOverBowlers(
      state,
      "BOWLER_C",
      "BOWLER_D",
    );

    const bowlers: string[] = [];

    for (let i = 0; i < 6; i++) {
      const result = recordDelivery(state, {
        runsBat: 0,
      });

      bowlers.push(result.bowlerId);
    }

    expect(bowlers).toEqual([
      "BOWLER_C",
      "BOWLER_D",
      "BOWLER_C",
      "BOWLER_D",
      "BOWLER_C",
      "BOWLER_D",
    ]);
  });

  it("allows a bowler to return after missing the previous over", () => {
    const state = createNormalInnings();

    for (let i = 0; i < 6; i++) {
      recordDelivery(state, {
        runsBat: 0,
      });
    }

    setOverBowlers(
      state,
      "BOWLER_C",
      "BOWLER_D",
    );

    for (let i = 0; i < 6; i++) {
      recordDelivery(state, {
        runsBat: 0,
      });
    }

    expect(() => {
      setOverBowlers(
        state,
        "BOWLER_A",
        "BOWLER_E",
      );
    }).not.toThrow();
  });
});

describe("Bowler restrictions", () => {
  it("rejects the same bowler twice in a normal over", () => {
    const state = createNormalInnings();

    expect(() => {
      setOverBowlers(
        state,
        "BOWLER_A",
        "BOWLER_A",
      );
    }).toThrow(
      "A normal over requires two different bowlers.",
    );
  });

  it("prevents Bowler A from bowling consecutive overs", () => {
    const state = createNormalInnings();

    for (let i = 0; i < 6; i++) {
      recordDelivery(state, {
        runsBat: 0,
      });
    }

    expect(() => {
      setOverBowlers(
        state,
        "BOWLER_A",
        "BOWLER_C",
      );
    }).toThrow(
      "Bowler A cannot bowl consecutive overs.",
    );
  });

  it("prevents Bowler B from bowling consecutive overs", () => {
    const state = createNormalInnings();

    for (let i = 0; i < 6; i++) {
      recordDelivery(state, {
        runsBat: 0,
      });
    }

    expect(() => {
      setOverBowlers(
        state,
        "BOWLER_C",
        "BOWLER_B",
      );
    }).toThrow(
      "Bowler B cannot bowl consecutive overs.",
    );
  });

  it("does not allow selecting bowlers after an over has started", () => {
    const state = createNormalInnings();

    recordDelivery(state, {
      runsBat: 0,
    });

    expect(() => {
      setOverBowlers(
        state,
        "BOWLER_C",
        "BOWLER_D",
      );
    }).toThrow(
      "Bowlers can only be selected at the start of an over.",
    );
  });
});

describe("Strike rotation", () => {
  it("changes strike after a single", () => {
    const state = createNormalInnings();

    const result = recordDelivery(state, {
      runsBat: 1,
    });

    expect(result.strikerId).toBe("BAT_B");
    expect(result.nonStrikerId).toBe("BAT_A");
  });

  it("keeps the same striker after two runs", () => {
    const state = createNormalInnings();

    const result = recordDelivery(state, {
      runsBat: 2,
    });

    expect(result.strikerId).toBe("BAT_A");
    expect(result.nonStrikerId).toBe("BAT_B");
  });

  it("keeps the same striker after four runs", () => {
    const state = createNormalInnings();

    const result = recordDelivery(state, {
      runsBat: 4,
    });

    expect(result.strikerId).toBe("BAT_A");
    expect(result.nonStrikerId).toBe("BAT_B");
  });

  it("keeps the same striker after six runs", () => {
    const state = createNormalInnings();

    const result = recordDelivery(state, {
      runsBat: 6,
    });

    expect(result.strikerId).toBe("BAT_A");
    expect(result.nonStrikerId).toBe("BAT_B");
  });
});

describe("Over completion", () => {
  it("completes an over after six legal deliveries", () => {
    const state = createNormalInnings();

    let lastResult;

    for (let i = 0; i < 6; i++) {
      lastResult = recordDelivery(state, {
        runsBat: 0,
      });
    }

    expect(lastResult?.overComplete).toBe(true);
    expect(state.oversCompleted).toBe(1);
    expect(state.legalBallsInCurrentOver).toBe(0);
    expect(
      state.deliveryCountInCurrentOver,
    ).toBe(0);
  });

  it("swaps batsmen at the end of an over", () => {
    const state = createNormalInnings();

    for (let i = 0; i < 6; i++) {
      recordDelivery(state, {
        runsBat: 0,
      });
    }

    expect(state.strikerId).toBe("BAT_B");
    expect(state.nonStrikerId).toBe("BAT_A");
  });

  it("does not automatically swap batsmen when manual over swap is requested", () => {
    const state = createNormalInnings();

    for (let i = 0; i < 6; i++) {
      const result = recordDelivery(state, {
        runsBat: 0,
        manualOverSwap: true,
      });

      if (i === 5) {
        expect(result.overComplete).toBe(true);
      }
    }

    expect(state.strikerId).toBe("BAT_A");
    expect(state.nonStrikerId).toBe("BAT_B");
  });
});

describe("Wides and no-balls", () => {
  it("does not count a wide as a legal ball", () => {
    const state = createNormalInnings();

    const result = recordDelivery(state, {
      runsExtra: 1,
      extraType: "WIDE",
    });

    expect(result.bowlerId).toBe("BOWLER_A");
    expect(state.legalBallsInCurrentOver).toBe(0);
    expect(state.totalRuns).toBe(1);
  });

  it("alternates to the second bowler after a wide", () => {
    const state = createNormalInnings();

    const first = recordDelivery(state, {
      runsExtra: 1,
      extraType: "WIDE",
    });

    const second = recordDelivery(state, {
      runsBat: 0,
    });

    expect(first.bowlerId).toBe("BOWLER_A");
    expect(second.bowlerId).toBe("BOWLER_B");
    expect(
      state.legalBallsInCurrentOver,
    ).toBe(1);
  });

  it("does not count a no-ball as a legal ball", () => {
    const state = createNormalInnings();

    const result = recordDelivery(state, {
      runsExtra: 1,
      extraType: "NO_BALL",
    });

    expect(result.bowlerId).toBe("BOWLER_A");
    expect(state.legalBallsInCurrentOver).toBe(0);
    expect(state.totalRuns).toBe(1);
  });

  it("alternates to the second bowler after a no-ball", () => {
    const state = createNormalInnings();

    const first = recordDelivery(state, {
      runsExtra: 1,
      extraType: "NO_BALL",
    });

    const second = recordDelivery(state, {
      runsBat: 0,
    });

    expect(first.bowlerId).toBe("BOWLER_A");
    expect(second.bowlerId).toBe("BOWLER_B");
    expect(
      state.legalBallsInCurrentOver,
    ).toBe(1);
  });
});

describe("Wickets", () => {
  it("credits a bowled wicket to the current bowler", () => {
    const state = createNormalInnings();

    const result = recordDelivery(state, {
      runsBat: 0,
      isWicket: true,
      wicketType: "BOWLED",
      dismissedPlayerId: "BAT_A",
    });

    expect(result.bowlerId).toBe("BOWLER_A");
    expect(result.wickets).toBe(1);
  });

  it("does not change the wicket count twice", () => {
    const state = createNormalInnings();

    recordDelivery(state, {
      runsBat: 0,
      isWicket: true,
      wicketType: "BOWLED",
      dismissedPlayerId: "BAT_A",
    });

    expect(state.wickets).toBe(1);
  });

  it("credits an Over Fence wicket to the bowler", () => {
    const state = createNormalInnings();

    const result = recordDelivery(state, {
      runsBat: 0,
      isWicket: true,
      wicketType: "OVER_FENCE",
      dismissedPlayerId: "BAT_A",
    });

    expect(result.bowlerId).toBe("BOWLER_A");
    expect(result.wickets).toBe(1);
  });

  it("records a run out as a wicket", () => {
    const state = createNormalInnings();

    const result = recordDelivery(state, {
      runsBat: 0,
      isWicket: true,
      wicketType: "RUN_OUT",
      dismissedPlayerId: "BAT_A",
    });

    expect(result.wickets).toBe(1);
    expect(result.bowlerId).toBe("BOWLER_A");
  });
});

describe("Batsman replacement", () => {
  it("replaces the striker after dismissal", () => {
    const state = createNormalInnings();

    recordDelivery(state, {
      runsBat: 0,
      isWicket: true,
      wicketType: "BOWLED",
      dismissedPlayerId: "BAT_A",
    });

    replaceDismissedBatsman(
      state,
      "BAT_A",
      "BAT_C",
    );

    expect(state.strikerId).toBe("BAT_C");
    expect(state.nonStrikerId).toBe("BAT_B");
  });

  it("replaces the non-striker after dismissal", () => {
    const state = createNormalInnings();

    replaceDismissedBatsman(
      state,
      "BAT_B",
      "BAT_C",
    );

    expect(state.strikerId).toBe("BAT_A");
    expect(state.nonStrikerId).toBe("BAT_C");
  });

  it("rejects replacing a player who is not batting", () => {
    const state = createNormalInnings();

    expect(() => {
      replaceDismissedBatsman(
        state,
        "BAT_C",
        "BAT_D",
      );
    }).toThrow(
      "Dismissed player BAT_C is not currently batting.",
    );
  });
});

describe("Odd-over final single-bowler rule", () => {
  it("recognizes an odd number of overs", () => {
    const state = createInningsState({
      inningsNumber: 1,
      totalOvers: 15,
      strikerId: "BAT_A",
      nonStrikerId: "BAT_B",
    });

    expect(state.oddOvers).toBe(true);
  });

  it("does not enable odd-over mode for an even number of overs", () => {
    const state = createInningsState({
      inningsNumber: 1,
      totalOvers: 16,
      strikerId: "BAT_A",
      nonStrikerId: "BAT_B",
    });

    expect(state.oddOvers).toBe(false);
  });

  it("uses one bowler for every ball of the final odd over", () => {
    const state = createInningsState({
      inningsNumber: 1,
      totalOvers: 3,
      strikerId: "BAT_A",
      nonStrikerId: "BAT_B",
    });

    setOverBowlers(
      state,
      "BOWLER_A",
      "BOWLER_B",
    );

    for (let i = 0; i < 6; i++) {
      recordDelivery(state, {
        runsBat: 0,
      });
    }

    setOverBowlers(
      state,
      "BOWLER_C",
      "BOWLER_D",
    );

    for (let i = 0; i < 6; i++) {
      recordDelivery(state, {
        runsBat: 0,
      });
    }

    setLastOverBowler(
      state,
      "BOWLER_A",
    );

    const bowlers: string[] = [];

    for (let i = 0; i < 6; i++) {
      const result = recordDelivery(state, {
        runsBat: 0,
      });

      bowlers.push(result.bowlerId);
    }

    expect(bowlers).toEqual([
      "BOWLER_A",
      "BOWLER_A",
      "BOWLER_A",
      "BOWLER_A",
      "BOWLER_A",
      "BOWLER_A",
    ]);

    expect(state.inningsComplete).toBe(true);
  });

  it("allows a final-over bowler who missed the previous over", () => {
    const state = createInningsState({
      inningsNumber: 1,
      totalOvers: 3,
      strikerId: "BAT_A",
      nonStrikerId: "BAT_B",
    });

    setOverBowlers(
      state,
      "BOWLER_A",
      "BOWLER_B",
    );

    for (let i = 0; i < 6; i++) {
      recordDelivery(state, {
        runsBat: 0,
      });
    }

    setOverBowlers(
      state,
      "BOWLER_C",
      "BOWLER_D",
    );

    for (let i = 0; i < 6; i++) {
      recordDelivery(state, {
        runsBat: 0,
      });
    }

    expect(() => {
      setLastOverBowler(
        state,
        "BOWLER_A",
      );
    }).not.toThrow();
  });

  it("rejects selecting the final single-bowler over too early", () => {
    const state = createInningsState({
      inningsNumber: 1,
      totalOvers: 3,
      strikerId: "BAT_A",
      nonStrikerId: "BAT_B",
    });

    expect(() => {
      setLastOverBowler(
        state,
        "BOWLER_A",
      );
    }).toThrow(
      "The innings is not at the final over.",
    );
  });

  it("rejects two bowlers for the final odd over", () => {
    const state = createInningsState({
      inningsNumber: 1,
      totalOvers: 3,
      strikerId: "BAT_A",
      nonStrikerId: "BAT_B",
    });

    setOverBowlers(
      state,
      "BOWLER_A",
      "BOWLER_B",
    );

    for (let i = 0; i < 6; i++) {
      recordDelivery(state, {
        runsBat: 0,
      });
    }

    setOverBowlers(
      state,
      "BOWLER_C",
      "BOWLER_D",
    );

    for (let i = 0; i < 6; i++) {
      recordDelivery(state, {
        runsBat: 0,
      });
    }

    expect(() => {
      setOverBowlers(
        state,
        "BOWLER_A",
        "BOWLER_C",
      );
    }).toThrow(
      "The final odd over requires one bowler.",
    );
  });
});

describe("Even-over innings", () => {
  it("does not use the single-bowler final-over rule", () => {
    const state = createInningsState({
      inningsNumber: 1,
      totalOvers: 2,
      strikerId: "BAT_A",
      nonStrikerId: "BAT_B",
    });

    setOverBowlers(
      state,
      "BOWLER_A",
      "BOWLER_B",
    );

    for (let i = 0; i < 6; i++) {
      recordDelivery(state, {
        runsBat: 0,
      });
    }

    setOverBowlers(
      state,
      "BOWLER_C",
      "BOWLER_D",
    );

    const bowlers: string[] = [];

    for (let i = 0; i < 6; i++) {
      const result = recordDelivery(state, {
        runsBat: 0,
      });

      bowlers.push(result.bowlerId);
    }

    expect(bowlers).toEqual([
      "BOWLER_C",
      "BOWLER_D",
      "BOWLER_C",
      "BOWLER_D",
      "BOWLER_C",
      "BOWLER_D",
    ]);

    expect(state.inningsComplete).toBe(true);
  });
});