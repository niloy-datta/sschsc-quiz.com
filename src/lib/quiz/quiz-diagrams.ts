/**
 * Explicit quiz diagram resolver — trusted matches only.
 */

const GRAPH_OPTION_FAMILIES = [
  "photon-energy",
  "half-life",
  "electric-field",
  "pressure-depth",
  "heating-curve",
  "reaction-rate",
  "pv-cycle",
  "shm-graph",
  "vt-graph",
] as const;

const TRUSTED_QUESTION_SLUGS = [
  // User-provided library (physics_13 + remaining_subjects packs)
  "cell-terminal-pd",
  "cell-terminal-pd-alt",
  "mass-spring",
  "nor-gate",
  "parallel-dry-cells",
  "parallel-resistors",
  "pendulum",
  "resistor-voltage",
  "series-lcr",
  "young-double-slit-1",
  "young-double-slit-2",
  "young-double-slit-3",
  "young-double-slit-4",
  "ssc-transformer",
  "ssc-buoyancy",
  "ssc-resistor-network",
  "ssc-current-junction",
  "ssc-concave-mirror",
  "ssc-concave-mirror-principal",
  "ssc-electrostatic-induction",
  "ssc-st-graph",
  "ssc-force-time-graph",
  "ssc-convex-lens",
  "ssc-myopia-eye",
  "ssc-work-zero-90deg",
  "ssc-power-circuit",
  "bio-mitochondria-chloroplast",
  "plasmid",
  "bio-recombinant-plasmid",
  "bio-dna-helix",
  "bio-trna",
  "bio-stomata",
  "bio-bacteriophage",
  "bio-golgi",
  "bio-cytokinesis",
  "bio-poaceae-root",
  "bio-endodermis",
  "bio-c4-kranz",
  "bio-tissue-culture",
  "bio-transcription-translation",
  "bio-crossing-over",
  "bio-meristem",
  "bio-parenchyma",
  "bio-chordata",
  "bio-resin-duct",
  "bio-mitosis-meiosis",
  "bio-nephron",
  "bio-eye",
  "bio-heart",
  "bio-brain",
  "bio-skin",
  "cell-division",
  "cell-wall",
  "sporangium",
  "fern-prothallus",
  "dna-rna",
  "vascular-bundle",
  "chem-alkyne-hydration",
  "chem-bromine-test",
  "chem-addition-polymer",
  "chem-titration",
  "geo-circle-pq-op",
  "geo-angle-bisectors",
  "geo-cyclic-quadrilateral",
  "geo-right-triangle-trig",
  "hm-parabola-y-x2",
  "hm-resultant-5n-7n-60",
  "hm-resultant-6n-8n-90",
  "hm-complex-locus",
  "hm-straight-line-slope",
  // Legacy slugs (attach when SVG added later)
  "ssc-charge-spheres",
  "ssc-wave-standing",
  "ssc-wheel-motion",
] as const;

export const TRUSTED_STORED_DIAGRAM_SLUGS = new Set<string>(TRUSTED_QUESTION_SLUGS);

function buildAssetMap(): Record<string, string> {
  const map: Record<string, string> = {};

  for (const slug of TRUSTED_QUESTION_SLUGS) {
    map[slug] = `/images/quiz/${slug}.svg`;
  }

  for (const family of GRAPH_OPTION_FAMILIES) {
    for (let i = 1; i <= 4; i++) {
      map[`${family}-${i}`] = `/images/quiz/${family}-${i}.svg`;
    }
  }

  return map;
}

export const QUIZ_DIAGRAM_ASSETS: Record<string, string> = buildAssetMap();

export type ResolvedQuizDiagram = {
  slug: string;
  src: string;
  caption?: string;
};

const BRACKET_CHITRA_RE = /\[চিত্র\s*[:：]\s*([^\]]+)\]/i;
const EXPLICIT_SLUG_RE =
  /(?:\[svg\s*[:：]\s*([a-z0-9-]+)\s*\]|\(\s*চিত্র\s*[:：]\s*([a-z0-9-]+)\s*\))/i;
