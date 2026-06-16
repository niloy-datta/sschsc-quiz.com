/**
 * Attach trusted diagram paths + strip anything else.
 * Usage: node scripts/attach-quiz-diagrams.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");

const TRUSTED = new Set([
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
  if (!image) return null;
  return String(image).replace(/^\/images\/quiz\//, "").replace(/\.svg$/i, "");
}

function resolve(text) {
  if (!text) return null;
  const t = String(text);

  const bracket = t.match(/\[চিত্র\s*[:：]\s*([^\]]+)\]/i);
  if (bracket) {
    const h = bracket[1];
    if (/গোলক/i.test(h) && /আধান/i.test(h) && /\bA\b/.test(h) && /\bB\b/.test(h)) {
      return "ssc-charge-spheres";
    }
    if (/তরঙ্গ/i.test(h) && /চূ/i.test(h)) return "ssc-wave-crests";
    if (/অবতল দর্পণ/i.test(h) && /লক্ষ্যবস্তু/i.test(h)) return "ssc-concave-mirror";
  }

  const paren = t.match(/\(\s*চিত্র\s*[:：]\s*([^)]+)\s*\)/i);
  if (paren) {
    const l = paren[1].trim().toLowerCase();
    if (l.includes("কোষ বিভাজন")) return "cell-division";
    if (l.includes("কোষপ্রাচীর") || l.includes("কোষ প্রাচীর")) return "cell-wall";
    if (l.includes("স্পোরাঞ্জ")) return "sporangium";
    if (l.includes("প্লাজমিড")) return "plasmid";
    if (l.includes("ফার্ন")) return "fern-prothallus";
    if (l.includes("সমপার্শ্ব") || l.includes("ভাস্কুলার")) return "vascular-bundle";
    if (/dna/i.test(l) && /rna/i.test(l)) return "dna-rna";
  }

  if (/\(\s*উদ্দীপক\s*[:：]\s*DNA\s*ও\s*RNA\s*\)/i.test(t)) return "dna-rna";

  if (/চিত্র|diagram|উদ্দীপক|চিত্রভিত্তিক/i.test(t)) {
    const isMirror =
      /দর্পণ|mirror|আয়না|আয়না|অবতল\s*দর্পণ|উত্তল\s*দর্পণ/i.test(t) ||
      (/\\text\{PC\}|\\text\{PM\}|2\\text\{PC\}|PC\s*=\s*PM/i.test(t) &&
        /প্রতিবিম্ব|আয়না|আয়না/i.test(t)) ||
      (/M\s*বিন্দু/i.test(t) && /প্রতিবিম্ব/i.test(t)) ||
      (/বক্রতার\s*কেন্দ্র/i.test(t) && /\(C\s*বিন্দু/i.test(t));
    if (isMirror) return "ssc-concave-mirror";

    const isLens =
      /লেন্স|lens/i.test(t) ||
      /লেন্সটিতে|লক্ষ্যবস্তুর\s*সৃষ্ট\s*প্রতিবিম্ব|বিবর্ধন\s*এক/i.test(t) ||
      (/\bO\b/.test(t) && /[CF]'|F'|C'|২F|2F/i.test(t) && /লেন্স|প্রতিবিম্ব/i.test(t));
    if (isLens) return "ssc-convex-lens";
  }

  if (!/চিত্র|diagram|উদ্দীপক/i.test(t)) return null;
  if (/নেফ্রন|glomerul|Ultrafiltration|ছাঁকনি/i.test(t)) return "bio-nephron";
  if (/নিউরন|neuron|স্নায়ু|synapse|সংযোগস্থল/i.test(t)) return "bio-neuron";
  if (/চক্ষু|retina|cornea|iris|চোখের|eyeball|অক্ষিক/i.test(t) &&
      !/দর্পণ|লেন্স|mirror|lens|অবতল|উত্তল|আয়না|আয়না/i.test(t)) return "bio-eye";
  if (/খাদ্যনাল|পাকস্থল|digestive/i.test(t)) return "bio-digestive";
  if (/অ্যালভিওল|alveoli/i.test(t)) return "bio-alveoli";
  if (/জাইলেম|ফ্লোয়েম|xylem|phloem/i.test(t)) return "bio-xylem-phloem";
  if (/\bGate\b|logic\s*gate|লজিক/i.test(t)) return "bio-logic-gate";

  return null;
}

function patchQuestions(list) {
  let updated = 0;
  for (const q of list) {
    if (!q || typeof q !== "object") continue;
    const text = String(q.text || q.questionText || q.question || "");
    const expected = resolve(text);
    const expectedSrc = expected ? `/images/quiz/${expected}.svg` : null;

    const currentSlug = slugFromImage(q.image);
    if (currentSlug && !TRUSTED.has(currentSlug)) {
      q.image = expectedSrc;
      updated++;
    } else if (expectedSrc && q.image !== expectedSrc) {
      q.image = expectedSrc;
      updated++;
    } else if (!expectedSrc && q.image) {
      q.image = null;
      updated++;
    }
  }
  return updated;
}

function walkJsonFile(filePath, stats) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let updated = 0;

  if (Array.isArray(data)) updated += patchQuestions(data);
  else if (Array.isArray(data.questions)) updated += patchQuestions(data.questions);
  else {
    for (const value of Object.values(data)) {
      if (!Array.isArray(value)) continue;
      for (const item of value) {
        if (item?.questions) updated += patchQuestions(item.questions);
        else updated += patchQuestions([item]);
      }
    }
  }

  if (updated > 0) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    stats.files += 1;
    stats.questions += updated;
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
  console.log(`Diagram sync: ${stats.questions} changes in ${stats.files} files`);
}

main();
