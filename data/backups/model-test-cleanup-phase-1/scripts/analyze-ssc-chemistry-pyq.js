/**
 * Analyze SSC Chemistry previous-year board questions.
 * Output: data/ssc-chemistry-pyq-analysis.txt + data/ssc-chemistry-pyq-by-chapter.json
 *
 * Usage: node scripts/analyze-ssc-chemistry-pyq.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MEGA_PATH = path.join(ROOT, "public", "quiz-data", "ssc", "chemistry.json");
const OUT_TXT = path.join(ROOT, "data", "ssc-chemistry-pyq-analysis.txt");
const OUT_JSON = path.join(ROOT, "data", "ssc-chemistry-pyq-by-chapter.json");

const CHAPTERS = [
  {
    no: 1,
    name: "রসায়নের ধারণা",
    keywords: [
      "রসায়নের",
      "ভৌত পরিবর্তন",
      "রাসায়নিক পরিবর্তন",
      "ল্যাব",
      "বৈজ্ঞানিক",
      "দহন",
      "মরিচা",
      "পদার্থের অবস্থা",
      "পদার্থের চতুর্থ",
    ],
  },
  {
    no: 2,
    name: "পরমাণুর গঠন",
    keywords: [
      "পরমাণু",
      "ইলেকট্রন",
      "নিউট্রন",
      "প্রোটন",
      "আইসোটোপ",
      "কক্ষপথ",
      "তেজস্ক্রিয়",
      "nucleus",
      "atomic mass",
    ],
  },
  {
    no: 3,
    name: "মৌলের পর্যায়বৃত্ত ধর্ম",
    keywords: [
      "পর্যায়",
      "পর্যায় সারণি",
      "মৌল",
      "atomic number",
      "যোজনী",
      "electronic",
      "গ্রুপ",
      "period",
      "electronegativity",
    ],
  },
  {
    no: 4,
    name: "রাসায়নিক বন্ধন",
    keywords: [
      "আয়ন",
      "যোজন",
      "বন্ধন",
      "covalent",
      "ionic",
      "ইলেকট্রন বিনিময়",
      "সহযোজী",
      "ধাতু",
      "nonmetal",
    ],
  },
  {
    no: 5,
    name: "মোল ধারণা ও গণনা",
    keywords: ["mol", "molar", "avogadro", "mole", "গণনা", "stoichiometry", "molarity", "মোল"],
  },
  {
    no: 6,
    name: "অম্ল-ক্ষার",
    keywords: ["অম্ল", "ক্ষার", "ph", "neutral", "লবণ", "proton", "hydronium", "ammonia"],
  },
  {
    no: 7,
    name: "জারণ-বিজারণ",
    keywords: ["জারণ", "বিজারণ", "oxidation", "reduction", "redox", "electron transfer"],
  },
  {
    no: 8,
    name: "তাপ রসায়ন",
    keywords: ["তাপ", "enthalpy", "exothermic", "endothermic", "heat", "combustion heat"],
  },
  {
    no: 9,
    name: "জৈব রসায়ন",
    keywords: ["জৈব", "organic", "functional group", "carbon chain", "alcohol", "carboxylic"],
  },
  {
    no: 10,
    name: "হাইড্রোকার্বন",
    keywords: [
      "হাইড্রোকার্বন",
      "অ্যালকেন",
      "অ্যালকাইন",
      "বেনজিন",
      "methane",
      "alkane",
      "alkene",
      "alkyne",
    ],
  },
  {
    no: 11,
    name: "ধাতু ও অধাতু",
    keywords: ["ধাতু", "অধাতু", "electrolysis", "corrosion", "alloy", "metal", "non-metal"],
  },
  {
    no: 12,
    name: "পরিবেশ রসায়ন",
    keywords: [
      "পরিবেশ",
      "দূষণ",
      "ozone",
      "greenhouse",
      "cfc",
      "acid rain",
      "global warming",
      "green house",
    ],
  },
];

const LETTER = ["A", "B", "C", "D"];
const BANGLA = ["ক", "খ", "গ", "ঘ"];

function classify(text) {
  const raw = String(text ?? "");
  const lower = raw.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const ch of CHAPTERS) {
    let score = 0;
    for (const kw of ch.keywords) {
      const k = kw.toLowerCase();
      if (lower.includes(k) || raw.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = ch;
    }
  }
  return bestScore > 0 ? best : null;
}

function collectBoardQuestions() {
  const mega = JSON.parse(fs.readFileSync(MEGA_PATH, "utf8"));
  const rows = [];
  for (const [year, boards] of Object.entries(mega.boardQuestions ?? {})) {
    if (!boards || typeof boards !== "object") continue;
    for (const [board, list] of Object.entries(boards)) {
      if (!Array.isArray(list)) continue;
      for (const q of list) {
        const text = String(q.questionText ?? "").trim();
        if (!text) continue;
        const opts = [
          String(q.optionA ?? "").trim(),
          String(q.optionB ?? "").trim(),
          String(q.optionC ?? "").trim(),
          String(q.optionD ?? "").trim(),
        ];
        if (opts.some((o) => !o)) continue;
        const letter = String(q.correctOption ?? "A").trim().toUpperCase();
        const idx = LETTER.indexOf(letter);
        rows.push({
          id: String(q.id ?? ""),
          year,
          board,
          text,
          options: opts,
          answer: BANGLA[idx >= 0 ? idx : 0],
          answerLetter: letter,
          explanation: String(q.explanation ?? "").trim(),
        });
      }
    }
  }
  return rows;
}

function main() {
  const all = collectBoardQuestions();
  const seen = new Set();
  const unique = [];
  for (const q of all) {
    const key = q.text.replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ ...q, text: key });
  }

  const byChapter = {};
  const unclassified = [];
  for (const ch of CHAPTERS) {
    byChapter[ch.no] = { chapter_no: ch.no, chapter_name: ch.name, questions: [] };
  }

  for (const q of unique) {
    const ch = classify(q.text);
    if (!ch) {
      unclassified.push(q);
      continue;
    }
    byChapter[ch.no].questions.push({
      ...q,
      topic: `pyq_${q.year}_${q.board}`,
    });
  }

  const lines = [];
  lines.push("SSC Chemistry — Previous Year Board Question Analysis");
  lines.push("=".repeat(60));
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Total board rows: ${all.length}`);
  lines.push(`Unique questions: ${unique.length}`);
  lines.push(`Unclassified: ${unclassified.length}`);
  lines.push("");

  for (const ch of CHAPTERS) {
    const list = byChapter[ch.no].questions;
    const setsPossible = Math.min(5, Math.floor(list.length / 25));
    lines.push(`Chapter ${String(ch.no).padStart(2, "0")}: ${ch.name}`);
    lines.push(`  Unique PYQ matched: ${list.length}`);
    lines.push(`  Full model sets possible (25 Q each, max 5): ${setsPossible}`);
    lines.push("  Top topics by year:");
    const yearCount = {};
    for (const q of list) yearCount[q.year] = (yearCount[q.year] ?? 0) + 1;
    for (const [y, n] of Object.entries(yearCount).sort()) {
      lines.push(`    - ${y}: ${n}`);
    }
    lines.push("  Sample questions:");
    for (const q of list.slice(0, 5)) {
      lines.push(`    • [${q.year} ${q.board}] ${q.text}`);
      lines.push(`      Ans: ${q.answer} | ${q.options.join(" | ")}`);
    }
    lines.push("");
  }

  if (unclassified.length) {
    lines.push("Unclassified samples (review for keyword rules):");
    for (const q of unclassified.slice(0, 20)) {
      lines.push(`  • [${q.year}] ${q.text}`);
    }
    lines.push("");
  }

  lines.push("Recommendation:");
  lines.push("  - Ch01: use curated board-pattern sets (already imported, 5×25).");
  lines.push("  - Ch02–12: PYQ-derived sets imported where ≥25 unique PYQ exist.");
  lines.push("  - Remaining slots: add parts 2–12 curated JSON like ch01-part-01.");

  fs.mkdirSync(path.dirname(OUT_TXT), { recursive: true });
  fs.writeFileSync(OUT_TXT, `${lines.join("\n")}\n`, "utf8");
  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalUnique: unique.length,
        unclassifiedCount: unclassified.length,
        chapters: Object.values(byChapter),
        unclassified: unclassified.slice(0, 100),
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  console.log("Wrote", OUT_TXT);
  console.log("Wrote", OUT_JSON);
  for (const ch of CHAPTERS) {
    console.log(
      `Ch${String(ch.no).padStart(2, "0")} ${ch.name}: ${byChapter[ch.no].questions.length} PYQ`,
    );
  }
}

main();
