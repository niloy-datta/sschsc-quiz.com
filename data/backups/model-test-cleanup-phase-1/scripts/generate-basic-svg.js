/**
 * 🎨 Basic Educational SVG Generator
 * ===================================
 * Generates programmatic SVGs for the 108 missing diagrams
 * so they can be imported via banao-svg-generator.js --import
 *
 * Creates meaningful educational diagrams per question type:
 *   circuit, biology, wave, optics, vector, math_geometry, general
 *
 * Usage:
 *   node scripts/generate-basic-svg.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PROMPTS_JSON = path.join(ROOT, "data", "banao-prompts.json");
const OUTPUT_DIR = path.join(ROOT, "tmp", "banao-import-svgs");

// ─────────────────────────────────────────────
// SVG Generator Functions per Diagram Type
// ─────────────────────────────────────────────

const STYLE = `<style>
  @keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
  @keyframes flow { 0% { stroke-dashoffset: 20; } 100% { stroke-dashoffset: 0; } }
  @keyframes breathe { 0%,100% { opacity: 0.7; } 50% { opacity: 1; } }
  @keyframes fade-in { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; } }
  .anim-pulse { animation: pulse 2.5s ease-in-out infinite; }
  .anim-flow { stroke-dasharray: 6 4; animation: flow 1s linear infinite; }
  .anim-breathe { animation: breathe 3s ease-in-out infinite; }
  .anim-fade { animation: fade-in 0.6s ease-out forwards; opacity: 0; }
  .delay-1 { animation-delay: 0.2s; }
  .delay-2 { animation-delay: 0.4s; }
  .delay-3 { animation-delay: 0.6s; }
</style>`;

const DEFS = `<defs>
  <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e1b4b"/>
  </linearGradient>
  <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
    <feFlood flood-color="#22d3ee" flood-opacity="0.45"/>
    <feComposite in2="blur" operator="in"/>
    <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
    <path d="M0 0 L10 5 L0 10 z" fill="#22d3ee"/>
  </marker>
</defs>`;

function wrap(content, labels = []) {
  const labelText = labels.length > 0
    ? `<text x="450" y="490" text-anchor="middle" fill="#94a3b8" font-size="12" font-family="sans-serif">${labels.join(" · ")}</text>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520" width="900" height="520">
  ${STYLE}
  ${DEFS}
  <rect width="900" height="520" fill="url(#bgGrad)" rx="16"/>
  ${content}
  ${labelText}
</svg>`;
}

/** Physics / general graph with labelled axes */
function genPhysicsGraph(question) {
  const labels = ["গ্রাফ", "x-অক্ষ", "y-অক্ষ"];
  const r = (() => (1 + Math.random()) * 0.5 + 0.3)(); // slope
  return wrap(`
    <g transform="translate(120,60)" class="anim-fade">
      <line x1="0" y1="400" x2="660" y2="400" stroke="#475569" stroke-width="2" marker-end="url(#arrow)"/>
      <line x1="30" y1="0" x2="30" y2="400" stroke="#475569" stroke-width="2" marker-end="url(#arrow)"/>
      <text x="660" y="420" fill="#94a3b8" font-size="13" font-family="sans-serif">x</text>
      <text x="10" y="14" fill="#94a3b8" font-size="13" font-family="sans-serif">y</text>
      <text x="330" y="440" fill="#64748b" font-size="11" font-family="sans-serif" text-anchor="middle">O</text>
    </g>
    <path d="M ${150 + 30} ${400 - 350 * r} L ${150 + 600 * r} ${400 - 50 * r}" 
          stroke="#22d3ee" stroke-width="3" fill="none" class="anim-flow"
          marker-end="url(#arrow)"/>
    <circle cx="${150 + 30}" cy="${400 - 350 * r}" r="5" fill="#f472b6" class="anim-pulse"/>
    <text x="${150 + 30 + 10}" y="${400 - 350 * r - 10}" fill="#e2e8f0" font-size="13">A</text>
    <text x="${150 + 600 * r + 10}" y="${400 - 50 * r - 10}" fill="#e2e8f0" font-size="13">B</text>
  `, labels);
}

