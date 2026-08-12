import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const env = {
  ...process.env,
  DATABASE_URL: "file:./test.db",
  NODE_ENV: "test",
};

if (existsSync("test.db")) {
  rmSync("test.db", { force: true });
}

const node = process.execPath;
const prismaCli = resolve("node_modules/prisma/build/index.js");
const vitestCli = resolve("node_modules/vitest/vitest.mjs");

execFileSync(node, [prismaCli, "migrate", "deploy"], {
  stdio: "inherit",
  env,
});

execFileSync(node, [vitestCli, "--run"], {
  stdio: "inherit",
  env,
});
