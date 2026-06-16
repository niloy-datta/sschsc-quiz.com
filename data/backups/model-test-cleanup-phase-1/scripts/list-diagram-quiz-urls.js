/**
 * List localhost URLs for quiz sets/questions that have diagrams.
 * Usage: node scripts/list-diagram-quiz-urls.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const BASE = "http://localhost:3000";

const HSC_SLUGS = new Set([
  "biology-1st-paper",
  "biology-2nd-paper",
  "physics-1st-paper",
  "physics-2nd-paper",
  "chemistry-1st-paper",
  "chemistry-2nd-paper",
  "higher-math-1st-paper",
  "higher-math-2nd-paper",
  "ict",
]);

const LEKHOCHITRA_OPT_RE = /^\[?\s*লেখচিত্র\s*[১২৩৪1-4]|ঘ\s*\]?$/i;

function levelFor(subject) {
  return HSC_SLUGS.has(subject) ? "hsc" : "ssc";
}

function chapterSlugFromFilename(fname) {
  const m = fname.match(/chapter-(\d{2})/i);
  return m ? `chapter-${m[1]}` : null;
}

function setUrl(subject, filename) {
  const level = levelFor(subject);
  const fname = filename.replace(/\.json$/, "");

  const board = fname.match(/^([a-z]+)-(\d{4})$/i);
  if (board) {
    const [, boardName, year] = board;
    if (level === "hsc") {
      const parts = subject.match(/^(.+)-(\d+(?:st|nd)-paper)$/);
      if (parts) {
        return `${BASE}/hsc-board-questions/${parts[1]}/${parts[2]}/${year}?board=${boardName}`;
      }
    }
    return `${BASE}/ssc-board-questions/${subject}/${year}?board=${boardName}`;
  }

  const chSlug = chapterSlugFromFilename(fname);
  if (chSlug) {
    return `${BASE}/${level}/${subject}/chapter/${chSlug}/set/${encodeURIComponent(fname)}`;
  }

  return `${BASE}/${level}/${subject}/model-tests/${encodeURIComponent(fname)}`;
}

function imageAssetUrl(imagePath) {
  return `${BASE}${imagePath}`;
}

const sets = new Map();

function noteSet(subject, file, q, kind) {
  const key = `${subject}::${file}`;
  if (!sets.has(key)) {
    sets.set(key, {
      subject,
      file,
      quizUrl: setUrl(subject, path.basename(file)),
      questions: [],
    });
  }
  sets.get(key).questions.push({
    id: q.id,
    kind,
    image: q.image || null,
    imageUrl: q.image ? imageAssetUrl(q.image) : null,
    snippet: String(q.text || q.questionText || q.question || "").slice(0, 80),
  });
}

function walkQuestions(list, file, subject) {
  for (const q of list) {
    if (!q || typeof q !== "object") continue;
    const text = String(q.text || q.questionText || q.question || "");
    if (q.image) noteSet(subject, file, q, "question-image");

    const opts = Array.isArray(q.options)
      ? q.options.map((o) => (typeof o === "string" ? o : o?.text || ""))
      : [];
    if (opts.some((o) => LEKHOCHITRA_OPT_RE.test(String(o).trim()))) {
      noteSet(subject, file, q, "graph-options");
    }
  }
}

function walkFile(filePath, subject) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return;
  }
  if (Array.isArray(data)) walkQuestions(data, filePath, subject);
  else if (Array.isArray(data.questions)) walkQuestions(data.questions, filePath, subject);
  else {
    for (const v of Object.values(data)) {
      if (Array.isArray(v)) {
        for (const item of v) {
          if (item?.questions) walkQuestions(item.questions, filePath, subject);
          else walkQuestions([item], filePath, subject);
        }
      }
    }
  }
}

function walkDir(dir, subject) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(p, subject);
    else if (ent.name.endsWith(".json") && ent.name !== "index.json") walkFile(p, subject);
  }
}

function main() {
  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    const dir = path.join(QUESTIONS_DIR, subject);
    if (!fs.statSync(dir).isDirectory()) continue;
    walkDir(dir, subject);
  }

  const sorted = [...sets.values()].sort((a, b) => a.quizUrl.localeCompare(b.quizUrl));
  console.log(`# Diagram quiz URLs (${sorted.length} sets)\n`);
  for (const s of sorted) {
    console.log(`## ${s.subject} / ${path.basename(s.file)}`);
    console.log(`Quiz: ${s.quizUrl}`);
    for (const q of s.questions) {
      console.log(`  - [${q.kind}] ${q.id}`);
      if (q.imageUrl) console.log(`    SVG: ${q.imageUrl}`);
      console.log(`    ${q.snippet}`);
    }
    console.log("");
  }
}

main();