const PAREN_CHITRA_RE = /\(\s*চিত্র\s*[:：]\s*([^)]+)\s*\)/i;
const LEKHOCHITRA_OPT_RE = /^\[?\s*লেখচিত্র\s*([১২৩৪1-4]|ঘ)\s*\]?$/i;

const BN_DIGIT: Record<string, number> = {
  "১": 1,
  "২": 2,
  "৩": 3,
  "৪": 4,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  ঘ: 4,
};

function asset(slug: string): ResolvedQuizDiagram | null {
  const src = QUIZ_DIAGRAM_ASSETS[slug];
  return src ? { slug, src } : null;
}

function normalizeHint(hint: string): string {
  return hint.replace(/\s+/g, " ").trim();
}

export function isTrustedStoredDiagram(image: string | null | undefined): boolean {
  if (!image) return false;
  return /^\/images\/quiz\/(?:[a-z0-9_.-]+\.svg|(?:generated|premium)(?:\/options)?\/[a-z0-9_.-]+\.svg)$/i.test(
    image,
  );
}

/** Question mentions a diagram but none could be resolved safely. */
export function questionNeedsDiagramPlaceholder(text: string): boolean {
  if (!text) return false;
  return (
    /\[চিত্র\s*[:：][^\]]+\]/i.test(text) ||
    /\(চিত্র\s*[:：][^)]+\)/i.test(text) ||
    /চিত্রটি\s*অনুপস্থিত|চিত্র\/গ্রাফ\s*ছিল|অপশনগুলোতে\s*চিত্র/i.test(text) ||
    (/চিত্রে|উদ্দীপকের\s*চিত্র|উপরের\s*চিত্র/i.test(text) &&
      !/\[চিত্র\s*[:：]|\(চিত্র\s*[:：]/i.test(text))
  );
}

function matchBracketChitraHint(hint: string): ResolvedQuizDiagram | null {
  const h = normalizeHint(hint);

  if (
    /গোলক\s+A\s+ও\s+B/i.test(h) ||
    (/গোলক/i.test(h) && /আধান/i.test(h) && /\bA\b/.test(h) && /\bB\b/.test(h))
  ) {
    return asset("ssc-charge-spheres");
  }

  if (/তরঙ্গ/i.test(h) && /চূ/i.test(h)) {
    return asset("ssc-wave-crests");
  }

  if (/অবতল দর্পণ/i.test(h) && /লক্ষ্যবস্তু/i.test(h)) {
    return asset("ssc-concave-mirror");
  }

  return null;
}

