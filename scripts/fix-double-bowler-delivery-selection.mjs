import fs from "node:fs";

const path = "src/app/page.tsx";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const oldBlock = `    if (!liveBowlerId) {\n      setError("Select a bowler for this delivery.");\n      return;\n    }\n\n    try {`;
const newBlock = `    const deliveryBowlerId =\n      bowlingMode === "DOUBLE"\n        ? liveDeliveryCount % 2 === 0\n          ? liveBowlerAId\n          : liveBowlerBId\n        : liveBowlerId;\n\n    if (!deliveryBowlerId) {\n      setError("Select a bowler for this delivery.");\n      return;\n    }\n\n    try {`;

if (text.split(oldBlock).length !== 2) {
  throw new Error("Expected exactly one delivery bowler validation block.");
}
text = text.replace(oldBlock, newBlock);

const oldPost = `            bowlerId: liveBowlerId,\n            strikerId: liveStrikerId,`;
const newPost = `            bowlerId: deliveryBowlerId,\n            strikerId: liveStrikerId,`;

if (text.split(oldPost).length !== 2) {
  throw new Error("Expected exactly one delivery bowler POST field.");
}
text = text.replace(oldPost, newPost);

const oldWicketDetail = `            bowlerId: liveBowlerId || null,\n            fielderId: input.fielderId ?? null,`;
const newWicketDetail = `            bowlerId: deliveryBowlerId || null,\n            fielderId: input.fielderId ?? null,`;

if (text.split(oldWicketDetail).length !== 2) {
  throw new Error("Expected exactly one live wicket detail bowler field.");
}
text = text.replace(oldWicketDetail, newWicketDetail);

fs.writeFileSync(path, text, "utf8");
console.log("Applied deterministic Double Bowler delivery selection fix.");