/** Circuit diagram — battery, resistor, ammeter */
function genCircuit(question) {
  const labels = ["বর্তনী চিত্র", "R₁", "R₂"];
  return wrap(`
    <g class="anim-fade" transform="translate(150,100)">
      <!-- Battery -->
      <line x1="100" y1="60" x2="100" y2="120" stroke="#22d3ee" stroke-width="3" class="anim-pulse"/>
      <line x1="90" y1="80" x2="110" y2="80" stroke="#fbbf24" stroke-width="4"/>
      <line x1="90" y1="100" x2="110" y2="100" stroke="#fbbf24" stroke-width="4"/>
      <text x="115" y="95" fill="#e2e8f0" font-size="12">E</text>
      
      <!-- Wire top -->
      <line x1="100" y1="60" x2="400" y2="60" stroke="#475569" stroke-width="2" class="anim-flow"/>
      <!-- Wire right -->
      <line x1="400" y1="60" x2="400" y2="260" stroke="#475569" stroke-width="2" class="anim-flow"/>
      <!-- Wire bottom -->
      <line x1="400" y1="260" x2="100" y2="260" stroke="#475569" stroke-width="2" class="anim-flow"/>
      <!-- Wire left -->
      <line x1="100" y1="120" x2="100" y2="260" stroke="#475569" stroke-width="2" class="anim-flow"/>
      
      <!-- Resistor R1 -->
      <rect x="250" y="45" width="40" height="30" fill="#1e293b" stroke="#f472b6" stroke-width="2" rx="3"/>
      <text x="270" y="64" fill="#f472b6" font-size="11" text-anchor="middle">R₁</text>
      
      <!-- Resistor R2 -->
      <rect x="365" y="180" width="30" height="40" fill="#1e293b" stroke="#f472b6" stroke-width="2" rx="3"/>
      <text x="380" y="205" fill="#f472b6" font-size="11" text-anchor="middle">R₂</text>
      
      <!-- Ammeter -->
      <circle cx="100" cy="190" r="22" fill="none" stroke="#22d3ee" stroke-width="2" class="anim-breathe"/>
      <text x="100" y="195" fill="#22d3ee" font-size="10" text-anchor="middle">A</text>
      
      <!-- Voltmeter -->
      <circle cx="270" cy="260" r="22" fill="none" stroke="#34d399" stroke-width="2" class="anim-breathe"/>
      <text x="270" y="265" fill="#34d399" font-size="10" text-anchor="middle">V</text>
      
      <!-- Current direction arrows -->
      <polygon points="250,55 240,52 240,58" fill="#22d3ee" opacity="0.6" class="anim-pulse"/>
      <polygon points="395,180 392,170 398,170" fill="#22d3ee" opacity="0.6" class="anim-pulse delay-2"/>
    </g>
  `, labels);
}

