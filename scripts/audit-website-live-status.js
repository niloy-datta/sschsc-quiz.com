/**
 * dev-quiz-dashboard Website Live Status Audit
 * 
 * Coverage: Next.js routes, API routes, HSC/SSC quiz data, chapter set counts,
 * SVG/images, question counts, chapter name quality, route data files.
 * 
 * Run: node scripts/audit-website-live-status.js
 * Output: data/website-audit-report.json and data/website-audit-report.txt
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUIZ_DATA = path.join(ROOT, "public/quiz-data");
const QUESTIONS = path.join(ROOT, "public/questions");
const IMAGES_QUIZ = path.join(ROOT, "public/images/quiz");
const APP_DIR = path.join(ROOT, "app");

const report = {
  generatedAt: new Date().toISOString(),
  // A: Routes & API Live Status
  sectionA: { routes: [], apis: [], summary: "" },
  // B: HSC Chapter Names & Set Counts
  sectionB: { papers: [], summary: "" },
  // C: SSC Chapter Names & Set Counts
  sectionC: { subjects: [], summary: "" },
  // D: SVG / Image Audit
  sectionD: { items: [], summary: "" },
  // E: Route Data File Audit
  sectionE: { files: [], summary: "" },
  // Top problems
  topProblems: [],
  // Totals
  totals: { chapters: 0, redCount: 0, warningCount: 0, okCount: 0 },
};

// ─── SECTION A: Route & API Live Status ─────────────────────────────────────

function auditRoutes() {
  const routeChecks = [
    { path: "app/page.tsx", label: "Home (/)", type: "page" },
    { path: "app/[level]/page.tsx", label: "/[level] (SSC/HSC Hub)", type: "page" },
    { path: "app/[level]/[subject]/page.tsx", label: "/[level]/[subject]", type: "page" },
    { path: "app/[level]/[subject]/chapters/page.tsx", label: "/[level]/[subject]/chapters", type: "page" },
    { path: "app/[level]/[subject]/chapter/[chapterSlug]/page.tsx", label: "/[level]/[subject]/chapter/[slug]", type: "page" },
    { path: "app/[level]/[subject]/chapter/[chapterSlug]/set/[setId]/page.tsx", label: "/[level]/[subject]/chapter/[slug]/set/[id]", type: "page" },
    { path: "app/[level]/[subject]/set/[setId]/page.tsx", label: "/[level]/[subject]/set/[id]", type: "page" },
    { path: "app/[level]/[subject]/model-tests/page.tsx", label: "/[level]/[subject]/model-tests", type: "page" },
    { path: "app/[level]/[subject]/model-tests/[testId]/page.tsx", label: "/[level]/[subject]/model-tests/[testId]", type: "page" },
    { path: "app/[level]/model-tests/page.tsx", label: "/[level]/model-tests (Hub)", type: "page" },
    { path: "app/[level]/final-focus/page.tsx", label: "/[level]/final-focus", type: "page" },
    { path: "app/[level]/full-book-test/page.tsx", label: "/[level]/full-book-test", type: "page" },
    { path: "app/hsc-board-questions/page.tsx", label: "/hsc-board-questions", type: "page" },
    { path: "app/hsc-board-questions/[subject]/page.tsx", label: "/hsc-board-questions/[subject]", type: "page" },
    { path: "app/hsc-board-questions/[subject]/[paper]/page.tsx", label: "/hsc-board-questions/[subject]/[paper]", type: "page" },
    { path: "app/hsc-board-questions/[subject]/[paper]/[year]/page.tsx", label: "/hsc-board-questions/[subject]/[paper]/[year]", type: "page" },
    { path: "app/ssc-board-questions/page.tsx", label: "/ssc-board-questions", type: "page" },
    { path: "app/ssc-board-questions/[subject]/page.tsx", label: "/ssc-board-questions/[subject]", type: "page" },
    { path: "app/ssc-board-questions/[subject]/[year]/page.tsx", label: "/ssc-board-questions/[subject]/[year]", type: "page" },
    { path: "app/api/subjects/route.ts", label: "API /api/subjects", type: "api" },
    { path: "app/api/questions/route.ts", label: "API /api/questions", type: "api" },
    { path: "app/api/quizzes/route.ts", label: "API /api/quizzes", type: "api" },
  ];

  for (const route of routeChecks) {
    const fullPath = path.join(ROOT, route.path);
    const exists = fs.existsSync(fullPath);
    const label = route.label;
    let status;

    if (!exists) {
      status = "MISSING";
    } else if (route.type === "api") {
      // Check API status by reading the file
      const content = fs.readFileSync(fullPath, "utf8");
      if (content.includes("403") || content.includes("disabled") || content.includes("not found")) {
        status = "DISABLED";
      } else if (content.includes("force-dynamic") || content.includes("fetch")) {
        status = "LIVE (proxy)";
      } else {
        status = "LIVE";
      }
    } else {
      status = "LIVE";
    }

    report.sectionA.routes.push({ label, path: route.path, status, exists });
  }

  // Check for special states in API routes
  const apiQPath = path.join(ROOT, "app/api/questions/route.ts");
  if (fs.existsSync(apiQPath)) {
    const content = fs.readFileSync(apiQPath, "utf8");
    // Check if it's actually disabled (returns 403)
    if (content.includes("status: 403")) {
      report.sectionA.routes.push({
        label: "/api/questions (status check)",
        path: "app/api/questions/route.ts",
        status: "DISABLED (returns 403 — static JSON only)",
        exists: true,
      });
    }
  }

  const apiSubPath = path.join(ROOT, "app/api/subjects/route.ts");
  if (fs.existsSync(apiSubPath)) {
    const c = fs.readFileSync(apiSubPath, "utf8");
    const hasFallback = c.includes("catch") || c.includes("fallback") || c.includes("||");
    report.sectionA.apis.push({
      endpoint: "/api/subjects",
      status: "LIVE (proxy to backend)",
      backendDependent: true,
      hasStaticFallback: hasFallback,
    });
  }

  const apiQuizPath = path.join(ROOT, "app/api/quizzes/route.ts");
  if (fs.existsSync(apiQuizPath)) {
    const c = fs.readFileSync(apiQuizPath, "utf8");
    const hasFallback = c.includes("catch") || c.includes("fallback") || c.includes("||");
    const stripsAnswers = c.includes("stripAnswerKeys") || c.includes("correctOption");
    report.sectionA.apis.push({
      endpoint: "/api/quizzes",
      status: "LIVE (proxy to backend, answer-stripping)",
      backendDependent: true,
      stripsAnswers,
      hasStaticFallback: hasFallback,
    });
  }
}

// ─── SECTION B & C: Chapter Set Count, Chapter Names, Question Count ────────

function loadQuizJson(level, slug) {
  const file = path.join(QUIZ_DATA, level, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function extractChapterSets(data) {
  // Chapter sets come from:
  // 1. chapters object (each key = 1 set)
  // 2. chapterWise array (each entry has sets array)
  // 3. chapter-scoped modelTests (keys matching chapter-XX-*)
  const chapters = data.chapters || {};
  const chapterWise = data.chapterWise || [];
  const modelTests = data.modelTests || {};

  // Build chapter groups: { "01": { name, sets: [...] } }
  const chapterMap = {};

  // Process chapters object
  for (const key of Object.keys(chapters)) {
    const match = key.match(/chapter[-_]?(\d{1,2})/i);
    if (!match) continue;
    const chNum = match[1].padStart(2, "0");
    if (!chapterMap[chNum]) chapterMap[chNum] = { chNum, names: new Set(), sets: [] };
    
    // Get first question's chapterName if available
    const qs = chapters[key];
    if (Array.isArray(qs) && qs.length > 0) {
      const chName = qs[0].chapterName || qs[0].chapter || "";
      if (chName) chapterMap[chNum].names.add(String(chName));
      chapterMap[chNum].sets.push({
        id: key,
        source: "chapters",
        questionCount: qs.length,
      });
    }
  }

  // Process chapterWise array
  for (const entry of chapterWise) {
    if (!entry || typeof entry !== "object") continue;
    const chSlug = entry.chapterSlug || "";
    const chName = entry.chapterName || "";
    const match = chSlug.match(/chapter[-_]?(\d{1,2})/i);
    if (!match) continue;
    const chNum = match[1].padStart(2, "0");
    if (!chapterMap[chNum]) chapterMap[chNum] = { chNum, names: new Set(), sets: [] };
    if (chName) chapterMap[chNum].names.add(chName);

    const rawSets = entry.sets || [];
    for (const rawSet of rawSets) {
      const qs = Array.isArray(rawSet) ? rawSet : (rawSet.questions || []);
      chapterMap[chNum].sets.push({
        id: rawSet.id || rawSet.setId || `${chSlug}-set`,
        source: "chapterWise",
        questionCount: qs.length,
      });
    }
  }

  // Process chapter-scoped model tests
  for (const key of Object.keys(modelTests)) {
    const match = key.match(/chapter[-_]?(\d{1,2})/i);
    if (!match) continue;
    const chNum = match[1].padStart(2, "0");
    if (!chapterMap[chNum]) chapterMap[chNum] = { chNum, names: new Set(), sets: [] };
    const qs = modelTests[key];
    chapterMap[chNum].sets.push({
      id: key,
      source: "modelTests",
      questionCount: Array.isArray(qs) ? qs.length : (qs?.questionCount || 0),
    });
  }

  // Check for chapterName in chapterWise or chapters meta
  // Try to find first question with chapterName in chapters
  for (const [key, qs] of Object.entries(chapters)) {
    const match = key.match(/chapter[-_]?(\d{1,2})/i);
    if (!match) continue;
    const chNum = match[1].padStart(2, "0");
    if (chapterMap[chNum] && chapterMap[chNum].names.size === 0) {
      if (Array.isArray(qs) && qs.length > 0) {
        // Try common fields: chapterName, chapter_title, name
        for (const q of qs) {
          if (q.chapterName) { chapterMap[chNum].names.add(q.chapterName); break; }
        }
      }
    }
  }

  return chapterMap;
}

function isGenericChapterName(name) {
  const lower = name.toLowerCase();
  // Bengali: অধ্যায় ০১, অধ্যায় ০১, অধ্যায় ১, অধ্যায় 
  // English: Chapter 1, Chapter 01, chapter 1
  if (/^অধ্যা[য়y]\s*\d{1,2}$/i.test(name)) return true;
  if (/^অধ্যা[য়y]\s*\d{1,2}.*$/i.test(name) && name.length < 20) return true;
  if (/^chapter\s*\d{1,2}$/i.test(name.trim())) return true;
  if (/^chapter[-_]?\d{1,2}$/i.test(name.trim())) return true;
  // Also match pure number-only names
  if (/^\d{1,2}$/.test(name.trim())) return true;
  return false;
}

function auditHSC() {
  const HSC_PAPERS = [
    { slug: "physics-1st-paper", label: "Physics 1st Paper", paper: "1st-paper", subject: "physics" },
    { slug: "physics-2nd-paper", label: "Physics 2nd Paper", paper: "2nd-paper", subject: "physics" },
    { slug: "chemistry-1st-paper", label: "Chemistry 1st Paper", paper: "1st-paper", subject: "chemistry" },
    { slug: "chemistry-2nd-paper", label: "Chemistry 2nd Paper", paper: "2nd-paper", subject: "chemistry" },
    { slug: "biology-1st-paper", label: "Biology 1st Paper", paper: "1st-paper", subject: "biology" },
    { slug: "biology-2nd-paper", label: "Biology 2nd Paper", paper: "2nd-paper", subject: "biology" },
    { slug: "higher-math-1st-paper", label: "Higher Math 1st Paper", paper: "1st-paper", subject: "higher-math" },
    { slug: "higher-math-2nd-paper", label: "Higher Math 2nd Paper", paper: "2nd-paper", subject: "higher-math" },
  ];

  for (const paper of HSC_PAPERS) {
    const data = loadQuizJson("hsc", paper.slug);
    if (!data) {
      report.sectionB.papers.push({
        label: paper.label,
        slug: paper.slug,
        exists: false,
        status: "MISSING",
        chapters: [],
      });
      continue;
    }

    const chapterMap = extractChapterSets(data);
    const chapters = Object.entries(chapterMap).sort((a, b) => a[0].localeCompare(b[0]));
    const reportChapters = [];

    for (const [chNum, chData] of chapters) {
      const setName =
        chData.names.size > 0 ? [...chData.names][0] : `অধ্যায় ${chNum}`;
      const isGeneric = chData.names.size === 0 || isGenericChapterName(setName);
      const setCount = chData.sets.length;
      const totalQuestions = chData.sets.reduce((s, x) => s + (x.questionCount || 0), 0);

      // Count sets with <25 questions
      const incompleteSets = chData.sets.filter((s) => (s.questionCount || 0) < 25);

      // Status: <5 RED, 5-9 WARNING, 10+ OK
      let setStatus;
      if (setCount >= 10) setStatus = "OK";
      else if (setCount >= 5) setStatus = "WARNING";
      else setStatus = "RED";

      reportChapters.push({
        chapter: chNum,
        chapterName: setName,
        isGenericName: isGeneric,
        setCount,
        totalQuestions,
        averageQuestionsPerSet: setCount > 0 ? Math.round(totalQuestions / setCount) : 0,
        incompleteSetCount: incompleteSets.length,
        status: setStatus,
      });

      // Update totals
      report.totals.chapters++;
      if (setStatus === "RED") report.totals.redCount++;
      else if (setStatus === "WARNING") report.totals.warningCount++;
      else report.totals.okCount++;
    }

    report.sectionB.papers.push({
      label: paper.label,
      slug: paper.slug,
      exists: true,
      totalChapters: chapters.length,
      chapters: reportChapters,
    });
  }
}

function auditSSC() {
  const SSC_SUBJECTS = [
    { slug: "physics", label: "Physics" },
    { slug: "chemistry", label: "Chemistry" },
    { slug: "biology", label: "Biology" },
    { slug: "higher-math", label: "Higher Math" },
    { slug: "general-math", label: "General Math" },
  ];

  for (const subj of SSC_SUBJECTS) {
    const data = loadQuizJson("ssc", subj.slug);
    if (!data) {
      report.sectionC.subjects.push({
        label: subj.label,
        slug: subj.slug,
        exists: false,
        status: "MISSING",
        chapters: [],
      });
      continue;
    }

    const chapterMap = extractChapterSets(data);
    const chapters = Object.entries(chapterMap).sort((a, b) => a[0].localeCompare(b[0]));
    const reportChapters = [];

    for (const [chNum, chData] of chapters) {
      const setName =
        chData.names.size > 0 ? [...chData.names][0] : `অধ্যায় ${chNum}`;
      const isGeneric = chData.names.size === 0 || isGenericChapterName(setName);
      const setCount = chData.sets.length;
      const totalQuestions = chData.sets.reduce((s, x) => s + (x.questionCount || 0), 0);

      const incompleteSets = chData.sets.filter((s) => (s.questionCount || 0) < 25);

      // SSC expects 5 sets. <5 RED, 5 OK (no WARNING range per spec — we use same 5 as threshold)
      let setStatus;
      if (setCount >= 10) setStatus = "OK";
      else if (setCount >= 5) setStatus = "WARNING";
      else setStatus = "RED";

      reportChapters.push({
        chapter: chNum,
        chapterName: setName,
        isGenericName: isGeneric,
        setCount,
        totalQuestions,
        averageQuestionsPerSet: setCount > 0 ? Math.round(totalQuestions / setCount) : 0,
        incompleteSetCount: incompleteSets.length,
        status: setStatus,
      });

      report.totals.chapters++;
      if (setStatus === "RED") report.totals.redCount++;
      else if (setStatus === "WARNING") report.totals.warningCount++;
      else report.totals.okCount++;
    }

    report.sectionC.subjects.push({
      label: subj.label,
      slug: subj.slug,
      exists: true,
      totalChapters: chapters.length,
      chapters: reportChapters,
    });
  }
}

// ─── SECTION D: SVG / Image Audit ───────────────────────────────────────────

function auditSVGs() {
  // Collect all SVG files that exist
  const existingSvgs = new Set();
  function scanSvgDir(dir, prefix) {
    if (!fs.existsSync(dir)) return;
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        scanSvgDir(full, item.name + "/");
      } else if (item.name.endsWith(".svg")) {
        existingSvgs.add(item.name);
      }
    }
  }
  scanSvgDir(IMAGES_QUIZ, "");

  // Check quiz JSON files for image/imageUrl references
  const referredImages = [];
  const levels = ["ssc", "hsc"];
  for (const level of levels) {
    const dir = path.join(QUIZ_DATA, level);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".json") || file.includes("model-tests.index")) continue;
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));

      // Check all questions for image fields
      function checkQuestions(questions, context) {
        if (!Array.isArray(questions)) return;
        for (let i = 0; i < Math.min(questions.length, 500); i++) {
          const q = questions[i];
          if (!q || typeof q !== "object") continue;
          const img = q.image || q.imageUrl || q.svg;
          if (img) {
            const imgStr = String(img);
            // Extract filename
            const imgName = imgStr.split("/").pop();
            if (imgName && !existingSvgs.has(imgName)) {
              referredImages.push({
                file,
                context,
                image: imgStr,
                missing: imgName,
              });
            }
          }
        }
      }

      // Check chapters
      if (data.chapters && typeof data.chapters === "object") {
        for (const [key, qs] of Object.entries(data.chapters)) {
          checkQuestions(qs, `chapters.${key}`);
        }
      }
      // Check modelTests
      if (data.modelTests && typeof data.modelTests === "object") {
        for (const [key, qs] of Object.entries(data.modelTests)) {
          checkQuestions(qs, `modelTests.${key}`);
        }
      }
      // Check boardQuestions
      if (data.boardQuestions && typeof data.boardQuestions === "object") {
        for (const [year, boards] of Object.entries(data.boardQuestions)) {
          if (boards && typeof boards === "object") {
            for (const [board, qs] of Object.entries(boards)) {
              checkQuestions(qs, `boardQuestions.${year}.${board}`);
            }
          }
        }
      }
    }
  }

  // Also check SVG count
  const svgDirItems = fs.existsSync(IMAGES_QUIZ) ? fs.readdirSync(IMAGES_QUIZ) : [];
  const svgCount = svgDirItems.filter(f => f.endsWith('.svg')).length;
  const premiumDir = path.join(IMAGES_QUIZ, 'premium');
  const premiumCount = fs.existsSync(premiumDir) ? fs.readdirSync(premiumDir).filter(f => f.endsWith('.svg')).length : 0;
  const generatedDir = path.join(IMAGES_QUIZ, 'generated');

  report.sectionD.items.push({
    totalSvgFiles: svgCount,
    premiumSvgFiles: premiumCount,
  });

  if (fs.existsSync(generatedDir)) {
    report.sectionD.items.push({
      generatedDir: true,
      generatedCount: fs.readdirSync(generatedDir).filter(f => f.endsWith('.svg')).length,
    });
  }

  report.sectionD.items.push({
    missingImages: referredImages.length,
    missingImageDetails: referredImages.slice(0, 50), // cap at 50
  });
}

// ─── SECTION E: Route Data File Audit ───────────────────────────────────────

function auditDataFiles() {
  const checks = [];

  // Check public/quiz-data files
  const sscSubjects = ["physics", "chemistry", "biology", "higher-math", "general-math"];
  const hscPapers = [
    "physics-1st-paper", "physics-2nd-paper", "chemistry-1st-paper", "chemistry-2nd-paper",
    "biology-1st-paper", "biology-2nd-paper", "higher-math-1st-paper", "higher-math-2nd-paper",
  ];

  const quizDataLevels = {
    ssc: sscSubjects,
    hsc: hscPapers,
  };

  for (const [level, slugs] of Object.entries(quizDataLevels)) {
    for (const slug of slugs) {
      const mainPath = path.join(QUIZ_DATA, level, `${slug}.json`);
      const idxPath = path.join(QUIZ_DATA, level, `${slug}.model-tests.index.json`);
      checks.push({
        path: `public/quiz-data/${level}/${slug}.json`,
        label: `Quiz Data: ${level} ${slug}`,
        exists: fs.existsSync(mainPath),
        type: "quiz-data",
      });
      checks.push({
        path: `public/quiz-data/${level}/${slug}.model-tests.index.json`,
        label: `Model Test Index: ${level} ${slug}`,
        exists: fs.existsSync(idxPath),
        type: "model-test-index",
      });
    }
  }

  // Check manifest
  checks.push({
    path: "public/quiz-data/manifest.json",
    label: "Quiz Data Manifest",
    exists: fs.existsSync(path.join(QUIZ_DATA, "manifest.json")),
    type: "manifest",
  });

  // Check public/questions directories
  const questionDirs = [...sscSubjects, ...hscPapers, "ict"];
  for (const dir of questionDirs) {
    const fullPath = path.join(QUESTIONS, dir);
    const hasIndex = fs.existsSync(path.join(fullPath, "index.json"));
    const fileCount = fs.existsSync(fullPath) ? fs.readdirSync(fullPath).filter(f => f.endsWith(".json")).length : 0;
    checks.push({
      path: `public/questions/${dir}/`,
      label: `Questions Dir: ${dir}`,
      exists: fs.existsSync(fullPath),
      hasIndex,
      fileCount,
      type: "questions-dir",
    });
  }

  report.sectionE.files = checks;
}

// ─── COMPILE TOP PROBLEMS ────────────────────────────────────────────────────

function compileTopProblems() {
  const problems = [];

  // RED chapters from HSC
  for (const paper of report.sectionB.papers) {
    if (!paper.chapters) continue;
    for (const ch of paper.chapters) {
      if (ch.status === "RED") {
        problems.push(`RED: ${paper.label} — Chapter ${ch.chapter} (${ch.chapterName}): only ${ch.setCount} sets`);
      }
      if (ch.isGenericName) {
        problems.push(`WARNING: ${paper.label} — Chapter ${ch.chapter}: generic name "${ch.chapterName}"`);
      }
      if (ch.incompleteSetCount > 0) {
        problems.push(`INCOMPLETE: ${paper.label} — Chapter ${ch.chapter}: ${ch.incompleteSetCount} sets have <25 questions`);
      }
    }
  }

  // RED chapters from SSC
  for (const subj of report.sectionC.subjects) {
    if (!subj.chapters) continue;
    for (const ch of subj.chapters) {
      if (ch.status === "RED") {
        problems.push(`RED: SSC ${subj.label} — Chapter ${ch.chapter} (${ch.chapterName}): only ${ch.setCount} sets`);
      }
      if (ch.isGenericName) {
        problems.push(`WARNING: SSC ${subj.label} — Chapter ${ch.chapter}: generic name "${ch.chapterName}"`);
      }
      if (ch.incompleteSetCount > 0) {
        problems.push(`INCOMPLETE: SSC ${subj.label} — Chapter ${ch.chapter}: ${ch.incompleteSetCount} sets have <25 questions`);
      }
    }
  }

  // Missing quiz-data files
  for (const f of report.sectionE.files) {
    if (!f.exists) {
      problems.push(`MISSING: ${f.label} — ${f.path}`);
    }
  }

  // Missing SVGs
  const missingSvgs = report.sectionD.items.find(i => i.missingImages !== undefined);
  if (missingSvgs && missingSvgs.missingImages > 0) {
    problems.push(`MISSING SVG: ${missingSvgs.missingImages} SVG files referenced but not found`);
    for (const det of (missingSvgs.missingImageDetails || []).slice(0, 5)) {
      problems.push(`  → ${det.image} (in ${det.file})`);
    }
  }

  // API issues
  for (const api of report.sectionA.apis) {
    if (api.backendDependent && !api.hasStaticFallback) {
      problems.push(`WARNING: ${api.endpoint} has no static fallback — will 500 if backend is down`);
    }
  }

  // Check for missing API fallback
  const disabledApis = report.sectionA.routes.filter(r => r.status === "DISABLED");
  for (const r of disabledApis) {
    problems.push(`DISABLED: ${r.label}`);
  }

  // Missing subjects/paper
  const missingData = report.sectionE.files.filter(f => !f.exists && f.type === "quiz-data");
  for (const f of missingData) {
    problems.push(`MISSING DATA: ${f.path}`);
  }

  report.topProblems = problems;
}

// ─── GENERATE REPORT TEXT ────────────────────────────────────────────────────

function generateTextReport() {
  const lines = [];

  function sep(title) {
    lines.push("");
    lines.push("=".repeat(72));
    lines.push(`  ${title}`);
    lines.push("=".repeat(72));
    lines.push("");
  }

  // Header
  lines.push("DEV-QUIZ-DASHBOARD WEBSITE LIVE STATUS AUDIT REPORT");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push("");

  // ── Section A: Routes & APIs ──
  sep("A. Routes & API Live Status");

  lines.push("Routes:");
  lines.push("-".repeat(72));
  for (const r of report.sectionA.routes) {
    const statusPad = (r.status || "LIVE").padEnd(20);
    lines.push(`  [${statusPad}] ${r.label}`);
  }

  if (report.sectionA.apis.length) {
    lines.push("");
    lines.push("API Details:");
    for (const api of report.sectionA.apis) {
      lines.push(`  ${api.endpoint}: ${api.status}`);
      if (api.backendDependent) {
        lines.push(`    → Backend-dependent: yes | Static fallback: ${api.hasStaticFallback ? "YES" : "NO"}`);
      }
      if (api.stripsAnswers) {
        lines.push(`    → Answer-stripping: yes`);
      }
    }
  }

  // ── Section B: HSC Chapter Audit ──
  sep("B. HSC Chapter Names & Set Counts");

  for (const paper of report.sectionB.papers) {
    lines.push(`\n${paper.label} (${paper.slug}):`);
    if (!paper.exists) {
      lines.push("  ** FILE MISSING **");
      continue;
    }
    if (paper.totalChapters === 0) {
      lines.push("  No chapters found (all data in chapter-scoped model tests)");
    }
    lines.push(`  ${"Chapter".padEnd(10)} ${"Name".padEnd(40)} ${"Sets".padEnd(6)} ${"Q/S".padEnd(5)} ${"Status".padEnd(10)}`);
    lines.push(`  ${"-".repeat(10)} ${"-".repeat(40)} ${"-".repeat(6)} ${"-".repeat(5)} ${"-".repeat(10)}`);
    for (const ch of paper.chapters) {
      const nameDisplay = ch.isGenericName ? `${ch.chapterName} ⚠` : ch.chapterName;
      lines.push(
        `  ${ch.chapter.padEnd(10)} ${(nameDisplay || "-").slice(0, 38).padEnd(40)} ${String(ch.setCount).padEnd(6)} ${String(ch.averageQuestionsPerSet).padEnd(5)} ${ch.status.padEnd(10)}`
      );
    }
  }

  // ── Section C: SSC Chapter Audit ──
  sep("C. SSC Chapter Names & Set Counts");

  for (const subj of report.sectionC.subjects) {
    lines.push(`\n${subj.label} (ssc/${subj.slug}):`);
    if (!subj.exists) {
      lines.push("  ** FILE MISSING **");
      continue;
    }
    if (subj.totalChapters === 0) {
      lines.push("  No chapters found (all data in chapter-scoped model tests)");
    }
    lines.push(`  ${"Chapter".padEnd(10)} ${"Name".padEnd(35)} ${"Sets".padEnd(6)} ${"Q/S".padEnd(5)} ${"Status".padEnd(10)}`);
    lines.push(`  ${"-".repeat(10)} ${"-".repeat(35)} ${"-".repeat(6)} ${"-".repeat(5)} ${"-".repeat(10)}`);
    for (const ch of subj.chapters) {
      const nameDisplay = ch.isGenericName ? `${ch.chapterName} ⚠` : ch.chapterName;
      lines.push(
        `  ${ch.chapter.padEnd(10)} ${(nameDisplay || "-").slice(0, 33).padEnd(35)} ${String(ch.setCount).padEnd(6)} ${String(ch.averageQuestionsPerSet).padEnd(5)} ${ch.status.padEnd(10)}`
      );
    }
  }

  // ── Section D: SVG Audit ──
  sep("D. SVG / Image Audit");

  const svgInfo = report.sectionD.items.find(i => i.totalSvgFiles !== undefined);
  if (svgInfo) {
    lines.push(`  Total SVG files in public/images/quiz/: ${svgInfo.totalSvgFiles}`);
    lines.push(`  Premium SVGs: ${svgInfo.premiumSvgFiles}`);
  }

  const genInfo = report.sectionD.items.find(i => i.generatedDir !== undefined);
  if (genInfo) lines.push(`  Generated SVGs: ~${genInfo.generatedCount}`);

  const missingInfo = report.sectionD.items.find(i => i.missingImages !== undefined);
  if (missingInfo) {
    lines.push(`\n  Missing/SVG files referenced but not found: ${missingInfo.missingImages}`);
    const details = missingInfo.missingImageDetails || [];
    if (details.length > 0) {
      lines.push("  Examples:");
      for (const d of details.slice(0, 10)) {
        lines.push(`    - ${d.image} (referenced in ${d.file})`);
      }
    }
  }

  // ── Section E: Route Data Files ──
  sep("E. Route Data File Audit");

  lines.push("  Quiz Data (public/quiz-data/):");
  const quizDataFiles = report.sectionE.files.filter(f => f.type === "quiz-data");
  for (const f of quizDataFiles) {
    lines.push(`    [${f.exists ? "OK" : "MISSING"}] ${f.path}`);
  }

  lines.push("\n  Model Test Index (public/quiz-data/):");
  const idxFiles = report.sectionE.files.filter(f => f.type === "model-test-index");
  for (const f of idxFiles) {
    lines.push(`    [${f.exists ? "OK" : "MISSING"}] ${f.path}`);
  }

  lines.push("\n  Manifest:");
  const manifestFiles = report.sectionE.files.filter(f => f.type === "manifest");
  for (const f of manifestFiles) {
    lines.push(`    [${f.exists ? "OK" : "MISSING"}] ${f.path}`);
  }

  lines.push("\n  Question Files (public/questions/):");
  const qFiles = report.sectionE.files.filter(f => f.type === "questions-dir");
  for (const f of qFiles) {
    const status = f.exists ? `OK (${f.fileCount} files)` : "MISSING";
    lines.push(`    [${f.exists ? "OK" : "MISSING"}] ${f.path} — ${f.exists ? `${f.fileCount} JSON files${f.hasIndex ? ', has index.json' : ', no index.json'}` : 'directory not found'}`);
  }

  // ── Summary ──
  sep("SUMMARY");

  const totalChapters = report.totals.chapters;
  const red = report.totals.redCount;
  const warning = report.totals.warningCount;
  const ok = report.totals.okCount;

  lines.push(`  Total chapters detected: ${totalChapters}`);
  lines.push(`  RED (critical, <5 sets):   ${red}`);
  lines.push(`  WARNING (5-9 sets):        ${warning}`);
  lines.push(`  OK (10+ sets):             ${ok}`);
  lines.push("");

  // Top 10 problems
  lines.push("  TOP PROBLEMS:");
  lines.push("  " + "-".repeat(60));
  const topProblems = report.topProblems.slice(0, 10);
  for (let i = 0; i < topProblems.length; i++) {
    lines.push(`  ${i + 1}. ${topProblems[i]}`);
  }
  if (report.topProblems.length > 10) {
    lines.push(`  ... and ${report.topProblems.length - 10} more`);
  }

  lines.push("");
  lines.push("─".repeat(72));
  lines.push(`Report saved to: data/website-audit-report.json`);
  lines.push(`This file:       data/website-audit-report.txt`);

  return lines.join("\n");
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

function main() {
  console.log("Running dev-quiz-dashboard website audit...\n");

  auditRoutes();
  auditHSC();
  auditSSC();
  auditSVGs();
  auditDataFiles();
  compileTopProblems();

  const text = generateTextReport();

  // Write JSON report
  const jsonPath = path.join(ROOT, "data", "website-audit-report.json");
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`Written: ${path.relative(ROOT, jsonPath)}`);

  // Write text report
  const txtPath = path.join(ROOT, "data", "website-audit-report.txt");
  fs.writeFileSync(txtPath, text, "utf8");
  console.log(`Written: ${path.relative(ROOT, txtPath)}`);

  // Print short summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("AUDIT SUMMARY");
  console.log(`${"=".repeat(60)}`);
  console.log(`Total chapters: ${report.totals.chapters}`);
  console.log(`RED (<5 sets):     ${report.totals.redCount}`);
  console.log(`WARNING (5-9):     ${report.totals.warningCount}`);
  console.log(`OK (10+):          ${report.totals.okCount}`);
  console.log(`Top problems:      ${report.topProblems.length}`);
  console.log("");
  for (let i = 0; i < Math.min(report.topProblems.length, 10); i++) {
    console.log(`  ${i + 1}. ${report.topProblems[i]}`);
  }
  if (report.topProblems.length > 10) {
    console.log(`  ... and ${report.topProblems.length - 10} more`);
  }
  console.log(`\nReports:`);
  console.log(`  data/website-audit-report.json`);
  console.log(`  data/website-audit-report.txt`);
}

main();
