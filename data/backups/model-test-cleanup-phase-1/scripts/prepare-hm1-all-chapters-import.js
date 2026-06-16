/**
 * Copy uploaded HM1 chapter JSON to data/imports, validate, report.
 * Run: node scripts/prepare-hm1-all-chapters-import.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const UPLOADS = path.join(
  process.env.USERPROFILE || process.env.HOME || "",
  ".cursor",
  "projects",
  "c-Users-Niloy-Chandra-Documents-dev-quiz-dashboard",
  "uploads",
);
const OUT_DIR = path.join(ROOT, "data", "imports");

const ALL_CHAPTERS_GLOB = "hsc-higher-math-1st-paper-all-chapters-sets-01-05";
const CHAPTER_GLOB = "hsc-higher-math-1st-paper-chapter-";

function findUpload(suffix) {
  const files = fs.readdirSync(UPLOADS);
  const hit = files.find((f) => f.includes(suffix));
  if (!hit) return null;
  return path.join(UPLOADS, hit);
}

function auditJson(data) {
  const chapters = data.chapterWise ?? [];
  const report = { chapters: [], totalSets: 0, totalQuestions: 0, issues: [] };

  for (const ch of chapters) {
    const chNo = String(ch.chapter ?? "").padStart(2, "0");
    const entry = { chapter: chNo, name: ch.chapterName, sets: [] };

    for (const set of ch.sets ?? []) {
      const id = String(set.id ?? "").trim();
      const qs = set.questions ?? [];
      report.totalSets += 1;
      report.totalQuestions += qs.length;

      const texts = new Map();
      let internalDup = 0;
      let missingFields = 0;

      for (const q of qs) {
        const t = String(q.question ?? "").trim();
        if (texts.has(t)) internalDup += 1;
        else texts.set(t, 1);
        if (!q.correctOption || !Array.isArray(q.options) || q.options.length !== 4) {
          missingFields += 1;
        }
      }

      const setReport = { id, count: qs.length, internalDup, missingFields };
      entry.sets.push(setReport);

      if (qs.length !== 25) {
        report.issues.push(`${id}: expected 25 questions, got ${qs.length}`);
      }
      if (internalDup > 0) {
        report.issues.push(`${id}: ${internalDup} duplicate stems within set`);
      }
      if (missingFields > 0) {
        report.issues.push(`${id}: ${missingFields} questions missing options/correctOption`);
      }
    }

    report.chapters.push(entry);
  }

  return report;
}

function copyFile(src, destName) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const dest = path.join(OUT_DIR, destName);
  fs.copyFileSync(src, dest);
  return dest;
}

function main() {
  const allSrc = findUpload(ALL_CHAPTERS_GLOB);
  if (!allSrc) {
    console.error("❌ Combined all-chapters upload not found");
    process.exit(1);
  }

  const allDest = copyFile(allSrc, "hsc-higher-math-1st-paper-all-chapters-sets-01-05.json");
  const allData = JSON.parse(fs.readFileSync(allDest, "utf8"));
  const allReport = auditJson(allData);

  console.log("\n📦 Combined file:", path.basename(allDest));
  console.log(`   Chapters: ${allReport.chapters.length}`);
  console.log(`   Sets: ${allReport.totalSets}`);
  console.log(`   Questions: ${allReport.totalQuestions}`);

  for (const ch of allReport.chapters) {
    console.log(`   Ch ${ch.chapter} ${ch.name}: ${ch.sets.length} sets`);
  }

  if (allReport.issues.length) {
    console.log("\n⚠️  Issues:");
    for (const i of allReport.issues.slice(0, 20)) console.log("  -", i);
    if (allReport.issues.length > 20) {
      console.log(`  ... and ${allReport.issues.length - 20} more`);
    }
  } else {
    console.log("\n✅ Validation passed (structure + 25 Q per set)");
  }

  // Also copy individual chapter files for reference
  for (let n = 1; n <= 10; n++) {
    const ch = String(n).padStart(2, "0");
    const src = findUpload(`${CHAPTER_GLOB}${ch}-sets-01-05`);
    if (src) {
      copyFile(src, `hsc-higher-math-1st-paper-chapter-${ch}-sets-01-05.json`);
    }
  }

  console.log("\n✅ Files copied to data/imports/\n");
}

main();
