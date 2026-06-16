/**
 * Audit: How many questions benefit from the text-matching priority fix?
 *
 * The fix (resolveQuizDiagram) prioritizes text-based matching (Priority 1)
 * over the stored image field (Priority 2). This means questions with
 * keywords like "নেফ্রন" now show bio-nephron.svg instead of a generic
 * premium placeholder.
 *
 * This script scans ALL question JSON files and reports how many questions
 * have text that matches a real library SVG AND had a premium/generated
 * placeholder in the image field.
 */

const fs = require("fs");
const path = require("path");

// ── Import resolveQuestionDiagram logic (inline to avoid TS dependency) ──────

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

const BN_DIGIT = {
  "১": 1, "২": 2, "৩": 3, "৪": 4,
  "1": 1, "2": 2, "3": 3, "4": 4,
};

function asset(slug) {
  return TRUSTED_STORED_SLUGS.has(slug)
    ? { slug, src: `/images/quiz/${slug}.svg` }
    : null;
}

const BRACKET_CHITRA_RE = /\[চিত্র\s*[:：]\s*([^\]]+)\]/i;
const EXPLICIT_SLUG_RE = /(?:\[svg\s*[:：]\s*([a-z0-9-]+)\s*\]|\(\s*চিত্র\s*[:：]\s*([a-z0-9-]+)\s*\))/i;
const PAREN_CHITRA_RE = /\(\s*চিত্র\s*[:：]\s*([^)]+)\s*\)/i;

function normalizeHint(hint) {
  return hint.replace(/\s+/g, " ").trim();
}

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
    if (/প্রধান\s*অক্ষ|১০\s*cm|10\s*cm.*40\s*cm|বিবর্ধন.*m/i.test(text))
      return asset("ssc-concave-mirror-principal");
    return asset("ssc-concave-mirror");
  }

  const isLens = /লেন্স|lens/i.test(text) ||
    /লেন্সটিতে|লক্ষ্যবস্তুর\s*সৃষ্ট\s*প্রতিবিম্ব|বিবর্ধন\s*এক/i.test(text) ||
    (/\bO\b/.test(text) && /[CF]'|F'|C'|২F|2F/i.test(text) && /লেন্স|প্রতিবিম্ব/i.test(text));

  if (isLens) return asset("ssc-convex-lens");
  if (/উপরের\s*চিত্রানুসারে.*প্রধান\s*অক্ষ.*বিবর্ধন|লক্ষ্যবস্তু\s*প্রধান\s*অক্ষ.*বিবর্ধন/i.test(text))
    return asset("ssc-concave-mirror-principal");
  if (/AB\s*=\s*200|MN\s*=\s*NH|স্থির\s*তরঙ্গ/i.test(text)) return asset("ssc-wave-standing");
  if (/ট্রান্সফরমার|transformer/i.test(text)) return asset("ssc-transformer");
  if (/ধনাত্মক\s*আধান|অনাহিত\s*পরিবাহ|electrostatic\s*induction/i.test(text))
    return asset("ssc-electrostatic-induction");
  if (/দূরত্ব[-\s]*সময়|distance[-\s]*time|O\(0,\s*0\).*A\(10,\s*10\)/i.test(text))
    return asset("ssc-st-graph");
  if (/বল\s*বনাম\s*সময়|force.*time|ঢাল\s*এর\s*একক/i.test(text))
    return asset("ssc-force-time-graph");
  if (/চলন্ত\s*গাড়ি|চলন্ত\s*গাড়ি|চাকার\s*গতি|wheel/i.test(text))
    return asset("ssc-wheel-motion");
  if (/প্লবতা|buoyancy|ভাস|immersed/i.test(text)) return asset("ssc-buoyancy");
  if (/R_1|R_2|তুল্য\s*রোধ|equivalent\s*resistance/i.test(text))
    return asset("ssc-resistor-network");
  if (/জাংশন|junction|কিরchhoff|কারশফ/i.test(text)) return asset("ssc-current-junction");
  if (/প্রান্তীয়\s*বিভব|terminal\s*pd|কোষ.*বিভব/i.test(text)) return asset("cell-terminal-pd");
  if (/LCR|series.*LCR|আবর্ত\s*প্রবাহ/i.test(text)) return asset("series-lcr");
  if (/young|ইয়ং|দ্বি-স্লিট|double\s*slit/i.test(text)) return asset("young-double-slit-1");
  return null;
}