function matchParenChitraLabel(label: string): ResolvedQuizDiagram | null {
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

/** Lens / mirror ray diagrams — must run before biology heuristics. */
function matchPhysicsOpticsStimulus(text: string): ResolvedQuizDiagram | null {
  if (!/চিত্র|diagram|উদ্দীপক|চিত্রভিত্তিক/i.test(text)) return null;

  const isMirror =
    /দর্পণ|mirror|আয়না|আয়না|অবতল\s*দর্পণ|উত্তল\s*দর্পণ/i.test(text) ||
    (/\\text\{PC\}|\\text\{PM\}|2\\text\{PC\}|PC\s*=\s*PM/i.test(text) &&
      /প্রতিবিম্ব|আয়না|আয়না/i.test(text)) ||
    (/M\s*বিন্দু/i.test(text) && /প্রতিবিম্ব/i.test(text)) ||
    (/বক্রতার\s*কেন্দ্র/i.test(text) && /\(C\s*বিন্দু/i.test(text));

  if (isMirror) {
    if (/প্রধান\s*অক্ষ|১০\s*cm|10\s*cm.*40\s*cm|বিবর্ধন.*m/i.test(text)) {
      return asset("ssc-concave-mirror-principal");
    }
    return asset("ssc-concave-mirror");
  }

  const isLens =
    /লেন্স|lens/i.test(text) ||
    /লেন্সটিতে|লক্ষ্যবস্তুর\s*সৃষ্ট\s*প্রতিবিম্ব|বিবর্ধন\s*এক/i.test(text) ||
    (/\bO\b/.test(text) && /[CF]'|F'|C'|২F|2F/i.test(text) && /লেন্স|প্রতিবিম্ব/i.test(text));

  if (isLens) return asset("ssc-convex-lens");

  if (/উপরের\s*চিত্রানুসারে.*প্রধান\s*অক্ষ.*বিবর্ধন|লক্ষ্যবস্তু\s*প্রধান\s*অক্ষ.*বিবর্ধন/i.test(text)) {
    return asset("ssc-concave-mirror-principal");
  }

  if (/তরঙ্গ|wave|MN\s*=\s*NH|A\s*থেকে\s*D/i.test(text)) {
    if (/AB\s*=\s*200|MN\s*=\s*NH|স্থির\s*তরঙ্গ/i.test(text)) {
      return asset("ssc-wave-standing");
    }
  }

  if (/ট্রান্সফরমার|transformer/i.test(text)) return asset("ssc-transformer");
  if (/ধনাত্মক\s*আধান|অনাহিত\s*পরিবাহ|electrostatic\s*induction/i.test(text)) {
    return asset("ssc-electrostatic-induction");
  }
  if (/দূরত্ব[-\s]*সময়|distance[-\s]*time|O\(0,\s*0\).*A\(10,\s*10\)/i.test(text)) {
    return asset("ssc-st-graph");
  }
  if (/বল\s*বনাম\s*সময়|force.*time|ঢাল\s*এর\s*একক/i.test(text)) {
    return asset("ssc-force-time-graph");
  }
  if (/চলন্ত\s*গাড়ি|চলন্ত\s*গাড়ি|চাকার\s*গতি|wheel/i.test(text)) {
    return asset("ssc-wheel-motion");
  }
  if (/প্লবতা|buoyancy|ভাস|immersed/i.test(text)) return asset("ssc-buoyancy");
  if (/R_1|R_2|তুল্য\s*রোধ|equivalent\s*resistance/i.test(text)) return asset("ssc-resistor-network");
  if (/জাংশন|junction|কিরchhoff|কারশফ/i.test(text)) return asset("ssc-current-junction");
  if (/প্রান্তীয়\s*বিভব|terminal\s*pd|কোষ.*বিভব/i.test(text)) return asset("cell-terminal-pd");
  if (/LCR|series.*LCR|আবর্ত\s*প্রবাহ/i.test(text)) return asset("series-lcr");
  if (/young|ইয়ং|দ্বি-স্লিট|double\s*slit/i.test(text)) return asset("young-double-slit-1");

  return null;
}

/** Topic-specific biology schematics when stem clearly names the structure. */
function matchBiologyStimulus(text: string): ResolvedQuizDiagram | null {
  if (!/চিত্র|diagram|উদ্দীপক/i.test(text)) return null;

  if (/নিউরন|neuron|স্নায়ু|synapse|সংযোগস্থল/i.test(text)) {
    return asset("bio-neuron");
  }
  if (
    /চক্ষু|retina|cornea|iris|চোখের|eyeball|অক্ষিক|দূরের\s*বস্তু\s*দেখতে\s*পায়\s*না|দূরের\s*বস্তু\s*দেখতে\s*পায়\s*না|myopia|ক্ষীন\s*দৃষ্টি/i.test(
      text,
    ) &&
    !/দর্পণ|লেন্স|mirror|lens|অবতল|উত্তল|আয়না|আয়না/i.test(text)
  ) {
    return asset("ssc-myopia-eye");
  }
  if (/মাইটোকন্ড্রিয়া|মাইটোকন্ড্রিয়া|mitochondria/i.test(text) && /ক্লোরো|chloroplast/i.test(text)) {
    return asset("bio-mitochondria-chloroplast");
  }
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
  if (/mitosis.*meiosis|মাইটোসিস.*মায়োসিস|মাইটোসিস.*মায়োসিস/i.test(text)) {
    return asset("bio-mitosis-meiosis");
  }
  if (/খাদ্যনাল|পাকস্থলী|digestive|পরিপাক|ক্ষুদ্রান্ত্র|বৃহদন্ত্র/i.test(text)) {
    return asset("bio-digestive");
  }
  if (/অ্যালভিওল|alveoli|ফুসফুস|গ্যাস\s*বিনিময়/i.test(text)) {
    return asset("bio-alveoli");
  }
  if (/জাইলেম|ফ্লোয়েম|xylem|phloem/i.test(text)) {
    return asset("bio-xylem-phloem");
  }
  if (/\bGate\b|logic\s*gate|লজিক/i.test(text)) {
    return asset("bio-logic-gate");
  }
  if (/নেফ্রন|glomerul|Ultrafiltration|ছাঁকনি|বোম্যানস|হেনলি|সংগ্রাহক|kidney|বৃক্ক/i.test(text)) {
    return asset("bio-nephron");
  }
  if (/চক্ষু|retina|cornea|iris|চোখের|eyeball|অক্ষিক|অপটিক.*নার্ভ|রেটিনা|কর্নিয়া/i.test(text)) {
    return asset("bio-eye");
  }
  if (/হৃৎপিণ্ড|হৃদযন্ত্র|heart|অলিন্দ|নিলয়|মহাধমনী|করোনারি/i.test(text)) {
    return asset("bio-heart");
  }
  if (/মস্তিষ্ক|brain|সেরিব্রাম|সেরিবেলাম|থ্যালামাস|হাইপোথ্যালামাস/i.test(text)) {
    return asset("bio-brain");
  }
  if (/ত্বক|skin|এপিডার্মিস|ডার্মিস|হাইপোডার্মিস|ঘর্মগ্রন্থি/i.test(text)) {
    return asset("bio-skin");
  }
  if (/কোষ\s*বিভাজন|মাইটোসিস|মায়োসিস|প্রোফেজ|মেটাফেজ|অ্যানাফেজ|টেলোফেজ|সাইটোকাইনেসিস/i.test(text)) {
    return asset("cell-division");
  }
  if (/কোষপ্রাচীর|cell\s*wall|মধ্যপর্দা|প্লাজমোডেসমাটা|প্রাথমিক\s*প্রাচীর|গৌণ\s*প্রাচীর/i.test(text)) {
    return asset("cell-wall");
  }
  if (/স্পোরাঞ্জি|sporangium|অ্যানুলাস|স্টোমিয়াম/i.test(text)) {
    return asset("sporangium");
  }
  if (/প্রোথ্যালাস|prothallus|ফার্ন|অ্যানথেরিডিয়া|আর্কিগোনিয়া/i.test(text)) {
    return asset("fern-prothallus");
  }
  if (/DNA.*RNA|ডিএনএ.*আরএনএ|নিউক্লিক\s*অ্যাসিড|ডাবল.*হেলিক্স.*সিঙ্গেল|dna.*rna/i.test(text)) {
    return asset("dna-rna");
  }
  if (/ভাস্কুলার\s*বান্ডল|vascular\s*bundle|সমপার্শ্বীয়|বিকর্ষ|ক্যাম্বিয়াম/i.test(text)) {
    return asset("vascular-bundle");
  }

  return null;
}

type GraphFamily = (typeof GRAPH_OPTION_FAMILIES)[number];

function isGraphComparisonQuestion(questionText: string): boolean {
  return /লেখচিত্র\s*(কোনটি|ভিন্ন|সঠিক)|কোন\s*লেখচিত্র|নিচের\s*কোন\s*লেখচিত্র|লেখ\s*চিত্র\s*কোন/i.test(
    questionText,
  );
}

function detectGraphFamily(questionText: string): GraphFamily | null {
  if (!isGraphComparisonQuestion(questionText)) return null;

  const q = questionText;

  if (/ফোটন|photon|আলোক\s*তড়/i.test(q)) return "photon-energy";
  if (/অর্ধায়ু|অর্ধায়ু|গড়\s*আয়ু|গড়\s*আয়ু|তেজস্ক্র/i.test(q)) return "half-life";
  if (/তড়িৎ\s*প্রাবল্য|electric\s*field/i.test(q)) return "electric-field";
  if (/চাপ\s*বনাম\s*গভীরতা|pressure.*depth/i.test(q)) return "pressure-depth";
  if (/তাপীয়\s*বক্র|তাপ\s*প্রদান|heating\s*curve|কঠিন\s*ঊর্ধ্বপাত/i.test(q)) {
    return "heating-curve";
  }
  if (/ঘনমাত্রা|বিক্রিয়ক|reaction\s*rate|উৎপাদ[^]*বৃদ্ধ/i.test(q)) return "reaction-rate";
  if (/P-V|p-v\s*গ্রাফ|চক্রাকার/i.test(q)) return "pv-cycle";
  if (/সরল\s*ছন্দ|simple\s*harmonic|সরলদোলক/i.test(q)) return "shm-graph";
  if (/স্থির\s*চাপ|আদর্শ\s*গ্যাস|volume.*temperature|V-T/i.test(q)) return "vt-graph";

  return null;
}

function extractGraphIndex(optionText: string): number | null {
  const m = optionText.trim().match(LEKHOCHITRA_OPT_RE);
  if (!m) return null;
  return BN_DIGIT[m[1]!] ?? null;
}

export function resolveQuestionDiagram(text: string): ResolvedQuizDiagram | null {
  if (!text) return null;

  const explicit = text.match(EXPLICIT_SLUG_RE);
  const slug = explicit?.[1] ?? explicit?.[2];
  if (slug && TRUSTED_STORED_DIAGRAM_SLUGS.has(slug)) {
    return asset(slug);
  }

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

  if (/\(\s*উদ্দীপক\s*[:：]\s*DNA\s*ও\s*RNA\s*\)/i.test(text)) {
    return asset("dna-rna");
  }

  return matchPhysicsOpticsStimulus(text) ?? matchBiologyStimulus(text);
}

export function resolveOptionDiagram(
  optionText: string,
  questionText: string,
): ResolvedQuizDiagram | null {
  const index = extractGraphIndex(optionText);
  if (!index || !questionText) return null;

  const family = detectGraphFamily(questionText);
  if (family) return asset(`${family}-${index}`);

  if (/young|ইয়ং|দ্বি-স্লিট|double\s*slit/i.test(questionText)) {
    return asset(`young-double-slit-${index}`);
  }

  return null;
}

export function stripQuestionDiagramMarkers(text: string): string {
  return text
    .replace(/\[চিত্র\s*[:：]\s*[^\]]+\]/gi, "")
    .replace(/\(\s*চিত্র\s*[:：]\s*[^)]+\s*\)/gi, "")
    .replace(/\(\s*উদ্দীপক\s*[:：]\s*DNA\s*ও\s*RNA\s*\)/gi, "")
    .replace(/^উদ্দীপক\s*[:：]\s*চিত্রে\s*/i, "উদ্দীপক: ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function resolveQuizDiagram(input: {
  text?: string | null;
  image?: string | null;
  optionText?: string | null;
  questionText?: string | null;
}): ResolvedQuizDiagram | null {
  // Priority 1: Text-based resolution for precise library SVG matches
  // e.g., "নেফ্রন" -> bio-nephron.svg (real diagram)
  if (input.text) {
    const textMatch = resolveQuestionDiagram(input.text);
    if (textMatch) return textMatch;
  }

  // Priority 2: Stored image field (premium/generated SVG) as fallback
  if (input.image && isTrustedStoredDiagram(input.image)) {
    const slug = input.image
      .replace(/^\/images\/quiz\//, "")
      .replace(/\.svg$/i, "");
    return { slug, src: input.image, caption: undefined };
  }

  // Priority 3: Option-level diagram resolution (e.g., graph families)
  if (input.optionText && input.questionText) {
    return resolveOptionDiagram(input.optionText, input.questionText);
  }

  return null;
}
