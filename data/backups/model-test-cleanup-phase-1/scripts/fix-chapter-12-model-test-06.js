/**
 * Fix SSC Physics Chapter 12 Model Test 06:
 * - Replace duplicate Ohm's law Q6-18 with diverse board questions
 * - Fix "X A A" decoy options on Q5
 * - Remove wrong Q19 placeholder image
 * - Shorten Q24 uddepok (same diagram as Q23)
 */
const fs = require("fs");
const path = require("path");

const FILE = path.join(
  __dirname,
  "..",
  "public",
  "questions",
  "physics",
  "ssc-physics-chapter-12-model-test-06.json",
);
const BARISHAL = path.join(__dirname, "..", "public", "questions", "physics", "barishal-2025.json");
const DHAKA = path.join(__dirname, "..", "public", "questions", "physics", "dhaka-2025.json");

const REPLACEMENT_INDICES = [
  { source: BARISHAL, index: 0 },
  { source: BARISHAL, index: 4 },
  { source: BARISHAL, index: 5 },
  { source: BARISHAL, index: 6 },
  { source: BARISHAL, index: 10 },
  { source: BARISHAL, index: 11 },
  { source: BARISHAL, index: 17 },
  { source: BARISHAL, index: 18 },
  { source: BARISHAL, index: 19 },
  { source: BARISHAL, index: 20 },
  { source: BARISHAL, index: 21 },
  { source: DHAKA, index: 2 },
  { source: DHAKA, index: 6 },
];

function cloneAsModelQuestion(src, num) {
  return {
    id: `ssc-physics-chapter-12-model-test-06-q${String(num).padStart(2, "0")}`,
    subject: "physics",
    chapter: "ssc-physics-chapter-12-model-test-06",
    text: src.text,
    options: [...src.options],
    image: src.image ?? null,
    timeLimit: src.timeLimit ?? 45,
  };
}

function fixDoubleAmpere(options) {
  return options.map((o) => String(o).replace(/(\d+(?:\.\d+)?)\s+A\s+A\b/g, "$1 A"));
}

const qs = JSON.parse(fs.readFileSync(FILE, "utf8"));

// Q5 — keep one Ohm's law, fix decoy option only
qs[4].options = fixDoubleAmpere(qs[4].options);

// Q6-18 — replace duplicates
for (let i = 0; i < REPLACEMENT_INDICES.length; i++) {
  const { source, index } = REPLACEMENT_INDICES[i];
  const pool = JSON.parse(fs.readFileSync(source, "utf8"));
  qs[5 + i] = cloneAsModelQuestion(pool[index], 6 + i);
}

// Q19 — no diagram until accurate eye diagram exists
qs[18].image = null;

// Q23-24 — standing wave (shared diagram)
qs[22].image = "/images/quiz/ssc-wave-standing.svg";
qs[23].image = "/images/quiz/ssc-wave-standing.svg";
qs[23].text =
  "উপরের চিত্রানুসারে, তরঙ্গটির—\ni. E ও H তে দশা একই\nii. বিস্তার $1\\text{ m}$\niii. বেগ $160\\text{ ms}^{-1}$\nনিচের কোনটি সঠিক?";

// Q25 — no diagram
qs[24].image = null;

fs.writeFileSync(FILE, `${JSON.stringify(qs, null, 2)}\n`, "utf8");
console.log("Fixed ssc-physics-chapter-12-model-test-06.json");
console.log("- Replaced Q6-18 with 13 unique board questions");
console.log("- Fixed Q5 decoy options, Q19 image removed, Q24 stem shortened");
