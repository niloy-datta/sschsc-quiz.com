/**
 * Quiz data audit â€” generates scripts/missing-quiz-report.md
 * Run: node scripts/audit-missing-quizzes.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public", "quiz-data");

const SSC_SUBJECTS = [
  { slug: "physics", label: "Physics" },
  { slug: "chemistry", label: "Chemistry" },
  { slug: "biology", label: "Biology" },
  { slug: "higher-math", label: "Higher Math" },
  { slug: "general-math", label: "General Math" },
];

const HSC_SUBJECTS = [
  { slug: "physics-1st-paper", label: "Physics 1st Paper" },
  { slug: "physics-2nd-paper", label: "Physics 2nd Paper" },
  { slug: "chemistry-1st-paper", label: "Chemistry 1st Paper" },
  { slug: "chemistry-2nd-paper", label: "Chemistry 2nd Paper" },
  { slug: "biology-1st-paper", label: "Biology 1st Paper" },
  { slug: "biology-2nd-paper", label: "Biology 2nd Paper" },
  { slug: "higher-math-1st-paper", label: "Higher Math 1st Paper" },
  { slug: "higher-math-2nd-paper", label: "Higher Math 2nd Paper" },
  { slug: "ict", label: "ICT" },
];

function countQuestions(arr) {
  return Array.isArray(arr) ? arr.length : 0;
}

function auditJson(level, slug, label) {
  const file = path.join(PUBLIC, level, `${slug}.json`);
  if (!fs.existsSync(file)) {
    return {
      level,
      label,
      slug,
      exists: false,
      chapterCount: 0,
      chapterQuestions: 0,
      chapterSlugs: [],
      boardYears: [],
      boardSetCount: 0,
      boardQuestions: 0,
      modelTestCount: 0,
      modelTestQuestions: 0,
      wholeSyllabusCount: 0,
      totalQuestions: 0,
    };
  }

  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const chapters = data.chapters || {};
  const modelTests = data.modelTests || {};
  const boardQuestions = data.boardQuestions || {};

  let chapterQuestions = 0;
  const chapterSlugs = Object.keys(chapters);
  for (const qs of Object.values(chapters)) {
    chapterQuestions += countQuestions(qs);
  }

  let boardSetCount = 0;
  let boardQ = 0;
  const boardYears = Object.keys(boardQuestions).sort();
  for (const year of boardYears) {
    const boards = boardQuestions[year] || {};
    boardSetCount += Object.keys(boards).length;
    for (const qs of Object.values(boards)) {
      boardQ += countQuestions(qs);
    }
  }

  let modelTestQuestions = 0;
  for (const qs of Object.values(modelTests)) {
    modelTestQuestions += countQuestions(qs);
  }

  const wholeSyllabusKeys = Object.keys(modelTests).filter((k) =>
    /full-book|whole-syllabus|full_syllabus|syllabus/i.test(k),
  );

  return {
    level,
    label,
    slug,
    exists: true,
    chapterCount: chapterSlugs.length,
    chapterQuestions,
    chapterSlugs,
    boardYears,
    boardSetCount,
    boardQuestions: boardQ,
    modelTestCount: Object.keys(modelTests).length,
    modelTestQuestions,
    wholeSyllabusCount: wholeSyllabusKeys.length,
    totalQuestions: chapterQuestions + boardQ + modelTestQuestions,
  };
}

function catStatus(count, minComplete = 3) {
  if (count === 0) return "Missing";
  if (count < minComplete) return "Partial";
  return "Available";
}

function boardStatus(years, sets) {
  if (years.length === 0 && sets === 0) return "Missing";
  if (years.length < 2 || sets < 5) return "Partial";
  return "Available";
}

function overallStatus(a) {
  if (!a.exists) return "Missing";
  const hasChapter = a.chapterCount > 0;
  const hasBoard = a.boardSetCount > 0;
  const hasModel = a.modelTestCount > 0;
  const hasWhole = a.wholeSyllabusCount > 0;

  if (!hasChapter && !hasBoard && !hasModel) return "Missing";

  const scores = [
    hasChapter ? (a.chapterCount >= 3 ? 2 : 1) : 0,
    hasBoard ? (a.boardYears.length >= 3 ? 2 : 1) : 0,
    hasModel ? (a.modelTestCount >= 5 ? 2 : 1) : 0,
  ];
  const total = scores.reduce((s, x) => s + x, 0);
  if (total >= 5) return "Complete";
  if (total >= 1) return "Partial";
  return "Missing";
}

function auditParsed() {
  const p = path.join(ROOT, "scratch", "parsed_quizzes.json");
  if (!fs.existsSync(p)) return null;
  const all = JSON.parse(fs.readFileSync(p, "utf8"));
  let chapterKeys = 0;
  let boardKeys = 0;
  let modelKeys = 0;
  let suggestionKeys = 0;
  let totalQ = 0;

  for (const [key, qs] of Object.entries(all)) {
    const k = key.toLowerCase().replace(/\\/g, "/");
    totalQ += qs.length;
    if (k.includes("chapter-wise") || /chapter-\d/.test(k)) chapterKeys++;
    if (k.includes("board-questions")) boardKeys++;
    if (k.includes("model-test") || k.includes("model_tests") || k.includes("/extra/"))
      modelKeys++;
    if (k.includes("suggestions") || k.includes("most-important") || k.includes("killer"))
      suggestionKeys++;
  }

  return {
    keys: Object.keys(all).length,
    totalQuestions: totalQ,
    chapterKeys,
    boardKeys,
    modelKeys,
    suggestionKeys,
  };
}

function countExtraSources() {
  const srcData = path.join(ROOT, "src", "data");
  const dataDir = path.join(ROOT, "data");
  const docsRaw = path.join(ROOT, "docs", "raw-questions");

  function countFiles(dir) {
    if (!fs.existsSync(dir)) return 0;
    let n = 0;
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (e.isDirectory()) walk(path.join(d, e.name));
        else n++;
      }
    };
    walk(dir);
    return n;
  }

  return {
    srcDataFiles: countFiles(srcData),
    dataDirFiles: countFiles(dataDir),
    docsRawFiles: countFiles(docsRaw),
  };
}

function auditLiveTest() {
  const livePage = path.join(ROOT, "app", "live-test", "page.tsx");
  const content = fs.existsSync(livePage)
    ? fs.readFileSync(livePage, "utf8")
    : "";
  const isMock =
    content.includes("mock countdown") ||
    content.includes("172800") ||
    !content.includes("fetchQuestions");
  return { hasPage: fs.existsSync(livePage), isMock };
}

const audits = [];
for (const s of SSC_SUBJECTS) {
  audits.push(auditJson("ssc", s.slug, s.label));
}
for (const s of HSC_SUBJECTS) {
  audits.push(auditJson("hsc", s.slug, s.label));
}

const parsed = auditParsed();
const extra = countExtraSources();
const live = auditLiveTest();

// Build markdown
const lines = [];
lines.push("# Missing Quiz Data Audit Report");
lines.push("");
lines.push(`Generated: ${new Date().toISOString().slice(0, 10)}`);
lines.push("");
lines.push("## Source Summary");
lines.push("");
lines.push("| Source | Count |");
lines.push("| ------ | ----- |");
if (parsed) {
  lines.push(`| scratch/parsed_quizzes.json keys | ${parsed.keys} |`);
  lines.push(`| scratch/parsed_quizzes.json questions | ${parsed.totalQuestions} |`);
  lines.push(`| Parsed chapter-wise source keys | ${parsed.chapterKeys} |`);
  lines.push(`| Parsed board source keys | ${parsed.boardKeys} |`);
  lines.push(`| Parsed model-test source keys | ${parsed.modelKeys} |`);
  lines.push(`| Parsed suggestion/most-important keys | ${parsed.suggestionKeys} |`);
}
lines.push(`| public/quiz-data JSON subjects | ${audits.filter((a) => a.exists).length} |`);
lines.push(`| src/data files | ${extra.srcDataFiles} |`);
lines.push(`| data/ files | ${extra.dataDirFiles} |`);
lines.push(`| docs/raw-questions files | ${extra.docsRawFiles} |`);
lines.push("");

lines.push("## Subject Audit Table");
lines.push("");
lines.push(
  "| Level | Subject/Paper | Chapter-wise | Board-wise | Whole Syllabus | Model Test | Status |",
);
lines.push(
  "| ----- | ------------- | ------------ | ---------- | -------------- | ---------- | ------ |",
);

for (const a of audits) {
  const ch = a.chapterCount
    ? `${a.chapterCount} ch (${a.chapterQuestions} qs)`
    : "Missing";
  const board = a.boardSetCount
    ? `${a.boardYears.length} yrs / ${a.boardSetCount} sets`
    : "Missing";
  const whole =
    a.wholeSyllabusCount > 0
      ? `${a.wholeSyllabusCount} set(s)`
      : "Missing";
  const mt = a.modelTestCount
    ? `${a.modelTestCount} sets (${a.modelTestQuestions} qs)`
    : "Missing";
  const status = overallStatus(a);
  lines.push(
    `| ${a.level.toUpperCase()} | ${a.label} | ${ch} | ${board} | ${whole} | ${mt} | ${status} |`,
  );
}

lines.push("");
lines.push("## Count Report (per subject/paper)");
lines.push("");

for (const a of audits) {
  lines.push(`### ${a.level.toUpperCase()} ${a.label}`);
  lines.push("");
  if (!a.exists) {
    lines.push("- JSON file: **not found**");
    lines.push("- Status: **Missing**");
    lines.push("");
    continue;
  }
  lines.push(`- Chapter count: **${a.chapterCount}** (${a.chapterQuestions} questions)`);
  if (a.chapterSlugs.length) {
    lines.push(`- Chapter slugs: ${a.chapterSlugs.join(", ")}`);
  }
  lines.push(
    `- Board years: ${a.boardYears.length ? a.boardYears.join(", ") : "none"} (${a.boardSetCount} board sets, ${a.boardQuestions} questions)`,
  );
  lines.push(`- Model test count: **${a.modelTestCount}** (${a.modelTestQuestions} questions)`);
  lines.push(`- Whole syllabus tests: **${a.wholeSyllabusCount}** (no dedicated full-book JSON category)`);
  lines.push(`- Total questions in JSON: **${a.totalQuestions}**`);
  lines.push(`- Status: **${overallStatus(a)}**`);
  lines.push("");
}

lines.push("## Global Categories");
lines.push("");
lines.push("| Category | In public/quiz-data | UI route | Notes |");
lines.push("| -------- | ------------------- | -------- | ----- |");
lines.push(
  "| Chapter-wise quiz | Yes (chapters) | `/ssc/[subject]`, `/hsc/.../chapter/[slug]` | Per-subject counts vary |",
);
lines.push(
  "| Board-wise / year-wise | Yes (boardQuestions) | `/ssc-board-questions`, `/hsc-board-questions` | Separate from subject hub |",
);
lines.push(
  "| Subject-wise hub | Yes | `/ssc/[subject]`, `/hsc/...` | Lists chapters + model test preview |",
);
lines.push(
  "| Whole syllabus / full book | **No dedicated data** | `/ssc/full-book-test`, `/hsc/full-book-test` | UI: Coming Soon |",
);
lines.push(
  "| Model test | Yes (modelTests) | `*/model-tests` | 110 sets total across all subjects |",
);
lines.push(
  "| Live test | **No static question set** | /live-test | " +
    (live.isMock ? "Mock countdown UI only" : "Check page") +
    " |",
);
lines.push("");

// Detailed missing lists - only factual
const missingChapters = audits.filter((a) => a.exists && a.chapterCount === 0);
const lowChapters = audits.filter(
  (a) => a.exists && a.chapterCount > 0 && a.chapterCount <= 2,
);
const missingBoard = audits.filter((a) => a.exists && a.boardSetCount === 0);
const partialBoard = audits.filter(
  (a) => a.exists && a.boardSetCount > 0 && a.boardYears.length < 3,
);
const missingModel = audits.filter((a) => a.exists && a.modelTestCount === 0);
const lowModel = audits.filter(
  (a) => a.exists && a.modelTestCount > 0 && a.modelTestCount < 5,
);

lines.push("## Detailed Missing / Low Data List");
lines.push("");
lines.push("### Missing Chapter-wise Quiz (0 chapters in JSON)");
if (missingChapters.length) {
  for (const a of missingChapters) {
    lines.push(`- ${a.level.toUpperCase()} ${a.label}`);
  }
} else {
  lines.push("- None (all subjects have at least one chapter entry, or file missing)");
}

lines.push("");
lines.push("### Low Chapter-wise Data (1â€“2 chapters only)");
if (lowChapters.length) {
  for (const a of lowChapters) {
    lines.push(
      `- ${a.level.toUpperCase()} ${a.label}: ${a.chapterSlugs.join(", ")}`,
    );
  }
} else {
  lines.push("- None");
}

lines.push("");
lines.push("### Missing Board Questions (0 board sets in JSON)");
if (missingBoard.length) {
  for (const a of missingBoard) {
    lines.push(`- ${a.level.toUpperCase()} ${a.label}`);
  }
} else {
  lines.push("- None");
}

lines.push("");
lines.push("### Partial Board Data (< 3 years in JSON)");
if (partialBoard.length) {
  for (const a of partialBoard) {
    lines.push(
      `- ${a.level.toUpperCase()} ${a.label}: years ${a.boardYears.join(", ") || "none"}`,
    );
  }
} else {
  lines.push("- None");
}

lines.push("");
lines.push("### Missing Model Tests (0 sets in JSON)");
if (missingModel.length) {
  for (const a of missingModel) {
    lines.push(`- ${a.level.toUpperCase()} ${a.label}`);
  }
} else {
  lines.push("- None");
}

lines.push("");
lines.push("### Low Model Test Count (< 5 sets)");
if (lowModel.length) {
  for (const a of lowModel) {
    lines.push(
      `- ${a.level.toUpperCase()} ${a.label}: **${a.modelTestCount}** set(s)`,
    );
  }
} else {
  lines.push("- None");
}

lines.push("");
lines.push("### Missing Whole Syllabus Tests");
lines.push("- All subjects: no `full-book` / `whole-syllabus` keys in `public/quiz-data` JSON");
lines.push("- UI routes `/ssc/full-book-test` and `/hsc/full-book-test` show **Coming Soon**");

lines.push("");
lines.push("### Live Test");
lines.push(
  "- /live-test page exists; " +
    (live.isMock
      ? "uses mock countdown â€” no real live question set in static JSON"
      : "may load from API"),
);

lines.push("");
lines.push("## Totals");
lines.push("");
const totalChapters = audits.reduce((s, a) => s + a.chapterCount, 0);
const totalChapterQ = audits.reduce((s, a) => s + a.chapterQuestions, 0);
const totalBoardSets = audits.reduce((s, a) => s + a.boardSetCount, 0);
const totalBoardQ = audits.reduce((s, a) => s + a.boardQuestions, 0);
const totalModel = audits.reduce((s, a) => s + a.modelTestCount, 0);
const totalModelQ = audits.reduce((s, a) => s + a.modelTestQuestions, 0);
const totalAll = audits.reduce((s, a) => s + a.totalQuestions, 0);

lines.push(`- Total questions in public/quiz-data: **${totalAll}**`);
lines.push(`- Chapter-wise chapters: **${totalChapters}** (${totalChapterQ} questions)`);
lines.push(`- Board question sets: **${totalBoardSets}** (${totalBoardQ} questions)`);
lines.push(`- Model test sets: **${totalModel}** (${totalModelQ} questions)`);
lines.push(`- Whole syllabus sets: **0** (not implemented in JSON)`);

const complete = audits.filter((a) => overallStatus(a) === "Complete");
const partial = audits.filter((a) => overallStatus(a) === "Partial");
const missing = audits.filter((a) => overallStatus(a) === "Missing");

lines.push(`- Subjects **Complete**: ${complete.map((a) => `${a.level.toUpperCase()} ${a.label}`).join(", ") || "none"}`);
lines.push(`- Subjects **Partial**: ${partial.length}`);
lines.push(`- Subjects **Missing**: ${missing.map((a) => `${a.level.toUpperCase()} ${a.label}`).join(", ") || "none"}`);

lines.push("");
lines.push("## UI Empty States (when data missing)");
lines.push("");
lines.push("- `à¦ªà§à¦°à¦¶à§à¦¨ à¦à¦–à¦¨à§‹ à¦¯à§‹à¦— à¦•à¦°à¦¾ à¦¹à§Ÿà¦¨à¦¿à¥¤` â€” used when chapter/model list is empty");
lines.push("- `à¦¶à§€à¦˜à§à¦°à¦‡ à¦†à¦¸à¦›à§‡à¥¤` â€” used on full-book-test Coming Soon pages");
lines.push("- Model test pages show only real sets; no fake cards");

const outPath = path.join(ROOT, "scripts", "missing-quiz-report.md");
fs.writeFileSync(outPath, lines.join("\n"), "utf8");

console.log("Written:", outPath);
console.log("Total questions:", totalAll);
console.log("Chapters:", totalChapters, "Model tests:", totalModel, "Board sets:", totalBoardSets);
console.log("Complete:", complete.length, "Partial:", partial.length, "Missing:", missing.length);

