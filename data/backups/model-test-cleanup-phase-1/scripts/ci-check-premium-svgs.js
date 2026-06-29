#!/usr/bin/env node
/**
 * CI Check: Premium SVG Validation
 *
 * Validates that no question uses a premium/generated placeholder SVG
 * when a text-matching library SVG is available.
 *
 * IMPORTANT: The matching logic below must be kept in sync with
 * src/lib/quiz/quiz-diagrams.ts — update both when changing heuristics.
 *
 * Exit codes:
 *   0 — All clean, no violations
 *   1 — Violations found (premium SVGs that should be library SVGs)
 *
 * Usage:
 *   node scripts/ci-check-premium-svgs.js           # scan + report
 *   node scripts/ci-check-premium-svgs.js --dry-run  # report without fixing
 *   node scripts/ci-check-premium-svgs.js --fix      # auto-fix violations
 */

const fs = require("fs");
const path = require("path");

// ── Config ──────────────────────────────────────────────────────────────────

const QUESTIONS_DIR = path.join(__dirname, "..", "public", "questions");
const SVG_DIR = path.join(__dirname, "..", "public", "images", "quiz");
const DRY_RUN = process.argv.includes("--dry-run");
const FIX_MODE = process.argv.includes("--fix");

// Load existing SVG files on disk for validation
const SVGS_ON_DISK = new Set(
  fs.readdirSync(SVG_DIR).filter((f) => f.endsWith(".svg")).map((f) => path.basename(f, ".svg")),
);

// ── Text-match logic (mirrors resolveQuestionDiagram from quiz-diagrams.ts) ──

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
  // Bio-extended SVGs (verified to exist on disk)
  "bio-neuron", "bio-xylem-phloem", "bio-digestive", "bio-alveoli",
];

// Filter to only slugs whose SVG files actually exist
const EXISTING_TRUSTED_SLUGS = new Set(
  TRUSTED_QUESTION_SLUGS.filter((slug) => SVGS_ON_DISK.has(slug)),
);

// Report which trusted slugs are missing SVG files
const missingSlugs = TRUSTED_QUESTION_SLUGS.filter((slug) => !SVGS_ON_DISK.has(slug));
if (missingSlugs.length > 0) {
  console.warn(`⚠️  Warning: ${missingSlugs.length} trusted slugs have no SVG file on disk:`);
  for (const s of missingSlugs) console.warn(`     /images/quiz/${s}.svg — MISSING`);
  console.warn("");
}

function asset(slug) {
  const src = `/images/quiz/${slug}.svg`;
  return EXISTING_TRUSTED_SLUGS.has(slug) ? { slug, src } : null;
}

const BRACKET_CHITRA_RE = /\[চিত্র\s*[:：]\s*([^\]]+)\]/i;
const EXPLICIT_SLUG_RE = /(?:\[svg\s*[:：]\s*([a-z0-9-]+)\s*\]|\(\s*চিত্র\s*[:：]\s*([a-z0-9-]+)\s*\))/i;
const PAREN_CHITRA_RE = /\(\s*চিত্র\s*[:：]\s*([^)]+)\s*\)/i;

function normalizeHint(hint) { return hint.replace(/\s+/g, " ").trim(); }

function matchBracketChitraHint(hint) {
  const h = normalizeHint(hint);
  // Match questions about two charged spheres, A and B.
  // The original regex was too brittle. This is more robust.
  if (
    (/গোলক/i.test(h) && /আধান/i.test(h) && /\bA\b/.test(h) && /\bB\b/.test(h))
  )
    return asset("ssc-charge-spheres");
  if (/তরঙ্গ/i.test(h) && /চূ/i.test(h)) return asset("ssc-wave-crests");
  if (/অবতল দর্পণ/i.test(h) && /লক্ষ্যবস্তু/i.test(h)) return asset("ssc-concave-mirror");
  return null;
}