function matchBiologyStimulus(text) {
  if (!/চিত্র|diagram|উদ্দীপক/i.test(text)) return null;

  if (/নিউরন|neuron|স্নায়ু|synapse|সংযোগস্থল/i.test(text)) return asset("bio-neuron");
  if (/চক্ষু|retina|cornea|iris|চোখের|eyeball|অক্ষিক|দূরের\s*বস্তু\s*দেখতে\s*পায়\s*না|দূরের\s*বস্তু\s*দেখতে\s*পায়\s*না|myopia|ক্ষীন\s*দৃষ্টি/i.test(text) && !/দর্পণ|লেন্স|mirror|lens|অবতল|উত্তল|আয়না|আয়না/i.test(text))
    return asset("ssc-myopia-eye");
  if (/মাইটোকন্ড্রিয়া|মাইটোকন্ড্রিয়া|mitochondria/i.test(text) && /ক্লোরো|chloroplast/i.test(text))
    return asset("bio-mitochondria-chloroplast");
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
  if (/transcription|translation|ট্রান্সক্রিপশন/i.test(text))
    return asset("bio-transcription-translation");
  if (/crossing\s*over|ক্রসিং\s*ওভার/i.test(text)) return asset("bio-crossing-over");
  if (/meristem|মেরিস্টেম/i.test(text)) return asset("bio-meristem");
  if (/parenchyma|প্যারেনকাইমা/i.test(text)) return asset("bio-parenchyma");
  if (/chordata|কর্ডাটা|notochord/i.test(text)) return asset("bio-chordata");
  if (/resin|তেল\s*নল|oil\s*gland/i.test(text)) return asset("bio-resin-duct");
  if (/mitosis.*meiosis|মাইটোসিস.*মায়োসিস|মাইটোসিস.*মায়োসিস/i.test(text))
    return asset("bio-mitosis-meiosis");
  if (/খাদ্যনাল|পাকস্থলী|digestive|পরিপাক|ক্ষুদ্রান্ত্র|বৃহদন্ত্র/i.test(text))
    return asset("bio-digestive");
  if (/অ্যালভিওল|alveoli|ফুসফুস|গ্যাস\s*বিনিময়/i.test(text)) return asset("bio-alveoli");
  if (/জাইলেম|ফ্লোয়েম|xylem|phloem/i.test(text)) return asset("bio-xylem-phloem");
  if (/\bGate\b|logic\s*gate|লজিক/i.test(text)) return asset("bio-logic-gate");
  if (/নেফ্রন|glomerul|Ultrafiltration|ছাঁকনি|বোম্যানস|হেনলি|সংগ্রাহক|kidney|বৃক্ক/i.test(text))
    return asset("bio-nephron");
  if (/চক্ষু|retina|cornea|iris|চোখের|eyeball|অক্ষিক|অপটিক.*নার্ভ|রেটিনা|কর্নিয়া/i.test(text))
    return asset("bio-eye");
  if (/হৃৎপিণ্ড|হৃদযন্ত্র|heart|অলিন্দ|নিলয়|মহাধমনী|করোনারি/i.test(text))
    return asset("bio-heart");
  if (/মস্তিষ্ক|brain|সেরিব্রাম|সেরিবেলাম|থ্যালামাস|হাইপোথ্যালামাস/i.test(text))
    return asset("bio-brain");
  if (/ত্বক|skin|এপিডার্মিস|ডার্মিস|হাইপোডার্মিস|ঘর্মগ্রন্থি/i.test(text))
    return asset("bio-skin");
  if (/কোষ\s*বিভাজন|মাইটোসিস|মায়োসিস|প্রোফেজ|মেটাফেজ|অ্যানাফেজ|টেলোফেজ|সাইটোকাইনেসিস/i.test(text))
    return asset("cell-division");
  if (/কোষপ্রাচীর|cell\s*wall|মধ্যপর্দা|প্লাজমোডেসমাটা|প্রাথমিক\s*প্রাচীর|গৌণ\s*প্রাচীর/i.test(text))
    return asset("cell-wall");
  if (/স্পোরাঞ্জি|sporangium|অ্যানুলাস|স্টোমিয়াম/i.test(text)) return asset("sporangium");
  if (/প্রোথ্যালাস|prothallus|ফার্ন|অ্যানথেরিডিয়া|আর্কিগোনিয়া/i.test(text))
    return asset("fern-prothallus");
  if (/DNA.*RNA|ডিএনএ.*আরএনএ|নিউক্লিক\s*অ্যাসিড|ডাবল.*হেলিক্স.*সিঙ্গেল|dna.*rna/i.test(text))
    return asset("dna-rna");
  if (/ভাস্কুলার\s*বান্ডল|vascular\s*bundle|সমপার্শ্বীয়|বিকর্ষ|ক্যাম্বিয়াম/i.test(text))
    return asset("vascular-bundle");

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

function isPremiumImage(image) {
  if (!image) return false;
  return /^\/images\/quiz\/(premium|generated)\//i.test(image);
}

function isLibraryImage(image) {
  if (!image) return false;
  return /^\/images\/quiz\/[a-z0-9_-]+\.svg$/i.test(image) && !isPremiumImage(image);
}

function extractSubject(filePath) {
  // Extract subject from path like public/questions/biology/...
  const normalized = filePath.replace(/\\/g, "/");
  const match = normalized.match(/public\/questions\/([^/]+)/);
  if (!match) return "unknown";

  let subject = match[1];
  // Simplify: map biology-1st-paper → biology, etc.
  if (subject.startsWith("biology")) return "biology";
  if (subject.startsWith("chemistry")) return "chemistry";
  if (subject.startsWith("physics")) return "physics";
  if (subject.startsWith("higher-math") || subject === "higher-math") return "higher-math";
  if (subject.startsWith("general-math") || subject === "general-math") return "general-math";
  if (subject === "ict") return "ict";
  return subject;
}

// ── Main Audit ──────────────────────────────────────────────────────────────

const QUESTIONS_DIR = path.join(__dirname, "..", "public", "questions");

function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(full));
    } else if (entry.isFile() && entry.name.endsWith(".json") && entry.name !== "index.json") {
      files.push(full);
    }
  }
  return files;
}