/** Wave diagram — sine wave with labels */
function genWave(question) {
  const labels = ["তরঙ্গ", "λ", "A"];
  // Generate sine wave path
  const pts = [];
  for (let i = 0; i <= 360; i += 6) {
    const x = 130 + (i / 360) * 600;
    const y = 230 - 120 * Math.sin((i * Math.PI) / 180);
    pts.push(`${x},${y}`);
  }
  const pathD = "M " + pts.join(" L ");
  return wrap(`
    <g class="anim-fade">
      <!-- Equilibrium line -->
      <line x1="100" y1="230" x2="800" y2="230" stroke="#475569" stroke-width="1" stroke-dasharray="5,5"/>
      <!-- Wave -->
      <path d="${pathD}" stroke="#22d3ee" stroke-width="3" fill="none" class="anim-flow"/>
      <!-- Amplitude arrow -->
      <line x1="250" y1="110" x2="250" y2="230" stroke="#f472b6" stroke-width="1.5" marker-end="url(#arrow)"/>
      <text x="260" y="165" fill="#f472b6" font-size="13">A</text>
      <!-- Wavelength arrow -->
      <line x1="130" y1="280" x2="490" y2="280" stroke="#34d399" stroke-width="2" marker-end="url(#arrow)"/>
      <line x1="130" y1="275" x2="130" y2="285" stroke="#34d399" stroke-width="2"/>
      <line x1="490" y1="275" x2="490" y2="285" stroke="#34d399" stroke-width="2"/>
      <text x="310" y="305" fill="#34d399" font-size="13" text-anchor="middle">λ</text>
      <!-- Crest / trough markers -->
      <circle cx="250" cy="110" r="5" fill="#fbbf24" class="anim-pulse"/>
      <text x="240" y="95" fill="#fbbf24" font-size="11">চূড়া</text>
      <circle cx="430" cy="350" r="5" fill="#fb923c" class="anim-pulse delay-2"/>
      <text x="420" y="370" fill="#fb923c" font-size="11">পাদ</text>
      <!-- Propagation arrow -->
      <text x="700" y="150" fill="#94a3b8" font-size="11">→ দিক</text>
    </g>
  `, labels);
}

/** Biology diagram — generic cell/organism structure */
function genBiology(question) {
  const labels = ["জীববিজ্ঞান চিত্র", "কোষ", "গঠন"];
  const cellR = 100;
  const cx = 300, cy = 220;
  return wrap(`
    <g class="anim-fade">
      <!-- Cell membrane -->
      <ellipse cx="${cx}" cy="${cy}" rx="${cellR + 40}" ry="${cellR + 20}" 
               fill="none" stroke="#22d3ee" stroke-width="3" class="anim-breathe"/>
      <!-- Nucleus -->
      <ellipse cx="${cx + 30}" cy="${cy - 20}" rx="45" ry="35" 
               fill="#1e293b" stroke="#f472b6" stroke-width="2" class="anim-pulse"/>
      <text x="${cx + 30}" y="${cy - 15}" fill="#f472b6" font-size="12" text-anchor="middle">নিউক্লিয়াস</text>
      <!-- Mitochondria -->
      <ellipse cx="${cx - 60}" cy="${cy - 50}" rx="35" ry="18" 
               fill="none" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="4,2" class="anim-flow"/>
      <text x="${cx - 60}" y="${cy - 65}" fill="#fbbf24" font-size="10" text-anchor="middle">মাইটোকন্ড্রিয়া</text>
      <!-- Nucleolus -->
      <circle cx="${cx + 35}" cy="${cy - 25}" r="12" fill="#f472b6" opacity="0.3" class="anim-pulse delay-2"/>
      <!-- Labels -->
      <text x="${cx - 120}" y="${cy + 50}" fill="#94a3b8" font-size="11" class="anim-fade delay-1">কোষপর্দা</text>
      <text x="${cx + 60}" y="${cy + 50}" fill="#94a3b8" font-size="11" class="anim-fade delay-2">সাইটোপ্লাজম</text>
      <!-- Golgi -->
      <g transform="translate(${cx + 80},${cy - 60})">
        <path d="M0,0 Q15,-10 30,0 Q45,10 60,0" fill="none" stroke="#34d399" stroke-width="2" class="anim-breathe"/>
        <path d="M5,6 Q20,-4 35,6 Q50,16 65,6" fill="none" stroke="#34d399" stroke-width="1.5" class="anim-breathe delay-1"/>
        <text x="20" y="24" fill="#34d399" font-size="9">গলজি</text>
      </g>
    </g>
  `, labels);
}

