const fs = require("fs");

function replaceOnce(file, oldText, newText, label) {
  const source = fs.readFileSync(file, "utf8");
  const count = source.split(oldText).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: expected exactly 1 match, found ${count}`);
  }
  fs.writeFileSync(file, source.replace(oldText, newText), "utf8");
}

replaceOnce(
  "src/app/page.tsx",
  `  function selectNextOverBowlers() {\n    if (!nextOverBowlerAId) {\n      setError("Select the next over bowler.");\n      return;\n    }\n\n    if (\n      bowlingMode === "DOUBLE" &&\n      (!nextOverBowlerBId ||\n        nextOverBowlerAId === nextOverBowlerBId)\n    ) {\n      setError("Select two different bowlers.");\n      return;\n    }`,
  `  function selectNextOverBowlers() {\n    if (!nextOverBowlerAId) {\n      setError("Select the next over bowler.");\n      return;\n    }\n\n    // The final over can be configured as an odd/single-bowler over.\n    // In that case only bowler A is required; there is no bowler B.\n    const oddFinalOver =\n      liveOddOvers &&\n      liveCurrentOver >= oversPerInnings;\n\n    const requiresSecondBowler =\n      bowlingMode === "DOUBLE" &&\n      !oddFinalOver;\n\n    if (\n      requiresSecondBowler &&\n      (!nextOverBowlerBId ||\n        nextOverBowlerAId === nextOverBowlerBId)\n    ) {\n      setError("Select two different bowlers.");\n      return;\n    }`,
  "odd final over bowler validation",
);

replaceOnce(
  "src/app/page.tsx",
  `    setLiveBowlerBId(\n      bowlingMode === "DOUBLE"\n        ? nextOverBowlerBId\n        : "",\n    );`,
  `    setLiveBowlerBId(\n      requiresSecondBowler\n        ? nextOverBowlerBId\n        : "",\n    );`,
  "odd final over bowler state",
);

replaceOnce(
  "src/app/page.tsx",
  `<button type="button" onClick={selectNextOverBowlers} className="mt-3 h-11 w-full rounded-lg bg-blue-600 font-bold text-white hover:bg-blue-700 [color-scheme:dark]">Start Next Over</button>`,
  `<button type="button" onClick={selectNextOverBowlers} className="mt-3 h-11 w-full rounded-lg bg-blue-600 font-bold text-white hover:bg-blue-700 [color-scheme:dark]">{oddFinalOver ? "Start Final Over" : "Start Next Over"}</button>`,
  "odd final over button label",
);

fs.unlinkSync("scripts/fix-odd-final-over.js");
fs.unlinkSync(".github/workflows/apply-odd-final-over-fix.yml");
console.log("Odd final over bowler fix applied successfully.");
