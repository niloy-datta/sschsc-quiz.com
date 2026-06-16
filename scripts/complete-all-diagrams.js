/**
 * Complete ALL missing question diagrams:
 * 1. Classify each diagram-needing question
 * 2. Write generated SVGs where needed
 * 3. Attach image field on every question
 *
 * Usage: node scripts/complete-all-diagrams.js
 */
const fs = require("fs");
const path = require("path");
const {
  resolveDiagramTopic,
  imagePathForSlug,
  generatedReferenceSvg,
} = require("./lib/diagram-topic-resolver");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const QUIZ_IMG = path.join(ROOT, "public", "images", "quiz");
const GENERATED_DIR = path.join(QUIZ_IMG, "generated");

const NEED_RE =
  /\[চিত্র\s*[:：]|\(চিত্র\s*[:：]|চিত্রে|উদ্দীপক|চিত্রভিত্তিক|লেখচিত্র|গ্রাফ|diagram|circuit|বৃত্ত|triangle|ত্রিভুজ|vector|ভেক্টor|ভেক্টর|সমন্বয়|অক্ষ|wave|তরঙ্গ|force|বল\s*চিত্র|V-I|I-V|E-ν|স্থানাঙ্ক|coordinate|parabola|x²|y\s*=|বর্তনী|resistor|লেন্স|দর্পণ|mirror|lens/i;

const stats = {
  scanned: 0,
  needDiagram: 0,
  libraryAttached: 0,
  generatedWritten: 0,
  alreadyOk: 0,
  filesUpdated: 0,
};

function collectQuestions(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.questions)) return data.questions;
  const out = [];
  for (const v of Object.values(data)) {
    if (!Array.isArray(v)) continue;
    for (const item of v) {
      if (item?.questions) out.push(...item.questions);
      else out.push(item);
    }
  }
  return out;
}

function questionText(q) {
  return String(q.text || q.questionText || q.question || "");
}

function needsDiagram(text) {
  return NEED_RE.test(text);
}

function ensureGeneratedSvg(slug, hint) {
  const filePath = path.join(QUIZ_IMG, `${slug}.svg`);
  if (fs.existsSync(filePath)) return false;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${generatedReferenceSvg(hint)}\n`, "utf8");
  return true;
}

function patchQuestion(q) {
  stats.scanned++;
  const text = questionText(q);
  if (!needsDiagram(text)) return false;

  stats.needDiagram++;
  const id = String(q.id || `q-${stats.scanned}`);
  const resolved = resolveDiagramTopic(text, id);
  const imagePath = imagePathForSlug(resolved.slug);

  if (resolved.kind === "generated") {
    if (ensureGeneratedSvg(resolved.slug, resolved.hint || text.slice(0, 120))) {
      stats.generatedWritten++;
    }
  }

  if (q.image === imagePath) {
    stats.alreadyOk++;
    return false;
  }

  q.image = imagePath;
  if (resolved.kind === "library") stats.libraryAttached++;
  else stats.generatedWritten += 0; // counted on write
  return true;
}

function patchFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let updated = 0;

  if (Array.isArray(data)) {
    for (const q of data) if (patchQuestion(q)) updated++;
  } else if (Array.isArray(data.questions)) {
    for (const q of data.questions) if (patchQuestion(q)) updated++;
  } else {
    for (const v of Object.values(data)) {
      if (!Array.isArray(v)) continue;
      for (const item of v) {
        if (item?.questions) {
          for (const q of item.questions) if (patchQuestion(q)) updated++;
        } else if (patchQuestion(item)) updated++;
      }
    }
  }

  if (updated > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    stats.filesUpdated++;
  }
}

function walkDir(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(p);
    else if (ent.name.endsWith(".json") && ent.name !== "index.json") patchFile(p);
  }
}

function main() {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });

  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    const dir = path.join(QUESTIONS_DIR, subject);
    if (fs.statSync(dir).isDirectory()) walkDir(dir);
  }

  console.log("Complete all diagrams — done");
  console.log(stats);
}

main();
