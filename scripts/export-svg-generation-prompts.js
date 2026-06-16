/**
 * Export detailed SVG generation prompts for review.
 * Output: data/svg-generation-prompts.txt + data/svg-generation-prompts.json
 *
 * Usage: node scripts/export-svg-generation-prompts.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const OUT_TXT = path.join(ROOT, "data", "svg-generation-prompts.txt");
const OUT_JSON = path.join(ROOT, "data", "svg-generation-prompts.json");

const LEKHOCHITRA_OPT = /^\[?\s*লেখচিত্র\s*[১২৩৪1-4]|ঘ\s*\]?$/i;
const VISUAL_STEM =
  /\[চিত্র\s*[:：]|\(চিত্র\s*[:：]|চিত্রে|উদ্দীপক|চিত্রভিত্তিক|লেখচিত্র|গ্রাফ|diagram|circuit|বৃত্ত|triangle|ত্রিভুজ|vector|ভেক্টর|সমন্বয়|অক্ষ|wave|তরঙ্গ|force|বল\s*চিত্র|V-I|I-V|E-ν|স্থানাঙ্ক|coordinate|parabola|x²|y\s*=|বর্তনী|resistor|লেন্স|দর্পণ|mirror|lens/i;

const TYPE_PROMPT_BASE = {
  physics_graph: `Create a clean, scalable SVG physics graph (dark educational theme).
Requirements:
- Labelled axes with units inferred from the question
- Correct curve shape (linear / exponential / sinusoidal / step / PV loop as appropriate)
- Mark key points (O, intercepts, maxima, minima)
- Bengali or standard physics notation where shown in the question
- viewBox scalable, no bitmap`,

  math_geometry: `Create a clean, scalable SVG geometry diagram (SSC/HSC board style).
Requirements:
- Draw exact shapes mentioned (circle, triangle, trapezium, coordinate plane)
- Label all points (A, B, C, O, P, Q, etc.) exactly as in the question
- Show angles, right-angle marks, medians, altitudes, or tangents if referenced
- Include measurements from the question text when given
- viewBox scalable, no bitmap`,

  vector_diagram: `Create a clean SVG vector / free-body diagram.
Requirements:
- Origin or object clearly shown
- Force/displacement/velocity vectors with arrowheads and labels (F, mg, N, T, etc.)
- Directions must match the question scenario
- viewBox scalable, no bitmap`,

  circuit: `Create a clean SVG electrical circuit diagram.
Requirements:
- Standard symbols: cell/battery, resistors, ammeter, voltmeter if mentioned
- Series or parallel layout as described in the question
- Label R1, R2, V, A etc.
- viewBox scalable, no bitmap`,

  wave: `Create a clean SVG wave diagram.
Requirements:
- Transverse or longitudinal as appropriate
- Label wavelength, amplitude, crest, trough, equilibrium line
- Match wave type in question (sound, light, string)
- viewBox scalable, no bitmap`,

  biology_diagram: `Create a clean SVG biology schematic (NCTB SSC/HSC level).
Requirements:
- Accurate organ/structure layout (cell, nephron, neuron, eye, plant tissue, etc.)
- Bengali labels where the question uses Bengali terms
- viewBox scalable, no bitmap`,

  optics: `Create a clean SVG ray diagram for lens or mirror.
Requirements:
- Principal axis, focal points F, F', center C, optical center O as needed
- Object and image arrows with correct real/virtual orientation if inferable
- Concave/convex mirror or lens type from question text
- viewBox scalable, no bitmap`,

  general_theory: `Create a clean SVG reference diagram matching the question stimulus.
Requirements:
- Must match the specific scenario in the question — NOT a generic unrelated shape
- Label all entities mentioned in the stem
- Board-exam clarity; Bengali labels if question is in Bengali
- viewBox scalable, no bitmap`,
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
  return String(q.text ?? q.questionText ?? q.question ?? "").trim();
}

function extractOptions(q) {
  if (Array.isArray(q.options)) {
    return q.options.map((o, i) => {
      const text = typeof o === "string" ? o : o?.text ?? "";
      const labels = ["ক", "খ", "গ", "ঘ"];
      return { label: labels[i] ?? String(i + 1), text: String(text).trim() };
    });
  }
  return [
    { label: "ক", text: String(q.optionA ?? "").trim() },
    { label: "খ", text: String(q.optionB ?? "").trim() },
    { label: "গ", text: String(q.optionC ?? "").trim() },
    { label: "ঘ", text: String(q.optionD ?? "").trim() },
  ];
}

function optionsNeedGraph(q) {
  return extractOptions(q).some((o) => LEKHOCHITRA_OPT.test(o.text));
}

function needsVisualSupport(q) {
  const text = questionText(q);
  return VISUAL_STEM.test(text) || optionsNeedGraph(q);
}

function detectType(text, q) {
  const t = text;
  if (/নেফ্রন|কোষ|cell|DNA|RNA|জাইলেম|নিউরন|চক্ষু|biology|উদ্ভিদ|প্রাণী/i.test(t) && !/লেন্স|দর্পণ|circuit/i.test(t)) {
    return { type: "biology_diagram", priority: "high" };
  }
  if (/লেন্স|দর্পণ|mirror|lens|প্রতিবিম্ব|F'|C'|অবতল|উত্তল/i.test(t)) {
    return { type: "optics", priority: "high" };
  }
  if (/V-I|I-V|লেখচিত্র|graph|গ্রাফ|photon|অর্ধায়ু|তাপীয়|P-V|সরল\s*ছন্দ|স্থির\s*চাপ|তড়িৎ\s*প্রাবল্য|চাপ.*গভীরতা/i.test(t)) {
    return { type: "physics_graph", priority: "high" };
  }
  if (/বর্তনী|circuit|resistor|R₁|R₂|অ্যামিটার|voltmeter/i.test(t)) {
    return { type: "circuit", priority: "high" };
  }
  if (/vector|ভেক্টর|FBD|free\s*body|বল\s*চিত্র/i.test(t)) {
    return { type: "vector_diagram", priority: "medium" };
  }
  if (/তরঙ্গ|wave|চূড়া|crest|frequency|কম্পাঙ্ক/i.test(t)) {
    return { type: "wave", priority: "medium" };
  }
  if (/বৃত্ত|triangle|ত্রিভুজ|∠|angle|স্থানাঙ্ক|coordinate|x²|y\s*=|parabola|trapezoid|ট্রাপিজ|geometry|O\s*কেন্দ্র|\\triangle/i.test(t)) {
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

function classifySvgStatus(q) {
  const img = String(q.image ?? q.svg ?? "").trim();
  if (!img) return "svg_missing";
  if (img.includes("/generated/")) return "svg_placeholder";
  if (img.includes("/premium/")) return "svg_template_needs_review";
  if (img.includes("/images/quiz/")) return "svg_attached";
  return "svg_unknown";
}

function extractChitraHint(text) {
  const bracket = text.match(/\[চিত্র\s*[:：]\s*([^\]]+)\]/i);
  if (bracket) return bracket[1].trim();
  const paren = text.match(/\(\s*চিত্র\s*[:：]\s*([^)]+)\s*\)/i);
  if (paren) return paren[1].trim();
  return null;
}

function buildDetailedPrompt(entry) {
  const base = TYPE_PROMPT_BASE[entry.detected_type] || TYPE_PROMPT_BASE.general_theory;
  const lines = [
    `You are an expert SSC/HSC educational diagram illustrator.`,
    ``,
    `TASK: Generate ONE accurate SVG for this MCQ question.`,
    ``,
    `QUESTION ID: ${entry.question_id}`,
    `SUBJECT / FILE: ${entry.subject} / ${entry.file}`,
    `STATUS: ${entry.status}`,
    `DETECTED TYPE: ${entry.detected_type}`,
    `PRIORITY: ${entry.priority}`,
    `CURRENT IMAGE: ${entry.current_image || "(none)"}`,
    ``,
    `--- QUESTION STEM ---`,
    entry.question,
    ``,
  ];

  if (entry.chitra_hint) {
    lines.push(`--- EXPLICIT DIAGRAM HINT ---`, entry.chitra_hint, ``);
  }

  if (entry.options?.length) {
    lines.push(`--- OPTIONS ---`);
    for (const o of entry.options) {
      if (o.text) lines.push(`${o.label}. ${o.text}`);
    }
    lines.push(``);
  }

  if (entry.graph_options) {
    lines.push(
      `NOTE: Options are graph choices [লেখচিত্র ১–৪]. Generate 4 separate SVG variants if fixing option diagrams.`,
      ``,
    );
  }

  lines.push(
    `--- SVG REQUIREMENTS ---`,
    base,
    ``,
    `OUTPUT:`,
    `- Return ONLY valid SVG markup OR set "image": "/images/quiz/premium/${entry.question_id.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 120)}.svg"`,
    `- Must match THIS exact question — not a generic placeholder`,
    `- Labels: use A, B, C, O, P, Q, F, C as in the question`,
    `- Style: dark background (#0f172a), neon accent lines, readable labels`,
    `- Size: viewBox="0 0 360 220" width="100%" height="100%"`,
    ``,
    `VERIFICATION:`,
    `- Cross-check every label and measurement against the question stem`,
    `- If information is insufficient, draw only what is stated; do not invent conflicting details`,
    ``,
    `END PROMPT`,
  );

  return lines.join("\n");
}

function walkDir(dir, subject, entries, stats) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(p, subject, entries, stats);
    else if (ent.name.endsWith(".json") && ent.name !== "index.json") {
      const relFile = path.relative(QUESTIONS_DIR, p).replace(/\\/g, "/");
      for (const q of collectQuestions(JSON.parse(fs.readFileSync(p, "utf8")))) {
        stats.scanned++;
        if (!needsVisualSupport(q)) continue;
        stats.needsVisual++;

        const text = questionText(q);
        const status = classifySvgStatus(q);
        const { type, priority } = detectType(text, q);
        const id = String(q.id ?? `${ent.name}-${stats.scanned}`);

        if (status === "svg_attached") {
          stats.attached++;
          continue; // skip OK library SVGs from review list
        }

        stats.inReport++;

        const entry = {
          question_id: id,
          status,
          detected_type: type,
          priority,
          subject,
          file: relFile,
          current_image: q.image ?? q.svg ?? null,
          question: text,
          chitra_hint: extractChitraHint(text),
          options: extractOptions(q).filter((o) => o.text),
          graph_options: optionsNeedGraph(q),
          generation_prompt: "",
        };
        entry.generation_prompt = buildDetailedPrompt(entry);
        entries.push(entry);
      }
    }
  }
}

function main() {
  const entries = [];
  const stats = {
    scanned: 0,
    needsVisual: 0,
    attached: 0,
    inReport: 0,
  };

  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    const dir = path.join(QUESTIONS_DIR, subject);
    if (fs.statSync(dir).isDirectory()) walkDir(dir, subject, entries, stats);
  }

  const pr = { high: 0, medium: 1, low: 2 };
  entries.sort(
    (a, b) =>
      pr[a.priority] - pr[b.priority] ||
      a.status.localeCompare(b.status) ||
      a.question_id.localeCompare(b.question_id),
  );

  const byStatus = {};
  for (const e of entries) byStatus[e.status] = (byStatus[e.status] || 0) + 1;

  const txtParts = [
    "SVG GENERATION PROMPTS — REVIEW LIST",
    `Generated: ${new Date().toISOString()}`,
    `Total questions scanned: ${stats.scanned}`,
    `Need visual support: ${stats.needsVisual}`,
    `Already have library SVG (skipped): ${stats.attached}`,
    `In this review file: ${stats.inReport}`,
    `By status: ${JSON.stringify(byStatus)}`,
    "",
    "═".repeat(80),
    "",
  ];

  entries.forEach((entry, i) => {
    txtParts.push(
      `[${i + 1}/${entries.length}] ${entry.question_id}`,
      "─".repeat(80),
      entry.generation_prompt,
      "",
      "═".repeat(80),
      "",
    );
  });

  fs.mkdirSync(path.dirname(OUT_TXT), { recursive: true });
  fs.writeFileSync(OUT_TXT, txtParts.join("\n"), "utf8");
  fs.writeFileSync(
    OUT_JSON,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), stats, byStatus, entries }, null, 2)}\n`,
    "utf8",
  );

  console.log(`Exported ${entries.length} prompts`);
  console.log(`TXT: ${path.relative(ROOT, OUT_TXT)}`);
  console.log(`JSON: ${path.relative(ROOT, OUT_JSON)}`);
  console.log("By status:", byStatus);
}

main();
