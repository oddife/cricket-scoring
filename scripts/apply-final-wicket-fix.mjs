import fs from "node:fs";

const path = "src/lib/scoring.ts";
let source = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

function replaceOnce(label, before, after) {
  const count = source.split(before).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: expected exactly 1 match, found ${count}`);
  }
  source = source.replace(before, after);
}

replaceOnce(
  "finalWicket declaration",
  `  const bowlingIds =\n    new Set(\n      bowlingPlayers.map(\n        (player) => player.playerId,\n      ),\n    );\n\n  if (!battingIds.has(input.strikerId)) {`,
  `  const bowlingIds =\n    new Set(\n      bowlingPlayers.map(\n        (player) => player.playerId,\n      ),\n    );\n\n  const finalWicket =\n    input.isWicket === true &&\n    innings.wickets + 1 >= battingPlayers.length - 1;\n\n  if (!battingIds.has(input.strikerId)) {`,
);

replaceOnce(
  "replacement requirement",
  `    if (!input.replacementPlayerId) {\n      throw new Error(\n        "A wicket requires a replacement player.",\n      );\n    }`,
  `    if (!input.replacementPlayerId && !finalWicket) {\n      throw new Error(\n        "A wicket requires a replacement player.",\n      );\n    }`,
);

replaceOnce(
  "replacement validation wrapper",
  `    if (\n      !battingIds.has(\n        input.replacementPlayerId,\n      )\n    ) {\n      throw new Error(\n        "Replacement player is not a match player for the batting team.",\n      );\n    }\n\n    if (\n      input.replacementPlayerId ===\n      input.dismissedPlayerId\n    ) {\n      throw new Error(\n        "Replacement player cannot be the dismissed player.",\n      );\n    }\n\n    if (\n      input.replacementPlayerId ===\n        input.strikerId ||\n      input.replacementPlayerId ===\n        input.nonStrikerId\n    ) {\n      throw new Error(\n        "Replacement player is already on the field.",\n      );\n    }\n\n    /*\n     * A player already dismissed in this innings\n     * cannot return as the replacement.\n     */\n    const previousDismissal =\n      await prisma.wicket.findFirst({\n        where: {\n          dismissedPlayerId:\n            input.replacementPlayerId,\n          delivery: {\n            inningsId:\n              input.inningsId,\n          },\n        },\n      });\n\n    if (previousDismissal) {\n      throw new Error(\n        "Replacement player has already been dismissed in this innings.",\n      );\n    }`,
  `    if (input.replacementPlayerId) {\n      if (\n        !battingIds.has(\n          input.replacementPlayerId,\n        )\n      ) {\n        throw new Error(\n          "Replacement player is not a match player for the batting team.",\n        );\n      }\n\n      if (\n        input.replacementPlayerId ===\n        input.dismissedPlayerId\n      ) {\n        throw new Error(\n          "Replacement player cannot be the dismissed player.",\n        );\n      }\n\n      if (\n        input.replacementPlayerId ===\n          input.strikerId ||\n        input.replacementPlayerId ===\n          input.nonStrikerId\n      ) {\n        throw new Error(\n          "Replacement player is already on the field.",\n        );\n      }\n\n      /*\n       * A player already dismissed in this innings\n       * cannot return as the replacement.\n       */\n      const previousDismissal =\n        await prisma.wicket.findFirst({\n          where: {\n            dismissedPlayerId:\n              input.replacementPlayerId,\n            delivery: {\n              inningsId:\n                input.inningsId,\n            },\n          },\n        });\n\n      if (previousDismissal) {\n        throw new Error(\n          "Replacement player has already been dismissed in this innings.",\n        );\n      }\n    }`,
);

replaceOnce(
  "innings completion rule",
  `  const inningsComplete =\n    newLegalBalls >=\n    innings.match.oversPerInnings * 6;`,
  `  const inningsComplete =\n    finalWicket ||\n    newLegalBalls >=\n      innings.match.oversPerInnings * 6;`,
);

fs.writeFileSync(path, source, "utf8");
console.log("Applied final-wicket backend fix to", path);
