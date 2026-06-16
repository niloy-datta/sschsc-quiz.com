/**
 * Import paper-wise model test sets (fill-to-15 JSON format).
 *
 * JSON shape:
 * { level, papers: [{ subject, sets: [{ id, title, questions[] }] }] }
 *
 * Usage:
 *   node scripts/import-paper-sets-fill-to-15.js data/imports/hsc-bio-1st-paper-sets-fill-to-15.json
 *   node scripts/import-paper-sets-fill-to-15.js --all
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const BACKEND_ANSWERS = path.join(ROOT, "backend", "data", "answers");
const IMPORTS = path.join(ROOT, "data", "imports");
const UPLOADS = path.join(
  process.env.USERPROFILE || process.env.HOME || "",
  ".cursor",
  "projects",
  "c-Users-Niloy-Chandra-Documents-dev-quiz-dashboard",
  "uploads",
);

const LABEL_TO_LETTER = { ক: "A", খ: "B", গ: "C", ঘ: "D" };
const LETTER_INDEX = { A: 0, B: 1, C: 2, D: 3 };

const SUBJECT_ALIASES = {
  "bio-1st": { slug: "biology-1st-paper", level: "hsc" },
  "bio-2nd": { slug: "biology-2nd-paper", level: "hsc" },
  "chem-2nd": { slug: "chemistry-2nd-paper", level: "hsc" },
  "physics-2nd": { slug: "physics-2nd-paper", level: "hsc" },
  "higher-math-1st-paper": { slug: "higher-math-1st-paper", level: "hsc" },
  "higher-math-2nd-paper": { slug: "higher-math-2nd-paper", level: "hsc" },
  ict: { slug: "ict", level: "hsc" },
  physics: { slug: "physics", level: "ssc" },
  chemistry: { slug: "chemistry", level: "ssc" },
  biology: { slug: "biology", level: "ssc" },
  "higher-math": { slug: "higher-math", level: "ssc" },
  "general-math": { slug: "general-math", level: "ssc" },
  "biology-1st-paper": { slug: "biology-1st-paper", level: "hsc" },
  "biology-2nd-paper": { slug: "biology-2nd-paper", level: "hsc" },
  "chemistry-2nd-paper": { slug: "chemistry-2nd-paper", level: "hsc" },
  "physics-2nd-paper": { slug: "physics-2nd-paper", level: "hsc" },
};

const FILL_FILES = [
  "hsc-bio-1st-paper-sets-fill-to-15.json",
  "hsc-bio-2nd-paper-sets-fill-to-15.json",
  "hsc-chem-2nd-paper-sets-fill-to-15.json",
  "hsc-higher-math-1st-paper-paper-sets-fill-to-15.json",
  "hsc-higher-math-2nd-paper-paper-sets-fill-to-15.json",
  "hsc-ict-paper-sets-fill-to-15.json",
  "hsc-physics-2nd-paper-sets-fill-to-15.json",
  "ssc-biology-paper-sets-fill-to-15.json",
  "ssc-chemistry-paper-sets-fill-to-15.json",
  "ssc-general-math-paper-sets-fill-to-15.json",
  "ssc-higher-math-paper-sets-fill-to-15.json",
  "ssc-physics-paper-sets-fill-to-15.json",
];

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
      chapter: String(q.chapter ?? "").padStart(2, "0") || undefined,
      topic: String(q.topic ?? "").trim(),
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
  let mega;
  ensureDir(path.dirname(megaPath));
  if (fs.existsSync(megaPath)) {
    mega = JSON.parse(fs.readFileSync(megaPath, "utf8"));
  } else {
    mega = {
      level: level.toUpperCase(),
      subject: subjectSlug,
      chapters: {},
      modelTests: {},
      boardQuestions: {},
    };
  }
  if (!mega.modelTests) mega.modelTests = {};
  if (!mega.modelTestsMeta) mega.modelTestsMeta = {};

  mega.modelTests[slug] = megaQuestions;
  mega.modelTestsMeta[slug] = {
    displayTitle: meta.displayTitle,
    name: meta.displayTitle,
    scope: "paper",
    tags: meta.tags,
    durationMinutes: meta.durationMinutes,
    questionCount: megaQuestions.length,
    importance: "high",
  };

  fs.writeFileSync(megaPath, `${JSON.stringify(mega, null, 2)}\n`, "utf8");
}

function updateModelTestsIndex(subjectSlug, level, slug, meta) {
  const indexPath = path.join(PUBLIC, "quiz-data", level, `${subjectSlug}.model-tests.index.json`);
  let index = { subject: subjectSlug, modelTests: {} };
  ensureDir(path.dirname(indexPath));
  if (fs.existsSync(indexPath)) {
    index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  }
  if (!index.modelTests) index.modelTests = {};
  index.modelTests[slug] = {
    questionCount: meta.questionCount,
    scope: "paper",
    displayTitle: meta.displayTitle,
    durationMinutes: meta.durationMinutes,
    importance: "high",
    tags: meta.tags,
  };
  fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
}

function updateSubjectIndex(subjectSlug, slug, meta) {
  const indexPath = path.join(PUBLIC, "questions", subjectSlug, "index.json");
  let index = { subject: subjectSlug, chapters: [], modelTests: [], boards: [] };
  ensureDir(path.dirname(indexPath));
  if (fs.existsSync(indexPath)) {
    index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  }
  if (!index.modelTests) index.modelTests = [];

  const entry = {
    id: slug,
    title: meta.displayTitle,
    questionCount: meta.questionCount,
    scope: "paper",
    importance: "high",
    tags: meta.tags,
  };
  const existing = index.modelTests.find((m) => m.id === slug);
  if (existing) Object.assign(existing, entry);
  else index.modelTests.push(entry);

  fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
}

function resolveSubject(paper, level) {
  const raw = String(paper.subject ?? "").trim().toLowerCase();
  if (SUBJECT_ALIASES[raw]) return SUBJECT_ALIASES[raw];

  const firstSetId = String(paper.sets?.[0]?.id ?? "").toLowerCase();
  if (firstSetId.includes("biology-1st") || firstSetId.includes("bio-1st")) {
    return { slug: "biology-1st-paper", level: "hsc" };
  }
  if (firstSetId.includes("biology-2nd") || firstSetId.includes("bio-2nd")) {
    return { slug: "biology-2nd-paper", level: "hsc" };
  }
  if (firstSetId.includes("chemistry-2nd") || firstSetId.includes("chem-2nd")) {
    return { slug: "chemistry-2nd-paper", level: "hsc" };
  }
  if (firstSetId.includes("physics-2nd")) {
    return { slug: "physics-2nd-paper", level: "hsc" };
  }
  if (firstSetId.startsWith("ssc-")) {
    const m = firstSetId.match(/^ssc-([a-z-]+)-paper-set/);
    if (m && SUBJECT_ALIASES[m[1]]) return SUBJECT_ALIASES[m[1]];
  }
  if (firstSetId.startsWith("hsc-")) {
    const m = firstSetId.match(/^hsc-([a-z0-9-]+)-paper-set/);
    if (m && SUBJECT_ALIASES[m[1]]) return SUBJECT_ALIASES[m[1]];
  }

  throw new Error(`Cannot resolve subject slug for paper subject="${raw}" set="${firstSetId}"`);
}

function findUpload(destName) {
  if (!fs.existsSync(UPLOADS)) return null;
  const hit = fs.readdirSync(UPLOADS).find((f) => f.includes(destName.replace(".json", "")));
  return hit ? path.join(UPLOADS, hit) : null;
}

function copyToImports(sourcePath, destName) {
  ensureDir(IMPORTS);
  const dest = path.join(IMPORTS, destName);
  fs.copyFileSync(sourcePath, dest);
  return dest;
}

function importFile(sourcePath) {
  const abs = path.isAbsolute(sourcePath) ? sourcePath : path.join(ROOT, sourcePath);
  if (!fs.existsSync(abs)) {
    console.error(`❌ Not found: ${abs}`);
    return { ok: false, sets: 0, questions: 0 };
  }

  const raw = JSON.parse(fs.readFileSync(abs, "utf8"));
  const papers = raw.papers ?? [];
  if (!papers.length) {
    console.error(`❌ No papers[] in ${path.basename(abs)}`);
    return { ok: false, sets: 0, questions: 0 };
  }

  console.log(`\n📄 ${path.basename(abs)}`);
  let setCount = 0;
  let questionCount = 0;
  const synced = new Set();

  for (const paper of papers) {
    const { slug: subjectSlug, level } = resolveSubject(paper, raw.level);
    console.log(`   → ${level}/${subjectSlug} (${paper.generatedSetsCount ?? paper.sets?.length ?? 0} sets)`);

    for (const set of paper.sets ?? []) {
      const slug = String(set.id ?? "").trim();
      if (!slug || !Array.isArray(set.questions) || !set.questions.length) {
        console.warn(`   ⚠️  Skip invalid set`);
        continue;
      }

      const converted = set.questions.map((q) => convertQuestion(q, slug, subjectSlug));
      const megaQuestions = converted.map((c) => c.mega);
      const publicQuestions = converted.map((c) => c.public);
      const answers = converted.map((c) => c.answer);

      const meta = {
        displayTitle: String(set.title ?? `Paper Model Test ${set.setNo ?? ""}`).trim(),
        tags: ["paper-wise", "model-test", "fill-to-15"],
        durationMinutes: 25,
        questionCount: megaQuestions.length,
      };

      writeSetFiles(subjectSlug, slug, megaQuestions, publicQuestions, answers);
      updateMegaJson(subjectSlug, level, slug, megaQuestions, meta);
      updateModelTestsIndex(subjectSlug, level, slug, meta);
      updateSubjectIndex(subjectSlug, slug, meta);

      setCount += 1;
      questionCount += megaQuestions.length;
      synced.add(`${level}/${subjectSlug}`);
      console.log(`   ✅ ${slug} — ${megaQuestions.length} questions`);
    }
  }

  console.log(`   Done: ${setCount} sets, ${questionCount} questions`);
  return { ok: true, sets: setCount, questions: questionCount, synced: [...synced] };
}

function prepareAndImportAll() {
  let totalSets = 0;
  let totalQuestions = 0;
  const allSynced = new Set();

  for (const destName of FILL_FILES) {
    const uploadSrc = findUpload(destName);
    const localPath = path.join(IMPORTS, destName);
    let source = localPath;
    if (uploadSrc) {
      source = copyToImports(uploadSrc, destName);
    } else if (!fs.existsSync(localPath)) {
      console.warn(`⚠️  Skip missing: ${destName}`);
      continue;
    }
    const result = importFile(source);
    if (result.ok) {
      totalSets += result.sets;
      totalQuestions += result.questions;
      for (const s of result.synced ?? []) allSynced.add(s);
    }
  }

  console.log(`\n✅ Batch complete: ${totalSets} sets, ${totalQuestions} questions across ${FILL_FILES.length} files`);
  return [...allSynced];
}

function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: node scripts/import-paper-sets-fill-to-15.js <file.json|--all>");
    process.exit(1);
  }

  if (arg === "--all") {
    const synced = prepareAndImportAll();
    if (synced.length) {
      console.log("\nRun index sync for:", synced.join(", "));
    }
    return;
  }

  importFile(arg);
}

main();
