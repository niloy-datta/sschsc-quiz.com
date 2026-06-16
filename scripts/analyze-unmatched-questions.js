/**
 * Analyzes the 1,749 questions that have images but NO text-match.
 * Finds common Bengali keywords, patterns, and clusters by subject.
 */
const fs = require("fs");
const path = require("path");

// Copy the resolve logic from audit script
const TRUSTED_QUESTION_SLUGS = [
  "cell-terminal-pd", "cell-terminal-pd-alt", "mass-spring", "nor-gate",
  "parallel-dry-cells", "parallel-resistors", "pendulum", "resistor-voltage",
  "series-lcr", "young-double-slit-1", "young-double-slit-2", "young-double-slit-3",
  "young-double-slit-4", "ssc-transformer", "ssc-buoyancy", "ssc-resistor-network",
  "ssc-current-junction", "ssc-concave-mirror", "ssc-concave-mirror-principal",
  "ssc-electrostatic-induction", "ssc-st-graph", "ssc-force-time-graph",
  "ssc-convex-lens", "ssc-myopia-eye", "ssc-work-zero-90deg", "ssc-power-circuit",
  "bio-mitochondria-chloroplast", "plasmid", "bio-recombinant-plasmid",
  "bio-dna-helix", "bio-trna", "bio-stomata", "bio-bacteriophage", "bio-golgi",
  "bio-cytokinesis", "bio-poaceae-root", "bio-endodermis", "bio-c4-kranz",
  "bio-tissue-culture", "bio-transcription-translation", "bio-crossing-over",
  "bio-meristem", "bio-parenchyma", "bio-chordata", "bio-resin-duct",
  "bio-mitosis-meiosis", "bio-nephron", "bio-eye", "bio-heart", "bio-brain",
  "bio-skin", "cell-division", "cell-wall", "sporangium", "fern-prothallus",
  "dna-rna", "vascular-bundle", "chem-alkyne-hydration", "chem-bromine-test",
  "chem-addition-polymer", "chem-titration", "geo-circle-pq-op",
  "geo-angle-bisectors", "geo-cyclic-quadrilateral", "geo-right-triangle-trig",
  "hm-parabola-y-x2", "hm-resultant-5n-7n-60", "hm-resultant-6n-8n-90",
  "hm-complex-locus", "hm-straight-line-slope", "ssc-charge-spheres",
  "ssc-wave-standing", "ssc-wheel-motion",
];

const GRAPH_OPTION_FAMILIES = [
  "photon-energy", "half-life", "electric-field", "pressure-depth",
  "heating-curve", "reaction-rate", "pv-cycle", "shm-graph", "vt-graph",
];

const TRUSTED_STORED_SLUGS = new Set(TRUSTED_QUESTION_SLUGS);

function asset(slug) {
  return TRUSTED_STORED_SLUGS.has(slug) ? { slug, src: `/images/quiz/${slug}.svg` } : null;
}

const BRACKET_CHITRA_RE = /\[চিত্র\s*[:：]\s*([^\]]+)\]/i;
const EXPLICIT_SLUG_RE = /(?:\[svg\s*[:：]\s*([a-z0-9-]+)\s*\]|\(\s*চিত্র\s*[:：]\s*([a-z0-9-]+)\s*\))/i;
const PAREN_CHITRA_RE = /\(\s*চিত্র\s*[:：]\s*([^)]+)\s*\)/i;

function normalizeHint(hint) { return hint.replace(/\s+/g, " ").trim(); }

function matchBracketChitraHint(hint) {
  const h = normalizeHint(hint);
  if (/গোলক\s+A\s+ও\s+B/i.test(h) || (/গোলক/i.test(h) && /আধান/i.test(h) && /\bA\b/.test(h) && /\bB\b/.test(h)))
    return asset("ssc-charge-spheres");
  if (/তরঙ্গ/i.test(h) && /চূ/i.test(h)) return asset("ssc-wave-crests");
  if (/অবতল দর্পণ/i.test(h) && /লক্ষ্যবস্তু/i.test(h)) return asset("ssc-concave-mirror");
  return null;
}

