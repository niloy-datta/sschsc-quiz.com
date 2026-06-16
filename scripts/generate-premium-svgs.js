/**
 * Premium SVG generator by detected_type (hyper-quality dark-neon style).
 * Reads data/detect-missing-svg.json OR scans live missing questions.
 *
 * Usage: node scripts/generate-premium-svgs.js [--attach]
 */
const fs = require("fs");
const path = require("path");
const { safeId } = require("./lib/diagram-topic-resolver");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const AUDIT = path.join(ROOT, "data", "detect-missing-svg.json");
const PREMIUM_DIR = path.join(ROOT, "public", "images", "quiz", "premium");
const ATTACH = process.argv.includes("--attach");

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapSvg(title, inner, subtitle = "") {
  return `<svg viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#22d3ee" flood-opacity="0.55"/>
    </filter>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1"/>
    </marker>
  </defs>
  <rect width="360" height="220" rx="14" fill="url(#bg)" stroke="#334155" stroke-width="1.5"/>
  ${inner}
  <text x="180" y="208" fill="#94a3b8" font-family="Segoe UI, system-ui, sans-serif" font-size="11" text-anchor="middle">${escapeXml(subtitle || title)}</text>
</svg>`;
}

const TEMPLATES = {
  physics_graph: () =>
    wrapSvg(
      "Physics graph",
      `
  <line x1="50" y1="170" x2="310" y2="170" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="50" y1="170" x2="50" y2="30" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
  <text x="318" y="178" fill="#94a3b8" font-size="11">x</text>
  <text x="38" y="28" fill="#94a3b8" font-size="11">y</text>
  <path d="M 55 160 Q 120 40 180 100 T 300 50" fill="none" stroke="#22d3ee" stroke-width="3" filter="url(#glow)"/>
  <circle cx="180" cy="100" r="4" fill="#f472b6"/>
  <text x="188" y="96" fill="#fda4af" font-size="10">P</text>`,
      "ফিজিক্স লেখচিত্র",
    ),

  math_geometry: () =>
    wrapSvg(
      "Geometry",
      `
  <circle cx="180" cy="95" r="62" fill="none" stroke="#22d3ee" stroke-width="2.5" filter="url(#glow)"/>
  <circle cx="180" cy="95" r="4" fill="#67e8f9"/>
  <text x="188" y="99" fill="#e2e8f0" font-size="13" font-weight="bold">O</text>
  <polygon points="180,40 240,140 120,140" fill="none" stroke="#f472b6" stroke-width="2"/>
  <text x="172" y="36" fill="#fda4af" font-size="12">A</text>
  <text x="248" y="148" fill="#fda4af" font-size="12">B</text>
  <text x="108" y="148" fill="#fda4af" font-size="12">C</text>`,
      "জ্যামিতি — বৃত্ত ও ত্রিভুজ",
    ),

  vector_diagram: () =>
    wrapSvg(
      "Vector",
      `
  <circle cx="180" cy="110" r="5" fill="#fde68a"/>
  <text x="188" y="114" fill="#fde68a" font-size="11">O</text>
  <line x1="180" y1="110" x2="260" y2="70" stroke="#22d3ee" stroke-width="3" marker-end="url(#arrow)" filter="url(#glow)"/>
  <line x1="180" y1="110" x2="120" y2="160" stroke="#34d399" stroke-width="3" marker-end="url(#arrow)"/>
  <line x1="180" y1="110" x2="250" y2="150" stroke="#f472b6" stroke-width="2.5" marker-end="url(#arrow)"/>
  <text x="262" y="66" fill="#67e8f9" font-size="11">F⃗</text>
  <text x="100" y="168" fill="#86efac" font-size="11">mg⃗</text>`,
      "ভেক্টর / বল চিত্র",
    ),

  circuit: () =>
    wrapSvg(
      "Circuit",
      `
  <rect x="60" y="55" width="240" height="110" rx="14" fill="#0f172a" stroke="#475569" stroke-width="2"/>
  <circle cx="95" cy="110" r="18" fill="#1e293b" stroke="#22d3ee" stroke-width="2" filter="url(#glow)"/>
  <text x="89" y="114" fill="#e2e8f0" font-size="10">V</text>
  <rect x="155" y="98" width="42" height="24" rx="5" fill="#1e293b" stroke="#f472b6" stroke-width="2"/>
  <text x="166" y="114" fill="#fda4af" font-size="10">R₁</text>
  <rect x="215" y="98" width="42" height="24" rx="5" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
  <text x="226" y="114" fill="#86efac" font-size="10">R₂</text>
  <line x1="113" y1="110" x2="155" y2="110" stroke="#94a3b8" stroke-width="2"/>
  <line x1="197" y1="110" x2="215" y2="110" stroke="#94a3b8" stroke-width="2"/>
  <line x1="257" y1="110" x2="285" y2="110" stroke="#94a3b8" stroke-width="2"/>`,
      "বৈদ্যুতিক বর্তনী",
    ),

  wave: () =>
    wrapSvg(
      "Wave",
      `
  <line x1="40" y1="110" x2="320" y2="110" stroke="#475569" stroke-width="1.5" stroke-dasharray="5 4"/>
  <path d="M 40 110 Q 70 55 100 110 T 160 110 T 220 110 T 280 110 T 320 110" fill="none" stroke="#22d3ee" stroke-width="3.5" filter="url(#glow)"/>
  <line x1="100" y1="55" x2="100" y2="110" stroke="#f472b6" stroke-width="2"/>
  <line x1="160" y1="110" x2="160" y2="55" stroke="#f472b6" stroke-width="2"/>
  <text x="88" y="48" fill="#fda4af" font-size="11">λ/2</text>`,
      "তরঙ্গ চিত্র",
    ),

  general_theory: (hint) =>
    wrapSvg(
      "Reference",
      `
  <rect x="30" y="35" width="300" height="130" rx="10" fill="#1e293b" stroke="#475569" stroke-width="1.5" stroke-dasharray="8 5"/>
  <ellipse cx="100" cy="90" rx="38" ry="28" fill="none" stroke="#22d3ee" stroke-width="2" opacity="0.85"/>
  <line x1="170" y1="65" x2="260" y2="115" stroke="#f472b6" stroke-width="2.5"/>
  <polygon points="270,70 295,105 245,105" fill="none" stroke="#34d399" stroke-width="2"/>
  <text x="180" y="88" fill="#e2e8f0" font-family="Segoe UI, system-ui, sans-serif" font-size="10" text-anchor="middle">${escapeXml((hint || "উদ্দীপক চিত্র").slice(0, 48))}</text>`,
      "উদ্দীপক / তত্ত্বীয় চিত্র",
    ),
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

function buildQuestionIndex() {
  /** @type {Map<string, Array<{ q: object, data: object, file: string }>>} */
  const map = new Map();
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith(".json") && ent.name !== "index.json") {
        const data = JSON.parse(fs.readFileSync(p, "utf8"));
        for (const q of collectQuestions(data)) {
          const id = String(q.id);
          if (!map.has(id)) map.set(id, []);
          map.get(id).push({ q, data, file: p });
        }
      }
    }
  }
  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    const dir = path.join(QUESTIONS_DIR, subject);
    if (fs.statSync(dir).isDirectory()) walk(dir);
  }
  return map;
}

