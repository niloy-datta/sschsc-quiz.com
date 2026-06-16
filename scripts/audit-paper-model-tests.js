/**
 * Comprehensive paper-wise & model-test-wise audit.
 * Run: node scripts/audit-paper-model-tests.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUIZ_DATA = path.join(ROOT, "public/quiz-data");
const QUESTIONS = path.join(ROOT, "public/questions");

const SUBJECTS = [
  ...["physics", "chemistry", "biology", "higher-math", "general-math"].map((s) => ({
    level: "ssc",
    slug: s,
    label: `SSC ${s}`,
  })),
  ...[
    ["physics-1st-paper", "HSC Physics 1st Paper"],
    ["physics-2nd-paper", "HSC Physics 2nd Paper"],
    ["chemistry-1st-paper", "HSC Chemistry 1st Paper"],
    ["chemistry-2nd-paper", "HSC Chemistry 2nd Paper"],
    ["biology-1st-paper", "HSC Biology 1st Paper"],
    ["biology-2nd-paper", "HSC Biology 2nd Paper"],
    ["higher-math-1st-paper", "HSC Higher Math 1st Paper"],
    ["higher-math-2nd-paper", "HSC Higher Math 2nd Paper"],
    ["ict", "HSC ICT"],
  ].map(([slug, label]) => ({ level: "hsc", slug, label })),
];

function normText(t) {
  return String(t || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function qText(q) {
  return normText(q.questionText || q.question || "");
}

const issues = [];

function add(paper, status, type, details, fix = "") {
  issues.push({ paper, status, type, details, fix });
}

const globalFingerprints = new Map();

for (const sub of SUBJECTS) {
  const file = path.join(QUIZ_DATA, sub.level, `${sub.slug}.json`);
  if (!fs.existsSync(file)) {
    add(sub.label, "Problem Found", "Missing", `Main JSON file not found: ${file}`, "Restore subject JSON");
    continue;
  }

  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const modelTests = data.modelTests || {};
  const chapters = data.chapters || {};

  for (const setId of Object.keys(modelTests)) {
    const sid = setId.toLowerCase();
    if (sub.level === "hsc" && sub.slug !== "ict") {
      const paperMatch = sid.match(/(physics|chemistry|biology|higher-math)-(1st|2nd)-paper/);
      if (paperMatch) {
        const found = `${paperMatch[1]}-${paperMatch[2]}-paper`;
        if (found !== sub.slug) {
          add(
            `${sub.label} / ${setId}`,
            "Problem Found",
            "Mixed",
            `Set ID references "${found}" but stored in ${sub.slug}.json`,
            "Move set to correct paper JSON or rename slug",
          );
        }
      }
      if (sub.slug.includes("1st-paper") && sid.includes("2nd-paper")) {
        add(
          `${sub.label} / ${setId}`,
          "Problem Found",
          "Mixed",
          "1st-paper file contains set ID with '2nd-paper'",
          "Move to 2nd-paper JSON or fix slug",
        );
      }
      if (sub.slug.includes("2nd-paper") && sid.includes("1st-paper")) {
        add(
          `${sub.label} / ${setId}`,
          "Problem Found",
          "Mixed",
          "2nd-paper file contains set ID with '1st-paper'",
          "Move to 1st-paper JSON or fix slug",
        );
      }
    }
    if (sub.level === "ssc" && sid.includes("hsc-")) {
      add(
        `${sub.label} / ${setId}`,
        "Problem Found",
        "Mixed",
        "SSC file contains HSC-prefixed set ID",
        "Move set to correct HSC paper JSON",
      );
    }
  }

  const allSets = { ...modelTests, ...chapters };
  const setFingerprints = new Map();

  for (const [setId, questions] of Object.entries(allSets)) {
    const qs = Array.isArray(questions) ? questions : [];
    const paperName = `${sub.label} / ${setId}`;

    if (qs.length === 0) {
      add(paperName, "Problem Found", "Missing", "Set has 0 questions", "Populate or remove empty set");
      continue;
    }

    const expected = sub.slug === "general-math" ? 30 : 25;
    if (qs.length !== expected && qs.length !== 20 && qs.length !== 15 && !setId.includes("board")) {
      if (qs.length < 10 || qs.length > expected + 5) {
        add(
          paperName,
          "Problem Found",
          "Other",
          `Unusual question count: ${qs.length} (typical: ${expected})`,
          "Verify set completeness",
        );
      }
    }

    const chFromSlug = setId.match(/chapter-(\d{2})/i);
    const setChapter = chFromSlug ? chFromSlug[1] : null;

    const seenIds = new Set();
    const qTexts = [];

    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      const qNo = q.questionNo ?? q.number ?? i + 1;
      if (qNo !== i + 1) {
        add(
          paperName,
          "Problem Found",
          "Wrong Serial",
          `Question at index ${i} has questionNo=${qNo}, expected ${i + 1}`,
          "Renumber questions sequentially",
        );
      }

      const qid = q.id || q.questionId || "";
      if (qid) {
        if (seenIds.has(qid)) {
          add(
            paperName,
            "Problem Found",
            "Duplicate",
            `Duplicate question id "${qid}" within same set`,
            "Assign unique IDs",
          );
        }
        seenIds.add(qid);

        if (setChapter && qid.includes("chapter-")) {
          const idCh = qid.match(/chapter-(\d{2})/);
          if (idCh && idCh[1] !== setChapter) {
            add(
              paperName,
              "Problem Found",
              "Wrong Placement",
              `Q${qNo}: id chapter-${idCh[1]} but set is chapter-${setChapter}`,
              "Fix question id or move to correct set",
            );
          }
        }
      }

      const qChRaw = String(q.chapter || q.chapterNo || "").trim();
      if (setChapter && qChRaw) {
        const qCh = qChRaw.padStart(2, "0");
        if (qCh !== setChapter && qCh !== setChapter.replace(/^0/, "")) {
          add(
            paperName,
            "Problem Found",
            "Wrong Placement",
            `Q${qNo}: question chapter="${q.chapter}" but set slug is chapter-${setChapter}`,
            "Fix chapter metadata or move question",
          );
        }
      }

      const txt = qText(q);
      if (!txt || txt.length < 5) {
        add(
          paperName,
          "Problem Found",
          "Missing",
          `Q${qNo}: empty or too-short question text`,
          "Replace or remove broken question",
        );
      }
      qTexts.push(txt);

      const opts = [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean);
      if (opts.length < 4 && !(Array.isArray(q.options) && q.options.length >= 4)) {
        add(
          paperName,
          "Problem Found",
          "Missing",
          `Q${qNo}: fewer than 4 options`,
          "Add missing options",
        );
      }
      if (!q.correctOption && q.answerIndex == null && q.correctAnswer == null) {
        add(
          paperName,
          "Problem Found",
          "Missing",
          `Q${qNo}: no correct answer marked`,
          "Set correctOption",
        );
      }

      const fp = `${txt}||${opts.join("|") || (q.options || []).join("|")}`;
      if (fp.length > 20) {
        if (!globalFingerprints.has(fp)) globalFingerprints.set(fp, []);
        globalFingerprints.get(fp).push({ paper: sub.label, setId, qNo });
      }
    }

    const textCounts = {};
    for (const t of qTexts) {
      if (t.length > 15) textCounts[t] = (textCounts[t] || 0) + 1;
    }
    for (const [t, c] of Object.entries(textCounts)) {
      if (c > 1) {
        add(
          paperName,
          "Problem Found",
          "Duplicate",
          `Same question text appears ${c} times in one set: "${t.slice(0, 80)}..."`,
          "Remove duplicate questions",
        );
      }
    }

    const fp = JSON.stringify([...qTexts].sort());
    if (!setFingerprints.has(fp)) setFingerprints.set(fp, []);
    setFingerprints.get(fp).push(setId);

    const sidecar = path.join(QUESTIONS, sub.slug, `${setId}.json`);
    if (fs.existsSync(sidecar)) {
      try {
        const sc = JSON.parse(fs.readFileSync(sidecar, "utf8"));
        const scQs = Array.isArray(sc) ? sc : sc.questions || [];
        if (scQs.length !== qs.length) {
          add(
            paperName,
            "Problem Found",
            "Mixed",
            `Sidecar has ${scQs.length} questions but mega JSON has ${qs.length}`,
            "Sync sidecar with mega JSON",
          );
        }
      } catch (e) {
        add(paperName, "Problem Found", "Other", `Sidecar JSON invalid: ${e.message}`, "Fix sidecar file");
      }
    }
  }

  for (const [, setIds] of setFingerprints.entries()) {
    if (setIds.length > 1) {
      add(
        `${sub.label} (duplicate sets)`,
        "Problem Found",
        "Duplicate",
        `Identical content in ${setIds.length} sets: ${setIds.slice(0, 8).join(", ")}${setIds.length > 8 ? "..." : ""}`,
        "Keep one set, delete duplicates",
      );
    }
  }

  const idxPath = path.join(QUIZ_DATA, sub.level, `${sub.slug}.model-tests.index.json`);
  if (fs.existsSync(idxPath)) {
    const idx = JSON.parse(fs.readFileSync(idxPath, "utf8"));
    const idxIds = new Set();
    if (Array.isArray(idx.modelTests)) idx.modelTests.forEach((m) => idxIds.add(m.id || m.slug));
    else if (idx.modelTests) Object.keys(idx.modelTests).forEach((k) => idxIds.add(k));
    else if (Array.isArray(idx.tests)) idx.tests.forEach((m) => idxIds.add(m.id));

    const megaIds = new Set(Object.keys(modelTests));
    for (const id of megaIds) {
      if (idxIds.size && !idxIds.has(id)) {
        add(
          `${sub.label} / ${id}`,
          "Problem Found",
          "Mixed",
          "Set in mega JSON but missing from model-tests.index.json",
          "Rebuild index",
        );
      }
    }
    for (const id of idxIds) {
      if (!megaIds.has(id)) {
        add(
          `${sub.label} / ${id}`,
          "Problem Found",
          "Mixed",
          "Set in index but missing from mega JSON",
          "Remove from index or restore set",
        );
      }
    }
  }

  const chapterSets = Object.keys(modelTests).filter((k) => /chapter-\d{2}-/.test(k));
  const byChapter = {};
  for (const k of chapterSets) {
    const m = k.match(/chapter-(\d{2}).*?(?:model-test|set|high-priority)-(\d{2})/i);
    if (m) {
      const ch = m[1];
      const num = parseInt(m[2], 10);
      byChapter[ch] = byChapter[ch] || [];
      byChapter[ch].push({ k, num });
    }
  }
  for (const [ch, sets] of Object.entries(byChapter)) {
    sets.sort((a, b) => a.num - b.num);
    const nums = sets.map((s) => s.num);
    const max = Math.max(...nums);
    const missing = [];
    for (let n = 1; n <= max; n++) if (!nums.includes(n)) missing.push(n);
    if (missing.length > 0) {
      add(
        `${sub.label} Chapter ${ch}`,
        "Problem Found",
        "Missing",
        `Serial gaps in chapter-${ch} sets: missing ${missing.join(", ")} (have: ${nums.join(", ")})`,
        "Import missing sets or renumber",
      );
    }
  }
}

for (const [fp, locs] of globalFingerprints.entries()) {
  const papers = new Set(locs.map((l) => l.paper));
  if (papers.size > 1 && fp.length > 50) {
    const hscPhysics = locs.filter((l) => l.paper.includes("Physics"));
    const papersInPhysics = new Set(hscPhysics.map((l) => l.paper));
    if (papersInPhysics.size > 1) {
      const detail = locs
        .slice(0, 4)
        .map((l) => `${l.paper}/${l.setId}#${l.qNo}`)
        .join("; ");
      add(
        `Cross-paper: ${detail}`,
        "Problem Found",
        "Mixed",
        `Same question in both Physics papers: ${[...papersInPhysics].join(", ")}`,
        "Verify question belongs to correct paper",
      );
    }
  }
}

const reportPath = path.join(ROOT, "scripts", "paper-model-audit-report.json");
fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2));

const byType = {};
const byPaper = {};
for (const i of issues) {
  byType[i.type] = (byType[i.type] || 0) + 1;
  const key = i.paper.split(" / ")[0];
  byPaper[key] = (byPaper[key] || 0) + 1;
}

console.log("TOTAL_ISSUES", issues.length);
console.log("BY_TYPE", JSON.stringify(byType, null, 2));
console.log("BY_PAPER", JSON.stringify(byPaper, null, 2));
console.log("Report:", reportPath);
