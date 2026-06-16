/**
 * Materialize missing ssc-{subject}-chapter-NN-model-test-MM.json files
 * from chapter-NN-split-MM.json when available, and prune ghost index entries.
 *
 * Usage: node scripts/fix-missing-ssc-model-tests.js [subject|all]
 * Examples: chemistry, biology, higher-math, general-math, all
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const ANSWERS_DIR = path.join(ROOT, "backend", "data", "answers");

function pad2(n) {
  return String(n).padStart(2, "0");
}

function loadJson(fp) {
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

function writeJson(fp, data) {
  fs.writeFileSync(fp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function collectQuestions(data) {
  return Array.isArray(data) ? data : data.questions ?? [];
}

function rewriteId(id, fromSet, toSet) {
  return String(id).replace(fromSet, toSet);
}

function normalizeAnswerEntry(entry, question) {
  const options = question?.options ?? [];
  let answerIndex =
    typeof entry.answerIndex === "number" ? entry.answerIndex : null;

  if (answerIndex == null && entry.answer != null) {
    const idx = options.findIndex(
      (o) => String(o).trim() === String(entry.answer).trim(),
    );
    if (idx >= 0) answerIndex = idx;
  }

  if (answerIndex == null && entry.correctOption != null) {
    const idx = options.findIndex(
      (o) => String(o).trim() === String(entry.correctOption).trim(),
    );
    if (idx >= 0) answerIndex = idx;
  }

  if (answerIndex == null) answerIndex = 0;

  return {
    answer: options[answerIndex] ?? entry.answer ?? entry.correctOption ?? "",
    answerIndex,
    explanation: String(entry.explanation ?? "").trim(),
    topic: String(entry.topic ?? question?.chapter ?? "general"),
    difficulty: Number(entry.difficulty ?? 1200),
  };
}

function materializeFromSplit(subject, modelSetId, splitSetId) {
  const qSrc = path.join(QUESTIONS_DIR, subject, `${splitSetId}.json`);
  const qDest = path.join(QUESTIONS_DIR, subject, `${modelSetId}.json`);
  const aSrc = path.join(ANSWERS_DIR, subject, `${splitSetId}.answers.json`);
  const aDest = path.join(ANSWERS_DIR, subject, `${modelSetId}.answers.json`);

  if (!fs.existsSync(qSrc)) return false;

  const raw = loadJson(qSrc);
  const questions = collectQuestions(raw).map((q) => ({
    ...q,
    id: rewriteId(q.id, splitSetId, modelSetId),
    chapter: modelSetId,
    subject,
  }));

  if (questions.length === 0) return false;

  writeJson(qDest, questions);

  const answersOut = {};
  if (fs.existsSync(aSrc)) {
    const answersIn = loadJson(aSrc);
    for (const [key, val] of Object.entries(answersIn)) {
      const newKey = rewriteId(key, splitSetId, modelSetId);
      const qNum = newKey.match(/-q(\d+)$/)?.[1];
      const question = questions.find((q) => q.id.endsWith(`-q${qNum}`));
      answersOut[newKey] = normalizeAnswerEntry(val, question);
    }
  } else {
    for (const q of questions) {
      answersOut[q.id] = {
        answer: q.options?.[0] ?? "",
        answerIndex: 0,
        explanation: "",
        topic: modelSetId,
        difficulty: 1200,
      };
    }
  }

  fs.mkdirSync(path.dirname(aDest), { recursive: true });
  writeJson(aDest, answersOut);
  return true;
}

function fixSubject(subject) {
  const subjectDir = path.join(QUESTIONS_DIR, subject);
  const indexPath = path.join(subjectDir, "index.json");
  if (!fs.existsSync(indexPath)) {
    console.warn("Skip", subject, "no index");
    return { created: 0, pruned: 0 };
  }

  const idx = loadJson(indexPath);
  const disk = new Set(
    fs
      .readdirSync(subjectDir)
      .filter((f) => f.endsWith(".json") && f !== "index.json")
      .map((f) => f.replace(/\.json$/, "")),
  );

  const prefix = `ssc-${subject}-chapter-`;
  let created = 0;

  for (const entry of idx.modelTests ?? []) {
    const modelSetId = entry.id;
    if (!modelSetId.startsWith(prefix) || !modelSetId.includes("-model-test-")) {
      continue;
    }
    if (disk.has(modelSetId)) continue;

    const match = modelSetId.match(
      /^ssc-[\w-]+-chapter-(\d+)-model-test-(\d+)$/,
    );
    if (!match) continue;

    const [, ch, num] = match;
    const splitSetId = `chapter-${pad2(ch)}-split-${pad2(num)}`;

    if (materializeFromSplit(subject, modelSetId, splitSetId)) {
      disk.add(modelSetId);
      created++;
      console.log("CREATED", subject, modelSetId, "<-", splitSetId);
    }
  }

  const before = idx.modelTests.length;
  idx.modelTests = (idx.modelTests ?? []).filter((entry) => {
    if (!entry.id.includes("-model-test-")) return true;
    if (disk.has(entry.id)) return true;
    console.log("PRUNE index", subject, entry.id);
    return false;
  });
  const pruned = before - idx.modelTests.length;

  writeJson(indexPath, idx);
  return { created, pruned };
}

const DEFAULT_SUBJECTS = [
  "chemistry",
  "biology",
  "physics",
  "higher-math",
  "general-math",
];

function listSubjects() {
  return fs
    .readdirSync(QUESTIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(QUESTIONS_DIR, d.name, "index.json")))
    .map((d) => d.name)
    .sort();
}

function main() {
  const arg = (process.argv[2] ?? "all").toLowerCase();
  const subjects =
    arg === "all"
      ? listSubjects().filter((s) => DEFAULT_SUBJECTS.includes(s) || s.endsWith("-math") || ["physics", "chemistry", "biology"].includes(s))
      : [arg.replace(/[^a-z0-9-]/g, "")];

  let totalCreated = 0;
  let totalPruned = 0;

  for (const subject of subjects) {
    const { created, pruned } = fixSubject(subject);
    totalCreated += created;
    totalPruned += pruned;
    console.log(`${subject}: created ${created}, pruned ${pruned}`);
  }

  console.log(`Done: ${totalCreated} files created, ${totalPruned} index entries pruned`);
}

main();
