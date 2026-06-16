/**
 * Strip wrongly auto-attached generic diagram images from question JSON.
 * Keeps only verified SSC physics + biology diagram slugs.
 *
 * Usage: node scripts/strip-untrusted-diagram-images.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");

const TRUSTED_SLUGS = new Set([
  "ssc-charge-spheres",
  "ssc-wave-crests",
  "ssc-concave-mirror",
  "ssc-convex-lens",
  "cell-division",
  "cell-wall",
  "sporangium",
  "plasmid",
  "fern-prothallus",
  "vascular-bundle",
  "dna-rna",
  "bio-nephron",
  "bio-neuron",
  "bio-eye",
  "bio-digestive",
  "bio-alveoli",
  "bio-xylem-phloem",
  "bio-logic-gate",
]);

function slugFromImage(image) {
  if (!image || typeof image !== "string") return null;
  return image.replace(/^\/images\/quiz\//, "").replace(/\.svg$/i, "");
}

function isTrusted(image) {
  const slug = slugFromImage(image);
  return slug != null && TRUSTED_SLUGS.has(slug);
}

function patchQuestions(list) {
  let stripped = 0;
  for (const q of list) {
    if (!q || typeof q !== "object" || !q.image) continue;
    if (!isTrusted(q.image)) {
      q.image = null;
      stripped++;
    }
  }
  return stripped;
}

function walkJsonFile(filePath, stats) {
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  let stripped = 0;

  if (Array.isArray(data)) stripped += patchQuestions(data);
  else if (Array.isArray(data.questions)) stripped += patchQuestions(data.questions);
  else {
    for (const value of Object.values(data)) {
      if (!Array.isArray(value)) continue;
      for (const item of value) {
        if (item?.questions) stripped += patchQuestions(item.questions);
        else stripped += patchQuestions([item]);
      }
    }
  }

  if (stripped > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    stats.files += 1;
    stats.questions += stripped;
  }
}

function walkDir(dir, stats) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(p, stats);
    else if (ent.name.endsWith(".json") && ent.name !== "index.json") walkJsonFile(p, stats);
  }
}

function main() {
  const stats = { files: 0, questions: 0 };
  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    const dir = path.join(QUESTIONS_DIR, subject);
    if (fs.statSync(dir).isDirectory()) walkDir(dir, stats);
  }
  console.log(`Stripped untrusted diagram images: ${stats.questions} questions in ${stats.files} files`);
}

main();
