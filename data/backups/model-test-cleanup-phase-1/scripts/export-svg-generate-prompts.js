/**
 * Clean SVG-generation prompts ONLY — for questions with no working diagram.
 * Output:
 *   data/svg-generate-prompts.txt   (copy-paste for AI)
 *   data/svg-generate-prompts.json
 *
 * Usage: node scripts/export-svg-generate-prompts.js
 *        node scripts/export-svg-generate-prompts.js --subject physics
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const OUT_JSON = path.join(ROOT, "data", "svg-generate-prompts.json");
const OUT_TXT = path.join(ROOT, "data", "svg-generate-prompts.txt");

const SUBJECT_FILTER = (() => {
  const i = process.argv.indexOf("--subject");
  return i >= 0 ? process.argv[i + 1] : null;
})();

const LEKHOCHITRA_OPT = /^\[?\s*লেখচিত্র\s*[১২৩৪1-4]|^ঘ\s*\]?$/i;
const CHITRA_OPT = /^চিত্র\s*[কখগঘ]/i;

/** True only when the question genuinely expects a diagram in the UI. */
function needsDiagram(q) {
  const text = questionText(q);
  const opts = getOptions(q);

  if (/\[চিত্র\s*[:：]|\(চিত্র\s*[:：]|চিত্রভিত্তিক|উপরের\s*চিত্র|নিচের\s*চিত্র|প্রশ্নের\s*চিত্র|diagram\s*required/i.test(text))
    return true;
  if (/উদ্দীপক/i.test(text) && /চিত্র|লেখচিত্র|diagram|AB\s*=|MN\s*=|গোলক|পরিবাহ|দর্পণ|লেন্স|তরঙ্গ|বর্তনী|লেখ/i.test(text))
    return true;
  if (/^[\s\S]*চিত্রে[\s\S]{0,120}(?:নিচের|কোনটি|সঠিক|কত|কী)/i.test(text)) return true;
  if (opts.some((o) => LEKHOCHITRA_OPT.test(o) || CHITRA_OPT.test(o))) return true;
  if (/(?:^|\s)চিত্র\s*[কখগঘ](?:\s|$)/i.test(text)) return true;
  if (/\(চিত্র\s*[:：][^)]+\)/i.test(text)) return true;

  return false;
}

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

function getOptions(q) {
  if (Array.isArray(q.options))
    return q.options.map((o) => (typeof o === "string" ? o : o?.text ?? "")).map(String);
  return [q.optionA, q.optionB, q.optionC, q.optionD].map((o) => String(o ?? "").trim());
}

function optionsNeedGraph(q) {
  return getOptions(q).some((o) => LEKHOCHITRA_OPT.test(o.trim()) || CHITRA_OPT.test(o.trim()));
}

function svgMissing(q) {
  const image = String(q.image ?? q.svg ?? "").trim() || null;
  if (!image) return { missing: true, reason: "no_image" };
  const disk = path.join(ROOT, "public", image.replace(/^\//, ""));
  if (!fs.existsSync(disk)) return { missing: true, reason: "file_missing", image };
  if (/\/generated\/|\/premium\//i.test(image)) return { missing: true, reason: "placeholder", image };
  return { missing: false, image };
}

function detectType(text, q) {
  const t = text;
  if (/AB\s*=\s*200|MN\s*=\s*NH|স্থির\s*তরঙ্গ|A\s*থেকে\s*D/i.test(t)) return "standing_wave";
  if (/ধনাত্মক\s*আধান|অনাহিত\s*পরিবাহ|electrostatic|induction/i.test(t)) return "electrostatic";
  if (/ট্রান্সফরমার|transformer/i.test(t)) return "transformer";
  if (/লেন্স|দর্পণ|mirror|lens|প্রতিবিম্ব|প্রধান\s*অক্ষ|বিবর্ধন/i.test(t)) return "optics";
  if (/দূরত্ব[-\s]*সময়|বল\s*বনাম\s*সময়|লেখচিত্র|graph|গ্রাফ|V-I|I-V|P-V|অর্ধায়ু|তাপীয়|সরল\s*ছন্দ/i.test(t))
    return "physics_graph";
  if (/বর্তনী|circuit|resistor|R_?1|R_?2|অ্যামিটার|voltmeter|ট্রানজিস্টor|npn|p-n-p/i.test(t))
    return "circuit";
  if (/vector|ভেক্টor|FBD|free\s*body/i.test(t)) return "vector";
  if (/তরঙ্গ|wave|কম্পাঙ্ক|অপবর্তন|Fresnel/i.test(t)) return "wave";
  if (/নেফ্রon|কোষ|DNA|RNA|মাইটো|প্লাজমিড|স্টোমাট|stomata|নিউরon|চক্ষু|retina|ব্যাকটেরিও|golgi|xylem|phloem/i.test(t))
    return "biology";
  if (/বৃত্ত|triangle|ত্রিভুজ|∠|O\s*কেন্দ্র|coordinate|স্থানাঙ্ক|x²|y\s*=|parabola|জ্যামিতি|∆|ট্রাপিজ/i.test(t))
    return "geometry";
  if (optionsNeedGraph(q)) return "graph_mcq_options";
  if (/উদ্দীপক|চিত্রে/i.test(t)) return "uddepok";
  return "general";
}

const DIAGRAM_BRIEF = {
  standing_wave:
    "Standing wave on equilibrium line. Label points A–H if in question. Show wavelength/amplitude markers (AB, MN, NH). Orange dimension arrows.",
  electrostatic:
    "Two conductors side by side: charged AB (+) and neutral EF (−/+ induced). Show induction arrow. Label A,B,E,F. Bengali: ধনাত্মক পরিবাহী, অনাহিত পরিবাহী.",
  transformer:
    "Transformer: primary/secondary coils, iron core, labels Vp, Vs, np, ns if in question.",
  optics:
    "Principal axis, concave/convex mirror or lens from question. Mark F, C, object arrow, scale in cm if given.",
  physics_graph:
    "XY graph with labelled axes and units from question. Plot exact points/segments (O, A, B, C etc.). Mark slope regions if asked.",
  circuit:
    "Standard circuit symbols. Series/parallel as described. Label R1, R2, A, V, battery.",
  vector: "Object + force/velocity vectors with arrowheads and labels (F, mg, N, etc.).",
  wave: "Wave profile: crest, trough, equilibrium, λ and A labels if relevant.",
  biology:
    "Accurate biology schematic (nephron, cell, DNA, stomata, eye cross-section, etc.) with Bengali/English labels from question.",
  geometry:
    "Exact geometry from question: circle/triangle/coordinate plane. Label all points (A,B,C,O,P,Q). Show given measurements.",
  graph_mcq_options:
    "This MCQ uses graph options — draw ONE reference/stimulus graph for the stem (options are separate graphs ক-ঘ).",
  uddepok: "Diagram matching the uddepok/stimulus text exactly. Every entity in the stem must appear labelled.",
  general: "Diagram that matches this specific question — not a generic unrelated shape.",
};

function extractChitraHint(text) {
  const b = text.match(/\[চিত্র\s*[:：]\s*([^\]]+)\]/i);
  if (b) return b[1].trim();
  const p = text.match(/\(\s*চিত্র\s*[:：]\s*([^)]+)\s*\)/i);
  if (p) return p[1].trim();
  return null;
}

function buildSvgPrompt(entry) {
  const hint = entry.chitra_hint ? `\nCHITRA HINT: ${entry.chitra_hint}` : "";
  const opts = entry.options_need_graphs
    ? `\nOPTIONS NOTE: MCQ options are graphs (লেখচিত্র ১–৪ / চিত্র ক–ঘ) — stimulus graph only unless generating option set.`
    : "";
  const optsList =
    entry.options?.length && !entry.options_need_graphs
      ? `\nOPTIONS:\n${entry.options.map((o, i) => `${["ক", "খ", "গ", "ঘ"][i]}. ${o}`).join("\n")}`
      : "";

  return `Generate ONE clean SVG diagram for this Bangladesh SSC/HSC science MCQ.

SAVE AS: ${entry.save_path}

QUESTION (${entry.question_id}):
${entry.question_full}${hint}${optsList}${opts}

DIAGRAM TYPE: ${entry.diagram_type}
MUST SHOW: ${entry.diagram_brief}

STYLE RULES (strict):
- SVG only, viewBox="0 0 900 520", width="900" height="520"
- Light background (#f8fafc), white inner card, subtle border
- Font: "Noto Sans Bengali", Arial — labels readable
- Bengali labels where question is Bengali
- NO "Question X" title, NO watermark, NO extra explanation text outside diagram
- Board-exam clarity; only labels needed to answer the MCQ`;
}

function walkDir(dir, relPrefix, entries) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(p, relPrefix, entries);
    else if (ent.name.endsWith(".json") && ent.name !== "index.json") {
      const relFile = path.relative(QUESTIONS_DIR, p).replace(/\\/g, "/");
      if (SUBJECT_FILTER && !relFile.startsWith(`${SUBJECT_FILTER}/`)) continue;

      let data;
      try {
        data = JSON.parse(fs.readFileSync(p, "utf8"));
      } catch {
        continue;
      }

      for (const q of collectQuestions(data)) {
        if (!needsDiagram(q)) continue;
        const miss = svgMissing(q);
        if (!miss.missing) continue;

        const text = questionText(q);
        const id = String(q.id ?? `${ent.name}-unknown`);
        const type = detectType(text, q);
        const savePath = `/images/quiz/${id}.svg`;

        entries.push({
          question_id: id,
          file: relFile,
          diagram_type: type,
          missing_reason: miss.reason,
          save_path: savePath,
          chitra_hint: extractChitraHint(text),
          question_full: text.slice(0, 600),
          options: getOptions(q).filter(Boolean),
          options_need_graphs: optionsNeedGraph(q),
          diagram_brief: DIAGRAM_BRIEF[type] || DIAGRAM_BRIEF.general,
          prompt: "",
        });
      }
    }
  }
}