function matchChemistryStimulus(text) {
  if (!/চিত্র|diagram|উদ্দীপক|বিক্রিয়া/i.test(text)) return null;

  if (/টাইট্রেশন|titration|কনিকেল\s*ফ্লাস্ক|conical\s*flask|বুরেট|burette|নির্দেশক|indicator/i.test(text)) {
    return asset("chem-titration");
  }
  if (
    /ব্রোমিন\s*পানি|bromine\s*water|Br₂.*লাল|লাল\s*বর্ণ.*বর্ণহীন/i.test(text) &&
    /অসম্পৃক্ত|unsaturated|অ্যালকিন|alkene|অ্যালকাইন|alkyne/i.test(text)
  ) {
    return asset("chem-bromine-test");
  }
  if (/সংযোজন\s*পলিমার|addition\s*polymer|পলিমারকরণ|polymerization|nCH₂=CH₂|ইথিন.*পলিথিন/i.test(text)) {
    return asset("chem-addition-polymer");
  }
  if (/অ্যালকাইন|alkyne|পানি\s*যোজন|hydration|মারকনিকভ|markovnikov|কিটোন|ketone|HgSO₄|H₂SO₄/i.test(text) && /প্রোপাইন|propyne|ইথাইন|ethyne/i.test(text)) {
    return asset("chem-alkyne-hydration");
  }
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
  if (/নিউরন|neuron|স্নায়ু|স্নায়ুকোষ|স্নায়ু|synapse|সংযোগস্থল/i.test(text))
    return asset("bio-neuron");
  if (/চক্ষু|retina|cornea|iris|চোখের|eyeball|অক্ষিক|দূরের\s*বস্তু\s*দেখতে\s*পায়\s*না|দূরের\s*বস্তু\s*দেখতে\s*পায়\s*না|myopia|ক্ষীন\s*দৃষ্টি/i.test(text) && !/দর্পণ|লেন্স|mirror|lens|অবতল|উত্তল|আয়না|আয়না/i.test(text))
    return asset("ssc-myopia-eye");
  if (/মাইটোকন্ড্রিয়া|মাইটোকন্ড্রিয়া|mitochondria|মাইটোকনড্রিয়া/i.test(text) && /ক্লোরো|chloroplast|প্লাস্টিড/i.test(text))
    return asset("bio-mitochondria-chloroplast");
  if (/প্লাজমিড|plasmid/i.test(text)) return asset("plasmid");
  if (/recombinant|রিকম্বিন্যান্ট/i.test(text)) return asset("bio-recombinant-plasmid");
  if (/DNA.*helix|ডিএনএ.*ডবল|ডিএনএ.*হেলিক্স|double\s*helix|ডাবল.*হেলিক্স|[ডদ]এনএ.*সিঁড়ি/i.test(text))
    return asset("bio-dna-helix");
  if (/tRNA|টিআরএনএ/i.test(text)) return asset("bio-trna");
  if (/স্টোমাটা|stomata|পত্র.*রন্ধ্র/i.test(text)) return asset("bio-stomata");
  if (/bacteriophage|ব্যাকটেরিওফেজ|ফায\s*ভাইরাস/i.test(text))
    return asset("bio-bacteriophage");
  if (/গলজি|golgi|গলগি/i.test(text)) return asset("bio-golgi");
  if (/cytokinesis|সাইটোকাইনেসিস/i.test(text)) return asset("bio-cytokinesis");
  if (/poaceae|ঘাস.*মূল/i.test(text)) return asset("bio-poaceae-root");
  if (/endodermis|এন্ডোডার্মিস|casparian/i.test(text)) return asset("bio-endodermis");
  if (/C4|kranz|Hatch|ক্র্যান্/i.test(text)) return asset("bio-c4-kranz");
  if (/tissue\s*culture|টিস্য.*কালচার|টিস্যু.*কালচার/i.test(text))
    return asset("bio-tissue-culture");
  if (/transcription|translation|ট্রান্সক্রিপশন|প্রতিলিপিকরণ|ট্রান্সলেশন/i.test(text))
    return asset("bio-transcription-translation");
  if (/crossing\s*over|ক্রসিং\s*ওভার/i.test(text)) return asset("bio-crossing-over");
  if (/meristem|মেরিস্টেম/i.test(text)) return asset("bio-meristem");
  if (/parenchyma|প্যারেনকাইমা/i.test(text)) return asset("bio-parenchyma");
  if (/chordata|কর্ডাটা|notochord/i.test(text)) return asset("bio-chordata");
  if (/resin|তেল\s*নল|oil\s*gland|রেজিন/i.test(text)) return asset("bio-resin-duct");
  if (/mitosis.*meiosis|মাইটোসিস.*মায়োসিস|মাইটোসিস.*মায়োসিস|মাইটোসিস.*মিয়োসিস/i.test(text))
    return asset("bio-mitosis-meiosis");
  if (/খাদ্যনাল|পাকস্থলী|digestive|পরিপাক|ক্ষুদ্রান্ত্র|বৃহদন্ত্র|গ্যাস্ট্রিক/i.test(text))
    return asset("bio-digestive");
  if (/অ্যালভিওল|alveoli|ফুসফুস|গ্যাস\s*বিনিময়|গ্যাস\s*বিনিময়/i.test(text))
    return asset("bio-alveoli");
  if (/জাইলেম|ফ্লোয়েম|xylem|phloem/i.test(text)) return asset("bio-xylem-phloem");
  /* Logic gate SVG (bio-logic-gate) not on disk — skip */
  if (/নেফ্রন|glomerul|Ultrafiltration|ছাঁকনি|বোম্যানস|হেনলি|সংগ্রাহক|kidney|বৃক্ক|মূত্র/i.test(text))
    return asset("bio-nephron");
  if (/চক্ষু|retina|cornea|iris|চোখের|eyeball|অক্ষিক|অপটিক.*নার্ভ|রেটিনা|কর্নিয়া/i.test(text))
    return asset("bio-eye");
  if (/হৃৎপিণ্ড|হৃদযন্ত্র|heart|অলিন্দ|নিলয়|মহাধমনী|করোনারি/i.test(text))
    return asset("bio-heart");
  if (/মস্তিষ্ক|brain|সেরিব্রাম|সেরিবেলাম|থ্যালামাস|হাইপোথ্যালামাস/i.test(text))
    return asset("bio-brain");
  if (/ত্বক|skin|এপিডার্মিস|ডার্মিস|হাইপোডার্মিস|ঘর্মগ্রন্থি/i.test(text))
    return asset("bio-skin");
  if (/কোষ\s*বিভাজন|মাইটোসিস|মায়োসিস|মিয়োসিস|প্রোফেজ|মেটাফেজ|অ্যানাফেজ|টেলোফেজ|সাইটোকাইনেসিস/i.test(text))
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
  if (/ক্রেবস\s*চক্র|krebs|গ্লাইকোলাইসিস|glycolysis/i.test(text))
    return asset("bio-mitochondria-chloroplast");
  return null;
}