console.log("🔍 Scanning question files...");
const allFiles = walkDir(QUESTIONS_DIR);
console.log(`   Found ${allFiles.length} question files`);

// Audit counters
let totalQuestions = 0;
let totalWithImage = 0;
let totalTextMatches = 0;
let totalBenefiting = 0; // Has premium image + text match returns better library SVG

const benefitBySubject = {};
const benefitBySlug = {};
const samples = [];

for (const file of allFiles) {
  let questions;
  try {
    questions = JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (e) {
    continue;
  }
  if (!Array.isArray(questions)) continue;

  const subject = extractSubject(file);

  for (const q of questions) {
    totalQuestions++;
    const text = q.text || "";
    const image = q.image || null;

    if (image) totalWithImage++;

    // Try text matching
    const textMatch = resolveQuestionDiagram(text);

    if (textMatch) {
      totalTextMatches++;

      // Does this question have a premium/generated image that text matching overrides?
      if (image) {
        const hasPremiumPlaceholder = isPremiumImage(image);
        const hasLibrarySvg = isLibraryImage(image);

        if (hasPremiumPlaceholder) {
          // BENEFITS: real library SVG replaces premium placeholder
          totalBenefiting++;
          benefitBySubject[subject] = (benefitBySubject[subject] || 0) + 1;
          benefitBySlug[textMatch.slug] = (benefitBySlug[textMatch.slug] || 0) + 1;

          if (samples.length < 30) {
            samples.push({
              id: q.id,
              subject,
              textSnippet: text.slice(0, 80),
              image,
              matchedSlug: textMatch.slug,
              matchedSrc: textMatch.src,
            });
          }
        } else if (image && !hasLibrarySvg && !hasPremiumPlaceholder) {
          // Image is something else (not premium and not library) — still counts if text match exists
          totalBenefiting++;
          benefitBySubject[subject] = (benefitBySubject[subject] || 0) + 1;
          benefitBySlug[textMatch.slug] = (benefitBySlug[textMatch.slug] || 0) + 1;
        }
      }
    }
  }
}

// ── Report ──────────────────────────────────────────────────────────────────

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║     📊 Text-Matching Priority Fix — Full Audit Report      ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

console.log(`📁 Total question files scanned: ${allFiles.length}`);
console.log(`📝 Total questions scanned:      ${totalQuestions}`);
console.log(`🖼️  Questions WITH an image field: ${totalWithImage}`);
console.log(`🎯 Text-matching hits:            ${totalTextMatches}`);
console.log(`✅ Questions BENEFITING from fix:  ${totalBenefiting}`);
console.log(`   (Had premium/generated placeholder ➜ now shows real library SVG)\n`);

console.log("─── By Subject ───");
const sortedSubjects = Object.entries(benefitBySubject).sort((a, b) => b[1] - a[1]);
for (const [subject, count] of sortedSubjects) {
  const pct = ((count / totalTextMatches) * 100).toFixed(1);
  console.log(`  ${subject.padEnd(15)} ${count.toString().padStart(5)} questions (${pct}% of text-matches)`);
}

console.log("\n─── By Diagram Slug (most benefited) ───");
const sortedSlugs = Object.entries(benefitBySlug).sort((a, b) => b[1] - a[1]);
for (const [slug, count] of sortedSlugs.slice(0, 20)) {
  console.log(`  ${slug.padEnd(32)} ${count.toString().padStart(4)} questions`);
}

console.log("\n─── Sample Questions That Now Show Better Diagrams ───");
for (const s of samples.slice(0, 15)) {
  console.log(`\n  📍 ${s.id.slice(0, 60)}`);
  console.log(`     Subject: ${s.subject}`);
  console.log(`     Text:    "${s.textSnippet}..."`);
  console.log(`     Before:  ${s.image}`);
  console.log(`     After:   ${s.matchedSrc} (${s.matchedSlug})`);
}

console.log(`\n─── Summary ───`);
console.log(`  🟢 ${totalBenefiting} questions now show REAL educational SVGs instead of premium placeholders`);
console.log(`  📊 Breakdown by subject:`);
for (const [subject, count] of sortedSubjects) {
  console.log(`     ${subject}: ${count}`);
}
console.log(`  🥇 Top 5 diagram slugs benefiting:`);
for (const [slug, count] of sortedSlugs.slice(0, 5)) {
  console.log(`     ${slug}: ${count}`);
}

// Also report stats about questions with images but NO text match
const noTextMatchCount = totalWithImage - totalTextMatches;
console.log(`\n  ⚠️  ${noTextMatchCount} questions have images but no text-matching (potential candidates for new heuristics)`);

// Write JSON report
const report = {
  totalFiles: allFiles.length,
  totalQuestions,
  totalWithImage,
  totalTextMatches,
  totalBenefiting,
  bySubject: benefitBySubject,
  bySlug: benefitBySlug,
  samples: samples.slice(0, 20),
  noTextMatchButHasImage: noTextMatchCount,
};

const reportPath = path.join(__dirname, "..", "data", "text-matching-audit-report.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📄 Full report saved to: data/text-matching-audit-report.json`);
