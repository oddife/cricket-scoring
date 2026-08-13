import fs from "node:fs";

const path = "src/app/page.tsx";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const resumeOld = `      const resumedCurrentBowlerId =
        bowlingMode === "DOUBLE" &&
        !liveOddOvers &&
        resumedBowlerAId &&
        resumedBowlerBId
          ? currentOverDeliveriesFromData.length % 2 === 0
            ? resumedBowlerAId
            : resumedBowlerBId
          : resumedBowlerAId || resumedBowlerBId;
`;

const resumeNew = `      const resumedBowlingMode =
        match.bowlingMode === "DOUBLE" ? "DOUBLE" : "NORMAL";
      const resumedOddOvers = Boolean(match.oddOvers);
      const resumedIsOddFinalOver =
        resumedBowlingMode === "DOUBLE" &&
        resumedOddOvers &&
        currentOverNumberFromData >= Number(match.oversPerInnings ?? 0);

      const resumedCurrentBowlerId =
        resumedBowlingMode === "DOUBLE" &&
        !resumedIsOddFinalOver &&
        resumedBowlerAId &&
        resumedBowlerBId
          ? currentOverDeliveriesFromData.length % 2 === 0
            ? resumedBowlerAId
            : resumedBowlerBId
          : resumedBowlerAId || resumedBowlerBId;
`;

if (text.split(resumeOld).length !== 2) {
  throw new Error("Resume bowler block was not found exactly once.");
}
text = text.replace(resumeOld, resumeNew);

const refreshOld = `      const refreshedOverIsOddFinalOver =
        bowlingMode === "DOUBLE" &&
        Boolean(innings.match?.oddOvers) &&
        refreshedOverNumber >= Number(innings.match?.oversPerInnings ?? 0);

      const refreshedBowlerAId =
`;

const refreshNew = `      const resolvedBowlingMode =
        innings.match?.bowlingMode === "DOUBLE" ? "DOUBLE" : "NORMAL";
      const resolvedOddOvers = Boolean(innings.match?.oddOvers);
      const refreshedOverIsOddFinalOver =
        resolvedBowlingMode === "DOUBLE" &&
        resolvedOddOvers &&
        refreshedOverNumber >= Number(innings.match?.oversPerInnings ?? 0);

      const refreshedBowlerAId =
`;

if (text.split(refreshOld).length !== 2) {
  throw new Error("Refresh bowler mode block was not found exactly once.");
}
text = text.replace(refreshOld, refreshNew);

const currentOld = `      const refreshedCurrentBowlerId =
        refreshedOverIsOddFinalOver
          ? refreshedBowlerAId
          : bowlingMode === "DOUBLE" &&
              refreshedOverDeliveries.length > 0
            ? refreshedOverDeliveries.length % 2 === 0
              ? refreshedBowlerAId
              : refreshedBowlerBId
            : refreshedBowlerAId;
`;

const currentNew = `      const refreshedCurrentBowlerId =
        refreshedOverIsOddFinalOver
          ? refreshedBowlerAId
          : resolvedBowlingMode === "DOUBLE" &&
              refreshedOverDeliveries.length > 0
            ? refreshedOverDeliveries.length % 2 === 0
              ? refreshedBowlerAId
              : refreshedBowlerBId
            : refreshedBowlerAId;
`;

if (text.split(currentOld).length !== 2) {
  throw new Error("Refresh current-bowler block was not found exactly once.");
}
text = text.replace(currentOld, currentNew);

fs.writeFileSync(path, text, "utf8");
console.log("Applied resume bowler state fix using persisted match mode instead of stale React state.");