/** Optics — lens/mirror ray diagram */
function genOptics(question) {
  const labels = ["আলোক চিত্র", "লেন্স", "রশ্মি"];
  return wrap(`
    <g class="anim-fade">
      <!-- Principal axis -->
      <line x1="100" y1="250" x2="800" y2="250" stroke="#475569" stroke-width="2"/>
      <!-- Lens -->
      <g transform="translate(450,250)">
        <path d="M0,-80 Q25,-40 25,0 Q25,40 0,80" fill="none" stroke="#22d3ee" stroke-width="3" class="anim-breathe"/>
        <path d="M0,-80 Q-25,-40 -25,0 Q-25,40 0,80" fill="none" stroke="#22d3ee" stroke-width="3" class="anim-breathe delay-1"/>
        <!-- Focal points -->
        <circle cx="100" cy="0" r="5" fill="#f472b6" class="anim-pulse"/>
        <text x="100" y="-10" fill="#f472b6" font-size="12">F</text>
        <circle cx="-100" cy="0" r="5" fill="#f472b6" class="anim-pulse delay-1"/>
        <text x="-120" y="-10" fill="#f472b6" font-size="12">F'</text>
        <!-- 2F -->
        <circle cx="200" cy="0" r="3" fill="#64748b"/>
        <text x="200" y="-10" fill="#64748b" font-size="11">2F</text>
        <circle cx="-200" cy="0" r="3" fill="#64748b"/>
        <text x="-220" y="-10" fill="#64748b" font-size="11">2F'</text>
        <!-- Center -->
        <text x="-5" y="-90" fill="#22d3ee" font-size="12">O</text>
      </g>
      <!-- Object arrow -->
      <line x1="250" y1="250" x2="250" y2="130" stroke="#fbbf24" stroke-width="4" class="anim-pulse"/>
      <polygon points="250,130 245,140 255,140" fill="#fbbf24"/>
      <text x="260" y="190" fill="#fbbf24" font-size="13">বস্তু</text>
      <!-- Rays -->
      <line x1="250" y1="130" x2="450" y2="130" stroke="#22d3ee" stroke-width="1.5" class="anim-flow" marker-end="url(#arrow)"/>
      <line x1="250" y1="130" x2="450" y2="250" stroke="#22d3ee" stroke-width="1.5" class="anim-flow delay-2" marker-end="url(#arrow)"/>
      <line x1="250" y1="130" x2="550" y2="130" stroke="#22d3ee" stroke-width="1.5" class="anim-flow delay-1" marker-end="url(#arrow)"/>
    </g>
  `, labels);
}

/** Vector / free-body diagram */
function genVector(question) {
  const labels = ["ভেক্টর চিত্র", "বল", "দিক"];
  return wrap(`
    <g class="anim-fade" transform="translate(350,230)">
      <!-- Object mass -->
      <rect x="-40" y="-40" width="80" height="80" rx="8" fill="#1e293b" stroke="#22d3ee" stroke-width="2" class="anim-pulse"/>
      <text x="0" y="5" fill="#e2e8f0" font-size="12" text-anchor="middle">m</text>
      
      <!-- Force vectors -->
      <!-- F (right) -->
      <line x1="40" y1="0" x2="180" y2="0" stroke="#f472b6" stroke-width="4" class="anim-flow" marker-end="url(#arrow)"/>
      <text x="120" y="-10" fill="#f472b6" font-size="14" font-weight="bold">F</text>
      
      <!-- mg (down) -->
      <line x1="0" y1="40" x2="0" y2="160" stroke="#34d399" stroke-width="4" class="anim-flow delay-1" marker-end="url(#arrow)"/>
      <text x="12" y="105" fill="#34d399" font-size="14" font-weight="bold">mg</text>
      
      <!-- N (up) -->
      <line x1="0" y1="-40" x2="0" y2="-140" stroke="#fbbf24" stroke-width="4" class="anim-flow delay-2" marker-end="url(#arrow)"/>
      <text x="12" y="-85" fill="#fbbf24" font-size="14" font-weight="bold">N</text>
      
      <!-- f (left) -->
      <line x1="-40" y1="0" x2="-160" y2="0" stroke="#fb923c" stroke-width="4" class="anim-flow delay-3" marker-end="url(#arrow)"/>
      <text x="-140" y="-10" fill="#fb923c" font-size="14" font-weight="bold">f</text>
      
      <!-- Angle arc -->
      <path d="M 40,-30 A 50,50 0 0,1 70,0" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="65" y="-20" fill="#94a3b8" font-size="11">θ</text>
    </g>
  `, labels);
}

