/**
 * Audit stored question images for obvious mismatches.
 */
const fs = require("fs");
const path = require("path");

const QUESTIONS_DIR = path.join(__dirname, "..", "public", "questions");

function slugFromImage(image) {
  return String(image).replace(/^\/images\/quiz\//, "").replace(/\.svg$/i, "");
}

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

function walkDir(dir, stats) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(p, stats);
    else if (ent.name.endsWith(".json") && ent.name !== "index.json") {
      const data = JSON.parse(fs.readFileSync(p, "utf8"));
      for (const q of collectQuestions(data)) {
        if (!q?.image) continue;
        const slug = slugFromImage(q.image);
        stats.counts[slug] = (stats.counts[slug] || 0) + 1;
        stats.total += 1;
        const t = String(q.text || q.questionText || q.question || "");
        if (slug === "bio-eye") {
          const isOptics = /দর্পণ|লেন্স|mirror|lens|F'|C'|O কেন্দ্র|অবতল|উত্তল/i.test(t);
          const isEye = /চক্ষু|retina|cornea|চোখ|eyeball|অক্ষিক/i.test(t);
          if (isOptics) stats.badOptics.push({ id: q.id, snippet: t.slice(0, 120) });
          else if (!isEye) stats.badOther.push({ id: q.id, snippet: t.slice(0, 120) });
        }
      }
    }
  }
}

function main() {
  const stats = { counts: {}, total: 0, badOptics: [], badOther: [] };
  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    const dir = path.join(QUESTIONS_DIR, subject);
    if (fs.statSync(dir).isDirectory()) walkDir(dir, stats);
  }
  console.log("Total with image:", stats.total);
  console.log("By slug:", stats.counts);
  console.log("Suspect bio-eye on optics:", stats.badOptics.length);
  console.log("Suspect bio-eye non-eye topic:", stats.badOther.length);
  for (const row of stats.badOptics.slice(0, 5)) console.log(" optics:", row.id);
  for (const row of stats.badOther.slice(0, 5)) console.log(" other:", row.id, row.snippet);
}

main();
