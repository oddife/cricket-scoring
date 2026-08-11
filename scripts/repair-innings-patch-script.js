const fs = require("fs");
const file = "scripts/fix-innings-tabs.js";
let source = fs.readFileSync(file, "utf8");

const replacements = [
  [
    "className={`h-20 rounded-xl border text-base font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}",
    "className={\\`h-20 rounded-xl border text-base font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 \\${className}\\`}",
  ],
  [
    "className={`mb-2 rounded-lg px-3 py-4 text-left text-sm font-semibold transition ${liveTab === tab ? \"bg-blue-600 text-white\" : \"text-slate-300 hover:bg-white/5\"}`}",
    "className={\\`mb-2 rounded-lg px-3 py-4 text-left text-sm font-semibold transition \\${liveTab === tab ? \"bg-blue-600 text-white\" : \"text-slate-300 hover:bg-white/5\"}\\`}",
  ],
  [
    ": `Start Innings ${liveInningsNumber + 1}`",
    ": \\`Start Innings ${liveInningsNumber + 1}\\`",
  ],
];

for (const [oldText, newText] of replacements) {
  source = source.split(oldText).join(newText);
}

fs.writeFileSync(file, source, "utf8");
console.log("Repaired innings patch script quoting.");