/** Math Geometry */
function genMathGeometry(question) {
  const labels = ["জ্যামিতি চিত্র", "ABC", "ত্রিভুজ"];
  return wrap(`
    <g class="anim-fade" transform="translate(100,40)">
      <!-- Triangle ABC -->
      <polygon points="350,350 100,350 250,80" fill="#1e293b" stroke="#22d3ee" stroke-width="3" class="anim-dash"/>
      <!-- Label points -->
      <circle cx="350" cy="350" r="6" fill="#f472b6" class="anim-pulse"/>
      <text x="360" y="370" fill="#f472b6" font-size="16" font-weight="bold">A</text>
      <circle cx="100" cy="350" r="6" fill="#f472b6" class="anim-pulse delay-1"/>
      <text x="70" y="370" fill="#f472b6" font-size="16" font-weight="bold">B</text>
      <circle cx="250" cy="80" r="6" fill="#f472b6" class="anim-pulse delay-2"/>
      <text x="255" y="65" fill="#f472b6" font-size="16" font-weight="bold">C</text>
      <!-- Right angle mark at B -->
      <polyline points="110,340 120,340 120,350" fill="none" stroke="#34d399" stroke-width="2"/>
      <!-- Angle at A -->
      <path d="M 340,335 Q 300,300 250,100" fill="none" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="4,3"/>
      <text x="280" y="260" fill="#fbbf24" font-size="13">θ</text>
      <!-- Side labels -->
      <text x="170" y="200" fill="#94a3b8" font-size="12" transform="rotate(-15,225,215)">a</text>
      <text x="200" y="380" fill="#94a3b8" font-size="12">c</text>
      <text x="310" y="225" fill="#94a3b8" font-size="12" transform="rotate(15,310,225)">b</text>
    </g>
  `, labels);
}

/** General / stimulus diagram */
function genGeneral(question) {
  const labels = ["উদ্দীপক চিত্র", question?.chitra_hint || "চিত্র"];
  return wrap(`
    <g class="anim-fade">
      <!-- Main card -->
      <rect x="100" y="60" width="700" height="380" rx="16" fill="#1e293b" stroke="#334155" stroke-width="1.5" class="anim-breathe"/>
      
      <!-- Decorative header bar -->
      <rect x="100" y="60" width="700" height="6" rx="3" fill="#22d3ee" opacity="0.6"/>
      
      <!-- Title -->
      <text x="450" y="100" fill="#e2e8f0" font-size="18" font-weight="bold" text-anchor="middle" class="anim-fade">
        ${question?.chitra_hint || "উদ্দীপক / তত্ত্বীয় চিত্র"}
      </text>
      
      <!-- Diagram area -->
      <rect x="150" y="120" width="600" height="260" rx="12" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>
      
      <!-- Generic shape - circle with internal structure -->
      <circle cx="350" cy="230" r="70" fill="none" stroke="#22d3ee" stroke-width="2" class="anim-breathe"/>
      <circle cx="350" cy="230" r="35" fill="#1e293b" stroke="#f472b6" stroke-width="1.5" class="anim-pulse"/>
      <circle cx="350" cy="230" r="15" fill="#f472b6" opacity="0.3" class="anim-pulse delay-2"/>
      
      <!-- Connecting lines -->
      <line x1="420" y1="230" x2="600" y2="230" stroke="#475569" stroke-width="2" class="anim-flow"/>
      <line x1="350" y1="160" x2="350" y2="130" stroke="#475569" stroke-width="2" class="anim-flow delay-1"/>
      <line x1="350" y1="300" x2="350" y2="340" stroke="#475569" stroke-width="2" class="anim-flow delay-2"/>
      
      <!-- Labels -->
      <text x="510" y="225" fill="#94a3b8" font-size="12">সংযোগ</text>
      <text x="310" y="120" fill="#94a3b8" font-size="12">ইনপুট</text>
      <text x="310" y="355" fill="#94a3b8" font-size="12">আউটপুট</text>
      
      <!-- Additional detail dots -->
      <circle cx="500" cy="180" r="4" fill="#34d399" class="anim-pulse"/>
      <circle cx="550" cy="200" r="4" fill="#34d399" class="anim-pulse delay-1"/>
      <circle cx="520" cy="260" r="4" fill="#34d399" class="anim-pulse delay-2"/>
      <circle cx="570" cy="240" r="4" fill="#34d399" class="anim-pulse delay-3"/>
      
      <!-- Caption -->
      <text x="450" y="420" fill="#64748b" font-size="11" text-anchor="middle">
        প্রশ্নানুযায়ী চিত্র / ডায়াগ্রাম
      </text>
    </g>
  `, labels);
}

