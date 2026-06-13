/**
 * Export boardQuestions from public/quiz-data/{level}/{subject}.json
 * into public/questions/{subject}/{board}-{year}.json (+ answer files).
 *
 * Also merges board-scoped modelTests (e.g. rajshahi-board-2024).
 *
 * Usage:
 *   node scripts/import-board-from-mega.js physics-2nd-paper
 *   node scripts/import-board-from-mega.js physics-2nd-paper hsc
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const BACKEND_ANSWERS = path.join(ROOT, "backend", "data", "answers");

const BOARD_ORDER = [
  "barishal",
  "chattogram",
  "cumilla",
  "dhaka",
  "dinajpur",
  "jashore",
  "mymensingh",
  "rajshahi",
  "sylhet",
];

const BOARD_FILE_RE =
  /^([a-z]+)-(\d{4})$/;

const BOARD_MODEL_RE =
  /^([a-z]+)-board-(\d{4})$/;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanOpt(opt) {
  return opt ? String(opt).trim() : "";
}

function parseCorrectIndex(q) {
  if (q.correctOptionIndex != null) {
    const n = Number(q.correctOptionIndex);
    if (!Number.isNaN(n)) return Math.max(0, Math.min(3, n));
  }
  if (q.answerIndex != null) {
    const n = Number(q.answerIndex);
    if (!Number.isNaN(n)) return Math.max(0, Math.min(3, n));
  }
  const co = String(q.correctOption || q.correct || "A")
    .trim()
    .toUpperCase();
  if (co === "A" || co === "ক" || co === "1") return 0;
  if (co === "B" || co === "খ" || co === "2") return 1;
  if (co === "C" || co === "গ" || co === "3") return 2;
  if (co === "D" || co === "ঘ" || co === "4") return 3;
  return 0;
}

function processQuestionList(questions, subjectSlug, setId, chapterTitle) {
  const publicQuestions = [];
  const privateAnswers = {};

  for (let idx = 0; idx < questions.length; idx++) {
    const q = questions[idx];
    const qId = q.id || `${subjectSlug}_${setId}_q${idx + 1}`;
    const text = cleanOpt(q.questionText || q.question || q.text);
    if (!text) continue;

    let options = [];
    if (Array.isArray(q.options)) {
      options = q.options.map(cleanOpt);
    } else {
      options = [
        cleanOpt(q.optionA || q.option_a),
        cleanOpt(q.optionB || q.option_b),
        cleanOpt(q.optionC || q.option_c),
        cleanOpt(q.optionD || q.option_d),
      ];
    }
    while (options.length < 4) options.push(`Option ${options.length + 1}`);
    options = options.slice(0, 4);

    const correctIdx = parseCorrectIndex(q);
    const correctAnsText = options[correctIdx];

    publicQuestions.push({
      id: qId,
      subject: subjectSlug,
      chapter: chapterTitle,
      text,
      options,
      image: q.image ?? null,
      timeLimit: q.timeLimit ?? 45,
    });

    privateAnswers[qId] = {
      correctOption: correctAnsText,
      explanation: cleanOpt(q.explanation || q.shortSolution),
    };
  }

  return { publicQuestions, privateAnswers };
}

function titleCaseBoard(board) {
  if (board === "chattogram") return "Chattogram";
  if (board === "cumilla") return "Cumilla";
  if (board === "barishal") return "Barishal";
  return board.charAt(0).toUpperCase() + board.slice(1);
}

function writeBoardSet(subjectSlug, setId, displayTitle, questions) {
  const { publicQuestions, privateAnswers } = processQuestionList(
    questions,
    subjectSlug,
    setId,
    displayTitle,
  );
  if (!publicQuestions.length) return 0;

  const pubPath = path.join(PUBLIC, "questions", subjectSlug, `${setId}.json`);
  const priPath = path.join(
    BACKEND_ANSWERS,
    subjectSlug,
    `${setId}.answers.json`,
  );
  ensureDir(path.dirname(pubPath));
  ensureDir(path.dirname(priPath));
  fs.writeFileSync(pubPath, `${JSON.stringify(publicQuestions, null, 2)}\n`, "utf8");
  fs.writeFileSync(priPath, `${JSON.stringify(privateAnswers, null, 2)}\n`, "utf8");
  return publicQuestions.length;
}

function mergeQuestionsByText(existing, incoming) {
  const seen = new Set(existing.map((q) => q.text));
  const merged = [...existing];
  for (const q of incoming) {
    if (!seen.has(q.text)) {
      merged.push(q);
      seen.add(q.text);
    }
  }
  return merged;
}

function importSubject(subjectSlug, level = "hsc") {
  const megaPath = path.join(PUBLIC, "quiz-data", level, `${subjectSlug}.json`);
  if (!fs.existsSync(megaPath)) {
    console.error(`❌ Not found: ${megaPath}`);
    process.exit(1);
  }

  const mega = JSON.parse(fs.readFileSync(megaPath, "utf8"));
  const boardQuestions = mega.boardQuestions || {};
  const modelTests = mega.modelTests || {};
  const modelTestsMeta = mega.modelTestsMeta || {};

  const exported = [];
  const years = Object.keys(boardQuestions).sort();

  for (const year of years) {
    const boards = boardQuestions[year];
    if (!boards || typeof boards !== "object") continue;

    for (const board of BOARD_ORDER) {
      const questions = boards[board];
      if (!Array.isArray(questions) || !questions.length) continue;

      const setId = `${board}-${year}`;
      const displayTitle = `${titleCaseBoard(board)} Board ${year}`;
      const count = writeBoardSet(subjectSlug, setId, displayTitle, questions);
      if (count) exported.push({ setId, count, source: "boardQuestions" });
    }
  }

  for (const [key, questions] of Object.entries(modelTests)) {
    if (!Array.isArray(questions) || !questions.length) continue;

    const meta = modelTestsMeta[key] || {};
    const isBoardScoped =
      meta.scope === "board" ||
      (Array.isArray(meta.tags) && meta.tags.includes("board-wise"));

    const match = key.match(BOARD_MODEL_RE);
    if (!match && !isBoardScoped) continue;

    let board;
    let year;
    if (match) {
      board = match[1];
      year = match[2];
    } else {
      const fallback = key.match(BOARD_FILE_RE);
      if (!fallback) continue;
      board = fallback[1];
      year = fallback[2];
    }

    const setId = `${board}-${year}`;
    const displayTitle = `${titleCaseBoard(board)} Board ${year}`;
    const pubPath = path.join(PUBLIC, "questions", subjectSlug, `${setId}.json`);

    if (fs.existsSync(pubPath)) {
      const existing = JSON.parse(fs.readFileSync(pubPath, "utf8"));
      const { publicQuestions } = processQuestionList(
        questions,
        subjectSlug,
        setId,
        displayTitle,
      );
      const merged = mergeQuestionsByText(existing, publicQuestions);
      fs.writeFileSync(pubPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
      exported.push({
        setId,
        count: merged.length,
        source: `modelTests:${key} (merged)`,
      });
    } else {
      const count = writeBoardSet(subjectSlug, setId, displayTitle, questions);
      if (count) exported.push({ setId, count, source: `modelTests:${key}` });
    }
  }

  console.log(`\n📦 ${subjectSlug} (${level})`);
  console.log(`   boardQuestions years: ${years.join(", ") || "none"}`);
  if (!exported.length) {
    console.log("   ⚠️  No board sets exported.");
    return;
  }

  const byYear = {};
  for (const row of exported) {
    const year = row.setId.split("-").pop();
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(row);
  }

  for (const year of Object.keys(byYear).sort()) {
    console.log(`   ${year}:`);
    for (const row of byYear[year]) {
      console.log(`     • ${row.setId} — ${row.count} Q (${row.source})`);
    }
  }
}

const subjectSlug = process.argv[2] || "physics-2nd-paper";
const level = process.argv[3] || "hsc";
importSubject(subjectSlug, level);
