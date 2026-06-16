import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";

function run(label, command, args, cwd = root) {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: isWin,
    env: process.env,
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[dev:full] ${label} exited with code ${code}`);
    }
  });

  return child;
}

console.log("[dev:full] Starting FastAPI on http://localhost:8000 …");
const backend = run(
  "backend",
  isWin ? "uvicorn" : "uvicorn",
  ["app.main:app", "--reload", "--port", "8000"],
  path.join(root, "backend"),
);

console.log("[dev:full] Starting Next.js …");
const frontend = run("frontend", isWin ? "pnpm.cmd" : "pnpm", ["dev:clean"], root);

function shutdown() {
  backend.kill();
  frontend.kill();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
