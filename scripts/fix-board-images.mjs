import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const QUESTIONS_DIR = path.join(ROOT, "public/questions");
const IMAGES_DIR = path.join(ROOT, "public/images/quiz");
const BOARD_SCANNED = path.join(ROOT, "public/images/board-scanned");

const subjects = [
  "chemistry-1st-paper", "chemistry-2nd-paper",
];

let fixedFiles = [];
let missingImages = [];
let totalRefs = 0;

for (const subj of subjects) {
  const qDir = path.join(QUESTIONS_DIR, subj);
  if (!fs.existsSync(qDir)) continue;

  const files = fs.readdirSync(qDir).filter(f =>
    f.endsWith("-2025.json") && f !== "index.json"
  );

  for (const f of files) {
    const fp = path.join(qDir, f);
    const data = JSON.parse(fs.readFileSync(fp, "utf8"));
    const items = Array.isArray(data) ? data : [];
    let modified = false;

    for (const q of items) {
      if (q.image) {
        totalRefs++;
        const refPath = path.join(ROOT, q.image.replace(/^\//, ""));
        const basename = path.basename(q.image);

        if (!fs.existsSync(refPath)) {
          // Try generated/
          const genPath = path.join(IMAGES_DIR, "generated", basename);
          if (fs.existsSync(genPath)) {
            q.image = "/images/quiz/generated/" + basename;
            modified = true;
            fixedFiles.push({ file: f, id: q.id, old: refPath, new: q.image });
          } else {
            // Try root images/quiz/
            const rootPath = path.join(IMAGES_DIR, basename);
            if (fs.existsSync(rootPath)) {
              q.image = "/images/quiz/" + basename;
              modified = true;
              fixedFiles.push({ file: f, id: q.id, old: refPath, new: q.image });
            } else {
              missingImages.push({ file: f, id: q.id, ref: q.image });
            }
          }
        }
      }
    }

    if (modified) {
      fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf8");
    }
  }
}

console.log("\n=== HSC Chemistry 2025 Board Images Fix Report ===\n");
console.log(`Total image references: ${totalRefs}`);
console.log(`Fixed image paths: ${fixedFiles.length}`);
console.log(`Still missing: ${missingImages.length}\n`);

if (fixedFiles.length > 0) {
  console.log("Fixed files:");
  for (const f of fixedFiles) {
    console.log(`  ${f.file} — ${f.id?.slice(-25)}`);
    console.log(`    OLD: ${f.old?.slice(-60)}`);
    console.log(`    NEW: ${f.new?.slice(-60)}`);
  }
  console.log("");
}

if (missingImages.length > 0) {
  console.log("Still missing images:");
  for (const m of missingImages) {
    console.log(`  ${m.file} — ${m.id?.slice(-25)} → ${m.ref}`);
  }
  console.log("");
}

// Now check scanned image wiring
console.log("=== Board Scanned Images ===\n");
for (const subj of subjects) {
  const scannedPath = path.join(BOARD_SCANNED, subj.replace("-1st-paper", "/1st-paper").replace("-2nd-paper", "/2nd-paper"));
  const scannedPathAlt = path.join(BOARD_SCANNED, subj.replace("-1st-paper", ""), "1st-paper");
  const candidates = [scannedPath, scannedPathAlt];

  for (const sp of candidates) {
    if (fs.existsSync(sp)) {
      const files = fs.readdirSync(sp).filter(f => f.startsWith("2025"));
      console.log(`${subj}: ${files.length} scanned files in ${path.relative(ROOT, sp)}`);
    }
  }
}

console.log("\nDone.");