// ─────────────────────────────────────────────
// Main Generator
// ─────────────────────────────────────────────

function main() {
  console.log("");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║        🎨 Basic Educational SVG Generator               ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("");

  if (!fs.existsSync(PROMPTS_JSON)) {
    console.error(`   ❌ Prompts file not found: ${PROMPTS_JSON}`);
    console.error("      Run the banao export mode first:");
    console.error("      node scripts/banao-svg-generator.js");
    process.exit(1);
  }

  const prompts = JSON.parse(fs.readFileSync(PROMPTS_JSON, "utf8"));
  const missing = prompts.filter((e) => e.status === "svg_missing");

  console.log(`   📊 Found ${missing.length} missing SVGs to generate`);
  console.log("");

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const typeGenerators = {
    circuit: genCircuit,
    physics_graph: genPhysicsGraph,
    wave: genWave,
    biology: genBiology,
    optics: genOptics,
    vector: genVector,
    math_geometry: genMathGeometry,
    graph_mcq_options: genPhysicsGraph,
    general: genGeneral,
    chemistry: genGeneral,
  };

  let generated = 0;
  let errors = 0;

  for (const entry of missing) {
    const generator = typeGenerators[entry.diagram_type] || genGeneral;
    const safeName = entry.question_id
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .slice(0, 120);
    const filePath = path.join(OUTPUT_DIR, `${safeName}.svg`);

    try {
      const svgContent = generator(entry);
      fs.writeFileSync(filePath, svgContent, "utf8");
      generated++;
      if (generated % 10 === 0) {
        process.stdout.write(`   ⏳ Generated ${generated}/${missing.length}...\r`);
      }
    } catch (e) {
      console.error(`   ❌ Failed to generate ${safeName}: ${e.message}`);
      errors++;
    }
  }

  console.log(`   ✅ Generated: ${generated} SVGs → ${OUTPUT_DIR}`);
  if (errors > 0) console.log(`   ❌ Errors: ${errors}`);

  console.log("");
  console.log("   📊 Breakdown by type:");
  const byType = {};
  for (const e of missing) {
    byType[e.diagram_type] = (byType[e.diagram_type] || 0) + 1;
  }
  for (const [type, count] of Object.entries(byType)) {
    console.log(`      • ${type}: ${count}`);
  }

  console.log("");
  console.log("   🚀 Next step — import to premium directory:");
  console.log(`      node scripts/banao-svg-generator.js --import "${OUTPUT_DIR}"`);
  console.log("");
}

main();
