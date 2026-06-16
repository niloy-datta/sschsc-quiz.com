/**
 * Questions that still need SVG (no image, missing file, or deleted placeholder path).
 * Output: data/missing-svg-now.json + data/missing-svg-now.txt (with prompts)
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const OUT_JSON = path.join(ROOT, "data", "missing-svg-now.json");
const OUT_TXT = path.join(ROOT, "data", "missing-svg-now.txt");

const LEKHOCHITRA_OPT = /^\[?\s*লেখচিত্র\s*[১২৩৪1-4]|ঘ\s*\]?$/i;
const VISUAL_STEM =
  /\[চিত্র\s*[:：]|\(চিত্র\s*[:：]|চিত্রে|উদ্দীপক|চিত্রভিত্তিক|লেখচিত্র|গ্রাফ|diagram|circuit|বৃত্ত|triangle|ত্রিভুজ|vector|ভেক্টor|সমন্বয়|অক্ষ|wave|তরঙ্গ|force|বল\s*চিত্র|V-I|I-V|স্থানাঙ্ক|coordinate|parabola|x²|y\s*=|বর্তনী|resistor|লেন্স|দর্পণ|mirror|lens|চিত্র\s*ক|চিত্র\s*খ/i;

const TYPE_PROMPT = {
  physics_graph: `Clean SVG physics graph. Labelled axes with units. Correct curve shape from question. Key points marked. Bengali/physics notation. viewBox only, no bitmap.`,
  math_geometry: `Clean SVG geometry diagram (SSC/HSC). Exact shapes and point labels from question. Angles/measurements if given. viewBox only.`,
  vector_diagram: `Clean SVG vector/FBD. Object + force arrows with labels matching question. viewBox only.`,
  circuit: `Clean SVG circuit. Standard symbols, series/parallel as described. Label R1,R2,V,A. viewBox only.`,
  wave: `Clean SVG wave diagram. Wavelength/amplitude/labels. Match question type. viewBox only.`,
  standing_wave: `Clean SVG standing wave. Points A-H, equilibrium line, amplitude markers, distance labels from uddepok. viewBox only.`,
  biology_diagram: `Clean SVG biology schematic. Accurate structure, Bengali labels if needed. viewBox only.`,
  optics: `Clean SVG ray/principal-axis diagram. F, C, object arrow, mirror/lens type from question. viewBox only.`,
  general_uddepok: `Clean SVG matching uddepok/stimulus exactly. All entities labeled. Board-exam clarity. viewBox only.`,
  explicit_chitra_label: `Clean SVG for the labeled chitra hint in the question. Match hint text exactly. viewBox only.`,
  physics_graph_options: `Create 4 separate SVG graphs (options ক-ঘ) for this MCQ. Each must be visually distinct per question logic.`,
  other: `Clean educational SVG matching this specific question stimulus. Not generic. viewBox only.`,
};

function collectQuestions(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.questions)) return data.questions;
  const out = [];
  for (const v of Object.values(data || {})) {
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
  return VISUAL_STEM.test(questionText(q)) || optionsNeedGraph(q);
}

function detectType(text, q) {
  const t = text;
  if (/AB\s*=\s*200|MN\s*=\s*NH|স্থির\s*তরঙ্গ|A\s*থেকে\s*D/i.test(t)) return "standing_wave";
  if (/লেন্স|দর্পণ|mirror|lens|প্রতিবিম্ব|প্রধান\s*অক্ষ/i.test(t)) return "optics";
  if (/V-I|I-V|লেখচিত্র|graph|গ্রাফ|photon|অর্ধায়ু|তাপীয়|P-V|সরল\s*ছন্দ|দূরত্ব-সময়|বল\s*বনাম\s*সময়/i.test(t))
    return "physics_graph";
  if (/বর্তনী|circuit|resistor|R₁|R₂/i.test(t)) return "circuit";
  if (/vector|ভেক্টor|FBD|বল\s*চিত্র/i.test(t)) return "vector_diagram";
  if (/তরঙ্গ|wave|কম্পাঙ্ক/i.test(t)) return "wave";
  if (/নেফ্রon|কোষ|DNA|RNA|জাইলেম|biology|প্লাজমিড|মাইটো/i.test(t) && !/লেন্স|দর্পণ|circuit/i.test(t))
    return "biology_diagram";
  if (/বৃত্ত|triangle|ত্রিভুজ|∠|geometry|O\s*কেন্দ্র|x²|y\s*=/i.test(t)) return "math_geometry";
  if (/\[চিত্র\s*[:：]|\(চিত্র\s*[:：]/i.test(t)) return "explicit_chitra_label";
  if (optionsNeedGraph(q)) return "physics_graph_options";
  if (/চিত্রে|উদ্দীপক|চিত্রভিত্তিক/i.test(t)) return "general_uddepok";
  return "other";
}

function extractChitraHint(text) {
  const b = text.match(/\[চিত্র\s*[:：]\s*([^\]]+)\]/i);
  if (b) return b[1].trim();
  const p = text.match(/\(\s*চিত্র\s*[:：]\s*([^)]+)\s*\)/i);
  if (p) return p[1].trim();
  return null;
}

function buildPrompt(entry) {
  const base = TYPE_PROMPT[entry.detected_type] || TYPE_PROMPT.other;
  const hint = entry.chitra_hint ? `\nChitra hint: ${entry.chitra_hint}` : "";
  const opts = entry.needs_option_graphs
    ? "\nNote: options are graph choices (লেখচিত্র ১-৪) — need 4 option SVGs."
    : "";
  return `${base}

Question ID: ${entry.question_id}
File: ${entry.file}
Reason: ${entry.missing_reason}
Question: ${entry.question_snippet}${hint}${opts}
Save as: ${entry.suggested_image_path}`;
}

function walkDir(dir, entries) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(p, entries);
    else if (ent.name.endsWith(".json") && ent.name !== "index.json") {
      const relFile = path.relative(QUESTIONS_DIR, p).replace(/\\/g, "/");
      let data;
      try {
        data = JSON.parse(fs.readFileSync(p, "utf8"));
      } catch {
        continue;
      }
      for (const q of collectQuestions(data)) {
        if (!needsVisual(q)) continue;
        const text = questionText(q);
        const id = String(q.id ?? `${ent.name}-unknown`);
        const image = String(q.image ?? q.svg ?? "").trim() || null;
        const type = detectType(text, q);
        const suggested = `/images/quiz/${id}.svg`;

        let missingReason = null;
        if (!image) {
          missingReason = "NO_IMAGE";
        } else {
          const disk = path.join(ROOT, "public", image.replace(/^\//, ""));
          if (!fs.existsSync(disk)) missingReason = "FILE_MISSING";
          else if (/\/generated\/|\/premium\//i.test(image)) missingReason = "PLACEHOLDER_PATH";
        }

        if (!missingReason) continue;

        entries.push({
          question_id: id,
          file: relFile,
          detected_type: type,
          missing_reason: missingReason,
          current_image: image,
          suggested_image_path: suggested,
          chitra_hint: extractChitraHint(text),
          question_snippet: text.slice(0, 200).replace(/\s+/g, " "),
          needs_option_graphs: optionsNeedGraph(q),
          prompt: "",
        });
      }
    }
  }
}

function main() {
  const entries = [];
  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    const subDir = path.join(QUESTIONS_DIR, subject);
    if (!fs.statSync(subDir).isDirectory()) continue;
    walkDir(subDir, entries);
  }

  for (const e of entries) e.prompt = buildPrompt(e);

  entries.sort((a, b) => {
    const rank = { NO_IMAGE: 0, FILE_MISSING: 1, PLACEHOLDER_PATH: 2 };
    return (rank[a.missing_reason] ?? 9) - (rank[b.missing_reason] ?? 9);
  });

  fs.writeFileSync(OUT_JSON, `${JSON.stringify(entries, null, 2)}\n`, "utf8");

  const byReason = {};
  const byType = {};
  for (const e of entries) {
    byReason[e.missing_reason] = (byReason[e.missing_reason] || 0) + 1;
    byType[e.detected_type] = (byType[e.detected_type] || 0) + 1;
  }

  const lines = [
    "═".repeat(72),
    "  MISSING SVG — questions without working diagram yet",
    "═".repeat(72),
    `Total: ${entries.length}`,
    `By reason: ${JSON.stringify(byReason)}`,
    `By type: ${JSON.stringify(byType)}`,
    "",
  ];

  for (const e of entries) {
    lines.push("─".repeat(72));
    lines.push(`ID: ${e.question_id}`);
    lines.push(`File: ${e.file}`);
    lines.push(`Type: ${e.detected_type} | Reason: ${e.missing_reason}`);
    lines.push(`Save: ${e.suggested_image_path}`);
    lines.push(`Q: ${e.question_snippet}`);
    if (e.chitra_hint) lines.push(`Hint: ${e.chitra_hint}`);
    lines.push("");
    lines.push("PROMPT:");
    lines.push(e.prompt);
    lines.push("");
  }

  fs.writeFileSync(OUT_TXT, lines.join("\n"), "utf8");

  console.log(`Missing SVG export: ${entries.length} questions`);
  console.log("By reason:", byReason);
  console.log("By type:", byType);
  console.log("JSON:", path.relative(ROOT, OUT_JSON));
  console.log("TXT:", path.relative(ROOT, OUT_TXT));
}

main();
