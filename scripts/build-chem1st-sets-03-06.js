const fs = require("fs");
const path = require("path");

const rawPath = path.join(__dirname, "..", "tmp-chem1st-raw.txt");
const outDir = path.join(__dirname, "..", "data", "imports", "chemistry-1st-sets");

const raw = fs.readFileSync(rawPath, "utf8");
const jsonStart = raw.indexOf("[");
const jsonText = raw.slice(jsonStart);

/** Trim agent commentary tails from explanation strings */
function sanitizeExplanation(text) {
  if (!text) return text;
  const markers = [
    " I'll set correct",
    " But option ",
    " Let's recalc:",
    " So answer ",
    " Actually CO₂",
    " আমি ",
    " নিকটতম ",
    " তাহলে উত্তর ",
    " সঠিক।",
  ];
  let s = text.trim();
  for (const m of markers) {
    const idx = s.indexOf(m);
    if (idx > 20) s = s.slice(0, idx).trim();
  }
  if (s.endsWith("?")) s = s.replace(/\?\s*.+$/, "।");
  return s.endsWith("।") || s.endsWith(".") ? s : s + "।";
}

const explanationOverrides = {
  "3:24": {
    correctOption: "খ",
    explanation:
      "N₂O₄ ⇌ 2NO₂; 0.5 mol থেকে 20% বিয়োজন → N₂O₄ = 0.4 M, NO₂ = 0.2 M; Kc = 0.2²/0.4 = 0.10।",
  },
  "4:2": {
    correctOption: "ঘ",
    explanation:
      "C₃H₈ + 5O₂ → 3CO₂ + 4H₂O। 5 g C₃H₈ (M=44) → 5/44 mol; CO₂ = 3×(5/44)×44 = 15 g।",
  },
  "4:4": {
    correctOption: "গ",
    explanation:
      "HCl + CH₃COONa → CH₃COOH; [CH₃COONa]=0.04, [CH₃COOH]=0.11; pH = 4.76 + log(0.04/0.11) ≈ 4.32 → 4.30।",
  },
  "4:9": {
    explanation:
      "আইসোবার: ভর সংখ্যা সমান, পারমাণবিক সংখ্যা ভিন্ন। ⁴⁰Ar (Z=18) ও ⁴⁰K (Z=19) আইসোবার।",
  },
  "5:3": {
    correctOption: "গ",
    explanation:
      "গ্রাহামের সূত্র: r₁/r₂ = t₂/t₁ = 25/40 = 5/8; √(M₂/M₁) = 5/8 → M₁ = 32×(8/5)² = 128 g/mol (HI)।",
  },
};

function extractSetBlocks(text) {
  const re = /\{\s*"setNumber"\s*:\s*(\d+)/g;
  const hits = [];
  let m;
  while ((m = re.exec(text))) {
    hits.push({ num: Number(m[1]), start: m.index });
  }
  const blocks = [];
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].start;
    const end = i + 1 < hits.length ? hits[i + 1].start : text.lastIndexOf("]");
    blocks.push({ num: hits[i].num, slice: text.slice(start, end).replace(/,\s*$/, "") });
  }
  return blocks;
}

function repairJsonObject(slice) {
  return slice.replace(
    /"explanation"\s*:\s*"([\s\S]*?)"\s*,\s*\n\s*"topic"/g,
    (_, exp) => {
      const safe = exp.replace(/\\/g, "\\\\").replace(/"/g, "'").replace(/\r?\n/g, " ");
      return `"explanation": "${safe}",\n        "topic"`;
    }
  );
}

function parseSet(slice) {
  const wrapped = repairJsonObject(slice.trim().replace(/,\s*$/, ""));
  return JSON.parse(wrapped);
}

const blocks = extractSetBlocks(jsonText);
const target = [3, 4, 5, 6];

for (const n of target) {
  const block = blocks.find((b) => b.num === n);
  if (!block) {
    console.error("Missing set", n);
    process.exit(1);
  }
  let set;
  try {
    set = parseSet(block.slice);
  } catch (err) {
    console.error("Parse failed set", n, err.message);
    // fallback: try aggressive quote fix on whole block
    const fixed = block.slice.replace(/"explanation": "([^"]*)"/g, (m, exp) => {
      const safe = exp.replace(/"/g, "'");
      return `"explanation": "${safe}"`;
    });
    try {
      set = JSON.parse(fixed.trim().replace(/,\s*$/, ""));
    } catch (err2) {
      console.error("Fallback parse failed", err2.message);
      process.exit(1);
    }
  }

  if (!set.subject) set.subject = "Chemistry 1st Paper";
  if (set.questions.length !== 25) {
    console.warn(`Set ${n}: expected 25 questions, got ${set.questions.length}`);
  }

  for (const q of set.questions) {
    const key = `${n}:${q.questionNumber}`;
    if (explanationOverrides[key]) {
      Object.assign(q, explanationOverrides[key]);
    }
    if (q.explanation) {
      q.explanation = sanitizeExplanation(q.explanation);
    }
  }

  const outPath = path.join(outDir, `set-${String(n).padStart(2, "0")}.json`);
  fs.writeFileSync(outPath, JSON.stringify(set, null, 2) + "\n");
  console.log("Wrote", outPath, "- questions:", set.questions.length);
}

// Validate
for (const n of target) {
  const p = path.join(outDir, `set-${String(n).padStart(2, "0")}.json`);
  const s = JSON.parse(fs.readFileSync(p, "utf8"));
  console.log(
    "Validate set",
    n,
    ":",
    s.questions.length,
    "Q1=",
    s.questions[0].questionText.slice(0, 30),
    "Q24=",
    s.questions[23].correctOption
  );
}
