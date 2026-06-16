/**
 * Fix SSC Physics Chapter 13 Model Test 06 (same data bugs as ch-12 clone).
 */
const fs = require("fs");
const path = require("path");

const FILE = path.join(
  __dirname,
  "..",
  "public",
  "questions",
  "physics",
  "ssc-physics-chapter-13-model-test-06.json",
);
const BARISHAL = path.join(__dirname, "..", "public", "questions", "physics", "barishal-2025.json");
const DHAKA = path.join(__dirname, "..", "public", "questions", "physics", "dhaka-2025.json");
const SET = "ssc-physics-chapter-13-model-test-06";

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
    id: `${SET}-q${String(num).padStart(2, "0")}`,
    subject: "physics",
    chapter: SET,
    text: src.text,
    options: [...src.options],
    image: src.image ?? null,
    timeLimit: src.timeLimit ?? 45,
  };
}

const qs = JSON.parse(fs.readFileSync(FILE, "utf8"));

// Q1-4 cleanup
qs[0].text = "কোন যন্ত্রের সাহায্যে A.C কে D.C করা যায়?";
qs[1].text =
  "ইলেকট্রনিক সার্কিটে ট্রানজিস্টর ব্যবহার হয়—\ni. বিবর্ধক হিসেবে\nii. রেকটিফায়ার হিসেবে\niii. গ্রাহক হিসেবে\nনিচের কোনটি সঠিক?";
qs[2].text = "npn ট্রানজিস্টরের যে অংশে কারেন্ট প্রবেশ করে তার নাম কী?";
qs[3].text = "নিচের কোন প্রতীকটি n-p-n ট্রানজিস্টরকে নির্দেশ করে?";

// Q5 keep one Ohm; Q6-18 replace
for (let i = 0; i < REPLACEMENT_INDICES.length; i++) {
  const { source, index } = REPLACEMENT_INDICES[i];
  const pool = JSON.parse(fs.readFileSync(source, "utf8"));
  qs[5 + i] = cloneAsModelQuestion(pool[index], 6 + i);
}

// Q19 myopia
qs[18].image = "/images/quiz/ssc-myopia-eye.svg";

// Q20 — strip leaked solution
qs[19].text =
  "একটি গাড়ির বেগ $12\\text{ ms}^{-1}$। গাড়িতে $2.5\\text{ ms}^{-2}$ মন্দন সৃষ্টি করা হলে $4\\text{ s}$ পর গাড়ির বেগ কত হবে?";
qs[19].shortSolution =
  "শেষবেগ $v = u - at = 12 - (2.5 \\times 4) = 2\\text{ ms}^{-1}$।";

// Q21 transformer
qs[20].image = "/images/quiz/ssc-transformer.svg";

// Q23-24 standing wave
qs[22].text =
  "উদ্দীপক: চিত্রে $AB = 200\\text{ cm}$, $MN = NH = 0.5\\text{ m}$ এবং তরঙ্গটি A থেকে D তে যেতে সময় লাগে $0.025\\text{ s}$। তরঙ্গটির কম্পাঙ্ক কত হার্জ?";
qs[22].image = "/images/quiz/ssc-wave-standing.svg";
qs[22].shortSolution =
  "A থেকে D = ২টি পূর্ণ তরঙ্গ → $T = 0.025/2 = 0.0125\\text{ s}$, $f = 1/T = 80\\text{ Hz}$।";

qs[23].text =
  "উপরের চিত্রানুসারে, তরঙ্গটির—\ni. E ও H তে দশা একই\nii. বিস্তার $1\\text{ m}$\niii. বেগ $160\\text{ ms}^{-1}$\nনিচের কোনটি সঠিক?";
qs[23].image = "/images/quiz/ssc-wave-standing.svg";
qs[23].shortSolution = "ঘ (ii ও iii) — বিস্তার 1m ভুল (0.5m), বেগ 160 m/s সঠিক।";

// Q25 wheel motion
qs[24].image = "/images/quiz/ssc-wheel-motion.svg";

fs.writeFileSync(FILE, `${JSON.stringify(qs, null, 2)}\n`, "utf8");
console.log("Fixed", SET);
