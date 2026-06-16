/**
 * Import user SVG packs into public/images/quiz/ and attach to matching questions.
 *
 * Sources:
 *   physics_13_images_only/
 *   ../remaining_subjects_clean_unique_images_only/
 *
 * Usage: node scripts/import-user-svg-pack.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DEST = path.join(ROOT, "public", "images", "quiz");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const REMAINING = path.resolve(ROOT, "..", "remaining_subjects_clean_unique_images_only");

const NEED_VISUAL =
  /\[চিত্র\s*[:：]|\(চিত্র\s*[:：]|চিত্রে|উদ্দীপক|চিত্রভিত্তিক|লেখচিত্র|গ্রাফ|diagram|circuit|বৃত্ত|triangle|ত্রিভুজ|vector|সমন্বয়|অক্ষ|wave|তরঙ্গ|force|V-I|I-V|স্থানাঙ্ক|coordinate|parabola|x²|y\s*=|বর্তনী|resistor|লেন্স|দর্পণ|mirror|lens/i;

/** { slug, from, match(text): boolean } — first match wins per question */
const ASSETS = [
  // ── physics_13_images_only ──
  {
    slug: "cell-terminal-pd",
    from: path.join(ROOT, "physics_13_images_only", "001_cell_terminal_pd.svg"),
  },
  {
    slug: "cell-terminal-pd-alt",
    from: path.join(ROOT, "physics_13_images_only", "002_cell_terminal_pd.svg"),
    match: (t) => /অভ্যন্তরীণ\s*রোধ|internal\s*resistance|ই\.?\s*ড\.?/i.test(t),
  },
  {
    slug: "mass-spring",
    from: path.join(ROOT, "physics_13_images_only", "003_mass_spring.svg"),
    match: (t) => /স্প্রিং|spring|দোলন\s*বল/i.test(t) && /চিত্র|উদ্দীপক|diagram/i.test(t),
  },
  {
    slug: "nor-gate",
    from: path.join(ROOT, "physics_13_images_only", "004_nor_gate.svg"),
    match: (t) => /nor\s*gate|ন\s*or\s*গেট|nor/i.test(t),
  },
  {
    slug: "parallel-dry-cells",
    from: path.join(ROOT, "physics_13_images_only", "005_parallel_dry_cells.svg"),
    match: (t) => /শুষ্ক\s*কোষ|dry\s*cell|সমান্তরাল.*কোষ/i.test(t),
  },
  {
    slug: "parallel-resistors",
    from: path.join(ROOT, "physics_13_images_only", "006_parallel_resistors.svg"),
    match: (t) => /সমান্তরাল.*রোধ|parallel.*resistor|রোধ.*সমান্তর/i.test(t),
  },
  {
    slug: "pendulum",
    from: path.join(ROOT, "physics_13_images_only", "007_pendulum.svg"),
    match: (t) => /দোলক|pendulum/i.test(t) && NEED_VISUAL.test(t),
  },
  {
    slug: "resistor-voltage",
    from: path.join(ROOT, "physics_13_images_only", "008_resistor_voltage.svg"),
    match: (t) => /V-I|I-V|রোধ.*বিভব|লেখচিত্র.*রোধ/i.test(t),
  },
  {
    slug: "series-lcr",
    from: path.join(ROOT, "physics_13_images_only", "009_series_lcr.svg"),
    match: (t) => /LCR|ধারক.*কুণ্ডলী|series.*LCR|আবর্ত\s*প্রবাহ/i.test(t),
  },
  {
    slug: "young-double-slit-1",
    from: path.join(ROOT, "physics_13_images_only", "010_young_double_slit.svg"),
  },
  {
    slug: "young-double-slit-2",
    from: path.join(ROOT, "physics_13_images_only", "011_young_double_slit.svg"),
  },
  {
    slug: "young-double-slit-3",
    from: path.join(ROOT, "physics_13_images_only", "012_young_double_slit.svg"),
  },
  {
    slug: "young-double-slit-4",
    from: path.join(ROOT, "physics_13_images_only", "013_young_double_slit.svg"),
  },

  // ── remaining_subjects / ssc_physics ──
  {
    slug: "ssc-transformer",
    from: path.join(REMAINING, "ssc_physics", "001_transformer.svg"),
    match: (t) => /ট্রান্সফরমার|transformer/i.test(t) && NEED_VISUAL.test(t),
  },
  {
    slug: "ssc-buoyancy",
    from: path.join(REMAINING, "ssc_physics", "002_buoyancy_immersed_body.svg"),
    match: (t) => /প্লবতা|buoyancy|ভাস|immersed|নিমজ্জ/i.test(t),
  },
  {
    slug: "ssc-resistor-network",
    from: path.join(
      REMAINING,
      "ssc_physics",
      "003_resistor_network_20v_6_12_parallel_6_series.svg",
    ),
    match: (t) =>
      /R_1|R_2|R_3|R_4|তুল্য\s*রোধ|equivalent\s*resistance|বর্তনীতে.*রোধ/i.test(t),
  },
  {
    slug: "ssc-current-junction",
    from: path.join(REMAINING, "ssc_physics", "004_current_junction_circuit.svg"),
    match: (t) => /জাংশন|junction|কিরchhoff|কারশফ|শাখা\s*বিভাজন/i.test(t),
  },
  {
    slug: "ssc-concave-mirror",
    from: path.join(REMAINING, "ssc_physics", "005_concave_mirror_ray.svg"),
    match: (t) =>
      /অবতল\s*দর্পণ|concave\s*mirror|আয়না|আয়না|PC\s*=\s*PM|2\s*PC/i.test(t) &&
      !/উত্তল\s*লেন্স|convex\s*lens/i.test(t),
  },
  {
    slug: "ssc-convex-lens",
    from: path.join(REMAINING, "ssc_physics", "006_convex_lens_ray.svg"),
    match: (t) => /উত্তল\s*লেন্স|convex\s*lens|লেন্স.*ray|F'|C'/i.test(t),
  },
  {
    slug: "ssc-myopia-eye",
    from: path.join(REMAINING, "ssc_physics", "007_myopia_eye_lens.svg"),
    match: (t) =>
      /দূরের\s*বস্তু\s*দেখতে\s*পায়\s*না|দূরের\s*বস্তু\s*দেখতে\s*পায়\s*না|myopia|ক্ষীন\s*দৃষ্টি/i.test(
        t,
      ),
  },
  {
    slug: "ssc-work-zero-90deg",
    from: path.join(REMAINING, "ssc_physics", "008_force_displacement_90_work_zero.svg"),
    match: (t) => /৯০\s*°|90\s*°|কাজ\s*=\s*0|displacement.*90/i.test(t),
  },
  {
    slug: "ssc-power-circuit",
    from: path.join(REMAINING, "ssc_physics", "009_basic_power_circuit.svg"),
    match: (t) => /বর্তনী.*ক্ষমতা|power.*circuit|ওয়াট.*বর্তনী/i.test(t),
  },

  // ── biology ──
  {
    slug: "bio-mitochondria-chloroplast",
    from: path.join(REMAINING, "biology", "001_mitochondria_chloroplast.svg"),
    match: (t) =>
      /মাইটোকন্ড্রিয়া|মাইটোকন্ড্রিয়া|mitochondria/i.test(t) &&
      /ক্লোরো|chloroplast|অঙ্গাণু/i.test(t),
  },
  { slug: "plasmid", from: path.join(REMAINING, "biology", "002_plasmid.svg"), match: (t) => /প্লাজমিড|plasmid/i.test(t) },
  {
    slug: "bio-recombinant-plasmid",
    from: path.join(REMAINING, "biology", "003_recombinant_plasmid.svg"),
    match: (t) => /recombinant|রিকম্বিন্যান্ট|জিন\s*ক্লোন/i.test(t),
  },
  {
    slug: "bio-dna-helix",
    from: path.join(REMAINING, "biology", "004_dna_double_helix.svg"),
    match: (t) => /DNA.*helix|ডিএনএ.*ডবল|double\s*helix/i.test(t),
  },
  {
    slug: "bio-trna",
    from: path.join(REMAINING, "biology", "005_trna_cloverleaf.svg"),
    match: (t) => /tRNA|টিআরএনএ|transfer\s*RNA/i.test(t),
  },
  {
    slug: "bio-stomata",
    from: path.join(REMAINING, "biology", "006_stomata.svg"),
    match: (t) => /স্টোমাটা|stomata|stoma/i.test(t),
  },
  {
    slug: "bio-bacteriophage",
    from: path.join(REMAINING, "biology", "007_bacteriophage.svg"),
    match: (t) => /bacteriophage|ব্যাকটেরিওফেজ/i.test(t),
  },
  {
    slug: "bio-golgi",
    from: path.join(REMAINING, "biology", "008_golgi_body.svg"),
    match: (t) => /গলজি|golgi/i.test(t),
  },
  {
    slug: "bio-cytokinesis",
    from: path.join(REMAINING, "biology", "009_cytokinesis.svg"),
    match: (t) => /cytokinesis|사이টো|সাইটোকাইনেসিস/i.test(t),
  },
  {
    slug: "bio-poaceae-root",
    from: path.join(REMAINING, "biology", "010_poaceae_root.svg"),
    match: (t) => /poaceae|ঘাস.*মূল|monocot.*root/i.test(t),
  },
  {
    slug: "bio-endodermis",
    from: path.join(REMAINING, "biology", "011_endodermis_casparian_strip.svg"),
    match: (t) => /endodermis|এন্ডোডার্মিস|casparian/i.test(t),
  },
  {
    slug: "bio-c4-kranz",
    from: path.join(REMAINING, "biology", "012_c4_kranz_anatomy.svg"),
    match: (t) => /C4|kranz|ক্রanz|Hatch/i.test(t),
  },
  {
    slug: "bio-tissue-culture",
    from: path.join(REMAINING, "biology", "013_tissue_culture.svg"),
    match: (t) => /tissue\s*culture|টিস্য\s*কালচার/i.test(t),
  },
  {
    slug: "bio-transcription-translation",
    from: path.join(REMAINING, "biology", "014_transcription_translation.svg"),
    match: (t) => /transcription|translation|ট্রান্সক্রিপশন|কেন্দ্রীয়\s*dogma/i.test(t),
  },
  {
    slug: "bio-crossing-over",
    from: path.join(REMAINING, "biology", "015_crossing_over.svg"),
    match: (t) => /crossing\s*over|ক্রসিং\s*ওভার/i.test(t),
  },
  {
    slug: "bio-meristem",
    from: path.join(REMAINING, "biology", "016_meristem_tissue.svg"),
    match: (t) => /meristem|মেরিস্টেম/i.test(t),
  },
  {
    slug: "bio-parenchyma",
    from: path.join(REMAINING, "biology", "017_parenchyma_tissue.svg"),
    match: (t) => /parenchyma|প্যারেনকাইমা/i.test(t),
  },
  {
    slug: "bio-chordata",
    from: path.join(REMAINING, "biology", "018_chordata_features.svg"),
    match: (t) => /chordata|কর্ডাটা|notochord/i.test(t),
  },
  {
    slug: "bio-resin-duct",
    from: path.join(REMAINING, "biology", "019_resin_duct_oil_gland.svg"),
    match: (t) => /resin|resin\s*duct|তেল\s*নল|oil\s*gland/i.test(t),
  },
  {
    slug: "bio-mitosis-meiosis",
    from: path.join(REMAINING, "biology", "020_mitosis_meiosis_comparison.svg"),
    match: (t) => /mitosis.*meiosis|মাইটোসিস.*মায়োসিস|মাইটোসিস.*মায়োসিস/i.test(t),
  },

  // ── chemistry ──
  {
    slug: "chem-alkyne-hydration",
    from: path.join(REMAINING, "chemistry", "001_alkyne_hydration_oxidation.svg"),
    match: (t) => /alkyne|অ্যালকাইন|hydration.*oxidation/i.test(t),
  },
  {
    slug: "chem-bromine-test",
    from: path.join(REMAINING, "chemistry", "002_bromine_test_unsaturation.svg"),
    match: (t) => /bromine|ব্রোমিন|unsaturation|অস্যাচুরেশন/i.test(t),
  },
  {
    slug: "chem-addition-polymer",
    from: path.join(REMAINING, "chemistry", "003_addition_polymerization.svg"),
    match: (t) => /addition\s*polymer|যোগ\s*পলিমার/i.test(t),
  },
  {
    slug: "chem-titration",
    from: path.join(REMAINING, "chemistry", "004_titration_endpoint.svg"),
    match: (t) => /titration|টাইট্রেশন|endpoint/i.test(t),
  },

  // ── general_math ──
  {
    slug: "geo-circle-pq-op",
    from: path.join(REMAINING, "general_math", "001_circle_pq_op_psq.svg"),
    match: (t) => /PC\s*=\s*PM|2\s*PC|OP.*PSQ|বৃত্ত.*PQ|কেন্দ্র\s*O/i.test(t),
  },
  {
    slug: "geo-angle-bisectors",
    from: path.join(REMAINING, "general_math", "002_angle_bisectors_pqrs.svg"),
    match: (t) => /angle\s*bisector|কোণ\s*দ্বিখণ্ডক|bisector/i.test(t),
  },
  {
    slug: "geo-cyclic-quadrilateral",
    from: path.join(REMAINING, "general_math", "003_cyclic_quadrilateral_angles.svg"),
    match: (t) => /cyclic\s*quad|চক্রীয়\s*চতুর্ভুজ/i.test(t),
  },
  {
    slug: "geo-right-triangle-trig",
    from: path.join(REMAINING, "general_math", "004_right_triangle_trigonometry.svg"),
    match: (t) => /সমকোণী\s*ত্রিভুজ|right\s*triangle|trigonometry/i.test(t),
  },

  // ── higher_math ──
  {
    slug: "hm-parabola-y-x2",
    from: path.join(REMAINING, "higher_math", "001_parabola_y_equals_x_square.svg"),
    match: (t) => /y\s*=\s*x\^2|y\s*=\s*x²|parabola|পরাবৃত্ত/i.test(t),
  },
  {
    slug: "hm-resultant-5n-7n-60",
    from: path.join(REMAINING, "higher_math", "002_resultant_5N_7N_60deg.svg"),
    match: (t) => /5\s*N.*7\s*N|৫\s*নিউটন.*৭\s*নিউটন|60\s*°|৬০\s*°/i.test(t),
  },
  {
    slug: "hm-resultant-6n-8n-90",
    from: path.join(REMAINING, "higher_math", "003_resultant_6N_8N_90deg.svg"),
    match: (t) => /6\s*N.*8\s*N|৬\s*নিউটন.*৮\s*নিউটন|90\s*°|৯০\s*°/i.test(t),
  },
  {
    slug: "hm-complex-locus",
    from: path.join(REMAINING, "higher_math", "004_complex_locus_mod_z_minus_1_equals_2.svg"),
    match: (t) => /\|z\s*[-−]\s*1\||mod\s*\(\s*z|জটিল.*স্থান/i.test(t),
  },
  {
    slug: "hm-straight-line-slope",
    from: path.join(REMAINING, "higher_math", "005_straight_line_slope.svg"),
    match: (t) => /straight\s*line|সরলরেখা.*ঢাল|slope|gradient/i.test(t),
  },
];

// Default matchers for assets without explicit match
const DEFAULT_MATCHERS = {
  "cell-terminal-pd": (t) =>
    /প্রান্তীয়\s*বিভব|terminal\s*pd|কোষ.*বিভব|EMF|electromotive/i.test(t),
  "young-double-slit-1": (t) => /young|ইয়ং|দ্বি-স্লিট|double\s*slit|আলোক\s*সংযোগ/i.test(t),
};

function defaultMatch(slug, text) {
  const fn = DEFAULT_MATCHERS[slug];
  return fn ? fn(text) : false;
}

function resolveSlug(text, opts) {
  for (const a of ASSETS) {
    const matcher = a.match ?? ((t) => defaultMatch(a.slug, t));
    if (matcher(text, opts)) return a.slug;
  }
  return null;
}

function resolveOptionSlug(optionText, questionText) {
  const m = optionText.trim().match(/^\[?\s*লেখচিত্র\s*([১২৩৪1-4]|ঘ)\s*\]?$/i);
  if (!m) return null;
  const idx = { "১": 1, "২": 2, "৩": 3, "৪": 4, "1": 1, "2": 2, "3": 3, "4": 4, ঘ: 4 }[
    m[1]
  ];
  if (/young|ইয়ং|দ্বি-স্লিট|double\s*slit/i.test(questionText) && idx) {
    return `young-double-slit-${idx}`;
  }
  return null;
}

function collectQuestions(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.questions)) return data.questions;
  return null;
}

