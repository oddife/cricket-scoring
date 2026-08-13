import fs from "node:fs";

const path = "src/lib/scoring.ts";
let source = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

function requireOnce(label, pattern) {
  const matches = source.match(pattern);
  if (!matches || matches.length !== 1) {
    throw new Error(`${label}: expected exactly 1 match, found ${matches ? matches.length : 0}`);
  }
  return matches[0];
}

if (source.includes("const finalWicket")) {
  console.log("Final-wicket backend fix is already present; no changes made.");
  process.exit(0);
}

const bowlingAnchor = /  const bowlingIds =\n    new Set\(\n      bowlingPlayers\.map\(\n        \(player\) => player\.playerId,\n      \),\n    \);\n/;

const bowlingBlock = requireOnce("bowlingIds anchor", bowlingAnchor);
source = source.replace(
  bowlingAnchor,
  `${bowlingBlock}\n  const finalWicket =\n    input.isWicket === true &&\n    innings.wickets + 1 >= battingPlayers.length - 1;\n`,
);

const replacementRequirement = `    if (!input.replacementPlayerId) {\n      throw new Error(\n        "A wicket requires a replacement player.",\n      );\n    }`;

if (source.split(replacementRequirement).length !== 2) {
  throw new Error("replacement requirement: expected exactly 1 match");
}

source = source.replace(
  replacementRequirement,
  `    if (!input.replacementPlayerId && !finalWicket) {\n      throw new Error(\n        "A wicket requires a replacement player.",\n      );\n    }`,
);

const validationBlock = /    if \(\n      !battingIds\.has\(\n        input\.replacementPlayerId,\n      \)\n    \) \{[\s\S]*?\n    \}\n  \} else if \(/;

requireOnce("replacement validation block", validationBlock);

const existingValidation = source.match(validationBlock)[0];
const body = existingValidation.slice(0, -"  } else if (".length);

const wrappedValidation = `    if (input.replacementPlayerId) {\n${body.slice(4)}  }\n  } else if (`;

source = source.replace(validationBlock, wrappedValidation);

const completionRule = `  const inningsComplete =\n    newLegalBalls >=\n    innings.match.oversPerInnings * 6;`;

if (source.split(completionRule).length !== 2) {
  throw new Error("innings completion rule: expected exactly 1 match");
}

source = source.replace(
  completionRule,
  `  const inningsComplete =\n    finalWicket ||\n    newLegalBalls >=\n      innings.match.oversPerInnings * 6;`,
);

fs.writeFileSync(path, source.replace(/\n/g, "\r\n"), "utf8");
console.log("Applied final-wicket backend fix to", path);
