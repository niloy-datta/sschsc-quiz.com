/**
 * Detect MCQ questions missing SVG/image support.
 * Spec: detect_missing_svg.txt
 *
 * Usage:
 *   node scripts/detect-missing-svg.js
 *   node scripts/detect-missing-svg.js --stdout
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const OUT = path.join(ROOT, "data", "detect-missing-svg.json");
const STDOUT = process.argv.includes("--stdout");

const LEKHOCHITRA_OPT = /^\[?\s*লেখচিত্র\s*[১২৩৪1-4]|ঘ\s*\]?$/i;

const VISUAL_STEM =
  /\[চিত্র\s*[:：]|\(চিত্র\s*[:：]|চিত্রে|চিত্রভিত্তিক|লেখচিত্র|গ্রাফ|diagram|circuit|বল\s*চিত্র|V-I|I-V|E-ν|স্থানাঙ্ক|coordinate|parabola|বর্তনীতে\s*তড়িৎ|বর্তনীতে\s*রোধ|resistor\s*network|লেন্স|দর্পণ|mirror|lens|নিচের\s*চিত্র|চিত্রটি\s*লক্ষ্য|উদ্দীপকের\s*চিত্র/i;

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
  return String(q.text ?? q.questionText ?? q.question ?? "");
}

function hasSvgSupport(q) {
  const img = q.image ?? q.svg;
  if (typeof img !== "string" || !img.trim()) return false;
  return /\.svg$/i.test(img) || img.includes("/images/quiz/");
}

function optionsNeedGraph(q) {
  const opts = Array.isArray(q.options)
    ? q.options.map((o) => (typeof o === "string" ? o : o?.text ?? ""))
    : [q.optionA, q.optionB, q.optionC, q.optionD].map(String);
  return opts.some((o) => LEKHOCHITRA_OPT.test(String(o).trim()));
}

function needsVisualSupport(q) {
  const text = questionText(q);
  return VISUAL_STEM.test(text) || optionsNeedGraph(q);
}

/** @returns {{ type: string, priority: 'high'|'medium'|'low' }} */
function detectType(text, q) {
  const t = text;

  if (/V-I|I-V|লেখচিত্র|graph|গ্রাফ|photon|অর্ধায়ু|তাপীয়\s*বক্র|P-V|সরল\s*ছন্দ|স্থির\s*চাপ|তড়িৎ\s*প্রাবল্য|চাপ.*গভীরতা|heating\s*curve|reaction\s*rate/i.test(t)) {
    return { type: "physics_graph", priority: "high" };
  }
  if (/বর্তনী|circuit|resistor|R₁|R₂|অ্যামিটার|voltmeter|V-I|I-V/i.test(t)) {
    return { type: "circuit", priority: "high" };
  }
  if (/vector|ভেক্টর|FBD|free\s*body|বল\s*চিত্র|displacement/i.test(t)) {
    return { type: "vector_diagram", priority: "medium" };
  }
  if (/তরঙ্গ|wave|চূড়া|crest|frequency|কম্পাঙ্ক/i.test(t)) {
    return { type: "wave", priority: "medium" };
  }
  if (/বৃত্ত|triangle|ত্রিভুজ|∠|angle|স্থানাঙ্ক|coordinate|x²|y\s*=|parabola|trapezoid|ট্রাপিজ|geometry|জ্যামিতি|O\s*কেন্দ্র|\\triangle/i.test(t)) {
    return { type: "math_geometry", priority: "high" };
  }
  if (/\[চিত্র\s*[:：]|\(চিত্র\s*[:：]/i.test(t)) {
    return { type: "general_theory", priority: "high" };
  }
  if (/চিত্রে|উদ্দীপক|চিত্রভিত্তিক|diagram/i.test(t)) {
    return { type: "general_theory", priority: "medium" };
  }
  if (optionsNeedGraph(q)) {
    return { type: "physics_graph", priority: "high" };
  }
  return { type: "general_theory", priority: "low" };
}

function walkDir(dir, results, stats) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(p, results, stats);
    else if (ent.name.endsWith(".json") && ent.name !== "index.json") {
      const questions = collectQuestions(JSON.parse(fs.readFileSync(p, "utf8")));
      for (const q of questions) {
        stats.scanned++;
        if (!needsVisualSupport(q)) continue;
        stats.needsVisual++;
        if (hasSvgSupport(q)) {
          stats.hasSvg++;
          continue;
        }
        const text = questionText(q);
        const id = String(q.id ?? `${path.basename(p)}-${stats.scanned}`);
        const { type, priority } = detectType(text, q);
        results.push({
          question_id: id,
          status: "svg_missing",
          detected_type: type,
          priority,
        });
        stats.missing++;
      }
    }
  }
}

function main() {
  const results = [];
  const stats = { scanned: 0, needsVisual: 0, hasSvg: 0, missing: 0 };

  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    const dir = path.join(QUESTIONS_DIR, subject);
    if (fs.statSync(dir).isDirectory()) walkDir(dir, results, stats);
  }

  results.sort((a, b) => {
    const pr = { high: 0, medium: 1, low: 2 };
    return pr[a.priority] - pr[b.priority] || a.question_id.localeCompare(b.question_id);
  });

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(results, null, 2)}\n`, "utf8");

  if (STDOUT) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(
      `SVG audit: ${stats.missing} missing / ${stats.needsVisual} need visual / ${stats.scanned} scanned`,
    );
    console.log(`Report: ${path.relative(ROOT, OUT)}`);
    const byType = {};
    for (const r of results) byType[r.detected_type] = (byType[r.detected_type] || 0) + 1;
    console.log("By type:", byType);
  }
}

main();
