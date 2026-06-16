/**
 * Generate missing backend answer files for public question sets.
 * Reads source data from:
 *   - Backup quiz-data for HSC ICT chapter model tests (29 sets)
 *   - Quarantine files for chapter-2-split sets (5 sets)
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BACKEND_ANSWERS = path.join(ROOT, "backend", "data", "answers");
const BACKUP_QUIZ_DATA = path.join(ROOT, "data", "backups", "quiz-fix-2026-06-13", "public", "quiz-data");
const QUARANTINE_DIR = path.join(ROOT, "data", "quarantine", "ict");
const PUBLIC_QUESTIONS = path.join(ROOT, "public", "questions");

const missingSets = [
  // Chapter-2-split sets (from quarantine)
  { setId: "chapter-2-split-01", subject: "ict", source: "quarantine" },
  { setId: "chapter-2-split-02", subject: "ict", source: "quarantine" },
  { setId: "chapter-2-split-03", subject: "ict", source: "quarantine" },
  { setId: "chapter-2-split-04", subject: "ict", source: "quarantine" },
  { setId: "chapter-2-split-05", subject: "ict", source: "quarantine" },
  // HSC ICT chapter model tests (from backup quiz-data)
  { setId: "hsc-ict-chapter-01-model-test-01", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-01-model-test-02", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-01-model-test-03", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-01-model-test-04", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-01-model-test-05", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-01-model-test-06", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-01-model-test-07", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-01-model-test-08", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-01-model-test-09", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-01-model-test-10", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-02-model-test-02", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-02-model-test-03", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-02-model-test-04", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-02-model-test-05", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-02-model-test-06", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-02-model-test-07", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-02-model-test-08", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-02-model-test-09", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-02-model-test-10", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-03-model-test-01", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-03-model-test-02", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-03-model-test-03", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-03-model-test-04", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-03-model-test-05", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-03-model-test-06", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-03-model-test-07", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-03-model-test-08", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-03-model-test-09", subject: "ict", source: "backup" },
  { setId: "hsc-ict-chapter-03-model-test-10", subject: "ict", source: "backup" },
];

const LABEL_MAP = { A: 0, B: 1, C: 2, D: 3, ক: 0, খ: 1, গ: 2, ঘ: 3 };

function generateAnswersFromBackupQuestions(questions, setId) {
  const answers = {};
  for (const q of questions) {
    const qId = q.id || `${setId}-q${Object.keys(answers).length + 1}`;
    const options = [
      q.optionA || q.options?.[0] || "",
      q.optionB || q.options?.[1] || "",
      q.optionC || q.options?.[2] || "",
      q.optionD || q.options?.[3] || "",
    ];

    let correctIdx = 0;
    const co = (q.correctOption || "A").toString().trim();
    if (q.correctOptionIndex !== undefined && q.correctOptionIndex !== null) {
      correctIdx = Math.min(3, Math.max(0, parseInt(q.correctOptionIndex, 10)));
    } else if (LABEL_MAP[co] !== undefined) {
      correctIdx = LABEL_MAP[co];
    } else {
      const num = parseInt(co, 10);
      if (!isNaN(num) && num >= 1 && num <= 4) {
        correctIdx = num - 1;
      }
    }

    const correctText = options[correctIdx] || options[0] || "";
    answers[qId] = {
      correctOption: correctText,
      explanation: q.explanation || "",
    };
  }
  return answers;
}

function generateAnswersFromQuarantine(entry, setId) {
  const answers = {};
  const questions = entry.questions || [];
  for (const q of questions) {
    const qId = q.id || `${setId}-q${Object.keys(answers).length + 1}`;
    const options = [q.optionA || "", q.optionB || "", q.optionC || "", q.optionD || ""];

    let correctIdx = 0;
    const co = (q.correctOption || "A").toString().trim();
    if (q.correctOptionIndex !== undefined && q.correctOptionIndex !== null) {
      correctIdx = Math.min(3, Math.max(0, parseInt(q.correctOptionIndex, 10)));
    } else if (LABEL_MAP[co] !== undefined) {
      correctIdx = LABEL_MAP[co];
    } else {
      const num = parseInt(co, 10);
      if (!isNaN(num) && num >= 1 && num <= 4) {
        correctIdx = num - 1;
      }
    }

    const correctText = options[correctIdx] || "";
    answers[qId] = {
      correctOption: correctText,
      explanation: q.explanation || "",
    };
  }
  return answers;
}

let generated = 0;
let skipped = 0;
let errors = [];

// Load backup quiz data once
const backupIctPath = path.join(BACKUP_QUIZ_DATA, "hsc", "ict.json");
let backupIct = null;
try {
  backupIct = JSON.parse(fs.readFileSync(backupIctPath, "utf8"));
} catch (e) {
  errors.push(`Cannot read backup quiz data: ${e.message}`);
}

for (const set of missingSets) {
  const outPath = path.join(BACKEND_ANSWERS, set.subject, `${set.setId}.answers.json`);

  // Skip if already exists
  if (fs.existsSync(outPath)) {
    skipped++;
    continue;
  }

  let answers = null;

  if (set.source === "backup") {
    if (!backupIct) {
      errors.push(`No backup data for ${set.setId}`);
      continue;
    }
    const questions = backupIct.modelTests?.[set.setId];
    if (!questions || questions.length === 0) {
      errors.push(`No questions in backup for ${set.setId}`);
      continue;
    }
    answers = generateAnswersFromBackupQuestions(questions, set.setId);
  } else if (set.source === "quarantine") {
    const qPath = path.join(QUARANTINE_DIR, `${set.setId}.json`);
    if (!fs.existsSync(qPath)) {
      // Try alternate path
      const altPath = path.join(ROOT, "data", "quarantine", set.subject, `${set.setId}.json`);
      if (fs.existsSync(altPath)) {
        try {
          const entry = JSON.parse(fs.readFileSync(altPath, "utf8"));
          answers = generateAnswersFromQuarantine(entry, set.setId);
        } catch (e) {
          errors.push(`Error reading quarantine ${altPath}: ${e.message}`);
        }
      } else {
        errors.push(`Quarantine file not found for ${set.setId}`);
      }
    } else {
      try {
        const entry = JSON.parse(fs.readFileSync(qPath, "utf8"));
        answers = generateAnswersFromQuarantine(entry, set.setId);
      } catch (e) {
        errors.push(`Error reading quarantine ${qPath}: ${e.message}`);
      }
    }
  }

  if (answers && Object.keys(answers).length > 0) {
    const dir = path.dirname(outPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(answers, null, 2), "utf8");
    generated++;
    console.log(`  ✓ ${set.setId} (${Object.keys(answers).length} answers)`);
  } else {
    errors.push(`No answers generated for ${set.setId}`);
  }
}

console.log(`\nDone: ${generated} generated, ${skipped} skipped, ${errors.length} errors`);
if (errors.length > 0) {
  console.log("Errors:");
  errors.forEach((e) => console.log(`  ✗ ${e}`));
}
