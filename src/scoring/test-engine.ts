import {
  createInningsState,
  getCurrentBowler,
  recordDelivery,
  setOverBowlers,
} from "./innings";

const state = createInningsState({
  inningsNumber: 1,
  totalOvers: 10,
  strikerId: "BAT_A",
  nonStrikerId: "BAT_B",
});

setOverBowlers(
  state,
  "BOWLER_A",
  "BOWLER_B",
);

console.log("START");
console.log(
  "Bowler:",
  getCurrentBowler(state),
);

for (let i = 1; i <= 6; i++) {
  const result = recordDelivery(state, {
    runsBat: 0,
  });

  console.log(
    `Ball ${i}:`,
    "Bowler =", result.bowlerId,
    "Over =", result.overNumber,
    "Ball =", result.ballNumber,
    "Over Complete =", result.overComplete,
    "Striker =", result.strikerId,
    "Non-Striker =", result.nonStrikerId,
  );
}

console.log("FINAL STATE");
console.log(state);