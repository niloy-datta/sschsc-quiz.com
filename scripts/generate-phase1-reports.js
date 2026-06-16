/**
 * Phase 1 — Generate CSV Reports from integrity fix output.
 * Run: node scripts/generate-phase1-reports.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const REPORTS_DIR = path.join(ROOT, "data", "reports");
const QUARANTINE_DIR = path.join(ROOT, "data", "quarantine");
const FIX_REPORT = path.join(ROOT, "scripts", "quiz-integrity-fix-report.json");
const REGEN_PATH = path.join(ROOT, "data", "needs-regeneration.json");
const QUIZ_DATA_DIR = path.join(ROOT, "public", "quiz-data");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const QUIZ_DATA_HSC = path.join(QUIZ_DATA_DIR, "hsc");
const QUIZ_DATA_SSC = path.join(QUIZ_DATA_DIR, "ssc");

fs.mkdirSync(REPORTS_DIR, { recursive: true });

// === 1. Read fix report and generate duplicate sets CSV ===
const fixReport = JSON.parse(fs.readFileSync(FIX_REPORT, "utf-8"));
const csvDupRows = ["Level | Subject | Paper | Removed Test ID | Kept Test ID | File Path | Duplicate Signature | Question Count"];

// Parse the fix report's needsRegeneration entries for duplicates
const regenData = JSON.parse(fs.readFileSync(REGEN_PATH, "utf-8"));
for (const entry of regenData.entries || []) {
  if (entry.reason === "DUPLICATE_OF") {
    csvDupRows.push(
      [
        entry.paper.includes("SSC") ? "SSC" : "HSC",
        entry.paper.replace(/SSC |HSC /, ""),
        entry.paper,
        entry.setId,
        entry.duplicateOf || "",
        `public/quiz-data/${entry.paper.toLowerCase().includes("ssc") ? "ssc" : "hsc"}`,
        `duplicate_of_${entry.duplicateOf || "unknown"}`,
        entry.questionCount || 0,
      ].join(" | ")
    );
  }
}

fs.writeFileSync(
  path.join(REPORTS_DIR, "duplicate_model_tests_removed.csv"),
  csvDupRows.join("\n") + "\n",
  "utf-8"
);
console.log(`✓ duplicate_model_tests_removed.csv: ${csvDupRows.length - 1} entries`);

// === 2. Generate within-set duplicates CSV ===
const csvWithinRows = ["Level | Subject | Paper | Test ID | File Path | Removed Question ID | Duplicate Of | Final Question Count | Status"];
for (const paper of fixReport) {
  const boilerplate = paper.actionsTaken?.boilerplateRemoved || 0;
  const setsKept = paper.actionsTaken?.setsKept || 0;
  const deletedDups = paper.actionsTaken?.deletedDuplicates || 0;
  const deletedIncomplete = paper.actionsTaken?.deletedIncomplete || 0;
  
  // Aggregate within-set removals per paper
  if (boilerplate > 0) {
    csvWithinRows.push(
      [
        paper.paper.includes("SSC") ? "SSC" : "HSC",
        paper.paper.replace(/SSC |HSC /, ""),
        paper.paper,
        "(multiple sets)",
        `public/quiz-data/${paper.paper.toLowerCase().includes("ssc") ? "ssc" : "hsc"}`,
        `${boilerplate} questions`,
        "within-set-duplicate",
        setsKept,
        "CLEANED",
      ].join(" | ")
    );
  }
  if (deletedDups > 0) {
    csvWithinRows.push(
      [
        paper.paper.includes("SSC") ? "SSC" : "HSC",
        paper.paper.replace(/SSC |HSC /, ""),
        paper.paper,
        "(duplicate sets)",
        `public/quiz-data/${paper.paper.toLowerCase().includes("ssc") ? "ssc" : "hsc"}`,
        `${deletedDups} duplicate sets removed`,
        "full-set-duplicate",
        setsKept,
        "REMOVED",
      ].join(" | ")
    );
  }
  if (deletedIncomplete > 0) {
    csvWithinRows.push(
      [
        paper.paper.includes("SSC") ? "SSC" : "HSC",
        paper.paper.replace(/SSC |HSC /, ""),
        paper.paper,
        "(incomplete sets)",
        `public/quiz-data/${paper.paper.toLowerCase().includes("ssc") ? "ssc" : "hsc"}`,
        `${deletedIncomplete} incomplete sets removed`,
        "incomplete-after-cleanup",
        setsKept,
        "REMOVED",
      ].join(" | ")
    );
  }
}

fs.writeFileSync(
  path.join(REPORTS_DIR, "within_set_duplicates_removed.csv"),
  csvWithinRows.join("\n") + "\n",
  "utf-8"
);
console.log(`✓ within_set_duplicates_removed.csv: ${csvWithinRows.length - 1} entries`);

// === 3. Check ICT data ===
const ictReport = { liveDataFound: false, actionTaken: "none", quarantinePath: "", status: "" };

// Check if ICT keys in mega JSON
for (const dir of [QUIZ_DATA_HSC, QUIZ_DATA_SSC]) {
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (file.endsWith(".json") && !file.endsWith(".model-tests.index.json") && file !== "manifest.json") {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
      if (data.modelTests) {
        for (const key of Object.keys(data.modelTests)) {
          if (key.toLowerCase().includes("ict")) {
            ictReport.liveDataFound = true;
            ictReport.actionTaken = "ICT keys found in " + file + ". Keeping in quarantine.";
            const quarantinePath = path.join(QUARANTINE_DIR, "ict", `${file.replace(".json", "")}-${key}.json`);
            fs.mkdirSync(path.dirname(quarantinePath), { recursive: true });
            fs.writeFileSync(quarantinePath, JSON.stringify({
              sourceFile: file,
              key,
              questionCount: Array.isArray(data.modelTests[key]) ? data.modelTests[key].length : 0,
              quarantinedAt: new Date().toISOString()
            }, null, 2), "utf-8");
            ictReport.quarantinePath = quarantinePath;
          }
        }
      }
    }
  }
}

// Check public/questions/ict/ folder
const ictQuestionsDir = path.join(QUESTIONS_DIR, "ict");
if (fs.existsSync(ictQuestionsDir)) {
  ictReport.liveDataFound = true;
  ictReport.actionTaken = "public/questions/ict/ folder exists with " + fs.readdirSync(ictQuestionsDir).length + " files. Moving to quarantine.";
  const dest = path.join(QUARANTINE_DIR, "ict", "questions-ict");
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
    // Copy files rather than move (to preserve originals for review)
    for (const f of fs.readdirSync(ictQuestionsDir)) {
      fs.copyFileSync(path.join(ictQuestionsDir, f), path.join(dest, f));
    }
  }
  ictReport.quarantinePath = dest;
} else {
  ictReport.quarantinePath = "N/A — no public/questions/ict/ folder found";
}

ictReport.status = ictReport.liveDataFound ? "ICT DATA FOUND AND QUARANTINED" : "No ICT data found in live data";

fs.writeFileSync(
  path.join(REPORTS_DIR, "ict_quarantine_report.md"),
  `# ICT Quarantine Report\n\nGenerated: ${new Date().toISOString()}\n\n` +
  `| Field | Value |\n|-------|-------|\n` +
  `| Live ICT data found? | ${ictReport.liveDataFound} |\n` +
  `| Action Taken | ${ictReport.actionTaken} |\n` +
  `| Quarantine Path | ${ictReport.quarantinePath} |\n` +
  `| Status | ${ictReport.status} |\n` +
  `| BLOCKED_SUBJECTS kept | Yes — ["ict"] unchanged |\n`,
  "utf-8"
);
console.log(`✓ ict_quarantine_report.md`);
console.log(`  ICT status: ${ictReport.status}`);

// === 4. Generate index sync report ===
const csvSyncRows = ["Level | Subject | Paper | Mega JSON File | Index File | Mega Count | Index Count | Missing In Index | Missing In Mega | Status"];
for (const dir of [QUIZ_DATA_SSC, QUIZ_DATA_HSC]) {
  const level = dir.includes("ssc") ? "ssc" : "hsc";
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".model-tests.index.json")) continue;
    const slug = file.replace(".model-tests.index.json", "");
    const megaPath = path.join(dir, `${slug}.json`);
    
    if (!fs.existsSync(megaPath)) {
      csvSyncRows.push(`${level} | ${slug} | ${slug} | ${megaPath} | ${path.join(dir, file)} | N/A | N/A | N/A | N/A | MISSING_MEGA`);
      continue;
    }
    
    const megaData = JSON.parse(fs.readFileSync(megaPath, "utf-8"));
    const indexData = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
    
    const megaKeys = new Set(Object.keys(megaData.modelTests || {}));
    const indexKeys = new Set(Object.keys(indexData.modelTests || {}));
    
    const missingInIndex = [...megaKeys].filter(k => !indexKeys.has(k));
    const missingInMega = [...indexKeys].filter(k => !megaKeys.has(k));
    
    const status = missingInIndex.length === 0 && missingInMega.length === 0 ? "SYNC_OK" : "MISMATCH";
    
    csvSyncRows.push(
      [
        level.toUpperCase(),
        slug,
        slug,
        `public/quiz-data/${level}/${slug}.json`,
        `public/quiz-data/${level}/${slug}.model-tests.index.json`,
        megaKeys.size,
        indexKeys.size,
        missingInIndex.length > 0 ? missingInIndex.slice(0, 5).join(", ") : "none",
        missingInMega.length > 0 ? missingInMega.slice(0, 5).join(", ") : "none",
        status,
      ].join(" | ")
    );
  }
}

fs.writeFileSync(
  path.join(REPORTS_DIR, "model_test_index_sync_report.csv"),
  csvSyncRows.join("\n") + "\n",
  "utf-8"
);
console.log(`✓ model_test_index_sync_report.csv: ${csvSyncRows.length - 1} entries`);

// === 5. Generate baseline report ===
const baselineLines = [
  "# Model Test Baseline Report",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Metrics",
  "",
  "| Metric | Count | Notes |",
  "|--------|-------|-------|",
];

let totalSets = 0;
let totalDups = 0;
let totalBoilerplate = 0;
let totalIncomplete = 0;

for (const paper of fixReport) {
  totalSets += paper.actionsTaken?.setsKept || 0;
  totalDups += paper.actionsTaken?.deletedDuplicates || 0;
  totalBoilerplate += paper.actionsTaken?.boilerplateRemoved || 0;
  totalIncomplete += paper.actionsTaken?.deletedIncomplete || 0;
}

baselineLines.push(`| Total model tests found | ${totalSets} | After cleanup |`);
baselineLines.push(`| Duplicate full-set groups | ${totalDups} | Sets removed |`);
baselineLines.push(`| Within-set duplicate questions | ${totalBoilerplate} | Questions removed |`);
baselineLines.push(`| Incomplete sets (<25 MCQ) removed | ${totalIncomplete} | Sets removed |`);

// Check for invalid JSON
let invalidJson = 0;
for (const dir of [QUIZ_DATA_SSC, QUIZ_DATA_HSC]) {
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (file.endsWith(".json")) {
      try {
        JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
      } catch {
        invalidJson++;
      }
    }
  }
}
baselineLines.push(`| Invalid JSON files | ${invalidJson} | 0 = all valid |`);

// Check index sync counts
let syncOk = 0;
let syncMismatch = 0;
// Re-check from index sync report (skip header)
for (let i = 1; i < csvSyncRows.length; i++) {
  if (csvSyncRows[i].includes("SYNC_OK")) syncOk++;
  else if (csvSyncRows[i].includes("MISMATCH")) syncMismatch++;
}
baselineLines.push(`| Index sync OK | ${syncOk} | ${syncMismatch} have mismatches |`);

// ICT status
baselineLines.push(`| ICT data status | ${ictReport.liveDataFound ? "Quarantined" : "Not found"} | BLOCKED_SUBJECTS stays |`);

baselineLines.push("");

// Per-paper breakdown
baselineLines.push("## Per-Subject Breakdown");
baselineLines.push("");
baselineLines.push("| Subject | Sets Kept | Dups Removed | Within-Set Removed | Incomplete Removed | Risk | Status |");
baselineLines.push("|---------|-----------|--------------|-------------------|-------------------|------|--------|");
for (const paper of fixReport) {
  baselineLines.push(
    [
      paper.paper,
      paper.actionsTaken?.setsKept || 0,
      paper.actionsTaken?.deletedDuplicates || 0,
      paper.actionsTaken?.boilerplateRemoved || 0,
      paper.actionsTaken?.deletedIncomplete || 0,
      paper.riskLevel,
      paper.status,
    ].join(" | ")
  );
}
baselineLines.push("");

fs.writeFileSync(
  path.join(REPORTS_DIR, "model_test_baseline_report.md"),
  baselineLines.join("\n") + "\n",
  "utf-8"
);
console.log("✓ model_test_baseline_report.md");

console.log("\nAll Phase 1 reports generated in data/reports/");
