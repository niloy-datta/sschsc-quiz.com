import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const HSC_DIRS = [
  "chemistry-1st-paper", "chemistry-2nd-paper",
  "physics-1st-paper", "physics-2nd-paper",
  "biology-1st-paper", "biology-2nd-paper",
  "higher-math-1st-paper", "higher-math-2nd-paper",
];

console.log("=== 2025 Board Question Coverage (HSC) ===\n");

for (const dir of HSC_DIRS) {
  const qDir = path.join(ROOT, "public/questions", dir);
  if (!fs.existsSync(qDir)) continue;

  const files = fs.readdirSync(qDir).filter(f => f.endsWith("-2025.json") && f !== "index.json");

  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(qDir, f), "utf8"));
    const items = Array.isArray(data) ? data : data.questions ?? [];
    const board = f.replace("-2025.json", "");
    const count = items.length;
    if (count < 25) {
      console.log(`  ${dir}/${board}: ${count}q → MISSING ${25 - count}`);
    } else {
      console.log(`  ${dir}/${board}: ${count}q ✅`);
    }
  }
}

// Now scan the scanned images to see what's available for auto-extraction
console.log("\n=== Scanned Board Papers Available ===\n");
const SCANNED = path.join(ROOT, "public/images/board-scanned");
if (fs.existsSync(SCANNED)) {
  const subjects = fs.readdirSync(SCANNED);
  for (const subj of subjects) {
    const subjPath = path.join(SCANNED, subj);
    if (!fs.statSync(subjPath).isDirectory()) continue;
    const papers = fs.readdirSync(subjPath);
    for (const paper of papers) {
      const paperPath = path.join(subjPath, paper);
      if (!fs.statSync(paperPath).isDirectory()) continue;
      const images = fs.readdirSync(paperPath).filter(f => f.startsWith("2025"));
      if (images.length > 0) {
        console.log(`  ${subj}/${paper}: ${images.length} scanned pages`);
      }
    }
  }
}