function premiumPath(questionId) {
  return `/images/quiz/premium/${safeId(questionId)}.svg`;
}

function generateForEntry(entry, hint) {
  const fn = TEMPLATES[entry.detected_type] || TEMPLATES.general_theory;
  const svg = fn(hint);
  const fileName = `${safeId(entry.question_id)}.svg`;
  const outPath = path.join(PREMIUM_DIR, fileName);
  fs.mkdirSync(PREMIUM_DIR, { recursive: true });
  fs.writeFileSync(outPath, `${svg}\n`, "utf8");
  return premiumPath(entry.question_id);
}

function main() {
  if (!fs.existsSync(AUDIT)) {
    require("./detect-missing-svg.js");
  }

  const audit = JSON.parse(fs.readFileSync(AUDIT, "utf8"));
  if (audit.length === 0) {
    console.log("No missing SVGs — all visual questions covered.");
    return;
  }

  const index = ATTACH ? buildQuestionIndex() : null;
  const filesToSave = new Map();
  let written = 0;

  for (const entry of audit) {
    const metas = index?.get(entry.question_id) ?? [];
    const text = metas[0]
      ? String(metas[0].q.text ?? metas[0].q.questionText ?? metas[0].q.question ?? "")
      : "";
    const imagePath = generateForEntry(entry, text.slice(0, 80));
    written++;

    if (ATTACH) {
      for (const meta of metas) {
        meta.q.image = imagePath;
        filesToSave.set(meta.file, meta.data);
      }
    }
  }

  if (ATTACH) {
    for (const [file, data] of filesToSave) {
      fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    }
  }

  console.log(`Premium SVGs written: ${written} → ${path.relative(ROOT, PREMIUM_DIR)}`);
  if (ATTACH) console.log(`Attached to ${filesToSave.size} JSON files`);
}

main();