function matchParenChitraLabel(label) {
  const l = normalizeHint(label).toLowerCase();
  if (l === "কোষ বিভাজন" || l === "কোষ-বিভাজন") return asset("cell-division");
  if (l === "কোষপ্রাচীর" || l === "কোষ প্রাচীর") return asset("cell-wall");
  if (l.includes("স্পোরাঞ্জ")) return asset("sporangium");
  if (l === "প্লাজমিড" || l === "plasmid") return asset("plasmid");
  if (l.includes("ফার্ন")) return asset("fern-prothallus");
  if (l.includes("মুক্ত সমপার্শ্ব") || l.includes("ভাস্কুলার")) return asset("vascular-bundle");
  if (/dna/i.test(l) && /rna/i.test(l)) return asset("dna-rna");
  return null;
}

function matchPhysicsOpticsStimulus(text) {
  if (!/চিত্র|diagram|উদ্দীপক|চিত্রভিত্তিক/i.test(text)) return null;
  const isMirror = /দর্পণ|mirror|আয়না|আয়না|অবতল\s*দর্পণ|উত্তল\s*দর্পণ/i.test(text) ||
    (/\\text\{PC\}|\\text\{PM\}|2\\text\{PC\}|PC\s*=\s*PM/i.test(text) && /প্রতিবিম্ব|আয়না|আয়না/i.test(text)) ||
    (/M\s*বিন্দু/i.test(text) && /প্রতিবিম্ব/i.test(text)) ||
    (/বক্রতার\s*কেন্দ্র/i.test(text) && /\(C\s*বিন্দু/i.test(text));
  if (isMirror) {
    if (/প্রধান\s*অক্ষ|১০\s*cm|10\s*cm.*40\s*cm|বিবর্ধন.*m/i.test(text)) return asset("ssc-concave-mirror-principal");
    return asset("ssc-concave-mirror");
  }
  const isLens = /লেন্স|lens/i.test(text) || /লেন্সটিতে|লক্ষ্যবস্তুর\s*সৃষ্ট\s*প্রতিবিম্ব|বিবর্ধন\s*এক/i.test(text) || (/\bO\b/.test(text) && /[CF]'|F'|C'|২F|2F/i.test(text) && /লেন্স|প্রতিবিম্ব/i.test(text));
  if (isLens) return asset("ssc-convex-lens");
  if (/উপরের\s*চিত্রানুসারে.*প্রধান\s*অক্ষ.*বিবর্ধন|লক্ষ্যবস্তু\s*প্রধান\s*অক্ষ.*বিবর্ধন/i.test(text)) return asset("ssc-concave-mirror-principal");
  if (/AB\s*=\s*200|MN\s*=\s*NH|স্থির\s*তরঙ্গ/i.test(text)) return asset("ssc-wave-standing");
  if (/ট্রান্সফরমার|transformer/i.test(text)) return asset("ssc-transformer");
  if (/ধনাত্মক\s*আধান|অনাহিত\s*পরিবাহ|electrostatic\s*induction/i.test(text)) return asset("ssc-electrostatic-induction");
  if (/দূরত্ব[-\s]*সময়|distance[-\s]*time|O\(0,\s*0\).*A\(10,\s*10\)/i.test(text)) return asset("ssc-st-graph");
  if (/বল\s*বনাম\s*সময়|force.*time|ঢাল\s*এর\s*একক/i.test(text)) return asset("ssc-force-time-graph");
  if (/চলন্ত\s*গাড়ি|চলন্ত\s*গাড়ি|চাকার\s*গতি|wheel/i.test(text)) return asset("ssc-wheel-motion");
  if (/প্লবতা|buoyancy|ভাস|immersed/i.test(text)) return asset("ssc-buoyancy");
  if (/R_1|R_2|তুল্য\s*রোধ|equivalent\s*resistance/i.test(text)) return asset("ssc-resistor-network");
  if (/জাংশন|junction|কিরchhoff|কারশফ/i.test(text)) return asset("ssc-current-junction");
  if (/প্রান্তীয়\s*বিভব|terminal\s*pd|কোষ.*বিভব/i.test(text)) return asset("cell-terminal-pd");
  if (/LCR|series.*LCR|আবর্ত\s*প্রবাহ/i.test(text)) return asset("series-lcr");
  if (/young|ইয়ং|দ্বি-স্লিট|double\s*slit/i.test(text)) return asset("young-double-slit-1");
  return null;
}

function matchBiologyStimulus(text) {
  if (!/চিত্র|diagram|উদ্দীপক/i.test(text)) return null;
  if (/নিউরন|neuron|স্নায়ু|synapse|সংযোগস্থল/i.test(text)) return asset("bio-neuron");
  if (/চক্ষু|retina|cornea|iris|চোখের|eyeball|অক্ষিক|দূরের\s*বস্তু\s*দেখতে\s*পায়\s*না|দূরের\s*বস্তু\s*দেখতে\s*পায়\s*না|myopia|ক্ষীন\s*দৃষ্টি/i.test(text) && !/দর্পণ|লেন্স|mirror|lens|অবতল|উত্তল|আয়না|আয়না/i.test(text)) return asset("ssc-myopia-eye");
  if (/মাইটোকন্ড্রিয়া|মাইটোকন্ড্রিয়া|mitochondria/i.test(text) && /ক্লোরো|chloroplast/i.test(text)) return asset("bio-mitochondria-chloroplast");
  if (/প্লাজমিড|plasmid/i.test(text)) return asset("plasmid");
  if (/recombinant|রিকম্বিন্যান্ট/i.test(text)) return asset("bio-recombinant-plasmid");
  if (/DNA.*helix|ডিএনএ.*ডবল|double\s*helix/i.test(text)) return asset("bio-dna-helix");
  if (/tRNA|টিআরএনএ/i.test(text)) return asset("bio-trna");
  if (/স্টোমাটা|stomata/i.test(text)) return asset("bio-stomata");
  if (/bacteriophage|ব্যাকটেরিওফেজ/i.test(text)) return asset("bio-bacteriophage");
  if (/গলজি|golgi/i.test(text)) return asset("bio-golgi");
  if (/cytokinesis|সাইটোকাইনেসিস/i.test(text)) return asset("bio-cytokinesis");
  if (/poaceae|ঘাস.*মূল/i.test(text)) return asset("bio-poaceae-root");
  if (/endodermis|এন্ডোডার্মিস|casparian/i.test(text)) return asset("bio-endodermis");
  if (/C4|kranz|Hatch/i.test(text)) return asset("bio-c4-kranz");
  if (/tissue\s*culture|টিস্য\s*কালচার/i.test(text)) return asset("bio-tissue-culture");
  if (/transcription|translation|ট্রান্সক্রিপশন/i.test(text)) return asset("bio-transcription-translation");
  if (/crossing\s*over|ক্রসিং\s*ওভার/i.test(text)) return asset("bio-crossing-over");
  if (/meristem|মেরিস্টেম/i.test(text)) return asset("bio-meristem");
  if (/parenchyma|প্যারেনকাইমা/i.test(text)) return asset("bio-parenchyma");
  if (/chordata|কর্ডাটা|notochord/i.test(text)) return asset("bio-chordata");
  if (/resin|তেল\s*নল|oil\s*gland/i.test(text)) return asset("bio-resin-duct");
  if (/mitosis.*meiosis|মাইটোসিস.*মায়োসিস|মাইটোসিস.*মায়োসিস/i.test(text)) return asset("bio-mitosis-meiosis");
  if (/খাদ্যনাল|পাকস্থলী|digestive|পরিপাক|ক্ষুদ্রান্ত্র|বৃহদন্ত্র/i.test(text)) return asset("bio-digestive");
  if (/অ্যালভিওল|alveoli|ফুসফুস|গ্যাস\s*বিনিময়/i.test(text)) return asset("bio-alveoli");
  if (/জাইলেম|ফ্লোয়েম|xylem|phloem/i.test(text)) return asset("bio-xylem-phloem");
  if (/\bGate\b|logic\s*gate|লজিক/i.test(text)) return asset("bio-logic-gate");
  if (/নেফ্রন|glomerul|Ultrafiltration|ছাঁকনি|বোম্যানস|হেনলি|সংগ্রাহক|kidney|বৃক্ক/i.test(text)) return asset("bio-nephron");
  if (/চক্ষু|retina|cornea|iris|চোখের|eyeball|অক্ষিক|অপটিক.*নার্ভ|রেটিনা|কর্নিয়া/i.test(text)) return asset("bio-eye");
  if (/হৃৎপিণ্ড|হৃদযন্ত্র|heart|অলিন্দ|নিলয়|মহাধমনী|করোনারি/i.test(text)) return asset("bio-heart");
  if (/মস্তিষ্ক|brain|সেরিব্রাম|সেরিবেলাম|থ্যালামাস|হাইপোথ্যালামাস/i.test(text)) return asset("bio-brain");
  if (/ত্বক|skin|এপিডার্মিস|ডার্মিস|হাইপোডার্মিস|ঘর্মগ্রন্থি/i.test(text)) return asset("bio-skin");
  if (/কোষ\s*বিভাজন|মাইটোসিস|মায়োসিস|প্রোফেজ|মেটাফেজ|অ্যানাফেজ|টেলোফেজ|সাইটোকাইনেসিস/i.test(text)) return asset("cell-division");
  if (/কোষপ্রাচীর|cell\s*wall|মধ্যপর্দা|প্লাজমোডেসমাটা|প্রাথমিক\s*প্রাচীর|গৌণ\s*প্রাচীর/i.test(text)) return asset("cell-wall");
  if (/স্পোরাঞ্জি|sporangium|অ্যানুলাস|স্টোমিয়াম/i.test(text)) return asset("sporangium");
  if (/প্রোথ্যালাস|prothallus|ফার্ন|অ্যানথেরিডিয়া|আর্কিগোনিয়া/i.test(text)) return asset("fern-prothallus");
  if (/DNA.*RNA|ডিএনএ.*আরএনএ|নিউক্লিক\s*অ্যাসিড|ডাবল.*হেলিক্স.*সিঙ্গেল|dna.*rna/i.test(text)) return asset("dna-rna");
  if (/ভাস্কুলার\s*বান্ডল|vascular\s*bundle|সমপার্শ্বীয়|বিকর্ষ|ক্যাম্বিয়াম/i.test(text)) return asset("vascular-bundle");
  return null;
}

function resolveQuestionDiagram(text) {
  if (!text) return null;
  const explicit = text.match(EXPLICIT_SLUG_RE);
  const slug = explicit?.[1] ?? explicit?.[2];
  if (slug && TRUSTED_STORED_SLUGS.has(slug)) return asset(slug);
  const bracket = text.match(BRACKET_CHITRA_RE);
  if (bracket) {
    const hint = bracket[1] ?? "";
    const resolved = matchBracketChitraHint(hint);
    if (resolved) return { ...resolved, caption: normalizeHint(hint) };
  }
  const paren = text.match(PAREN_CHITRA_RE);
  if (paren) {
    const label = paren[1] ?? "";
    const resolved = matchParenChitraLabel(label);
    if (resolved) return { ...resolved, caption: normalizeHint(label) };
  }
  if (/\(\s*উদ্দীপক\s*[:：]\s*DNA\s*ও\s*RNA\s*\)/i.test(text)) return asset("dna-rna");
  return matchPhysicsOpticsStimulus(text) ?? matchBiologyStimulus(text);
}

const QUESTIONS_DIR = path.join(__dirname, "..", "public", "questions");

function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkDir(full));
    else if (entry.isFile() && entry.name.endsWith(".json") && entry.name !== "index.json") files.push(full);
  }
  return files;
}

