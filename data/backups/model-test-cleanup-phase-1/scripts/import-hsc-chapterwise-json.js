/**
 * Import chapterWise high-priority JSON into public quiz-data (chapter scope).
 *
 * Usage:
 *   node scripts/import-hsc-chapterwise-json.js data/imports/hsc-chemistry-1st-paper-chapterwise-5-high-priority-sets.json chemistry-1st-paper
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const BACKEND_ANSWERS = path.join(ROOT, "backend", "data", "answers");

const LABEL_TO_LETTER = { ক: "A", খ: "B", গ: "C", ঘ: "D" };
const LETTER_INDEX = { A: 0, B: 1, C: 2, D: 3 };

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function normalizeOptionsArray(options) {
  if (!Array.isArray(options)) return [];
  if (options.length && (options[0]?.label != null || options[0]?.key != null)) {
    const order = ["ক", "খ", "গ", "ঘ"];
    const byLabel = {};
    for (const opt of options) {
      const label = String(opt.label ?? opt.key ?? "").trim();
      byLabel[label] = String(opt.text ?? "").trim();
    }
    return order.map((label) => ({ text: byLabel[label] ?? "" }));
  }
  return options;
}

function convertQuestion(q, setId, subjectSlug) {
  const opts = normalizeOptionsArray(q.options);
  const optionA = String(opts[0]?.text ?? "").trim();
  const optionB = String(opts[1]?.text ?? "").trim();
  const optionC = String(opts[2]?.text ?? "").trim();
  const optionD = String(opts[3]?.text ?? "").trim();
  const correctOption = LABEL_TO_LETTER[String(q.correctOption ?? "").trim()] ?? "A";
  const questionText = String(q.question ?? "").trim();
  const explanation = String(q.shortSolution ?? q.explanation ?? "").trim();
  const id =
    String(q.id ?? "").trim() ||
    `${setId}-q${String(q.questionNo ?? q.questionNumber ?? 0).padStart(2, "0")}`;

  return {
    mega: {
      id,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      explanation,
      chapter: String(q.chapter ?? "").padStart(2, "0"),
      topic: String(q.topic ?? q.chapterName ?? "").trim(),
      difficulty: String(q.difficulty ?? "Board Standard").trim(),
    },
    public: {
      id,
      subject: subjectSlug,
      chapter: setId,
      text: questionText,
      options: [optionA, optionB, optionC, optionD],
      image: null,
      timeLimit: 45,
    },
    answer: {
      correctOption: [optionA, optionB, optionC, optionD][LETTER_INDEX[correctOption]] ?? optionA,
      explanation,
    },
  };
}

function writeSetFiles(subjectSlug, slug, megaQuestions, publicQuestions, answers) {
  const pubPath = path.join(PUBLIC, "questions", subjectSlug, `${slug}.json`);
  const priPath = path.join(BACKEND_ANSWERS, subjectSlug, `${slug}.answers.json`);
  ensureDir(path.dirname(pubPath));
  ensureDir(path.dirname(priPath));
  fs.writeFileSync(pubPath, `${JSON.stringify(publicQuestions, null, 2)}\n`, "utf8");

  const answerMap = {};
  for (let i = 0; i < megaQuestions.length; i++) {
    answerMap[megaQuestions[i].id] = answers[i];
  }
  fs.writeFileSync(priPath, `${JSON.stringify(answerMap, null, 2)}\n`, "utf8");
}

function updateMegaJson(subjectSlug, level, slug, megaQuestions, meta) {
  const megaPath = path.join(PUBLIC, "quiz-data", level, `${subjectSlug}.json`);
  const mega = JSON.parse(fs.readFileSync(megaPath, "utf8"));
  if (!mega.modelTests) mega.modelTests = {};
  if (!mega.modelTestsMeta) mega.modelTestsMeta = {};

  mega.modelTests[slug] = megaQuestions;
  mega.modelTestsMeta[slug] = {
    displayTitle: meta.displayTitle,
    name: meta.displayTitle,
    scope: "chapter",
    tags: meta.tags,
    chaptersCovered: meta.chaptersCovered,
    durationMinutes: meta.durationMinutes,
    questionCount: megaQuestions.length,
    importance: "high",
  };

  fs.writeFileSync(megaPath, `${JSON.stringify(mega, null, 2)}\n`, "utf8");
}

function updateModelTestsIndex(subjectSlug, level, slug, meta) {
  const indexPath = path.join(
    PUBLIC,
    "quiz-data",
    level,
    `${subjectSlug}.model-tests.index.json`,
  );
  if (!fs.existsSync(indexPath)) return;
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  if (!index.modelTests) index.modelTests = {};
  index.modelTests[slug] = {
    questionCount: meta.questionCount,
    scope: "chapter",
    displayTitle: meta.displayTitle,
    durationMinutes: meta.durationMinutes,
    importance: "high",
    tags: meta.tags,
    chaptersCovered: meta.chaptersCovered,
  };
  fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
}

function updateSubjectIndex(subjectSlug, slug, meta) {
  const indexPath = path.join(PUBLIC, "questions", subjectSlug, "index.json");
  if (!fs.existsSync(indexPath)) return;
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  if (!index.modelTests) index.modelTests = [];

  const entry = {
    id: slug,
    title: meta.displayTitle,
    questionCount: meta.questionCount,
    scope: "chapter",
    importance: "high",
    tags: meta.tags,
    chaptersCovered: meta.chaptersCovered,
  };
  const existing = index.modelTests.find((m) => m.id === slug);
  if (existing) Object.assign(existing, entry);
  else index.modelTests.push(entry);

  fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
}

function importChapterwise(sourcePath, subjectSlug, level = "hsc") {
  const abs = path.isAbsolute(sourcePath) ? sourcePath : path.join(ROOT, sourcePath);
  if (!fs.existsSync(abs)) {
    console.error(`❌ Source not found: ${abs}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(abs, "utf8"));
  const chapters = raw.chapterWise ?? [];
  if (!chapters.length) {
    console.error("❌ No chapterWise[] in source JSON");
    process.exit(1);
  }

  console.log(`\n📚 Importing chapter-wise sets → ${subjectSlug}`);
  console.log(`   Chapters: ${chapters.length}`);
  console.log(`   Source: ${path.basename(abs)}`);

  let setCount = 0;
  let questionCount = 0;

  for (const ch of chapters) {
    const chapterNo = String(ch.chapter ?? "").padStart(2, "0");
    const chapterName = String(ch.chapterName ?? "").trim();

    for (const set of ch.sets ?? []) {
      const slug = String(set.id ?? "").trim();
      if (!slug || !Array.isArray(set.questions) || !set.questions.length) {
        console.warn(`   ⚠️  Skip invalid set in chapter ${chapterNo}`);
        continue;
      }

      const converted = set.questions.map((q) => convertQuestion(q, slug, subjectSlug));
      const megaQuestions = converted.map((c) => c.mega);
      const publicQuestions = converted.map((c) => c.public);
      const answers = converted.map((c) => c.answer);

      const meta = {
        displayTitle: String(set.title ?? `Chapter ${chapterNo} Model Test`).trim(),
        tags: ["chapter-wise", "high-priority"],
        chaptersCovered: [{ chapter: chapterNo, chapterName }],
        durationMinutes: 25,
        questionCount: megaQuestions.length,
      };

      writeSetFiles(subjectSlug, slug, megaQuestions, publicQuestions, answers);
      updateMegaJson(subjectSlug, level, slug, megaQuestions, meta);
      updateModelTestsIndex(subjectSlug, level, slug, meta);
      updateSubjectIndex(subjectSlug, slug, meta);

      setCount += 1;
      questionCount += megaQuestions.length;
      console.log(`   ✅ ${slug} — ${megaQuestions.length} questions`);
    }
  }

  console.log(`\n✅ Chapter-wise import complete: ${setCount} sets, ${questionCount} questions.\n`);
}

const sourcePath = process.argv[2];
const subjectSlug = process.argv[3];
if (!sourcePath || !subjectSlug) {
  console.error(
    "Usage: node scripts/import-hsc-chapterwise-json.js <path-to-json> <subject-slug>",
  );
  process.exit(1);
}

importChapterwise(sourcePath, subjectSlug);
