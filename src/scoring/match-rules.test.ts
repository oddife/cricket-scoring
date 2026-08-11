import { describe, expect, it } from "vitest";

import {
  calculateFourInningsPosition,
  calculateTarget,
  decideMatchAfterCompletedInnings,
} from "./match-rules";

const A = "TEAM_A";
const B = "TEAM_B";

function innings(
  inningsNumber: number,
  battingTeamId: string,
  totalRuns: number,
) {
  return { inningsNumber, battingTeamId, totalRuns };
}

describe("multi-innings targets", () => {
  it("does not create a target for innings 1", () => {
    expect(calculateTarget({ inningsNumber: 1, inningsPerMatch: 4, battingTeamId: A, bowlingTeamId: B, previousInnings: [] })).toBeNull();
  });

  it("does not create a target for innings 3", () => {
    expect(calculateTarget({ inningsNumber: 3, inningsPerMatch: 4, battingTeamId: A, bowlingTeamId: B, previousInnings: [innings(1, A, 100), innings(2, B, 120)] })).toBeNull();
  });

  it("sets innings 2 target to first innings score plus one", () => {
    expect(calculateTarget({ inningsNumber: 2, inningsPerMatch: 2, battingTeamId: B, bowlingTeamId: A, previousInnings: [innings(1, A, 150)] })).toBe(151);
  });

  it("sets innings 4 target to aggregate deficit plus one", () => {
    expect(calculateTarget({ inningsNumber: 4, inningsPerMatch: 4, battingTeamId: B, bowlingTeamId: A, previousInnings: [innings(1, A, 150), innings(2, B, 120), innings(3, A, 80)] })).toBe(111);
  });

  it("sets innings 4 target to one when the aggregates are level", () => {
    expect(calculateTarget({ inningsNumber: 4, inningsPerMatch: 4, battingTeamId: B, bowlingTeamId: A, previousInnings: [innings(1, A, 150), innings(2, B, 150), innings(3, A, 0)] })).toBe(1);

    expect(calculateTarget({ inningsNumber: 4, inningsPerMatch: 4, battingTeamId: A, bowlingTeamId: B, previousInnings: [innings(1, A, 100), innings(2, B, 100), innings(3, A, 0)] })).toBe(1);
  });
});

describe("four-innings aggregate position", () => {
  it("shows the current batting side's aggregate lead", () => {
    expect(calculateFourInningsPosition({ inningsNumber: 3, inningsPerMatch: 4, battingTeamId: A, bowlingTeamId: B, currentInningsRuns: 30, previousInnings: [innings(1, A, 100), innings(2, B, 120)] })).toEqual({ kind: "LEAD", runs: 10 });
  });

  it("shows the current batting side's aggregate deficit", () => {
    expect(calculateFourInningsPosition({ inningsNumber: 3, inningsPerMatch: 4, battingTeamId: A, bowlingTeamId: B, currentInningsRuns: 10, previousInnings: [innings(1, A, 100), innings(2, B, 120)] })).toEqual({ kind: "TRAIL", runs: 10 });
  });

  it("shows level aggregates", () => {
    expect(calculateFourInningsPosition({ inningsNumber: 3, inningsPerMatch: 4, battingTeamId: A, bowlingTeamId: B, currentInningsRuns: 20, previousInnings: [innings(1, A, 100), innings(2, B, 120)] })).toEqual({ kind: "LEVEL", runs: 0 });
  });
});

describe("match result", () => {
  it("ends a two-innings chase immediately when target is reached", () => {
    expect(decideMatchAfterCompletedInnings({ inningsNumber: 2, inningsPerMatch: 2, battingTeamId: B, bowlingTeamId: A, currentInningsRuns: 151, previousInnings: [innings(1, A, 150)], target: 151 })).toEqual({ completed: true, winnerTeamId: B, tie: false });
  });

  it("ends a four-innings match if innings 3 finishes behind", () => {
    expect(decideMatchAfterCompletedInnings({ inningsNumber: 3, inningsPerMatch: 4, battingTeamId: A, bowlingTeamId: B, currentInningsRuns: 10, previousInnings: [innings(1, A, 100), innings(2, B, 120)], target: null })).toEqual({ completed: true, winnerTeamId: B, tie: false });
  });

  it("continues to innings 4 when innings 3 is level", () => {
    expect(decideMatchAfterCompletedInnings({ inningsNumber: 3, inningsPerMatch: 4, battingTeamId: A, bowlingTeamId: B, currentInningsRuns: 20, previousInnings: [innings(1, A, 100), innings(2, B, 120)], target: null })).toEqual({ completed: false, winnerTeamId: null, tie: false });
  });

  it("ends innings 4 with the aggregate winner", () => {
    expect(decideMatchAfterCompletedInnings({ inningsNumber: 4, inningsPerMatch: 4, battingTeamId: B, bowlingTeamId: A, currentInningsRuns: 50, previousInnings: [innings(1, A, 100), innings(2, B, 80), innings(3, A, 30)], target: 51 })).toEqual({ completed: true, winnerTeamId: B, tie: false });
  });

  it("records a tie when the final aggregates are equal", () => {
    expect(decideMatchAfterCompletedInnings({ inningsNumber: 4, inningsPerMatch: 4, battingTeamId: B, bowlingTeamId: A, currentInningsRuns: 50, previousInnings: [innings(1, A, 100), innings(2, B, 80), innings(3, A, 30)], target: 51 })).toEqual({ completed: true, winnerTeamId: null, tie: true });
  });
});