console.log("🔍 Scanning for unmatched questions...");
const allFiles = walkDir(QUESTIONS_DIR);
console.log(`   Found ${allFiles.length} files`);

// Collection of unmatched text + subject
const unmatchedBySubject = {};
let unmatchedCount = 0;

// Keyword frequency analysis
const keywordCounts = {};

// Bengali words/phrases to look for
const CANDIDATE_KEYWORDS = [
  // Physics
  "প্রতিবিম্ব", "আলো", "রশ্মি", "প্রতিসরণ", "প্রতিফলন", "পরিবর্তী", "অভিসারী",
  "চিত্রানুসারে", "উদ্দীপকের", "চিত্রভিত্তিক", "লেন্স", "দর্পণ", "আয়না", "আয়না",
  "বক্রতা", "ফোকাস", "প্রধান অক্ষ", "আলোক", "রশ্মিচিত্র", "আলোর গতিপথ",
  "বিভব", "তড়িৎ", "পরিবাহী", "রোধক", "বর্তনী", "সার্কিট", "বattery",
  "অবতল", "উত্তল", "প্রিজম", "spectrum", "বর্ণালী",
  "চলন্ত", "বেগ", "ত্বরণ", "বল", "ভর", "ঘর্ষণ", "ভরবেগ",
  "চাপ", "গভীরতা", "উত্তোলন", "তাপ", "চক্র", "ইঞ্জিন",
  "বিকিরণ", "তেজস্ক্রিয়", "নিউক্লিয়ার",

  // Biology
  "ক্রোমোজোম", "জিন", "বংশগতি", "মেন্ডেল", "ডিএনএ", "আরএনএ",
  "স্নায়ু", "নিউরন", "অ্যাক্সন", "ডেনড্রাইট",
  "রক্ত", "হৃৎপিণ্ড", "ধমনি", "শিরা", "হৃদযন্ত্র", "সংবহন",
  "শ্বসন", "শ্বাস", "ফুসফুস", "অ্যালভিওলি",
  "পাকস্থলী", "যকৃৎ", "অগ্ন্যাশয়", "ক্ষুদ্রান্ত্র", "বৃহদন্ত্র",
  "চক্ষু", "কর্ণ", "কান", "নাক", "জিহ্বা", "স্বাদ",
  "হরমোন", "গ্রন্থি", "পিটুইটারি", "থাইরয়েড", "অ্যাড্রেনালিন",
  "পরাগায়ন", "ফুল", "পুষ্প", "বীজ", "ভ্রূণ",
  "বাস্তুতন্ত্র", "খাদ্য", "শৃঙ্খল", "জীব", "উদ্ভিদ",
  "কোষ বিভাজন", "মাইটোসিস", "মিয়োসিস",

  // Chemistry
  "পরমাণু", "অণু", "ইলেকট্রন", "প্রোটন", "নিউট্রন",
  "বন্ধন", "আয়নিক", "সমযোজী", "ধাতব", "অক্সিডেশন",
  "জারণ", "বিজারণ", "তড়িৎ", "ক্যাথোড", "অ্যানোড",
  "টাইট্রেশন", "বিকারক", "দ্রবণ", "ঘনমাত্রা", "pH",
  "শিখা", "পরীক্ষা", "বর্ণ", "উত্তাপন", "ক্যালরিমিটার",
  "জৈব", "অ্যালকোহল", "অ্যালডিহাইড", "কিটোন", "অম্ল",
  "ক্ষার", "লবণ", "কার্বন", "হাইড্রোকার্বন",

  // Math
  "জ্যামিতি", "ত্রিভুজ", "বৃত্ত", "বর্গ", "আয়তক্ষেত্র", "কোণ",
  "সরলরেখা", "পরাবৃত্ত", "উপবৃত্ত", "অধিবৃত্ত", "লেখচিত্র",
  "ফাংশন", "গ্রাফ", "সেট", "ভেনচিত্র", "ভেন ডায়াগ্রাম",
  "ম্যাট্রিক্স", "নির্ণায়ক", "ভেক্টর", "ডট", "ক্রস",
  "সমীকরণ", "অসমতা", "ক্ষেত্রফল", "আয়তন", "পরিসীমা",

  // General patterns
  "উদ্দীপকে", "চিত্রে", "উপরের চিত্র", "নিচের চিত্র", "প্রদত্ত চিত্র",
  "পরীক্ষণ", "ব্যবস্থা", "যন্ত্র", "সরঞ্জাম",
];

