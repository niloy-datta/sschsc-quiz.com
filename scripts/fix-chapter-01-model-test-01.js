/**
 * Fix SSC Physics Chapter 01 Model Test 01 — attach SVGs, clean stems/OCR.
 */
const fs = require("fs");
const path = require("path");

const FILE = path.join(
  __dirname,
  "..",
  "public",
  "questions",
  "physics",
  "ssc-physics-chapter-01-model-test-01.json",
);
const SET = "ssc-physics-chapter-01-model-test-01";

const qs = JSON.parse(fs.readFileSync(FILE, "utf8"));

// Q1, Q11 — transformer
qs[0].image = "/images/quiz/ssc-transformer.svg";
qs[10].image = "/images/quiz/ssc-transformer.svg";

// Q2 — strip leaked derivation
qs[1].text = "ক্ষমতার মাত্রা কোনটি?";
qs[1].shortSolution =
  "$[P] = \\frac{[M] \\times [L][T]^{-2} \\times [L]}{[T]} = \\text{ML}^2\\text{T}^{-3}$";

// Q3 — electrostatic induction
qs[2].image = "/images/quiz/ssc-electrostatic-induction.svg";

// Q5, Q23 — concave mirror principal axis
qs[4].image = "/images/quiz/ssc-concave-mirror-principal.svg";
qs[22].text =
  "উপরের চিত্রানুসারে, লক্ষ্যবস্তু প্রধান অক্ষের উপর কোন অবস্থানে রাখলে বিবর্ধন $m$ এর মান $1$ এর চেয়ে ছোট হবে না?";
qs[22].image = "/images/quiz/ssc-physics-chapter-01-model-test-01-q23.svg";

// Q13 — s-t graph
qs[12].text =
  "উদ্দীপক: একটি দূরত্ব-সময় লেখচিত্র দেওয়া আছে। লেখচিত্রে Y-অক্ষে দূরত্ব $s$ (মিটার) এবং X-অক্ষে সময় $t$ (সেকেন্ড)। রেখাটি $O(0,0)$ থেকে $A(10,10)$, $B(20,10)$ এবং $C(30,20)$ বিন্দু দিয়ে গেছে। OA অংশের দ্রুতি কত?";
qs[12].options = [
  "$0.5\\text{ m/s}$",
  "$1\\text{ m/s}$",
  "$2\\text{ m/s}$",
  "$6\\text{ m/s}$",
];
qs[12].image = "/images/quiz/ssc-st-graph.svg";

// Q22, Q24 — force-time graph
const forceSlopeQ =
  "উদ্দীপক: $2\\text{ kg}$ ভরের একটি বস্তুর উপর প্রযুক্ত বল বনাম সময়ের লেখচিত্র দেওয়া আছে। লেখচিত্রের ঢালের একক নিচের কোনটি?";
const forceSlopeOpts = [
  "$\\text{kg}\\,\\text{m/s}$",
  "$\\text{kg}\\,\\text{m/s}^2$",
  "$\\text{kg}\\,\\text{m}^2/\\text{s}^2$",
  "$\\text{kg}\\,\\text{m/s}^3$",
];
qs[21].text = forceSlopeQ;
qs[21].options = [...forceSlopeOpts];
qs[21].image = "/images/quiz/ssc-force-time-graph.svg";
qs[23].text = forceSlopeQ;
qs[23].options = [...forceSlopeOpts];
qs[23].image = "/images/quiz/ssc-force-time-graph.svg";

// Q18–21, Q25 — OCR cleanup
qs[17].text =
  "কোনো পরিবাহীর দুই প্রান্তের বিভব পার্থক্য $120\\text{ V}$ এবং তড়িত প্রবাহ $10\\text{ A}$ হলে এর রোধ কত?";
qs[17].options = ["$1200\\,\\Omega$", "$12\\,\\Omega$", "$0.12\\,\\Omega$", "$0.1\\,\\Omega$"];

qs[18].text =
  "একটি ট্রান্সফর্মারের প্রাইমারি কয়েলের পাঁচ সংখ্যা $100$। সেকেন্ডারি কয়েলের পাঁচ সংখ্যা $1000$। প্রাইমারি কয়েলে $12\\text{ V}$ DC দেওয়া হলে, সেকেন্ডারি কয়েলে ভোল্টেজ কত?";
qs[18].options = ["$0\\text{ V}$", "$10\\text{ V}$", "$100\\text{ V}$", "$120\\text{ V}$"];

qs[19].text =
  "একটি স্ক্রুগজের স্ক্রুর পিচ $0.5\\text{ mm}$ এবং বৃত্তাকার স্কেলের ভাগ সংখ্যা $100$ হলে স্ক্রুগজের least count কত?";
qs[19].options = [
  "$0.001\\text{ mm}$",
  "$0.005\\text{ mm}$",
  "$0.01\\text{ mm}$",
  "$0.05\\text{ mm}$",
];

qs[20].text =
  "$2\\text{ mm}$ পিচ বিশিষ্ট স্ক্রু-গজের least count $0.002\\text{ cm}$ হলে, বৃত্তাকার স্কেলের ভাগ সংখ্যা কত?";
qs[20].options = ["$10^3$", "$10^2$", "$10^{-2}$", "$10^{-3}$"];

qs[24].text = "ইলেকট্রিক ফিল্ড পরিবর্তন করতে হলে পটেনশিয়াল—";

fs.writeFileSync(FILE, `${JSON.stringify(qs, null, 2)}\n`, "utf8");
console.log("Fixed", SET);
