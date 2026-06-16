/**
 * Master list: every question that needs a diagram + implementation status.
 * Output: data/chitro-lagbe-master-list.txt + .json
 *
 * Usage: node scripts/export-chitro-lagbe-list.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const OUT_TXT = path.join(ROOT, "data", "chitro-lagbe-master-list.txt");
const OUT_JSON = path.join(ROOT, "data", "chitro-lagbe-master-list.json");

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
  return String(q.text ?? q.questionText ?? q.question ?? "").trim();
}

function optionsNeedGraph(q) {
  const opts = Array.isArray(q.options)
    ? q.options.map((o) => (typeof o === "string" ? o : o?.text ?? ""))
    : [q.optionA, q.optionB, q.optionC, q.optionD].map(String);
  return opts.some((o) => LEKHOCHITRA_OPT.test(String(o).trim()));
}

function needsVisual(q) {
  const t = questionText(q);
  return VISUAL_STEM.test(t) || optionsNeedGraph(q);
}

function detectType(text, q) {
  const t = text;
  if (/নেফ্রon|কোষ|cell|DNA|RNA|জাইলেম|নিউরon|চক্ষু|biology|উদ্ভিদ|প্রাণী|অঙ্গাণু|প্লাজমিড|মাইটো/i.test(t) && !/লেন্স|দর্পণ|circuit/i.test(t))
    return "biology_diagram";
  if (/লেন্স|দর্পণ|mirror|lens|প্রতিবিম্ব|F'|C'|অবতল|উত্তল/i.test(t)) return "optics";
  if (/AB\s*=\s*200|MN\s*=\s*NH|স্থির\s*তরঙ্গ|A\s*থেকে\s*D/i.test(t)) return "standing_wave";
  if (/V-I|I-V|লেখচিত্র|graph|গ্রাফ|photon|অর্ধায়ু|তাপীয়|P-V|সরল\s*ছন্দ|স্থির\s*চাপ|তড়িৎ\s*প্রাবল্য|চাপ.*গভীরতা/i.test(t))
    return "physics_graph";
  if (/বর্তনী|circuit|resistor|R₁|R₂|অ্যামিটার|voltmeter/i.test(t)) return "circuit";
  if (/vector|ভেক্টor|FBD|free\s*body|বল\s*চিত্র/i.test(t)) return "vector_diagram";
  if (/তরঙ্গ|wave|চূড়া|crest|frequency|কম্পাঙ্ক/i.test(t)) return "wave";
  if (/বৃত্ত|triangle|ত্রিভুজ|∠|angle|স্থানাঙ্ক|coordinate|x²|y\s*=|parabola|trapezoid|ট্রাপিজ|geometry|O\s*কেন্দ্র|\\triangle/i.test(t))
    return "math_geometry";
  if (/\[চিত্র\s*[:：]|\(চিত্র\s*[:：]/i.test(t)) return "explicit_chitra_label";
  if (/চিত্রে|উদ্দীপক|চিত্রভিত্তিক|diagram/i.test(t)) return "general_uddepok";
  if (optionsNeedGraph(q)) return "physics_graph_options";
  return "other";
}

function implementationStatus(image) {
  if (!image) return { status: "MISSING", action: "তৈরি + attach করতে হবে" };
  if (image.includes("/generated/")) return { status: "PLACEHOLDER", action: "নির accurate SVG দিয়ে replace" };
  if (image.includes("/premium/")) return { status: "TEMPLATE", action: "verify + accurate SVG দিয়ে replace" };
  if (image.includes("ssc-wave-standing")) return { status: "DONE", action: "✓ implement করা হয়েছে" };
  if (image.includes("wave-transverse") || image.includes("ssc-wave-crests")) return { status: "GENERIC", action: "topic-specific SVG দিয়ে upgrade" };
  if (image.includes("geo-") || image.includes("circuit-") || image.includes("ssc-convex") || image.includes("ssc-concave"))
    return { status: "LIBRARY", action: "verify question match; ভুল হলে replace" };
  if (image.includes("bio-") || image.includes("cell-") || image.includes("dna-rna") || image.includes("sporangium"))
    return { status: "LIBRARY", action: "verify question match; ভুল হলে replace" };
  if (image.includes("/images/quiz/")) return { status: "ATTACHED", action: "review করুন" };
  return { status: "UNKNOWN", action: "check" };
}

function priority(status, type) {
  if (status === "MISSING") return "P0-critical";
  if (status === "PLACEHOLDER") return "P1-high";
  if (status === "TEMPLATE") return "P1-high";
  if (status === "GENERIC") return "P2-medium";
  if (status === "LIBRARY") return "P3-verify";
  if (status === "DONE") return "P4-done";
  return "P3-verify";
}

function extractChitraHint(text) {
  const b = text.match(/\[চিত্র\s*[:：]\s*([^\]]+)\]/i);
  if (b) return b[1].trim();
  const p = text.match(/\(\s*চিত্র\s*[:：]\s*([^)]+)\s*\)/i);
  if (p) return p[1].trim();
  return null;
}

function suggestedFilename(id, type) {
  const safe = String(id).replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 100);
  return `/images/quiz/premium/${safe}.svg`;
}

function walkDir(dir, subject, entries) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(p, subject, entries);
    else if (ent.name.endsWith(".json") && ent.name !== "index.json") {
      const relFile = path.relative(QUESTIONS_DIR, p).replace(/\\/g, "/");
      for (const q of collectQuestions(JSON.parse(fs.readFileSync(p, "utf8")))) {
        if (!needsVisual(q)) continue;
        const text = questionText(q);
        const id = String(q.id ?? `${ent.name}-unknown`);
        const image = q.image ?? q.svg ?? null;
        const type = detectType(text, q);
        const impl = implementationStatus(image);
        entries.push({
          question_id: id,
          subject,
          file: relFile,
          detected_type: type,
          priority: priority(impl.status, type),
          implementation_status: impl.status,
          action: impl.action,
          current_image: image,
          suggested_image_path: suggestedFilename(id, type),
          chitra_hint: extractChitraHint(text),
          question_snippet: text.slice(0, 160).replace(/\s+/g, " "),
          needs_option_graphs: optionsNeedGraph(q),
        });
      }
    }
  }
}

function main() {
  const entries = [];
  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    const dir = path.join(QUESTIONS_DIR, subject);
    if (fs.statSync(dir).isDirectory()) walkDir(dir, subject, entries);
  }

  const prOrder = { "P0-critical": 0, "P1-high": 1, "P2-medium": 2, "P3-verify": 3, "P4-done": 4 };
  entries.sort(
    (a, b) =>
      prOrder[a.priority] - prOrder[b.priority] ||
      a.subject.localeCompare(b.subject) ||
      a.file.localeCompare(b.file),
  );

  const byStatus = {};
  const bySubject = {};
  const byType = {};
  for (const e of entries) {
    byStatus[e.implementation_status] = (byStatus[e.implementation_status] || 0) + 1;
    bySubject[e.subject] = (bySubject[e.subject] || 0) + 1;
    byType[e.detected_type] = (byType[e.detected_type] || 0) + 1;
  }

  const needWork = entries.filter((e) => e.implementation_status !== "DONE");

  const lines = [
    "চিত্র লাগবে — MASTER LIST (বিস্তারিত)",
    `Generated: ${new Date().toISOString()}`,
    "",
    "═".repeat(90),
    "SUMMARY",
    "═".repeat(90),
    `মোট diagram-প্রয়োজন প্রশ্ন: ${entries.length}`,
    `আপনাকে implement করতে হবে (DONE ছাড়া): ${needWork.length}`,
    "",
    "By implementation status:",
    ...Object.entries(byStatus).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k}: ${v}`),
    "",
    "By subject:",
    ...Object.entries(bySubject).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k}: ${v}`),
    "",
    "By diagram type:",
    ...Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k}: ${v}`),
    "",
    "═".repeat(90),
    "PRIORITY GUIDE",
    "═".repeat(90),
    "P0-critical  → image field নেই — অবশ্যই SVG তৈরি করুন",
    "P1-high      → placeholder/template — accurate SVG দিয়ে replace",
    "P2-medium    → generic library SVG — topic-specific upgrade",
    "P3-verify    → library attached — question match verify করুন",
    "P4-done      → already accurate (e.g. ssc-wave-standing)",
    "",
    "═".repeat(90),
    "HOW TO IMPLEMENT EACH",
    "═".repeat(90),
    "1. SVG save: public/images/quiz/premium/{question_id}.svg",
    "2. JSON update: \"image\": \"/images/quiz/premium/{question_id}.svg\"",
    "3. Or shared slug: /images/quiz/ssc-wave-standing.svg (reuse when same diagram)",
    "",
    "═".repeat(90),
    "FULL LIST (implement করতে হবে)",
    "═".repeat(90),
    "",
  ];

  let n = 0;
  for (const e of needWork) {
    n++;
    lines.push(
      `[${n}/${needWork.length}] ${e.priority} | ${e.implementation_status}`,
      `  question_id:     ${e.question_id}`,
      `  subject:         ${e.subject}`,
      `  file:            ${e.file}`,
      `  diagram_type:    ${e.detected_type}`,
      `  current_image:   ${e.current_image || "(none)"}`,
      `  save_svg_as:     ${e.suggested_image_path}`,
      e.chitra_hint ? `  chitra_hint:     ${e.chitra_hint}` : null,
      e.needs_option_graphs ? `  note:            Options are [লেখচিত্র ১-৪] — 4 graph variants may be needed` : null,
      `  question:        ${e.question_snippet}`,
      `  action:          ${e.action}`,
      "",
    );
  }

  lines.push("═".repeat(90));
  lines.push("ALREADY DONE (reference)");
  lines.push("═".repeat(90));
  for (const e of entries.filter((x) => x.implementation_status === "DONE")) {
    lines.push(`  ✓ ${e.question_id} → ${e.current_image}`);
  }

  fs.mkdirSync(path.dirname(OUT_TXT), { recursive: true });
  fs.writeFileSync(OUT_TXT, lines.filter(Boolean).join("\n"), "utf8");
  fs.writeFileSync(
    OUT_JSON,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), summary: { total: entries.length, needWork: needWork.length, byStatus, bySubject, byType }, entries }, null, 2)}\n`,
    "utf8",
  );

  console.log(`Total need diagram: ${entries.length}`);
  console.log(`You must implement: ${needWork.length}`);
  console.log("By status:", byStatus);
  console.log(`TXT: ${path.relative(ROOT, OUT_TXT)}`);
  console.log(`JSON: ${path.relative(ROOT, OUT_JSON)}`);
}

main();