function copyAssets(stats) {
  fs.mkdirSync(DEST, { recursive: true });
  for (const a of ASSETS) {
    if (!fs.existsSync(a.from)) {
      stats.missingSource++;
      console.warn("Missing source:", a.from);
      continue;
    }
    const dest = path.join(DEST, `${a.slug}.svg`);
    fs.copyFileSync(a.from, dest);
    stats.copied++;
  }
}

function attachToQuestions(stats) {
  /** High-confidence matchers — attach even without generic visual keywords */
  const FORCE_ATTACH = [
    (t) => /দূরের\s*বস্তু\s*দেখতে\s*পায়\s*না|myopia|ক্ষীন\s*দৃষ্টি/i.test(t),
    (t) => /ট্রান্সফরমার|transformer/i.test(t),
    (t) => /AB\s*=\s*200|MN\s*=\s*NH|স্থির\s*তরঙ্গ/i.test(t),
  ];

  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    const dir = path.join(QUESTIONS_DIR, subject);
    if (!fs.statSync(dir).isDirectory()) continue;

    const walk = (folder) => {
      for (const ent of fs.readdirSync(folder, { withFileTypes: true })) {
        const p = path.join(folder, ent.name);
        if (ent.isDirectory()) {
          walk(p);
          continue;
        }
        if (!ent.name.endsWith(".json") || ent.name === "index.json") continue;

        const data = JSON.parse(fs.readFileSync(p, "utf8"));
        const list = collectQuestions(data);
        if (!list) continue;

        let changed = false;
        for (const q of list) {
          const text = String(q.text || q.questionText || q.question || "");
          const needsVisual =
            NEED_VISUAL.test(text) || FORCE_ATTACH.some((fn) => fn(text));
          if (!needsVisual) continue;

          const slug = resolveSlug(text);
          if (slug) {
            const image = `/images/quiz/${slug}.svg`;
            if (q.image !== image) {
              q.image = image;
              stats.stemAttached++;
              changed = true;
            }
          }

          const opts = Array.isArray(q.options)
            ? q.options.map((o) => (typeof o === "string" ? o : o?.text ?? ""))
            : [q.optionA, q.optionB, q.optionC, q.optionD].map(String);

          const optionSlugs = opts.map((o) => resolveOptionSlug(o, text)).filter(Boolean);
          if (optionSlugs.length === 4) {
            const paths = optionSlugs.map((s) => `/images/quiz/${s}.svg`);
            const same =
              Array.isArray(q.optionImages) &&
              q.optionImages.length === 4 &&
              q.optionImages.every((v, i) => v === paths[i]);
            if (!same) {
              q.optionImages = paths;
              stats.optionAttached++;
              changed = true;
            }
          }
        }

        if (changed) {
          fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, "utf8");
          stats.filesUpdated++;
        }
      }
    };

    walk(dir);
  }
}

function main() {
  const stats = { copied: 0, missingSource: 0, stemAttached: 0, optionAttached: 0, filesUpdated: 0 };
  console.log("Copying user SVG pack → public/images/quiz/ ...");
  copyAssets(stats);
  console.log(`Copied ${stats.copied} SVGs (${stats.missingSource} missing).`);

  console.log("Attaching to matching questions ...");
  attachToQuestions(stats);
  console.log(JSON.stringify(stats, null, 2));
  console.log("Done.");
}

main();
