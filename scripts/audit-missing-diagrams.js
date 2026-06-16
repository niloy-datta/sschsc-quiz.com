/**
 * Audit questions that need diagrams but lack trusted SVG.
 */
const fs = require("fs");
const path = require("path");

const QUESTIONS_DIR = path.join(__dirname, "..", "public", "questions");

const TRUSTED = new Set([
  "ssc-charge-spheres", "ssc-wave-crests", "ssc-concave-mirror", "ssc-convex-lens",
  "cell-division", "cell-wall", "sporangium", "plasmid", "fern-prothallus",
  "vascular-bundle", "dna-rna", "bio-nephron", "bio-neuron", "bio-eye",
  "bio-digestive", "bio-alveoli", "bio-xylem-phloem", "bio-logic-gate",
]);

const HINT =
  /\[চিত্র\s*[:：]|\(চিত্র\s*[:：]|চিত্রে|উদ্দীপক|চিত্রভিত্তিক|লেখচিত্র|গ্রাফ|diagram|circuit|বৃত্ত|triangle|ত্রিভুজ|vector|সমন্বয়|অক্ষ|wave|তরঙ্গ|force|V-I|I-V|E-ν/i;

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

function slugFromImage(image) {
  if (!image) return null;
  return String(image).replace(/^\/images\/quiz\//, "").replace(/\.svg$/i, "");
}

function walkDir(dir, stats) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(p, stats);
    else if (ent.name.endsWith(".json") && ent.name !== "index.json") {
      for (const q of collectQuestions(JSON.parse(fs.readFileSync(p, "utf8")))) {
        stats.total++;
        const t = String(q.text || q.questionText || q.question || "");
        if (!HINT.test(t)) continue;
        stats.needDiagram++;
        const slug = slugFromImage(q.image);
        if (q.image && q.image.startsWith("/images/quiz/")) {
          stats.hasImage++;
          continue;
        }
        stats.missing++;
      }
    }
  }
}

function main() {
  const stats = { total: 0, needDiagram: 0, hasImage: 0, missing: 0 };
  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    const dir = path.join(QUESTIONS_DIR, subject);
    if (fs.statSync(dir).isDirectory()) walkDir(dir, stats);
  }
  console.log(stats);
}

main();
