import fs from "node:fs";

const path = "src/lib/scoring.ts";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const requiredExports = [
  "export async function swapPersistentStrikers",
  "export async function manualChangePersistentState",
  "export async function undoPersistentAction",
];
for (const marker of requiredExports) {
  if (!text.includes(marker)) {
    throw new Error(`Known-good scoring export missing before edit: ${marker}`);
  }
}

const finalWicket = `  const finalWicket =\n    input.isWicket === true &&\n    innings.wickets + 1 >= battingPlayers.length - 1;\n\n`;

const strikerAnchor = `  if (!battingIds.has(input.strikerId)) {`;
if (text.split(strikerAnchor).length !== 2) {
  throw new Error("Expected exactly one striker validation anchor.");
}
if (!text.includes("const finalWicket =")) {
  text = text.replace(strikerAnchor, finalWicket + strikerAnchor);
}

const requiredReplacement = `    if (!input.replacementPlayerId) {\n      throw new Error(\n        "A wicket requires a replacement player.",\n      );\n    }`;
const optionalReplacement = `    if (!input.replacementPlayerId && !finalWicket) {\n      throw new Error(\n        "A wicket requires a replacement player.",\n      );\n    }`;
if (text.includes(requiredReplacement)) {
  text = text.replace(requiredReplacement, optionalReplacement);
} else if (!text.includes("!input.replacementPlayerId && !finalWicket")) {
  throw new Error("Expected wicket replacement requirement block.");
}

const replacementValidationStart = `    if (\n      !battingIds.has(\n        input.replacementPlayerId,\n      )\n    ) {`;
const replacementValidationEnd = `\n  } else if (\n    input.dismissedPlayerId ||\n    input.replacementPlayerId\n  ) {`;
const start = text.indexOf(replacementValidationStart);
const end = text.indexOf(replacementValidationEnd, start);
if (start < 0 || end < 0) {
  throw new Error(`Replacement validation block not found (start=${start}, end=${end}).`);
}
const block = text.slice(start, end);
if (!block.includes("if (input.replacementPlayerId) {")) {
  text =
    text.slice(0, start) +
    `    if (input.replacementPlayerId) {\n` +
    block +
    `    }` +
    text.slice(end);
}

const oldComplete = `  const inningsComplete =\n    newLegalBalls >=\n    innings.match.oversPerInnings * 6;`;
const newComplete = `  const inningsComplete =\n    finalWicket ||\n    newLegalBalls >=\n      innings.match.oversPerInnings * 6;`;
if (text.includes(oldComplete)) {
  text = text.replace(oldComplete, newComplete);
} else if (!text.includes(newComplete)) {
  throw new Error("Expected innings completion rule.");
}

for (const marker of requiredExports) {
  if (!text.includes(marker)) {
    throw new Error(`Scoring export disappeared during edit: ${marker}`);
  }
}

fs.writeFileSync(path, text, { encoding: "utf8" });
console.log("Applied final-wicket rule without removing existing scoring exports.");