for (const file of allFiles) {
  let questions;
  try { questions = JSON.parse(fs.readFileSync(file, "utf-8")); } catch (e) { continue; }
  if (!Array.isArray(questions)) continue;

  const normalized = file.replace(/\\/g, "/");
  const subjectMatch = normalized.match(/public\/questions\/([^/]+)/);
  let subject = subjectMatch ? subjectMatch[1] : "unknown";
  if (subject.startsWith("biology")) subject = "biology";
  else if (subject.startsWith("chemistry")) subject = "chemistry";
  else if (subject.startsWith("physics")) subject = "physics";
  else if (subject.startsWith("higher-math") || subject === "higher-math") subject = "higher-math";
  else if (subject.startsWith("general-math") || subject === "general-math") subject = "general-math";
  else if (subject === "ict") subject = "ict";

  for (const q of questions) {
    const text = q.text || "";
    const image = q.image || null;
    if (!image) continue;

    const textMatch = resolveQuestionDiagram(text);
    if (textMatch) continue; // skip already matched

    unmatchedCount++;
    if (!unmatchedBySubject[subject]) unmatchedBySubject[subject] = [];
    if (unmatchedBySubject[subject].length < 500) {
      unmatchedBySubject[subject].push({ id: q.id, text: text.slice(0, 120), image });
    }

    // Count keyword occurrences
    for (const kw of CANDIDATE_KEYWORDS) {
      if (text.includes(kw)) {
        keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
      }
    }

    // Also scan for any single Bengali word > 3 chars that appears frequently
    // Extract unique Bengali words
    const bengaliWords = text.match(/[\u0980-\u09FF]{3,}/g);
    if (bengaliWords) {
      for (const w of bengaliWords) {
        if (w.length >= 3 && w.length <= 20) {
          const kw = w;
          if (!CANDIDATE_KEYWORDS.includes(kw)) {
            keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
          }
        }
      }
    }
  }
}

