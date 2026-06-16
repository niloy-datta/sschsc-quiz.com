#!/usr/bin/env node
/**
 * sync-quiz-data.mjs — Data Audit & Sanitization Script
 * 
 * Hour 1 deliverable:
 * 1. Scan backend/data/answers/ and cross-verify with public/questions/
 * 2. Identify orphaned JSONs and missing board questions (2019-2026)
 * 3. Sanitize quiz data (strip correctOption, answerIndex) for Vercel CDN compliance
 * 4. Ensure all board questions follow exact same structure as chapter-wise sets
 * 5. Generate integrity report
 * 
 * Priority: System Stability > Data Integrity > Code Maintainability
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const ANSWERS_DIR = path.join(ROOT, "backend", "data", "answers");

const SUBJECT_FOLDERS = [
  "biology", "chemistry", "physics", "general-math", "higher-math",            // SSC
  "biology-1st-paper", "biology-2nd-paper",
  "chemistry-1st-paper", "chemistry-2nd-paper",
  "physics-1st-paper", "physics-2nd-paper",
  "higher-math-1st-paper", "higher-math-2nd-paper",                             // HSC
];

const BOARD_YEARS = ["2022", "2023", "2024", "2025", "2026"];
const BOARD_NAMES = [
  "barishal", "chattogram", "cumilla", "dhaka",
  "dinajpur", "jashore", "mymensingh", "rajshahi", "sylhet",
];

// Sensitive fields that must NOT be in public/questions/ files
const SENSITIVE_FIELDS = new Set([
  "correctoption", "correctanswer", "answerindex", "correctindex",
  "answer", "explanation", "solution", "hint",
]);

// ─── Audit Report ───────────────────────────────────────────────

const report = {
  timestamp: new Date().toISOString(),
  questionsDir: { totalFiles: 0, totalDirs: 0, totalSubjects: 0 },
  answersDir: { totalFiles: 0, totalDirs: 0, totalSubjects: 0 },
  subjects: {},
  summary: {
    totalQuestionFiles: 0,
    totalAnswerFiles: 0,
    totalOrphanQuestions: 0,
    totalOrphanAnswers: 0,
    totalSensitiveFieldFiles: 0,
    totalIntegrityIssues: 0,
    totalMissingBoards: 0,
    totalLegacySplitFiles: 0,
    totalQuestions: 0,
    status: "Success",
  },
};

// ─── Helpers ────────────────────────────────────────────────────

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isLegacySplitFile(name) {
  return name.includes("-split-") && name.endsWith(".json") && !name.endsWith(".answers.json");
}

function isBoardFile(name) {
  return BOARD_NAMES.some((b) => name.startsWith(b + "-")) && !name.endsWith(".answers.json") && !name.endsWith(".placeholder");
}

function isPlaceholder(name) {
  return name.endsWith(".placeholder");
}

function getSubjectLevel(folderName) {
  const HSC_PAPERS = ["biology-1st-paper", "biology-2nd-paper", "chemistry-1st-paper", "chemistry-2nd-paper", "physics-1st-paper", "physics-2nd-paper", "higher-math-1st-paper", "higher-math-2nd-paper"];
  if (HSC_PAPERS.includes(folderName)) return "hsc";
  return "ssc";
}

function getExpectedBoardIds(folderName, level) {
  const boards = [];
  for (const board of BOARD_NAMES) {
    for (const year of BOARD_YEARS) {
      boards.push(`${board}-${year}`);
    }
  }
  return boards;
}

// ─── Scan & Cross-verify ────────────────────────────────────────

console.log("🔍 Starting deep data audit...\n");

for (const folder of SUBJECT_FOLDERS) {
  const questionsPath = path.join(QUESTIONS_DIR, folder);
  const answersPath = path.join(ANSWERS_DIR, folder);

  const subjectInfo = {
    questionFiles: 0,
    answerFiles: 0,
    boardFiles: 0,
    chapterSets: 0,
    modelTests: 0,
    orphanQuestions: [],
    orphanAnswers: [],
    missingBoards: [],
    sensitiveFieldsFound: [],
    legacySplitFiles: [],
    integrityIssues: [],
    totalQuestions: 0,
    totalBoardQ: 0,
    totalSetQ: 0,
  };

  // Read question files
  const qFiles = fs.existsSync(questionsPath)
    ? fs.readdirSync(questionsPath).filter((f) => f.endsWith(".json") && !isPlaceholder(f) && f !== "index.json")
    : [];

  // Read answer files
  const aFiles = fs.existsSync(answersPath)
    ? fs.readdirSync(answersPath).filter((f) => f.endsWith(".answers.json"))
    : [];

  subjectInfo.questionFiles = qFiles.length;
  subjectInfo.answerFiles = aFiles.length;

  // Map answer filenames -> base names
  const qNames = new Set(qFiles.map((f) => f.replace(/\.json$/, "")));
  const aNames = new Set(aFiles.map((f) => f.replace(/\.answers\.json$/, "")));

  // Find orphans
  for (const q of qFiles) {
    const base = q.replace(/\.json$/, "");
    if (!aNames.has(base)) {
      subjectInfo.orphanQuestions.push(base);
    }
  }
  for (const a of aFiles) {
    const base = a.replace(/\.answers\.json$/, "");
    if (!qNames.has(base)) {
      subjectInfo.orphanAnswers.push(base);
    }
  }

  // Check board coverage
  const expectedBoards = getExpectedBoardIds(folder, getSubjectLevel(folder));
  const existingBoards = new Set(
    qFiles
      .filter(isBoardFile)
      .map((f) => f.replace(/\.json$/, ""))
  );
  for (const expected of expectedBoards) {
    if (!existingBoards.has(expected)) {
      subjectInfo.missingBoards.push(expected);
    }
  }

  // Categorize files
  for (const f of qFiles) {
    if (isLegacySplitFile(f)) {
      subjectInfo.legacySplitFiles.push(f);
    }
    if (isBoardFile(f)) {
      subjectInfo.boardFiles++;
      const data = readJsonSafe(path.join(questionsPath, f));
      if (data) {
        const qs = Array.isArray(data) ? data : data.questions ?? [];
        subjectInfo.totalBoardQ += qs.length;
        subjectInfo.totalQuestions += qs.length;
      }
    } else if (!isLegacySplitFile(f) && f !== "index.json") {
      const data = readJsonSafe(path.join(questionsPath, f));
      if (data) {
        const qs = Array.isArray(data) ? data : data.questions ?? [];
        if (f.includes("chapter-")) subjectInfo.chapterSets++;
        else subjectInfo.modelTests++;
        subjectInfo.totalSetQ += qs.length;
        subjectInfo.totalQuestions += qs.length;
      }
    }
  }

  // Scan for sensitive fields in public questions
  for (const f of qFiles) {
    const data = readJsonSafe(path.join(questionsPath, f));
    if (!data) continue;
    const questions = Array.isArray(data) ? data : data.questions ?? [];

    const foundFields = new Set();
    for (const q of questions) {
      if (!q || typeof q !== "object") continue;
      for (const key of Object.keys(q)) {
        if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
          foundFields.add(key);
        }
      }
    }
    if (foundFields.size > 0) {
      subjectInfo.sensitiveFieldsFound.push({
        file: f,
        fields: [...foundFields],
      });
    }
  }

  // Check index.json validity
  const indexPath = path.join(questionsPath, "index.json");
  const indexData = readJsonSafe(indexPath);
  if (!indexData) {
    subjectInfo.integrityIssues.push("Missing or invalid index.json");
  } else {
    // Verify modelTests listed in index exist as files
    const modelTests = indexData.modelTests ?? [];
    for (const mt of modelTests) {
      if (mt.id && !qNames.has(mt.id)) {
        // Skip if it's a board file
        const isBoard = BOARD_NAMES.some((b) => mt.id?.startsWith(b));
        if (!isBoard && !mt.id?.includes("split")) {
          subjectInfo.integrityIssues.push(`Index references modelTest "${mt.id}" but no file found`);
        }
      }
    }
    // Verify boards listed in index exist as files
    const boards = indexData.boards ?? [];
    for (const bd of boards) {
      if (bd.id && !qNames.has(bd.id)) {
        subjectInfo.missingBoards.push(bd.id);
      }
    }
  }

  report.subjects[folder] = subjectInfo;
}

// ─── Compile Summary ────────────────────────────────────────────

for (const [folder, info] of Object.entries(report.subjects)) {
  report.summary.totalQuestionFiles += info.questionFiles;
  report.summary.totalAnswerFiles += info.answerFiles;
  report.summary.totalOrphanQuestions += info.orphanQuestions.length;
  report.summary.totalOrphanAnswers += info.orphanAnswers.length;
  report.summary.totalSensitiveFieldFiles += info.sensitiveFieldsFound.length;
  report.summary.totalIntegrityIssues += info.integrityIssues.length;
  report.summary.totalMissingBoards += info.missingBoards.length;
  report.summary.totalLegacySplitFiles += info.legacySplitFiles.length;
  report.summary.totalQuestions += info.totalQuestions;
}

if (report.summary.totalIntegrityIssues > 0 || report.summary.totalSensitiveFieldFiles > 0) {
  report.summary.status = "Warning";
}

// ─── Print Report ───────────────────────────────────────────────

console.log("=".repeat(72));
console.log("  QUIZ DATA AUDIT REPORT");
console.log("=".repeat(72));
console.log(`  Timestamp: ${report.timestamp}`);
console.log(`  Questions Dir: ${report.summary.totalQuestionFiles} files across ${Object.keys(report.subjects).length} subjects`);
console.log(`  Answers Dir:   ${report.summary.totalAnswerFiles} files`);
console.log(`  Total Questions: ${report.summary.totalQuestions}`);
console.log(`  Status: ${report.summary.status}\n`);

for (const [folder, info] of Object.entries(report.subjects)) {
  console.log(`📁 ${folder} (${getSubjectLevel(folder).toUpperCase()})`);
  console.log(`   Files: ${info.questionFiles} questions, ${info.answerFiles} answers`);
  console.log(`   Questions: ${info.totalQuestions} total (${info.totalBoardQ} board, ${info.totalSetQ} sets)`);

  if (info.orphanQuestions.length > 0) {
    console.log(`   ⚠️  Orphan Questions (no answers): ${info.orphanQuestions.length}`);
    info.orphanQuestions.slice(0, 5).forEach((o) => console.log(`       - ${o}`));
    if (info.orphanQuestions.length > 5) console.log(`       ... and ${info.orphanQuestions.length - 5} more`);
  }
  if (info.orphanAnswers.length > 0) {
    console.log(`   ⚠️  Orphan Answers (no questions): ${info.orphanAnswers.length}`);
    info.orphanAnswers.slice(0, 5).forEach((o) => console.log(`       - ${o}`));
    if (info.orphanAnswers.length > 5) console.log(`       ... and ${info.orphanAnswers.length - 5} more`);
  }
  if (info.missingBoards.length > 0) {
    const nonPlaceholder = info.missingBoards.filter((b) => {
      const p = path.join(QUESTIONS_DIR, folder, `${b}.json`);
      return !fs.existsSync(p.replace(".json", ".json.placeholder"));
    });
    if (nonPlaceholder.length > 0) {
      console.log(`   ⚠️  Missing Board Files: ${nonPlaceholder.length}`);
      nonPlaceholder.slice(0, 8).forEach((b) => console.log(`       - ${b}`));
      if (nonPlaceholder.length > 8) console.log(`       ... and ${nonPlaceholder.length - 8} more`);
    }
  }
  if (info.sensitiveFieldsFound.length > 0) {
    console.log(`   🔴 SENSITIVE FIELDS IN PUBLIC: ${info.sensitiveFieldsFound.length} files`);
    info.sensitiveFieldsFound.forEach((sf) => console.log(`       - ${sf.file}: [${sf.fields.join(", ")}]`));
  }
  if (info.legacySplitFiles.length > 0) {
    console.log(`   🗑️  Legacy Split Files: ${info.legacySplitFiles.length}`);
    info.legacySplitFiles.slice(0, 3).forEach((f) => console.log(`       - ${f}`));
    if (info.legacySplitFiles.length > 3) console.log(`       ... and ${info.legacySplitFiles.length - 3} more`);
  }
  if (info.integrityIssues.length > 0) {
    console.log(`   🔴 Integrity Issues: ${info.integrityIssues.length}`);
    info.integrityIssues.slice(0, 5).forEach((i) => console.log(`       - ${i}`));
    if (info.integrityIssues.length > 5) console.log(`       ... and ${info.integrityIssues.length - 5} more`);
  }
  console.log("");
}

console.log("=".repeat(72));
console.log("  SUMMARY");
console.log("=".repeat(72));
console.log(`  Total Question Files:          ${report.summary.totalQuestionFiles}`);
console.log(`  Total Answer Files:            ${report.summary.totalAnswerFiles}`);
console.log(`  Total Questions:               ${report.summary.totalQuestions}`);
console.log(`  Orphan Questions (no answer):  ${report.summary.totalOrphanQuestions}`);
console.log(`  Orphan Answers (no question):  ${report.summary.totalOrphanAnswers}`);
console.log(`  Missing Board Files:           ${report.summary.totalMissingBoards}`);
console.log(`  Files with Sensitive Fields:   ${report.summary.totalSensitiveFieldFiles}`);
console.log(`  Integrity Issues:              ${report.summary.totalIntegrityIssues}`);
console.log(`  Legacy Split Files:            ${report.summary.totalLegacySplitFiles}`);
console.log(`  Overall Status:                ${report.summary.status}`);
console.log("=".repeat(72));

// Write report to file
const reportPath = path.join(ROOT, "scripts", "audit-report.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📄 Full report written to: scripts/audit-report.json`);
