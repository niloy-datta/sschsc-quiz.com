import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DIRS = [
  "chemistry-1st-paper", "chemistry-2nd-paper",
  "physics-1st-paper", "physics-2nd-paper",
  "biology-1st-paper", "biology-2nd-paper",
  "higher-math-1st-paper", "higher-math-2nd-paper",
];

console.log("=== All 2024 board question counts ===\n");

for (const dir of DIRS) {
  const p = path.join(ROOT, "public/questions", dir);
  if (!fs.existsSync(p)) continue;
  const files = fs.readdirSync(p).filter(f => f.endsWith("-2024.json") && f !== "index.json");
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(p, f), "utf8"));
    const items = Array.isArray(data) ? data : data.questions ?? [];
    const board = f.replace("-2024.json", "");
    const tag = items.length >= 25 ? "OK" : "SHORT";
    console.log(`${tag} ${dir}/${board}  ${items.length}q`);
  }
}
