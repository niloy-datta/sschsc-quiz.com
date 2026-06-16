/**
 * Phase 1 Remaining Issues Fix — Orphaned files, index integrity, orphan answers.
 * Run: node scripts/cleanup-remaining-phase1-issues.js
 * Dry run: node scripts/cleanup-remaining-phase1-issues.js --dry-run
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const ANSWERS_DIR = path.join(ROOT, "backend", "data", "answers");
const QUIZ_DATA_DIR = path.join(ROOT, "public", "quiz-data");
const DRY_RUN = process.argv.includes("--dry-run");

const report = {
  orphanedSplitFiles: [],
  indexIntegrityFixes: [],
  orphanAnswersRemoved: [],
  errors: [],
  summary: { splitDeleted: 0, indexFixes: 0, orphanAnswersDeleted: 0 },
};

// Collect all index.json references per subject
function loadIndexReferences(subjectDir) {
  const indexPath = path.join(subjectDir, "index.json");
  if (!fs.existsSync(indexPath)) return { modelTests: new Set(), boards: new Set() };
  const idx = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  const modelTestIds = new Set((idx.modelTests || []).map((m) => String(m.id || "")));
  const boardIds = new Set((idx.boards || []).map((b) => String(b.id || "")));
  return { modelTests: modelTestIds, boards: boardIds, index: idx };
}

// Fix 1: Delete orphaned split files (not in any index.json)
function cleanOrphanedSplits() {
  console.log(DRY_RUN ? "\n[DRY-RUN] Would delete orphaned split files:" : "\nDeleting orphaned split files...");

  for (const subjectDir of fs.readdirSync(QUESTIONS_DIR)) {
    const fullDir = path.join(QUESTIONS_DIR, subjectDir);
    if (!fs.statSync(fullDir).isDirectory()) continue;

    const { modelTests, boards } = loadIndexReferences(fullDir);
    const allReferenced = new Set([...modelTests, ...boards]);

    for (const f of fs.readdirSync(fullDir)) {
      if (!f.includes("-split-") || !f.endsWith(".json") || f === "index.json") continue;

      const baseName = f.replace(/\.json$/, "");
      if (!allReferenced.has(baseName)) {
        const filePath = path.join(fullDir, f);
        const size = fs.statSync(filePath).size;
        report.orphanedSplitFiles.push({ subject: subjectDir, file: f, size });

        if (!DRY_RUN) {
          fs.unlinkSync(filePath);
        }
        report.summary.splitDeleted++;
        console.log(`  ${DRY_RUN ? "[WOULD DELETE]" : "[DELETED]"} ${subjectDir}/${f} (${size} bytes)`);
      }
    }
  }
  console.log(`  Total: ${report.summary.splitDeleted} orphaned split files ${DRY_RUN ? "would be" : ""}deleted`);
}

// Fix 2: Fix index.json entries — keep only those with matching files
function fixIndexIntegrity() {
  console.log(DRY_RUN ? "\n[DRY-RUN] Would fix index.json entries:" : "\nFixing index.json entries...");

  for (const subjectDir of fs.readdirSync(QUESTIONS_DIR)) {
    const fullDir = path.join(QUESTIONS_DIR, subjectDir);
    if (!fs.statSync(fullDir).isDirectory()) continue;

    const indexPath = path.join(fullDir, "index.json");
    if (!fs.existsSync(indexPath)) continue;

    const { modelTests, boards, index } = loadIndexReferences(fullDir);
    let changed = false;

    // Check model test references
    const validModelTests = (index.modelTests || []).filter((mt) => {
      const id = String(mt.id || "");
      const filePath = path.join(fullDir, `${id}.json`);
      const exists = fs.existsSync(filePath);
      if (!exists) {
        report.indexIntegrityFixes.push({
          subject: subjectDir,
          type: "modelTest",
          id,
          action: "REMOVED_FROM_INDEX",
        });
        report.summary.indexFixes++;
        if (!DRY_RUN) {
          changed = true;
        }
        console.log(`  ${DRY_RUN ? "[WOULD REMOVE]" : "[REMOVED]"} index.json modelTest '${id}' in ${subjectDir} (no file)`);
      }
      return exists;
    });

    // Check board references
    const validBoards = (index.boards || []).filter((bd) => {
      const id = String(bd.id || "");
      const filePath = path.join(fullDir, `${id}.json`);
      const exists = fs.existsSync(filePath);
      if (!exists) {
        report.indexIntegrityFixes.push({
          subject: subjectDir,
          type: "board",
          id,
          action: "REMOVED_FROM_INDEX",
        });
        report.summary.indexFixes++;
        if (!DRY_RUN) {
          changed = true;
        }
        console.log(`  ${DRY_RUN ? "[WOULD REMOVE]" : "[REMOVED]"} index.json board '${id}' in ${subjectDir} (no file)`);
      }
      return exists;
    });

    if (changed) {
      index.modelTests = validModelTests;
      index.boards = validBoards;
      if (!DRY_RUN) {
        fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n", "utf-8");
      }
    }
  }
  console.log(`  Total: ${report.summary.indexFixes} index.json entries ${DRY_RUN ? "would be" : ""}fixed`);
}

// Fix 3: Remove orphan answer files (no matching question file)
function cleanOrphanAnswers() {
  console.log(DRY_RUN ? "\n[DRY-RUN] Would delete orphan answer files:" : "\nDeleting orphan answer files...");

  for (const subjectDir of fs.readdirSync(ANSWERS_DIR)) {
    const fullDir = path.join(ANSWERS_DIR, subjectDir);
    if (!fs.statSync(fullDir).isDirectory()) continue;

    const questionsSubjectDir = path.join(QUESTIONS_DIR, subjectDir);

    for (const f of fs.readdirSync(fullDir)) {
      if (!f.endsWith(".answers.json")) continue;
      const baseName = f.replace(/\.answers\.json$/, "");
      const questionFile = path.join(questionsSubjectDir, `${baseName}.json`);

      if (!fs.existsSync(questionFile)) {
        const filePath = path.join(fullDir, f);
        const size = fs.statSync(filePath).size;
        report.orphanAnswersRemoved.push({ subject: subjectDir, file: f, size });

        if (!DRY_RUN) {
          fs.unlinkSync(filePath);
        }
        report.summary.orphanAnswersDeleted++;
        console.log(`  ${DRY_RUN ? "[WOULD DELETE]" : "[DELETED]"} ${subjectDir}/${f} (${size} bytes)`);
      }
    }
  }
  console.log(`  Total: ${report.summary.orphanAnswersDeleted} orphan answer files ${DRY_RUN ? "would be" : ""}deleted`);
}

function main() {
  console.log(DRY_RUN ? "=== DRY RUN — No files will be modified ===\n" : "=== LIVE RUN — Fixing remaining issues ===\n");

  cleanOrphanedSplits();
  fixIndexIntegrity();
  cleanOrphanAnswers();

  // Write report
  const reportPath = path.join(ROOT, "data", "reports", "remaining_issues_fix_report.json");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf-8");
  console.log(`\nReport written to: ${reportPath}`);

  const total = report.summary.splitDeleted + report.summary.indexFixes + report.summary.orphanAnswersDeleted;
  console.log(`\nTotal actions ${DRY_RUN ? "previewed" : "completed"}: ${total}`);
  if (DRY_RUN) {
    console.log("Run without --dry-run to apply.");
  }
}

main();
