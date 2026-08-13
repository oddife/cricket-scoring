import fs from "node:fs";

const path = "src/app/page.tsx";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const oldRefresh = `      const refreshedBowlerAId =\n        observedBowlers[0] ??\n        innings.currentBowlerAId ??\n        "";\n      const refreshedBowlerBId = refreshedOverIsOddFinalOver\n        ? ""\n        : observedBowlers[1] ??\n          innings.currentBowlerBId ??\n          liveBowlerBId;`;

const newRefresh = `      const storedBowlerPair = (() => {\n        if (!matchId || typeof window === "undefined") {\n          return { a: "", b: "" };\n        }\n        try {\n          const raw = window.localStorage.getItem(\n            \`cricket-scorer:bowler-pair:\${inningsId}\`,\n          );\n          if (!raw) return { a: "", b: "" };\n          const parsed = JSON.parse(raw) as { a?: string; b?: string };\n          return { a: parsed.a ?? "", b: parsed.b ?? "" };\n        } catch {\n          return { a: "", b: "" };\n        }\n      })();\n\n      const refreshedBowlerAId =\n        observedBowlers[0] ??\n        innings.currentBowlerAId ??\n        storedBowlerPair.a ??\n        "";\n      const refreshedBowlerBId = refreshedOverIsOddFinalOver\n        ? ""\n        : observedBowlers[1] ??\n          innings.currentBowlerBId ??\n          storedBowlerPair.b ??\n          (observedBowlers.length === 1 ? liveBowlerBId : "");`;

if (text.split(oldRefresh).length !== 2) {
  throw new Error("Expected exactly one double-bowler refresh block.");
}
text = text.replace(oldRefresh, newRefresh);

const oldFirst = `      setLiveBowlerBId(\n        data.currentBowlerBId ?? openingBowlerBId,\n      );\n      setLiveBowlerId(`;
const newFirst = `      setLiveBowlerBId(\n        data.currentBowlerBId ?? openingBowlerBId,\n      );\n      if (typeof window !== "undefined") {\n        window.localStorage.setItem(\n          \`cricket-scorer:bowler-pair:\${data.id}\`,\n          JSON.stringify({\n            a: data.currentBowlerAId ?? openingBowlerAId,\n            b: data.currentBowlerBId ?? openingBowlerBId,\n          }),\n        );\n      }\n      setLiveBowlerId(`;

if (text.split(oldFirst).length !== 2) {
  throw new Error("Expected exactly one first-innings bowler initialization block.");
}
text = text.replace(oldFirst, newFirst);

const oldNext = `      setLiveBowlerBId(data.currentBowlerBId ?? nextInningsBowlerBId);\n      setLiveBowlerId(data.currentBowlerAId ?? nextInningsBowlerAId);`;
const newNext = `      setLiveBowlerBId(data.currentBowlerBId ?? nextInningsBowlerBId);\n      if (typeof window !== "undefined") {\n        window.localStorage.setItem(\n          \`cricket-scorer:bowler-pair:\${data.id}\`,\n          JSON.stringify({\n            a: data.currentBowlerAId ?? nextInningsBowlerAId,\n            b: data.currentBowlerBId ?? nextInningsBowlerBId,\n          }),\n        );\n      }\n      setLiveBowlerId(data.currentBowlerAId ?? nextInningsBowlerAId);`;

if (text.split(oldNext).length !== 2) {
  throw new Error("Expected exactly one next-innings bowler initialization block.");
}
text = text.replace(oldNext, newNext);

fs.writeFileSync(path, text, "utf8");
console.log("Applied safe Double Bowler pair persistence/refresh fix.");
