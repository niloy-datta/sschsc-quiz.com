/**
 * Import HSC Board-Analyzed 100-Quality Pack (exam-ready practice sets).
 *
 * Usage:
 *   node scripts/import-hsc-board-analyzed-quality-pack.js [path-to-json]
 *
 * Default source:
 *   hsc_board_analyzed_100_quality_pack/hsc_board_analyzed_100_quality_pack/hsc_board_analyzed_exam_ready_practice_sets.json
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const BACKEND_ANSWERS = path.join(ROOT, "backend", "data", "answers");
const LEVEL = "hsc";

const LABEL_TO_LETTER = { ক: "A", খ: "B", গ: "C", ঘ: "D" };
const LETTER_INDEX = { A: 0, B: 1, C: 2, D: 3 };

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function pad2(n) {
  return String(n).padStart(2, "0");
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

function convertQuestion(q, setId, subjectSlug, setNo) {
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
    `${setId}-q${pad2(q.questionNo ?? q.questionNumber ?? 0)}`;

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
      chapter: pad2(setNo),
      topic: String(q.chapter ?? q.subject ?? "").trim() || "Board Analyzed",
      difficulty: q.qualityScore != null ? `Quality ${q.qualityScore}` : "Board Standard",
      sourceType: q.sourceType ?? null,
      sourceYear: q.sourceYear ?? null,
      sourceBoard: q.sourceBoard ?? null,
      qualityScore: q.qualityScore ?? null,
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
      correctOption:
        String(q.correctAnswerText ?? "").trim() ||
        [optionA, optionB, optionC, optionD][LETTER_INDEX[correctOption]] ||
        optionA,
      explanation,
    },
  };
}

function displayTitleForSet(setNo) {
  return `Board Analyzed Premium Set ${pad2(setNo)}`;
}

function importPack(sourcePath) {
  const abs = path.isAbsolute(sourcePath) ? sourcePath : path.join(ROOT, sourcePath);
  if (!fs.existsSync(abs)) {
    console.error(`❌ Source not found: ${abs}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(abs, "utf8"));
  const papers = raw.papers ?? [];
  if (!papers.length) {
    console.error("❌ No papers[] in source JSON");
    process.exit(1);
  }

  console.log(`\n📦 HSC Board-Analyzed 100-Quality Pack Import`);
  console.log(`   Source: ${path.basename(abs)}`);
  console.log(`   Papers: ${papers.length}`);

  let totalSets = 0;
  let totalQuestions = 0;
  let replaced = 0;
  const touchedSubjects = new Set();

  for (const paper of papers) {
    const subjectSlug = String(paper.paperSlug ?? "").trim();
    if (!subjectSlug) {
      console.warn("   ⚠️  Skip paper without paperSlug");
      continue;
    }

    const megaPath = path.join(PUBLIC, "quiz-data", LEVEL, `${subjectSlug}.json`);
    if (!fs.existsSync(megaPath)) {
      console.warn(`   ⚠️  Skip — no mega JSON: ${subjectSlug}`);
      continue;
    }

    const mega = JSON.parse(fs.readFileSync(megaPath, "utf8"));
    if (!mega.modelTests) mega.modelTests = {};
    if (!mega.modelTestsMeta) mega.modelTestsMeta = {};

    const modelIndexPath = path.join(
      PUBLIC,
      "quiz-data",
      LEVEL,
      `${subjectSlug}.model-tests.index.json`,
    );
    let modelIndex = null;
    if (fs.existsSync(modelIndexPath)) {
      modelIndex = JSON.parse(fs.readFileSync(modelIndexPath, "utf8"));
      if (!modelIndex.modelTests) modelIndex.modelTests = {};
    }

    let paperSets = 0;
    let paperQuestions = 0;

    for (const set of paper.sets ?? []) {
      const setNo = Number(set.setNo ?? set.set ?? 0);
      const slug = String(set.id ?? "").trim();
      if (!slug || !setNo || !Array.isArray(set.questions) || !set.questions.length) {
        console.warn(`   ⚠️  Skip invalid set in ${subjectSlug}`);
        continue;
      }

      const existed = Boolean(mega.modelTests[slug]);
      const converted = set.questions.map((q) =>
        convertQuestion(q, slug, subjectSlug, setNo),
      );
      const megaQuestions = converted.map((c) => c.mega);
      const publicQuestions = converted.map((c) => c.public);
      const answers = converted.map((c) => c.answer);

      const displayTitle = displayTitleForSet(setNo);
      const meta = {
        displayTitle,
        tags: ["board-analyzed", "premium", "paper-wise", "high-priority"],
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
        scope: "paper",
        tags: meta.tags,
        durationMinutes: meta.durationMinutes,
        questionCount: meta.questionCount,
        importance: "high",
        confidenceLabel: "Board-Analyzed Premium",
      };

      if (modelIndex) {
        modelIndex.modelTests[slug] = {
          questionCount: meta.questionCount,
          scope: "paper",
          displayTitle: meta.displayTitle,
          durationMinutes: meta.durationMinutes,
          importance: "high",
          tags: meta.tags,
        };
      }

      paperSets += 1;
      paperQuestions += megaQuestions.length;
      totalSets += 1;
      totalQuestions += megaQuestions.length;
      if (existed) replaced += 1;
    }

    fs.writeFileSync(megaPath, `${JSON.stringify(mega, null, 2)}\n`, "utf8");
    if (modelIndex) {
      fs.writeFileSync(modelIndexPath, `${JSON.stringify(modelIndex, null, 2)}\n`, "utf8");
    }

    touchedSubjects.add(subjectSlug);
    console.log(
      `   ✅ ${paper.paperName ?? subjectSlug} — ${paperSets} sets, ${paperQuestions} MCQ`,
    );
  }

  console.log(`\n✅ Import complete`);
  console.log(`   Sets imported: ${totalSets} (${replaced} replaced existing)`);
  console.log(`   Questions: ${totalQuestions}`);
  console.log(`   Subjects touched: ${[...touchedSubjects].join(", ")}\n`);
}

const defaultSource =
  "hsc_board_analyzed_100_quality_pack/hsc_board_analyzed_100_quality_pack/hsc_board_analyzed_exam_ready_practice_sets.json";
importPack(process.argv[2] || defaultSource);
