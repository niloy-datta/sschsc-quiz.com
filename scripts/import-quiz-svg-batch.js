/**
 * Import quiz SVG batch from manifest + staging directory.
 * Usage: node scripts/import-quiz-svg-batch.js [manifest.json] [svg-dir]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, "biology-hsc-svg-batch-manifest.json");
const SVG_DIR = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(__dirname, "quiz_svg_batch");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const OUT_QUIZ = path.join(ROOT, "public", "images", "quiz");

function collectQuestions(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.questions)) return data.questions;
  return [];
}

function attachToFile(relFile, questionId, imagePath) {
  const fp = path.join(QUESTIONS_DIR, relFile);
  if (!fs.existsSync(fp)) {
    console.warn("MISSING JSON file:", relFile);
    return false;
  }
  const raw = JSON.parse(fs.readFileSync(fp, "utf8"));
  const list = collectQuestions(raw);
  const q = list.find((x) => String(x.id) === questionId);
  if (!q) {
    console.warn("NOT FOUND in JSON:", questionId, relFile);
    return false;
  }
  q.image = imagePath;
  const out = Array.isArray(raw) ? list : { ...raw, questions: list };
  fs.writeFileSync(fp, `${JSON.stringify(Array.isArray(raw) ? list : out, null, 2)}\n`, "utf8");
  return true;
}

function main() {
  const entries = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  let copied = 0;
  let attached = 0;
  let missing = 0;

  fs.mkdirSync(OUT_QUIZ, { recursive: true });

  for (const { id, file } of entries) {
    const src = path.join(SVG_DIR, `${id}.svg`);
    const dest = path.join(OUT_QUIZ, `${id}.svg`);
    const imagePath = `/images/quiz/${id}.svg`;

    if (!fs.existsSync(src)) {
      console.warn("MISSING SVG file:", src);
      missing++;
      continue;
    }

    fs.copyFileSync(src, dest);
    copied++;

    if (attachToFile(file, id, imagePath)) {
      attached++;
      console.log("OK", id);
    }
  }

  console.log(`Done: ${copied} SVGs copied, ${attached} attached, ${missing} missing source files`);
}

main();
