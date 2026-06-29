/**
 * Detect MCQ questions missing SVG/image support.
 *
 * Usage:
 *   node scripts/detect-missing-svg.js
 *   node scripts/detect-missing-svg.js --stdout
 */
const fs = require("fs");
const path = require("path");
const {
  ROOT,
  QUESTIONS_DIR,
  collectQuestions,
  questionText,
  needsDiagram,
  optionsNeedGraph,
  imagePath,
  analyzeImageState,
  analyzeOptionImages,
  isPlaceholderPath,
} = require("./lib/svg-audit-shared");
const { resolveDiagramTopic, imagePathForSlug, LIBRARY_SLUGS } = require("./lib/diagram-topic-resolver");

const OUT = path.join(ROOT, "data", "detect-missing-svg.json");
const STDOUT = process.argv.includes("--stdout");

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

function hasWorkingSvg(q) {
  const state = analyzeImageState(q);
  return state.status === "ok" || (state.status === "placeholder_path" && state.file_exists);
}

function walkDir(dir, results, stats) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(p, results, stats);
    else if (ent.name.endsWith(".json") && ent.name !== "index.json") {
      if (/ict/i.test(p)) continue;
      const questions = collectQuestions(JSON.parse(fs.readFileSync(p, "utf8")));
      for (const q of questions) {
        stats.scanned++;
        if (!needsDiagram(q)) continue;
        stats.needsVisual++;

        const text = questionText(q);
        const id = String(q.id ?? `${path.basename(p)}-${stats.scanned}`);
        const imgState = analyzeImageState(q);
        const optState = analyzeOptionImages(q);
        const { type, priority } = detectType(text, q);

        const resolved = resolveDiagramTopic(text, id);
        const resolvedPath =
          resolved.kind === "library" && LIBRARY_SLUGS.has(resolved.slug)
            ? imagePathForSlug(resolved.slug)
            : null;
        const current = imagePath(q);
        const suspiciousMapping =
          resolvedPath && current && current !== resolvedPath && isPlaceholderPath(current);

        if (hasWorkingSvg(q) && optState.status !== "missing_or_invalid" && optState.status !== "broken_paths") {
          stats.hasSvg++;
          if (suspiciousMapping) {
            results.push({
              question_id: id,
              status: "suspicious_mapping",
              detected_type: type,
              priority: "high",
              current_image: current,
              recommended_image: resolvedPath,
            });
            stats.suspicious++;
          }
          continue;
        }

        let status = "svg_missing";
        if (imgState.status === "broken_path") status = "broken_path";
        else if (imgState.status === "placeholder_path") status = "placeholder_image";
        else if (optState.status === "missing_or_invalid") status = "missing_option_images";
        else if (optState.status === "broken_paths") status = "broken_option_images";

        results.push({
          question_id: id,
          status,
          detected_type: type,
          priority,
          current_image: current,
          recommended_image: resolvedPath,
          option_images_status: optState.status,
        });
        stats.missing++;
      }
    }
  }
}

function main() {
  const results = [];
  const stats = {
    scanned: 0,
    needsVisual: 0,
    hasSvg: 0,
    missing: 0,
    suspicious: 0,
  };

  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    if (/^ict$/i.test(subject)) continue;
    const dir = path.join(QUESTIONS_DIR, subject);
    if (fs.statSync(dir).isDirectory()) walkDir(dir, results, stats);
  }

  results.sort((a, b) => {
    const pr = { high: 0, medium: 1, low: 2 };
    return pr[a.priority] - pr[a.priority] || a.question_id.localeCompare(b.question_id);
  });

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(results, null, 2)}\n`, "utf8");

  if (STDOUT) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(
      `SVG audit: ${stats.missing} issues / ${stats.needsVisual} need visual / ${stats.scanned} scanned`,
    );
    console.log(`Working SVGs: ${stats.hasSvg}, suspicious mappings: ${stats.suspicious}`);
    console.log(`Report: ${path.relative(ROOT, OUT)}`);
    const byStatus = {};
    for (const r of results) byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    console.log("By status:", byStatus);
  }
}

main();
