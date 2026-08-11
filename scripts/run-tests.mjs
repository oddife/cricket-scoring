import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";

const env = {
  ...process.env,
  DATABASE_URL: "file:./test.db",
  NODE_ENV: "test",
};

if (existsSync("test.db")) {
  rmSync("test.db", { force: true });
}

const npx = process.platform === "win32" ? "npx.cmd" : "npx";

execFileSync(npx, ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env,
});

execFileSync(npx, ["vitest", "--run"], {
  stdio: "inherit",
  env,
});