// ── Report ──
console.log(`\n📊 Total unmatched questions: ${unmatchedCount}`);
console.log("\n─── By Subject ───");
for (const [subj, items] of Object.entries(unmatchedBySubject)) {
  console.log(`  ${subj.padEnd(15)} ${items.length}`);
}

console.log("\n─── Top 60 Most Frequent Bengali Keywords in Unmatched Questions ───");
const sortedKW = Object.entries(keywordCounts).sort((a, b) => b[1] - a[1]);
for (const [kw, count] of sortedKW.slice(0, 60)) {
  if (count >= 5) {
    console.log(`  ${kw.padEnd(25)} ${count.toString().padStart(4)}`);
  }
}

console.log("\n─── Sample Unmatched Questions per Subject ───");
let sampleShown = 0;
for (const [subj, items] of Object.entries(unmatchedBySubject)) {
  if (sampleShown >= 30) break;
  console.log(`\n  [${subj}] — ${items.length} total`);
  for (const s of items.slice(0, 5)) {
    if (sampleShown >= 30) break;
    console.log(`    📍 ${s.id.slice(0, 50)}`);
    console.log(`       "${s.text.slice(0, 100)}..."`);
    sampleShown++;
  }
}

// Save full data for offline analysis
const outputPath = path.join(__dirname, "..", "data", "unmatched-questions-analysis.json");
const output = {
  total: unmatchedCount,
  bySubject: Object.fromEntries(Object.entries(unmatchedBySubject).map(([k, v]) => [k, v.length])),
  topKeywords: Object.fromEntries(sortedKW.slice(0, 100)),
  sampleBySubject: Object.fromEntries(
    Object.entries(unmatchedBySubject).map(([k, v]) => [k, v.slice(0, 20)])
  ),
};
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`\n📄 Full analysis saved to: data/unmatched-questions-analysis.json`);
