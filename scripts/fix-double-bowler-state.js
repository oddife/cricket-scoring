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
  "src/lib/scoring.ts",
  `        const bowlerB =\n          firstDeliveryOfOver\n            ? null\n            : innings.currentBowlerBId ?? currentOverSecondBowler;`,
  `        const bowlerB =\n          innings.currentBowlerBId ?? currentOverSecondBowler;`,
  "scoring bowler pair persistence",
);

replaceOnce(
  "src/app/page.tsx",
  `      const refreshedBowlerBId =\n        innings.currentBowlerBId ??\n        (refreshedOverDeliveries.length > 0 ? liveBowlerBId : "");`,
  `      const refreshedBowlerBId =\n        innings.currentBowlerBId ??\n        liveBowlerBId;`,
  "page bowler pair restoration",
);

replaceOnce(
  "src/app/page.tsx",
  `      setLiveBowlerId(\n        bowlingMode === "DOUBLE" &&\n        refreshedBowlerAId &&\n        refreshedBowlerBId\n          ? refreshedOverDeliveries.length % 2 === 0\n            ? refreshedBowlerAId\n            : refreshedBowlerBId\n          : refreshedBowlerAId,\n      );`,
  `      const lastOverDelivery =\n        refreshedOverDeliveries[refreshedOverDeliveries.length - 1];\n\n      const refreshedCurrentBowlerId =\n        bowlingMode === "DOUBLE" &&\n        refreshedBowlerAId &&\n        refreshedBowlerBId &&\n        lastOverDelivery\n          ? lastOverDelivery.bowlerId === refreshedBowlerAId\n            ? refreshedBowlerBId\n            : refreshedBowlerAId\n          : refreshedBowlerAId;\n\n      setLiveBowlerId(refreshedCurrentBowlerId);`,
  "page current bowler restoration",
);

console.log("Double-bowler state fix applied successfully.");
