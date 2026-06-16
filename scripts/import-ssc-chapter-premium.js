/**
 * Import SSC chapter-wise premium JSON (chapters[].sets[] format).
 *
 * Usage:
 *   node scripts/import-ssc-chapter-premium.js <subject-slug> <path-to-json>
 *
 * Examples:
 *   node scripts/import-ssc-chapter-premium.js higher-math ssc_higher_math_premium_full/ssc_higher_math_premium.json
 *   node scripts/import-ssc-chapter-premium.js general-math ssc_general_math_premium_full/ssc_general_math_premium.json
 *   node scripts/import-ssc-chapter-premium.js biology ssc_biology_premium_full/ssc_biology_premium.json
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const BACKEND_ANSWERS = path.join(ROOT, "backend", "data", "answers");
const LEVEL = "ssc";

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
  return options.map((opt) => ({ text: String(opt?.text ?? opt ?? "").trim() }));
}

function convertQuestion(q, setId, subjectSlug, chapterNo, chapterName) {
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
      chapter: chapterNo,
      topic: chapterName,
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

function buildSetSlug(subjectSlug, chapterNo, setNo) {
  return `ssc-${subjectSlug}-chapter-${chapterNo}-model-test-${String(setNo).padStart(2, "0")}`;
}

function importPremium(subjectSlug, sourcePath) {
  const abs = path.isAbsolute(sourcePath) ? sourcePath : path.join(ROOT, sourcePath);
  if (!fs.existsSync(abs)) {
    console.error(`❌ Source not found: ${abs}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(abs, "utf8"));
  const chapters = raw.chapters ?? raw.chapterWise ?? [];
  if (!chapters.length) {
    console.error("❌ No chapters[] in source JSON");
    process.exit(1);
  }

  const megaPath = path.join(PUBLIC, "quiz-data", LEVEL, `${subjectSlug}.json`);
  if (!fs.existsSync(megaPath)) {
    console.error(`❌ Mega JSON not found: ${megaPath}`);
    process.exit(1);
  }

  const mega = JSON.parse(fs.readFileSync(megaPath, "utf8"));
  if (!mega.modelTests) mega.modelTests = {};
  if (!mega.modelTestsMeta) mega.modelTestsMeta = {};

  const modelIndexPath = path.join(PUBLIC, "quiz-data", LEVEL, `${subjectSlug}.model-tests.index.json`);
  let modelIndex = null;
  if (fs.existsSync(modelIndexPath)) {
    modelIndex = JSON.parse(fs.readFileSync(modelIndexPath, "utf8"));
    if (!modelIndex.modelTests) modelIndex.modelTests = {};
  }

  const paperName = String(raw.paper ?? subjectSlug).trim();
  console.log(`\n📚 ${paperName} Premium Import`);
  console.log(`   Subject: ${subjectSlug}`);
  console.log(`   Source: ${path.basename(abs)}`);
  console.log(`   Chapters: ${chapters.length}`);

  let setCount = 0;
  let questionCount = 0;
  let replaced = 0;

  for (const ch of chapters) {
    const chapterNo = String(ch.chapter ?? "").padStart(2, "0");
    const chapterName = String(ch.chapterName ?? "").trim();

    for (const set of ch.sets ?? []) {
      const setNo = Number(set.set ?? set.setNo ?? 0);
      if (!setNo || !Array.isArray(set.questions) || !set.questions.length) {
        console.warn(`   ⚠️  Skip invalid set in chapter ${chapterNo}`);
        continue;
      }

      const slug = buildSetSlug(subjectSlug, chapterNo, setNo);
      const existed = Boolean(mega.modelTests[slug]);

      const converted = set.questions.map((q) =>
        convertQuestion(q, slug, subjectSlug, chapterNo, chapterName),
      );
      const megaQuestions = converted.map((c) => c.mega);
      const publicQuestions = converted.map((c) => c.public);
      const answers = converted.map((c) => c.answer);

      const displayTitle = `Chapter ${chapterNo} Model Test ${String(setNo).padStart(2, "0")}`;
      const meta = {
        displayTitle,
        tags: ["chapter-wise", "premium", "model-test"],
        chaptersCovered: [{ chapter: chapterNo, chapterName }],
        durationMinutes: 25,
        questionCount: megaQuestions.length,
      };

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

      mega.modelTests[slug] = megaQuestions;
      mega.modelTestsMeta[slug] = {
        displayTitle: meta.displayTitle,
        name: meta.displayTitle,
        scope: "chapter",
        tags: meta.tags,
        chaptersCovered: meta.chaptersCovered,
        durationMinutes: meta.durationMinutes,
        questionCount: meta.questionCount,
        importance: "high",
      };

      if (modelIndex) {
        modelIndex.modelTests[slug] = {
          questionCount: meta.questionCount,
          scope: "chapter",
          displayTitle: meta.displayTitle,
          durationMinutes: meta.durationMinutes,
          importance: "high",
          tags: meta.tags,
          chaptersCovered: meta.chaptersCovered,
        };
      }

      setCount += 1;
      questionCount += megaQuestions.length;
      if (existed) replaced += 1;
    }

    const chSets = (ch.sets ?? []).length;
    const chQ = (ch.sets ?? []).reduce((a, s) => a + (s.questions?.length ?? 0), 0);
    console.log(`   ✅ Ch${chapterNo} ${chapterName} — ${chSets} sets, ${chQ} MCQ`);
  }

  fs.writeFileSync(megaPath, `${JSON.stringify(mega, null, 2)}\n`, "utf8");
  if (modelIndex) {
    fs.writeFileSync(modelIndexPath, `${JSON.stringify(modelIndex, null, 2)}\n`, "utf8");
  }

  console.log(`\n✅ Premium import complete`);
  console.log(`   Sets imported: ${setCount} (${replaced} replaced existing)`);
  console.log(`   Questions: ${questionCount}`);
  console.log(`   Total sets in mega now: ${Object.keys(mega.modelTests).length}\n`);
}

const subjectSlug = process.argv[2];
const sourcePath = process.argv[3];

if (!subjectSlug || !sourcePath) {
  console.error("Usage: node scripts/import-ssc-chapter-premium.js <subject-slug> <path-to-json>");
  process.exit(1);
}

importPremium(subjectSlug, sourcePath);
