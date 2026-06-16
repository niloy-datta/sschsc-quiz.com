/**
 * Generate HM1 chapter-wise hyper prompt files (master + per-chapter + per-set).
 * Run: node scripts/generate-hm1-hyper-prompts.js
 */
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "data", "prompts", "hsc-higher-math-1st-paper");

const chapters = [
  {
    n: "01",
    name: "ম্যাট্রিক্স ও নির্ণায়ক",
    en: "Matrices and Determinants",
    hot: "Order, types, addition, multiplication, transpose, symmetric/skew, determinant 2x2/3x3, minors, cofactors, adjoint, inverse A^{-1}=adj(A)/|A|, singular/non-singular, Cramer rule, matrix equation AX=B",
    note: "REPLACE existing Ch01 — current live data is wrong topic (Sets/Functions) and all 5 sets are duplicate.",
  },
  {
    n: "02",
    name: "ভেক্টর",
    en: "Vector",
    hot: "Module, unit vector, direction cosines, dot product, cross product, scalar triple product, vector equation of line, projection, angle between vectors, coplanarity",
  },
  {
    n: "03",
    name: "সরলরেখা",
    en: "Straight Lines",
    hot: "Slope, intercept form, point-slope, two-point form, normal form, distance point-line, distance between parallel lines, angle between lines, concurrency, family of lines",
  },
  {
    n: "04",
    name: "বৃত্ত",
    en: "The Circle",
    hot: "Standard form x^2+y^2=r^2, general form, centre-radius, chord, tangent, normal, two circles intersection, radical axis",
  },
  {
    n: "05",
    name: "বিন্যাস ও সমাবেশ",
    en: "Permutations and Combinations",
    hot: "nPr, nCr, factorial, circular permutation, repetition, division into groups, binomial counting, board word problems",
  },
  {
    n: "06",
    name: "ত্রিকোণমিতিক অনুপাত",
    en: "Trigonometric Ratios",
    hot: "ASTC rule, allied angles, sum-product formulas, double angle, half angle, general solution basics, graph values, max-min",
  },
  {
    n: "07",
    name: "সংযুক্ত কোণের ত্রিকোণমিতিক অনুপাত",
    en: "Associated Angle Trigonometry",
    hot: "sin(180±θ), cos(360±θ), tan(90±θ), sin(A±B), product to sum, conditional identities, prove identities",
  },
  {
    n: "08",
    name: "ফাংশন ও ফাংশনের লেখচিত্র",
    en: "Functions and Graph",
    hot: "Domain-range, injective/surjective/bijective, composition, inverse, even-odd, piecewise, |x| graphs, transformation of graphs",
    note: "Previous Sets/Functions content imported as Ch01 belongs HERE — generate fresh unique sets.",
  },
  {
    n: "09",
    name: "অন্তরীকরণ",
    en: "Differentiation",
    hot: "Power rule, product/quotient/chain rule, implicit, parametric, tangent-normal, rate of change, max-min (2nd derivative test)",
  },
  {
    n: "10",
    name: "যোগজীকরণ",
    en: "Integration",
    hot: "Standard integrals, substitution, by parts, partial fraction, definite integral properties, area under curve basics",
  },
];

const setFocus = [
  "Fundamentals + easy-medium board classics",
  "Numerical application + formula drill",
  "i/ii/iii analytical heavy + traps",
  "Mixed revision + recent board pattern",
  "Hard + Conceptual Trap + Final Board Simulator",
];

fs.mkdirSync(dir, { recursive: true });

for (const ch of chapters) {
  const chapterPrompt = [
    `# HYPER PROMPT — HSC Higher Math 1st Paper — Chapter ${ch.n}`,
    `# ${ch.name} (${ch.en})`,
    `# Paste AFTER 00-MASTER-HYPER-PROMPT.txt`,
    `# Save AI output as: data/imports/hsc-higher-math-1st-paper-chapter-${ch.n}-sets-01-05.json`,
    "",
    "## THIS BATCH",
    `Generate **Chapter ${ch.n}: ${ch.name}** — **Set 01–05** (5 × 25 = **125 MCQ**).`,
    "",
    ch.note ? `## SPECIAL NOTE\n${ch.note}\n` : "",
    "## SET IDs (exact)",
    `- hsc-higher-math-1st-paper-chapter-${ch.n}-set-01`,
    `- hsc-higher-math-1st-paper-chapter-${ch.n}-set-02`,
    `- hsc-higher-math-1st-paper-chapter-${ch.n}-set-03`,
    `- hsc-higher-math-1st-paper-chapter-${ch.n}-set-04`,
    `- hsc-higher-math-1st-paper-chapter-${ch.n}-set-05`,
    "",
    "## MEGA HOT SUBTOPICS (99.99% pattern cache)",
    ch.hot,
    "",
    "## SET DIFFERENTIATION (mandatory — no duplicate across sets)",
    "| Set | Focus |",
    "|-----|-------|",
    ...setFocus.map((f, i) => `| ${String(i + 1).padStart(2, "0")} | ${f} |`),
    "",
    "Return complete import-ready JSON only.",
    "",
  ].join("\n");

  fs.writeFileSync(path.join(dir, `ch${ch.n}-hyper-prompt.txt`), `${chapterPrompt}\n`, "utf8");

  for (let s = 1; s <= 5; s++) {
    const ss = String(s).padStart(2, "0");
    const setPrompt = [
      `# MICRO HYPER PROMPT — Ch ${ch.n} Set ${ss} ONLY (25 MCQ)`,
      `# Chapter: ${ch.name}`,
      `# Paste AFTER 00-MASTER-HYPER-PROMPT.txt`,
      `# Save output: data/imports/hsc-higher-math-1st-paper-chapter-${ch.n}-set-${ss}.json`,
      "",
      "## TASK",
      `Generate **ONLY Set ${ss}** for Chapter ${ch.n}: ${ch.name}.`,
      `Exactly **25 unique MCQ**. Set ID: hsc-higher-math-1st-paper-chapter-${ch.n}-set-${ss}`,
      "",
      `## SET FOCUS\n${setFocus[s - 1]}`,
      "",
      "## MEGA HOT SUBTOPICS",
      ch.hot,
      "",
      "## JSON (single-set wrapper)",
      "{",
      '  "level": "HSC",',
      '  "subject": "higher-math-1st-paper",',
      '  "chapterWise": [{',
      `    "chapter": "${ch.n}",`,
      `    "chapterName": "${ch.name}",`,
      '    "sets": [{',
      `      "id": "hsc-higher-math-1st-paper-chapter-${ch.n}-set-${ss}",`,
      `      "title": "Chapter ${ch.n} Hyper Mega Hot Set ${ss}",`,
      '      "questions": [ /* exactly 25 */ ]',
      "    }]",
      "  }]",
      "}",
      "",
      "Output JSON only.",
      "",
    ].join("\n");

    fs.writeFileSync(path.join(dir, `ch${ch.n}-set-${ss}-hyper-prompt.txt`), setPrompt, "utf8");
  }
}

console.log(`Created ${chapters.length} chapter + ${chapters.length * 5} set prompts in ${dir}`);