function resolveQuestionDiagram(text) {
  if (!text) return null;
  const explicit = text.match(EXPLICIT_SLUG_RE);
  const slug = explicit?.[1] ?? explicit?.[2];
  if (slug && EXISTING_TRUSTED_SLUGS.has(slug)) return asset(slug);
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

// ── Helpers ─────────────────────────────────────────────────────────────────

function isPremiumPlaceholder(image) {
  if (!image) return false;
  return /^\/images\/quiz\/(premium|generated)\//i.test(image);
}

function extractSubject(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  const match = normalized.match(/public\/questions\/([^/]+)/);
  if (!match) return "unknown";
  const subj = match[1];
  if (subj.startsWith("biology")) return "biology";
  if (subj.startsWith("chemistry")) return "chemistry";
  if (subj.startsWith("physics")) return "physics";
  if (subj.startsWith("higher-math") || subj === "higher-math") return "higher-math";
  if (subj.startsWith("general-math") || subj === "general-math") return "general-math";
  if (subj === "ict") return "ict";
  return subj;
}

function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkDir(full));
    else if (entry.isFile() && entry.name.endsWith(".json") && entry.name !== "index.json") files.push(full);
  }
  return files;
}

// ── Main ────────────────────────────────────────────────────────────────────

const violations = [];
let fixed = 0;

console.log("🔍 CI Check: Premium SVG Validation\n");
console.log(`📁 Question dir: ${QUESTIONS_DIR}`);
console.log(`🖼️  SVG files on disk: ${SVGS_ON_DISK.size}`);
console.log(`🎯 Trusted slugs with SVGs: ${EXISTING_TRUSTED_SLUGS.size}`);
if (DRY_RUN) console.log("📋 DRY-RUN MODE — reporting only, no changes\n");
if (FIX_MODE) console.log("🛠️  FIX MODE — auto-fixing violations\n");

const allFiles = walkDir(QUESTIONS_DIR);

for (const file of allFiles) {
  let questions;
  try {
    const raw = fs.readFileSync(file, "utf-8");
    questions = JSON.parse(raw);
  } catch { continue; }
  if (!Array.isArray(questions)) continue;

  const subject = extractSubject(file);
  let fileModified = false;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const text = q.text || "";
    const image = q.image || null;
    if (!image || !isPremiumPlaceholder(image)) continue;

    const textMatch = resolveQuestionDiagram(text);
    if (!textMatch) continue;

    violations.push({
      file: file.replace(/\\/g, "/").replace(/^.*public\/questions\//, "public/questions/"),
      subject, id: q.id,
      currentImage: image,
      recommendedImage: textMatch.src,
      recommendedSlug: textMatch.slug,
    });

    if (FIX_MODE) {
      questions[i].image = textMatch.src;
      fileModified = true;
      fixed++;
    }
  }

  if (FIX_MODE && fileModified) {
    fs.writeFileSync(file, JSON.stringify(questions, null, 2) + "\n", "utf-8");
  }
}

// ── Report ──────────────────────────────────────────────────────────────────

console.log(`📊 Files scanned: ${allFiles.length}`);
console.log(`⚠️  Violations: ${violations.length}`);
if (FIX_MODE) console.log(`🔧 Fixed: ${fixed}`);

if (violations.length > 0) {
  console.log("\n─── Violations by subject ───");
  const bySubject = {};
  for (const v of violations) {
    if (!bySubject[v.subject]) bySubject[v.subject] = [];
    bySubject[v.subject].push(v);
  }
  for (const [subject, items] of Object.entries(bySubject)) {
    console.log(`  [${subject}] — ${items.length}`);
    for (const v of items.slice(0, 3)) {
      console.log(`    ${v.id.slice(0, 55)}`);
      console.log(`      ${v.currentImage} → ${v.recommendedImage}`);
    }
    if (items.length > 3) console.log(`    ... and ${items.length - 3} more`);
  }

  console.log(`\n💡 Run with --fix to auto-replace:`);
  console.log(`   node scripts/ci-check-premium-svgs.js --fix`);

  if (!FIX_MODE && !DRY_RUN) {
    console.log("\n❌ CI CHECK FAILED\n");
    process.exit(1);
  } else {
    console.log(`\n✅ ${FIX_MODE ? `Fixed ${fixed} violations` : "Dry-run — no changes made"}\n`);
  }
} else {
  console.log("\n✅ All clean! No premium SVGs where library SVGs are available.");
  console.log("✅ CI CHECK PASSED\n");
}