function main() {
  const entries = [];
  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    if (SUBJECT_FILTER && subject !== SUBJECT_FILTER) continue;
    const subDir = path.join(QUESTIONS_DIR, subject);
    if (!fs.statSync(subDir).isDirectory()) continue;
    walkDir(subDir, subject, entries);
  }

  entries.sort((a, b) => a.file.localeCompare(b.file) || a.question_id.localeCompare(b.question_id));
  for (const e of entries) e.prompt = buildSvgPrompt(e);

  fs.writeFileSync(OUT_JSON, `${JSON.stringify(entries, null, 2)}\n`, "utf8");

  const lines = [
    `# SVG GENERATION PROMPTS — ${entries.length} questions (no working diagram yet)`,
    `# Copy each block → paste to AI → save SVG to SAVE AS path`,
    `# Regenerate: pnpm run data:export-svg-generate-prompts`,
    SUBJECT_FILTER ? `# Filter: ${SUBJECT_FILTER}` : "",
    "",
  ].filter(Boolean);

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    lines.push(`${"=".repeat(80)}`);
    lines.push(`# ${i + 1}/${entries.length}  |  ${e.question_id}`);
    lines.push(`${"=".repeat(80)}`);
    lines.push(e.prompt);
    lines.push("");
  }

  fs.writeFileSync(OUT_TXT, lines.join("\n"), "utf8");

  const bySubject = {};
  const byType = {};
  for (const e of entries) {
    const sub = e.file.split("/")[0];
    bySubject[sub] = (bySubject[sub] || 0) + 1;
    byType[e.diagram_type] = (byType[e.diagram_type] || 0) + 1;
  }

  console.log(`SVG generate prompts: ${entries.length}`);
  console.log("By subject:", bySubject);
  console.log("By type:", byType);
  console.log("TXT:", path.relative(ROOT, OUT_TXT));
  console.log("JSON:", path.relative(ROOT, OUT_JSON));
}

main();
