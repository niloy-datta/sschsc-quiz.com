/**
 * 🎯 BANAO — Premium Animated SVG Generator
 * ===========================================
 * Creates AI-ready prompts that produce premium SVGs with:
 *   ✦ CSS @keyframes animations (pulse, flow, rotate, breathe)
 *   ✦ feGaussianBlur neon glow effects
 *   ✦ LinearGradients for premium dark-theme styling
 *   ✦ Auto-connect to codebase (save → attach → update JSON)
 *
 * Usage:
 *   node scripts/banao-svg-generator.js                         # Export prompts for ALL missing diagrams
 *   node scripts/banao-svg-generator.js --subject physics       # Filter by subject
 *   node scripts/banao-svg-generator.js --import <svg-dir>      # Import AI-generated SVGs → attach to questions
 *   node scripts/banao-svg-generator.js --upgrade               # Upgrade ALL existing premium SVGs with animations
 *   node scripts/banao-svg-generator.js --upgrade --slug bio-nephron  # Upgrade a single SVG
 *
 * Output:
 *   data/banao-prompts.json    — Structured prompts for AI
 *   data/banao-prompts.txt     — Copy-paste prompts for AI
 *   data/banao-upgrade.json    — Upgrade prompts for existing SVGs
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const QUIZ_IMG = path.join(ROOT, "public", "images", "quiz");
const PREMIUM_DIR = path.join(QUIZ_IMG, "premium");
const OUT_JSON = path.join(ROOT, "data", "banao-prompts.json");
const OUT_TXT = path.join(ROOT, "data", "banao-prompts.txt");
const UPGRADE_JSON = path.join(ROOT, "data", "banao-upgrade.json");
const UPGRADE_TXT = path.join(ROOT, "data", "banao-upgrade.txt");

const SUBJECT_FILTER = (() => {
  const i = process.argv.indexOf("--subject");
  return i >= 0 ? process.argv[i + 1] : null;
})();

const IMPORT_MODE = (() => {
  const i = process.argv.indexOf("--import");
  return i >= 0 ? process.argv[i + 1] : null;
})();

const UPGRADE_MODE = process.argv.includes("--upgrade");
const UPGRADE_SLUG = (() => {
  const i = process.argv.indexOf("--slug");
  return i >= 0 ? process.argv[i + 1] : null;
})();

// =====================================================================
// 🎨 BANAO PREMIUM STYLE SYSTEM
// =====================================================================

const BANAO_BASE_STYLE = `
┌─────────────────────────────────────────────────────────────┐
│                    🎯 BANAO PREMIUM SVG                     │
│              CSS Animations + Glow + Gradients              │
└─────────────────────────────────────────────────────────────┘

🎨 COLOR PALETTE (Dark Theme — Premium Neon):
  • Background: #0f172a → #1e1b4b (gradient)
  • Card BG: #1e293b with #334155 border
  • Primary accent: #22d3ee (cyan) — main lines, glows
  • Secondary accent: #f472b6 (pink) — highlights, markers
  • Success accent: #34d399 (emerald) — positive elements
  • Warning accent: #fb923c (orange) — warnings, arrows
  • Text primary: #e2e8f0 (light) — labels
  • Text secondary: #94a3b8 (gray) — subtitles
  • Text muted: #64748b (dim) — axis labels

✨ STANDARD <defs> BLOCK (INCLUDE IN EVERY SVG):
  <defs>
    <!-- Background gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#13113a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>

    <!-- Card gradient -->
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>

    <!-- Primary glow (cyan) -->
    <filter id="glowCyan" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
      <feFlood flood-color="#22d3ee" flood-opacity="0.45" result="glowColor"/>
      <feComposite in="glowColor" in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Secondary glow (pink) -->
    <filter id="glowPink" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
      <feFlood flood-color="#f472b6" flood-opacity="0.45" result="glowColor"/>
      <feComposite in="glowColor" in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Success glow (emerald) -->
    <filter id="glowEmerald" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
      <feFlood flood-color="#34d399" flood-opacity="0.45" result="glowColor"/>
      <feComposite in="glowColor" in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Strong glow for emphasis -->
    <filter id="glowStrong" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur"/>
      <feFlood flood-color="#22d3ee" flood-opacity="0.6" result="glowColor"/>
      <feComposite in="glowColor" in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Arrow marker -->
    <marker id="arrowCyan" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#22d3ee"/>
    </marker>
    <marker id="arrowGray" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8"/>
    </marker>
  </defs>

🎬 ANIMATION RULES (CSS @keyframes — EMBED INSIDE <style>):
  Add this <style> block inside <svg>:

  <style>
    @keyframes pulse-glow {
      0%, 100% { opacity: 0.6; filter: url(#glowCyan); }
      50% { opacity: 1; filter: url(#glowStrong); }
    }
    @keyframes pulse-pink {
      0%, 100% { opacity: 0.6; filter: url(#glowPink); }
      50% { opacity: 1; }
    }
    @keyframes flow-right {
      0% { stroke-dashoffset: 20; }
      100% { stroke-dashoffset: 0; }
    }
    @keyframes beat {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }
    @keyframes spin-slow {
      0% { transform: rotate(0deg); transform-origin: center; }
      100% { transform: rotate(360deg); transform-origin: center; }
    }
    @keyframes breathe {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }
    @keyframes dash-move {
      0% { stroke-dashoffset: 100; }
      100% { stroke-dashoffset: 0; }
    }
    @keyframes fade-in-up {
      0% { opacity: 0; transform: translateY(8px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    .anim-pulse { animation: pulse-glow 2.5s ease-in-out infinite; }
    .anim-pulse-fast { animation: pulse-glow 1.5s ease-in-out infinite; }
    .anim-flow { stroke-dasharray: 6 4; animation: flow-right 1s linear infinite; }
    .anim-beat { animation: beat 1.2s ease-in-out infinite; transform-origin: center; }
    .anim-spin { animation: spin-slow 8s linear infinite; }
    .anim-breathe { animation: breathe 3s ease-in-out infinite; }
    .anim-dash { stroke-dasharray: 100; animation: dash-move 2s ease-out forwards; }
    .anim-fade { animation: fade-in-up 0.6s ease-out forwards; opacity: 0; }
    .anim-delay-1 { animation-delay: 0.2s; }
    .anim-delay-2 { animation-delay: 0.4s; }
    .anim-delay-3 { animation-delay: 0.6s; }
  </style>

📐 LAYOUT:
  • viewBox="0 0 900 520" (wider canvas for detailed diagrams)
  • Background rect with rx="16" fill="url(#bgGrad)"
  • Inner card area for the diagram with subtle border
  • Footer text at bottom for Bengali caption

📦 OUTPUT FORMAT:
  Return valid SVG markup ONLY (no markdown fences, no extra text).
  The SVG will be saved to: {{SAVE_PATH}}
  JSON field to update: "image": "{{SAVE_PATH}}"
`;

const DIAGRAM_ANIMATIONS = {
  // =================================================================
  // 🔬 BIOLOGY — animated cells, flowing blood, beating heart
  // =================================================================
  biology: `
DIAGRAM TYPE: biology (NCTB SSC/HSC level)

SPECIFIC REQUIREMENTS:
- Draw the exact biological structure mentioned (nephron, cell, DNA, neuron, eye, heart, etc.)
- Every label must match the question's Bengali/English terms
- High accuracy for board exam standards

🎬 TYPE-SPECIFIC ANIMATIONS:
  • Nephron: Animate blood flow in afferent/efferent arterioles (dashed animated lines)
    → Apply .anim-flow class on blood vessels
    → Apply .anim-pulse on glomerulus (Bowman's capsule)
    → PCT/DCT: .anim-breathe on tubule sections
    → Collecting duct: .anim-flow downward

  • Heart: Animate beating heart
    → Apply .anim-beat on the heart outline
    → .anim-flow on major vessels (aorta, vena cava)
    → .anim-pulse on SA/AV node areas

  • Neuron: Animate signal transmission
    → .anim-flow along axon (myelinated segments)
    → .anim-pulse at synapse (neurotransmitter release)
    → .anim-pulse-fast at dendrites

  • DNA/RNA: Animate helix rotation
    → .anim-spin on the double helix
    → .anim-pulse on base pairs
    → Colored segments: A=T (red/pink), G≡C (blue/cyan), U (green)

  • Cell division (mitosis/meiosis):
    → .anim-pulse on chromosomes during metaphase
    → .anim-flow on spindle fibers
    → Stage labels with .anim-fade

  • Eye (cross-section):
    → .anim-breathe on iris/pupil
    → .anim-flow on optic nerve
    → .anim-pulse on retina (light-sensitive area)

  • Plant tissues (xylem/phloem, stomata, leaf):
    → .anim-flow upward in xylem, downward in phloem
    → .anim-breathe on guard cells (stomata opening/closing)
    → .anim-pulse on chloroplasts

  • Generic biology:
    → Apply .anim-breathe on the main structure
    → .anim-fade on labels (staggered with delays)
    → Use glow for key functional areas
`,

  // =================================================================
  // ⚡ PHYSICS — graphs, circuits, waves, optics
  // =================================================================
  physics_graph: `
DIAGRAM TYPE: physics_graph (SSC/HSC level)

SPECIFIC REQUIREMENTS:
- Draw labelled XY axes with units from the question
- Plot exact curve shape: linear, exponential, sinusoidal, PV loop, etc.
- Mark key points: O, intercepts, maxima, minima, data points
- Bengali notation where applicable

🎬 TYPE-SPECIFIC ANIMATIONS:
  • Graph curve: .anim-dash class to animate the curve drawing
  • Data points: .anim-pulse on marked points (O, A, B, C)
  • Animated tangent/slope lines at key points
  • Axis labels: .anim-fade with delays
  • Moving point along curve for V-I / I-V characteristics
  • PV cycle: animated cycle direction arrow
  • SHM: animated oscillating point along sine curve
  • Wave graphs: animated propagation direction
`,

  // =================================================================
  // 🔌 CIRCUITS — animated current flow, glowing components
  // =================================================================
  circuit: `
DIAGRAM TYPE: circuit (SSC/HSC level)

SPECIFIC REQUIREMENTS:
- Standard circuit symbols: cell/battery, resistors, ammeter, voltmeter
- Series/parallel layout as described
- Label R₁, R₂, V, A, battery terminals

🎬 TYPE-SPECIFIC ANIMATIONS:
  • Current flow: .anim-flow on wires (animated dashed lines)
  • Battery: .anim-pulse on + terminal (bright), - terminal (dim)
  • Resistors: .anim-breathe on resistor symbols with heat glow
  • Bulbs/LEDs: .anim-pulse-fast on glowing elements (warm yellow)
  • Ammeter/Voltmeter: .anim-pulse on meter display
  • Direction arrows showing current path
  • Branch points (junction): .anim-pulse
  • Switch: animated open/close if relevant
`,

  // =================================================================
  // 🌊 WAVES — animated propagation, crest/trough movement
  // =================================================================
  wave: `
DIAGRAM TYPE: wave (SSC/HSC level)

SPECIFIC REQUIREMENTS:
- Transverse or longitudinal as per question
- Label λ (wavelength), A (amplitude), crest, trough, equilibrium
- Match wave type: sound, light, string, water

🎬 TYPE-SPECIFIC ANIMATIONS:
  • Wave propagation: animated wave movement (translate the waveform)
  • Crest and trough markers: .anim-pulse on crest, .anim-pulse-pink on trough
  • Wavelength arrow (λ): .anim-breathe on the measurement arrow
  • Amplitude line: .anim-pulse-fast
  • Standing wave: animated node/antinode oscillation
  • Phase difference: animated phase markers
  • Doppler effect: animated wavefront compression/expansion
`,

  // =================================================================
  // 📐 MATH / GEOMETRY — animated constructions, measurements
  // =================================================================
  math_geometry: `
DIAGRAM TYPE: math_geometry (SSC/HSC level)

SPECIFIC REQUIREMENTS:
- Exact shapes: circle, triangle, trapezium, coordinate plane, parabola
- Label ALL points (A, B, C, O, P, Q) exactly as in question
- Show measurements, angles, right-angle marks, medians, altitudes

🎬 TYPE-SPECIFIC ANIMATIONS:
  • Shapes drawn with .anim-dash (animate the path drawing)
  • Points: .anim-pulse on labeled points
  • Right-angle marks: .anim-pulse on the □ symbol
  • Angle arcs: .anim-breathe on angle markers
  • Dimensional arrows: .anim-flow on measurement lines
  • Coordinate grid: subtle grid animation
  • Parabola/curve: .anim-dash
  • Circle: .anim-spin-slow on the circumference
  • Tangent lines: .anim-flow
`,

  // =================================================================
  // 🥽 OPTICS — animated ray diagrams
  // =================================================================
  optics: `
DIAGRAM TYPE: optics (lens/mirror)

SPECIFIC REQUIREMENTS:
- Principal axis with focal points F, F', center C, optical center O
- Object and image arrows (correct real/virtual orientation)
- Concave/convex mirror or lens from question text

🎬 TYPE-SPECIFIC ANIMATIONS:
  • Light rays: .anim-flow on incident and reflected/refracted rays
  • Focal points: .anim-pulse on F and F'
  • Object arrow: .anim-breathe
  • Image arrow: .anim-pulse (real image) or .anim-breathe (virtual, dashed)
  • Principal axis: subtle glow on the axis line
  • Lens/mirror symbol: .anim-pulse
  • Ray arrows: animated arrowheads
`,

  // =================================================================
  // ➡️ VECTORS — animated force diagrams
  // =================================================================
  vector: `
DIAGRAM TYPE: vector / free-body diagram

SPECIFIC REQUIREMENTS:
- Object/point mass clearly shown at origin
- All force/velocity/displacement vectors with arrowheads
- Labels: F, mg, N, T, f, a, v as in question

🎬 TYPE-SPECIFIC ANIMATIONS:
  • Force vectors: .anim-flow along each vector (from tail to head)
  • Object: .anim-pulse on the central mass/point
  • Vector labels: .anim-fade with staggered delays
  • Angle arcs between vectors: .anim-breathe
  • Resultant vector (if shown): .anim-pulse-fast (double thickness + glow)
  • Component vectors: dashed with .anim-flow
`,

  // =================================================================
  // 🧪 CHEMISTRY — animated reactions, molecular structures
  // =================================================================
  chemistry: `
DIAGRAM TYPE: chemistry (SSC/HSC level)

SPECIFIC REQUIREMENTS:
- Molecular structures, reaction diagrams, titration setups
- Labels in Bengali/English as per question
- Show bonds, atoms, functional groups clearly

🎬 TYPE-SPECIFIC ANIMATIONS:
  • Chemical bonds: .anim-flow along single/double bonds
  • Atoms: .anim-pulse on key atoms (C, H, O, N etc.)
  • Reaction arrows: .anim-flow (animated → direction)
  • Functional groups: .anim-breathe on highlighted groups
  • Electrolytic cell: .anim-flow on ion movement
  • Titration: animated drop falling, color change indicator
  • Periodic trends: animated gradient along periods/groups
`,

  // =================================================================
  // 📊 GRAPH MCQ OPTIONS — reference stimulus + note
  // =================================================================
  graph_mcq_options: `
DIAGRAM TYPE: graph_mcq (reference stimulus)

NOTE: Options are graph choices (লেখচিত্র ১–৪ / চিত্র ক–ঘ). 
This prompt generates the REFERENCE/STIMULUS graph only.

🎬 ANIMATIONS:
  • Same as physics_graph for the stem/reference
  • Add a note that option SVGs will be generated separately
`,

  // =================================================================
  // 🎯 GENERAL / UD DEPOK — any stimulus diagram
  // =================================================================
  general: `
DIAGRAM TYPE: general_stimulus

SPECIFIC REQUIREMENTS:
- Draw EXACTLY what the question stimulus describes
- Every entity in the stem must appear and be labelled
- Match Bengali terms where applicable

🎬 TYPE-SPECIFIC ANIMATIONS:
  • Main subject: .anim-breathe or .anim-pulse
  • Supporting elements: .anim-fade with staggered delays
  • Labels: .anim-fade-in-up
  • Structure boundaries: subtle .anim-flow borders
  • Active/important areas: .anim-pulse highlight
`,
};

// =====================================================================
// 🔍 DETECTION LOGIC
// =====================================================================

const VISUAL_STEM_RE =
  /\[চিত্র\s*[:：]|\(চিত্র\s*[:：]|চিত্রে|উদ্দীপক|চিত্রভিত্তিক|লেখচিত্র|গ্রাফ|diagram|circuit|বৃত্ত|triangle|ত্রিভুজ|vector|ভেক্টর|সমন্বয়|অক্ষ|wave|তরঙ্গ|force|বল\s*চিত্র|V-I|I-V|E-ν|স্থানাঙ্ক|coordinate|parabola|x²|y\s*=|বর্তনী|resistor|লেন্স|দর্পণ|mirror|lens|নিচের\s*চিত্র|প্রশ্নের\s*চিত্র|চিত্রটি|পরিবাহী|গোলক|রোধ/i;

const LEKHOCHITRA_OPT = /^\[?\s*লেখচিত্র\s*[১২৩৪1-4]|^ঘ\s*\]?$/i;
const CHITRA_OPT = /^চিত্র\s*[কখগঘ]/i;

function collectQuestions(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.questions)) return data.questions;
  const out = [];
  for (const v of Object.values(data || {})) {
    if (!Array.isArray(v)) continue;
    for (const item of v) {
      if (item?.questions) out.push(...item.questions);
      else out.push(item);
    }
  }
  return out;
}

function questionText(q) {
  return String(q.text ?? q.questionText ?? q.question ?? "").trim();
}

function getOptions(q) {
  if (Array.isArray(q.options))
    return q.options.map((o) => (typeof o === "string" ? o : o?.text ?? "")).map(String);
  return [q.optionA, q.optionB, q.optionC, q.optionD].map((o) => String(o ?? "").trim());
}

function needsDiagram(text, q) {
  if (/\[চিত্র\s*[:：]|\(চিত্র\s*[:：]|চিত্রভিত্তিক|উপরের\s*চিত্র|নিচের\s*চিত্র|প্রশ্নের\s*চিত্র|diagram\s*required/i.test(text))
    return true;
  if (/উদ্দীপক/i.test(text) && /চিত্র|লেখচিত্র|diagram|AB\s*=|MN\s*=|গোলক|পরিবাহ|দর্পণ|লেন্স|তরঙ্গ|বর্তনী|লেখ/i.test(text))
    return true;
  if (/^[\s\S]*চিত্রে[\s\S]{0,120}(?:নিচের|কোনটি|সঠিক|কত|কী)/i.test(text)) return true;
  const opts = getOptions(q);
  if (opts.some((o) => LEKHOCHITRA_OPT.test(o) || CHITRA_OPT.test(o))) return true;
  if (/(?:^|\s)চিত্র\s*[কখগঘ](?:\s|$)/i.test(text)) return true;
  if (/\(চিত্র\s*[:：][^)]+\)/i.test(text)) return true;
  return false;
}

function detectType(text, q) {
  const t = text;
  if (/নেফ্রন|কোষ\s*বিভাজন|cell|DNA|RNA|জাইলেম|ফ্লোয়েম|নিউরন|চক্ষু|হৃৎপিণ্ড|হৃদযন্ত্র|heart|মস্তিষ্ক|brain|ত্বক|skin|প্লাজমিড|স্টোমাটা|stomata|মাইটোকন্ড্রিয়া|mitochondria|গলজি|golgi|ব্যাকটেরিও|bacteriophage|স্পোরাঞ্জি|sporangium|ফার্ন|prothallus|ভাস্কুলার|vascular|parenchyma|প্যারেনকাইমা|biology|উদ্ভিদ|প্রাণী/i.test(t) && !/লেন্স|দর্পণ|circuit|বর্তনী/i.test(t))
    return "biology";
  if (/লেন্স|দর্পণ|mirror|lens|প্রতিবিম্ব|F'|C'|অবতল|উত্তল|প্রধান\s*অক্ষ|বিবর্ধন|রশ্মি|ray/i.test(t))
    return "optics";
  if (/V-I|I-V|লেখচিত্র|graph|গ্রাফ|photon|ফোটন|অর্ধায়ু|half.?life|তাপীয়\s*বক্র|heating\s*curve|P-V|p-v|সরল\s*ছন্দ|SHM|simple\s*harmonic|স্থির\s*চাপ|তড়িৎ\s*প্রাবল্য|electric\s*field|চাপ.*গভীরতা|pressure.*depth|বিক্রিয়ক|reaction\s*rate/i.test(t))
    return "physics_graph";
  if (/বর্তনী|circuit|resistor|রোধ|R₁|R₂|R_?1|R_?2|অ্যামিটার|ammeter|voltmeter|ভোল্টমিটার|ব্যাটারি|battery|তড়িৎ|current|জাংশন|junction|Kirchhoff|কারশফ|ট্রান্সফরমার|transformer|npn|pnp|p-n-p|ট্রানজিস্টর|diode|ডায়োড/i.test(t))
    return "circuit";
  if (/vector|ভেক্টর|FBD|free\s*body|বল\s*চিত্র|force|সমান\s*বল|lift|ভর|weight|টান|tension|ঘর্ষণ|friction|নতি|inclined/i.test(t))
    return "vector";
  if (/তরঙ্গ|wave|কম্পাঙ্ক|frequency|চূড়া|crest|পাদ|trough|তরঙ্গদৈর্ঘ্য|wavelength|আয়তন|amplitude|প্রসার|অপবর্তন|diffraction|Fresnel|সুর|pitch/i.test(t))
    return "wave";
  if (/বৃত্ত|circle|triangle|ত্রিভুজ|∠|angle|স্থানাঙ্ক|coordinate|x²|y\s*=|parabola|প্যারাবোলা|trapezoid|ট্রাপিজ|জ্যামিতি|geometry|∆|△|ABC|কেন্দ্র\s*O|মধ্যমা|median|লম্ব|altitude|orthocenter|সমকোণ|right\s*angle|ত্রিকোণ|trig/i.test(t))
    return "math_geometry";
  if (/রাসায়নিক|chemical|অণু|molecule|পরমাণু|atom|বন্ধন|bond|অম্ল|acid|ক্ষার|base|লবণ|salt|জারণ|oxidation|বিজারণ|reduction|দ্রবণ|solution|টাইট্রেশন|titration|pH|ইলেকট্রন|electron|প্রোটন|proton|নিউট্রন|neutron|পর্যায়|periodic|গ্রুপ|group|কার্বন|carbon|হাইড্রোকার্বন|hydrocarbon|অ্যালকোহল|alcohol|কিটোন|ketone|অ্যালডিহাইড|aldehyde|কার্বক্সিলিক|carboxylic|এস্টার|ester|আইসোমার|isomer/i.test(t))
    return "chemistry";
  const opts = getOptions(q);
  if (opts.some((o) => LEKHOCHITRA_OPT.test(o.trim()) || CHITRA_OPT.test(o.trim())))
    return "graph_mcq_options";
  if (/উদ্দীপক|চিত্রে|চিত্র|diagram/i.test(t))
    return "general";
  return "general";
}

function extractChitraHint(text) {
  const b = text.match(/\[চিত্র\s*[:：]\s*([^\]]+)\]/i);
  if (b) return b[1].trim();
  const p = text.match(/\(\s*চিত্র\s*[:：]\s*([^)]+)\s*\)/i);
  if (p) return p[1].trim();
  return null;
}

function detectMissingSvg(q) {
  const img = String(q.image ?? q.svg ?? "").trim();
  if (!img) return { missing: true, reason: "no_image" };
  const disk = path.join(ROOT, "public", img.replace(/^\//, ""));
  if (!fs.existsSync(disk)) return { missing: true, reason: "file_missing", image: img };
  if (/\/generated\//i.test(img)) return { missing: true, reason: "placeholder", image: img };
  return { missing: false, image: img };
}

// =====================================================================
// 🎯 BANAO PROMPT BUILDER
// =====================================================================

function buildBanaoPrompt(entry) {
  const typeAnim = DIAGRAM_ANIMATIONS[entry.diagram_type] || DIAGRAM_ANIMATIONS.general;
  const savePath = `/images/quiz/premium/${entry.question_id.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 120)}.svg`;

  const optsList = entry.options?.length
    ? entry.options.map((o, i) => `${["ক", "খ", "গ", "ঘ"][i]}. ${o}`).join("\n")
    : "";

  const hintSection = entry.chitra_hint
    ? `\n📌 EXPLICIT DIAGRAM HINT: ${entry.chitra_hint}`
    : "";

  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 BANAO — PREMIUM ANIMATED SVG GENERATION PROMPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 QUESTION ID: ${entry.question_id}
📂 FILE: ${entry.file}
🔬 TYPE: ${entry.diagram_type}
📌 STATUS: ${entry.status}
📎 SAVE AS: ${savePath}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 QUESTION TEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${entry.question_full}${hintSection}

${optsList ? `\nঅপশনসমূহ:\n${optsList}\n` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 STYLE SPECIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${BANAO_BASE_STYLE}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 ANIMATION & DIAGRAM SPECIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${typeAnim}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 AUTO-CONNECT INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
After generating the SVG:

1. SAVE the SVG file to: public${savePath}
   (create directories if needed)

2. UPDATE the question JSON field:
   "image": "${savePath}"

3. The app will automatically display this diagram
   via QuizDiagram → QuizQuestionStem components.

4. To batch-import all SVGs later, run:
   node scripts/banao-svg-generator.js --import <svg-dir>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
END PROMPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// =====================================================================
// 🚀 UPGRADE PROMPT — enhance existing premium SVGs with animations
// =====================================================================

function buildUpgradePrompt(svgPath, questionText, questionId) {
  const svgContent = fs.readFileSync(svgPath, "utf8");
  // Check if it already has animations
  const hasAnimations = svgContent.includes("@keyframes") || svgContent.includes("anim-");

  const upgradeType = hasAnimations
    ? "UPGRADE (has basic animations — enhance them)"
    : "FRESH (no animations — add full animation system)";

  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 BANAO — SVG ANIMATION UPGRADE PROMPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 SVG FILE: ${svgPath}
📋 SVG ID: ${path.basename(svgPath, ".svg")}
🔧 UPGRADE TYPE: ${upgradeType}
📝 QUESTION: ${(questionText || "").slice(0, 200)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Add the following to the EXISTING SVG at ${svgPath}:

1️⃣ ADD <style> BLOCK with these animations:
  <style>
    @keyframes pulse-glow {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    @keyframes flow-right {
      0% { stroke-dashoffset: 20; }
      100% { stroke-dashoffset: 0; }
    }
    @keyframes breathe {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }
    @keyframes fade-in-up {
      0% { opacity: 0; transform: translateY(8px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .anim-pulse { animation: pulse-glow 2.5s ease-in-out infinite; }
    .anim-flow { stroke-dasharray: 6 4; animation: flow-right 1s linear infinite; }
    .anim-breathe { animation: breathe 3s ease-in-out infinite; }
    .anim-fade { animation: fade-in-up 0.6s ease-out forwards; opacity: 0; }
  </style>

2️⃣ UPGRADE <defs> with enhanced glow filters:
  <filter id="glow" ...> → replace with feGaussianBlur-based glow
  Add feDropShadow or feGaussianBlur for neon effect

3️⃣ UPGRADE <linearGradient> backgrounds:
  Add rich dark gradients (bgGrad, cardGrad) if not present

4️⃣ ADD animation classes to key elements:
  • Main structural elements → .anim-breathe or .anim-pulse
  • Flowing elements (wires, tubes, rays) → .anim-flow
  • Important labels → .anim-fade

5️⃣ KEEP existing content INTACT — don't remove any labels or shapes.
   Only ADD the animation system and upgrade visual quality.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 CURRENT SVG CONTENT (reference):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${svgContent.slice(0, 1500)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
END UPGRADE PROMPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// =====================================================================
// 📂 FILE SCANNING
// =====================================================================

function walkDir(dir, relPrefix, entries) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(p, relPrefix, entries);
    else if (ent.name.endsWith(".json") && ent.name !== "index.json") {
      const relFile = path.relative(QUESTIONS_DIR, p).replace(/\\/g, "/");
      if (SUBJECT_FILTER && !relFile.startsWith(`${SUBJECT_FILTER}/`)) continue;

      let data;
      try { data = JSON.parse(fs.readFileSync(p, "utf8")); }
      catch { continue; }

      for (const q of collectQuestions(data)) {
        const text = questionText(q);
        if (!needsDiagram(text, q)) continue;

        const id = String(q.id ?? `${ent.name}-${Math.random().toString(36).slice(2, 8)}`);
        const type = detectType(text, q);
        const status = detectMissingSvg(q);

        entries.push({
          question_id: id,
          file: relFile,
          diagram_type: type,
          status: status.missing ? "svg_missing" : status.reason || "svg_exists",
          current_image: status.image || null,
          question_full: text.slice(0, 600),
          chitra_hint: extractChitraHint(text),
          options: getOptions(q).filter(Boolean),
        });
      }
    }
  }
}

// =====================================================================
// 🚀 IMPORT MODE — attach AI-generated SVGs to questions
// =====================================================================

function importSvgs(svgDir) {
  console.log(`\n📦 BANAO IMPORT MODE`);
  console.log(`   Scanning: ${svgDir}`);
  console.log("");

  if (!fs.existsSync(svgDir)) {
    console.error(`   ❌ Directory not found: ${svgDir}`);
    process.exit(1);
  }

  // Build question index
  const qIndex = new Map();
  function buildIndex(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) buildIndex(p);
      else if (ent.name.endsWith(".json") && ent.name !== "index.json") {
        let data;
        try { data = JSON.parse(fs.readFileSync(p, "utf8")); }
        catch { continue; }
        for (const q of collectQuestions(data)) {
          const id = String(q.id ?? "");
          if (!qIndex.has(id)) qIndex.set(id, []);
          qIndex.get(id).push({ q, data, file: p });
        }
      }
    }
  }
  buildIndex(QUESTIONS_DIR);

  // Scan SVG files in import directory
  const svgFiles = fs.readdirSync(svgDir).filter(f => f.endsWith(".svg"));
  let imported = 0;
  let attached = 0;
  let errors = 0;

  const filesToSave = new Map();

  for (const svgFile of svgFiles) {
    const questionId = path.basename(svgFile, ".svg");
    const svgPath = path.join(svgDir, svgFile);
    const destPath = path.join(PREMIUM_DIR, svgFile);

    try {
      // Copy SVG to premium dir
      fs.mkdirSync(PREMIUM_DIR, { recursive: true });
      fs.copyFileSync(svgPath, destPath);
      imported++;

      // Attach to questions
      const metas = qIndex.get(questionId) || [];
      const imagePath = `/images/quiz/premium/${svgFile}`;

      for (const meta of metas) {
        meta.q.image = imagePath;
        filesToSave.set(meta.file, meta.data);
        attached++;
      }
    } catch (e) {
      console.error(`   ❌ Error importing ${svgFile}: ${e.message}`);
      errors++;
    }
  }

  // Save updated JSON files
  for (const [file, data] of filesToSave) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
  }

  console.log(`   ✅ Imported: ${imported} SVGs → ${PREMIUM_DIR}`);
  console.log(`   ✅ Attached: ${attached} questions updated in ${filesToSave.size} files`);
  if (errors > 0) console.log(`   ❌ Errors: ${errors}`);
  console.log("");
}

// =====================================================================
// 🚀 UPGRADE MODE — add animations to existing premium SVGs
// =====================================================================

function upgradeExistingSvgs() {
  console.log(`\n🎬 BANAO UPGRADE MODE`);
  console.log(`   Adding animations to existing premium SVGs...`);
  console.log("");

  const svgDir = PREMIUM_DIR;
  if (!fs.existsSync(svgDir)) {
    console.log(`   No premium SVGs directory found.`);
    return;
  }

  const allFiles = fs.readdirSync(svgDir).filter(f => f.endsWith(".svg"));

  // Filter by slug if --slug flag provided
  const files = UPGRADE_SLUG
    ? allFiles.filter(f => f.includes(UPGRADE_SLUG))
    : allFiles;

  if (UPGRADE_SLUG && files.length === 0) {
    console.log(`   No SVGs found matching slug: ${UPGRADE_SLUG}`);
    console.log(`   Available example slugs:`);
    allFiles.slice(0, 10).forEach(f => console.log(`     • ${path.basename(f, ".svg")}`));
    return;
  }

  console.log(`   Found ${files.length} SVGs to upgrade`);

  const entries = [];
  for (const file of files.slice(0, UPGRADE_SLUG ? 1 : 500)) {
    const svgPath = path.join(svgDir, file);
    const questionId = path.basename(file, ".svg");
    entries.push({
      question_id: questionId,
      svg_path: svgPath,
      prompt: buildUpgradePrompt(svgPath, "", questionId),
    });
  }

  // Write upgrade prompts
  const txtParts = [
    `# 🎯 BANAO SVG UPGRADE PROMPTS`,
    `# Generated: ${new Date().toISOString()}`,
    `# Total SVGs to upgrade: ${entries.length}`,
    `# Filter: ${UPGRADE_SLUG ? `slug=${UPGRADE_SLUG}` : "all premium SVGs"}`,
    ``,
    `# INSTRUCTIONS:`,
    `# 1. Copy each block below → paste to AI`,
    `# 2. AI returns upgraded SVG with animations`,
    `# 3. Save the SVG back to the same path`,
    `# 4. Run refresh to verify`,
    ``,
  ];

  for (let i = 0; i < entries.length; i++) {
    txtParts.push(`═`.repeat(80));
    txtParts.push(`# ${i + 1}/${entries.length}  |  ${entries[i].question_id}`);
    txtParts.push(`# FILE: ${entries[i].svg_path}`);
    txtParts.push(`═`.repeat(80));
    txtParts.push(entries[i].prompt);
    txtParts.push("");
  }

  fs.writeFileSync(UPGRADE_TXT, txtParts.join("\n"), "utf8");
  fs.writeFileSync(UPGRADE_JSON, JSON.stringify(entries, null, 2) + "\n", "utf8");

  console.log(`   ✅ Upgrade prompts written to:`);
  console.log(`      TXT:  ${path.relative(ROOT, UPGRADE_TXT)}`);
  console.log(`      JSON: ${path.relative(ROOT, UPGRADE_JSON)}`);
  console.log("");

  if (entries.length > 0) {
    console.log(`   📝 Sample first prompt path: ${entries[0].svg_path}`);
  }
}

// =====================================================================
// 🚀 MAIN
// =====================================================================

function main() {
  console.log("");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║         🎯 BANAO — Premium Animated SVG Generator       ║");
  console.log("║     CSS Animations + feGaussianBlur Glow + Gradients    ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("");

  // IMPORT MODE
  if (IMPORT_MODE) {
    importSvgs(IMPORT_MODE);
    return;
  }

  // UPGRADE MODE
  if (UPGRADE_MODE) {
    upgradeExistingSvgs();
    return;
  }

  // EXPORT MODE (default)
  console.log("🔍 Scanning for questions needing premium diagrams...\n");

  const entries = [];
  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    if (SUBJECT_FILTER && subject !== SUBJECT_FILTER) continue;
    const subDir = path.join(QUESTIONS_DIR, subject);
    if (!fs.statSync(subDir).isDirectory()) continue;
    walkDir(subDir, subject, entries);
  }

  // Sort: missing first, then by type, then by id
  entries.sort((a, b) => {
    const aMiss = a.status === "svg_missing" ? 0 : 1;
    const bMiss = b.status === "svg_missing" ? 0 : 1;
    if (aMiss !== bMiss) return aMiss - bMiss;
    return a.file.localeCompare(b.file) || a.question_id.localeCompare(b.question_id);
  });

  // Count by type and status
  const byType = {};
  const byStatus = {};
  for (const e of entries) {
    byType[e.diagram_type] = (byType[e.diagram_type] || 0) + 1;
    byStatus[e.status] = (byStatus[e.status] || 0) + 1;
  }

  console.log(`   📊 SCAN RESULTS:`);
  console.log(`   Total diagram questions: ${entries.length}`);
  console.log(`   By status: ${JSON.stringify(byStatus)}`);
  console.log(`   By type:   ${JSON.stringify(byType)}`);
  console.log("");

  // Build prompts
  for (const e of entries) {
    e.prompt = buildBanaoPrompt(e);
  }

  // Write JSON
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(entries, null, 2) + "\n", "utf8");

  // Write TXT
  const txtParts = [
    `# 🎯 BANAO PREMIUM SVG GENERATION PROMPTS`,
    `# Generated: ${new Date().toISOString()}`,
    `# Total: ${entries.length}`,
    `# By status: ${JSON.stringify(byStatus)}`,
    `# By type:   ${JSON.stringify(byType)}`,
    SUBJECT_FILTER ? `# Filter: ${SUBJECT_FILTER}` : "",
    ``,
    `# 🚀 HOW TO USE:`,
    `# 1. Copy each block below → paste to AI (Claude/GPT/Gemini)`,
    `# 2. AI returns premium SVG with CSS animations + glow + gradients`,
    `# 3. Save SVG to the path specified in "SAVE AS" field`,
    `# 4. Update question JSON: set "image": "<path>"`,
    `# 5. Or batch-import: node scripts/banao-svg-generator.js --import <svg-dir>`,
    ``,
    `# 🆕 To UPGRADE existing SVGs with animations:`,
    `#    node scripts/banao-svg-generator.js --upgrade`,
    `#    node scripts/banao-svg-generator.js --upgrade --slug bio-nephron`,
    ``,
  ].filter(Boolean);

  for (let i = 0; i < entries.length; i++) {
    txtParts.push("");
    txtParts.push(entries[i].prompt);
    txtParts.push("");
  }

  fs.writeFileSync(OUT_TXT, txtParts.join("\n"), "utf8");

  console.log(`   ✅ Prompts exported to:`);
  console.log(`      TXT:  ${path.relative(ROOT, OUT_TXT)}`);
  console.log(`      JSON: ${path.relative(ROOT, OUT_JSON)}`);
  console.log("");

  // Show sample
  if (entries.length > 0) {
    console.log(`   📝 Sample: ${entries[0].question_id} (${entries[0].diagram_type})`);
    console.log(`   📎 Save as: /images/quiz/premium/${entries[0].question_id.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 120)}.svg`);
    console.log(`   🔬 Status: ${entries[0].status}`);
  }

  console.log("");
  console.log("   🎯 Next steps:");
  console.log(`      • Generate:  node scripts/banao-svg-generator.js --upgrade`);
  console.log(`      • Import:    node scripts/banao-svg-generator.js --import <svg-dir>`);
  console.log("");
}

main();
