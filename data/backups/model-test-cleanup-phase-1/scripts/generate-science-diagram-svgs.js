/**
 * Generate dark-neon quiz diagram SVGs for physics, chemistry & math.
 * Usage: node scripts/generate-science-diagram-svgs.js
 */
const fs = require("fs");
const path = require("path");

const OUT = path.resolve(__dirname, "../public/images/quiz");

function write(name, body) {
  fs.writeFileSync(path.join(OUT, name), body.trim() + "\n", "utf8");
}

function defs(id, color) {
  return `<defs>
    <marker id="${id}-ax" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8"/>
    </marker>
    <marker id="${id}-ay" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 10 L 5 0 L 10 10 z" fill="#94a3b8"/>
    </marker>
    <filter id="${id}-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="${color}" flood-opacity="0.65"/>
    </filter>
  </defs>`;
}

function axes(id, x0 = 30, y0 = 170, x1 = 185, y1 = 15) {
  return `
  <line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="#94a3b8" stroke-width="2" marker-end="url(#${id}-ay)"/>
  <line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="#94a3b8" stroke-width="2" marker-end="url(#${id}-ax)"/>
  <line x1="${x0}" y1="120" x2="180" y2="120" stroke="#334155" stroke-width="0.5" stroke-dasharray="2 2"/>
  <line x1="105" y1="20" x2="105" y2="170" stroke="#334155" stroke-width="0.5" stroke-dasharray="2 2"/>`;
}

function graphSvg(id, color, xLabel, yLabel, pathD, extra = "") {
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
${defs(id, color)}
${axes(id)}
  <path d="${pathD}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" filter="url(#${id}-glow)"/>
  ${extra}
  <text x="12" y="25" fill="#e2e8f0" font-family="system-ui,sans-serif" font-size="14" font-weight="bold">${yLabel}</text>
  <text x="172" y="192" fill="#e2e8f0" font-family="system-ui,sans-serif" font-size="14" font-weight="bold">${xLabel}</text>
  <text x="15" y="188" fill="#64748b" font-family="system-ui,sans-serif" font-size="11">O</text>
</svg>`;
}

function geoSvg(inner, label = "") {
  return `<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">
  <rect width="320" height="220" fill="transparent"/>
  <filter id="glow"><feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#22d3ee" flood-opacity="0.55"/></filter>
  ${inner}
  ${label ? `<text x="160" y="210" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="12" text-anchor="middle">${label}</text>` : ""}
</svg>`;
}

// ─── Graph families (4 MCQ variants each) ───────────────────────────────

const graphFamilies = {
  "pressure-depth": {
    color: "#38bdf8",
    x: "h",
    y: "P",
    paths: [
      "M 35 165 L 165 35",
      "M 35 165 L 120 120 L 165 55",
      "M 35 165 Q 80 140 165 100",
      "M 35 120 L 165 120",
    ],
  },
  "vt-graph": {
    color: "#f472b6",
    x: "t",
    y: "v",
    paths: [
      "M 35 165 L 165 35",
      "M 35 165 L 100 100 L 165 165",
      "M 35 100 Q 100 40 165 165",
      "M 35 165 L 165 165",
    ],
  },
  "heating-curve": {
    color: "#fb923c",
    x: "t",
    y: "T",
    paths: [
      "M 35 165 L 70 130 L 70 130 L 105 130 L 105 80 L 140 80 L 140 50 L 165 50",
      "M 35 165 L 165 35",
      "M 35 165 L 80 120 L 165 120",
      "M 35 165 L 70 100 L 110 100 L 165 60",
    ],
  },
  "reaction-rate": {
    color: "#a78bfa",
    x: "t",
    y: "c",
    paths: [
      "M 35 35 L 165 165",
      "M 35 165 L 165 35",
      "M 35 165 Q 100 40 165 35",
      "M 35 165 L 165 165",
    ],
  },
  "pv-cycle": {
    color: "#34d399",
    x: "V",
    y: "P",
    paths: [
      "M 60 140 L 140 140 L 140 60 L 60 60 Z",
      "M 50 150 L 150 150 L 150 50 L 50 50 Z",
      "M 70 130 L 130 130 L 130 70 L 70 70 Z",
      "M 55 145 L 145 145 L 145 55 L 55 55 Z",
    ],
  },
  "shm-graph": {
    color: "#22d3ee",
    x: "t",
    y: "x",
    paths: [
      "M 35 100 Q 65 40 100 100 T 165 100",
      "M 35 100 Q 65 160 100 100 T 165 100",
      "M 35 165 L 165 35",
      "M 35 100 L 165 100",
    ],
  },
  "parabola-graph": {
    color: "#22d3ee",
    x: "x",
    y: "y",
    paths: [
      "M 35 165 Q 100 40 165 165",
      "M 35 35 Q 100 160 165 35",
      "M 35 100 L 165 100",
      "M 35 165 L 165 35",
    ],
  },
  "function-test": {
    color: "#e879f9",
    x: "x",
    y: "y",
    paths: [
      "M 100 35 L 100 165",
      "M 35 100 Q 100 40 165 100",
      "M 35 165 Q 100 40 165 165",
      "M 35 35 L 165 165",
    ],
  },
};

for (const [family, cfg] of Object.entries(graphFamilies)) {
  cfg.paths.forEach((pathD, i) => {
    write(
      `${family}-${i + 1}.svg`,
      graphSvg(family + i, cfg.color, cfg.x, cfg.y, pathD),
    );
  });
}

// ─── Geometry / circuit stimulus diagrams ─────────────────────────────────

write(
  "geo-circle-center-o.svg",
  geoSvg(
    `
  <circle cx="160" cy="100" r="70" fill="#0f172a" stroke="#22d3ee" stroke-width="2.5" filter="url(#glow)"/>
  <circle cx="160" cy="100" r="4" fill="#67e8f9"/>
  <text x="168" y="96" fill="#f8fafc" font-size="14" font-weight="bold">O</text>
  <polygon points="160,30 220,130 100,130" fill="none" stroke="#f472b6" stroke-width="2"/>
  <text x="152" y="28" fill="#fda4af" font-size="12">A</text>
  <text x="228" y="138" fill="#fda4af" font-size="12">B</text>
  <text x="88" y="138" fill="#fda4af" font-size="12">C</text>`,
    "বৃত্ত — কেন্দ্র O",
  ),
);

write(
  "geo-triangle-right.svg",
  geoSvg(
    `
  <polygon points="80,160 240,160 80,50" fill="#0f172a" stroke="#22d3ee" stroke-width="2.5" filter="url(#glow)"/>
  <rect x="80" y="145" width="15" height="15" fill="none" stroke="#94a3b8"/>
  <text x="72" y="168" fill="#e2e8f0" font-size="13">B</text>
  <text x="248" y="168" fill="#e2e8f0" font-size="13">C</text>
  <text x="68" y="48" fill="#e2e8f0" font-size="13">A</text>`,
    "সমকোণী ত্রিভুজ ABC",
  ),
);

write(
  "geo-triangle-medians.svg",
  geoSvg(
    `
  <polygon points="160,40 70,170 250,170" fill="#0f172a" stroke="#22d3ee" stroke-width="2.5" filter="url(#glow)"/>
  <line x1="160" y1="40" x2="160" y2="170" stroke="#f472b6" stroke-width="2" stroke-dasharray="5 3"/>
  <line x1="70" y1="170" x2="205" y2="105" stroke="#34d399" stroke-width="2" stroke-dasharray="5 3"/>
  <line x1="250" y1="170" x2="115" y2="105" stroke="#a78bfa" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="152" y="34" fill="#e2e8f0" font-size="12">A</text>
  <text x="58" y="182" fill="#e2e8f0" font-size="12">B</text>
  <text x="256" y="182" fill="#e2e8f0" font-size="12">C</text>`,
    "মধ্যমা ত্রয়",
  ),
);

write(
  "geo-triangle-altitudes.svg",
  geoSvg(
    `
  <polygon points="160,40 70,170 250,170" fill="#0f172a" stroke="#22d3ee" stroke-width="2.5" filter="url(#glow)"/>
  <line x1="160" y1="40" x2="160" y2="170" stroke="#f472b6" stroke-width="2"/>
  <line x1="70" y1="170" x2="190" y2="90" stroke="#34d399" stroke-width="2"/>
  <line x1="250" y1="170" x2="130" y2="90" stroke="#a78bfa" stroke-width="2"/>
  <circle cx="160" cy="108" r="5" fill="#fde68a"/>
  <text x="168" y="112" fill="#fde68a" font-size="12">P</text>`,
    "লম্ব ত্রয় — orthocenter P",
  ),
);

write(
  "geo-coord-triangle.svg",
  geoSvg(
    `
  <line x1="40" y1="170" x2="280" y2="170" stroke="#64748b" stroke-width="2"/>
  <line x1="40" y1="170" x2="40" y2="30" stroke="#64748b" stroke-width="2"/>
  <text x="285" y="175" fill="#94a3b8" font-size="12">x</text>
  <text x="30" y="28" fill="#94a3b8" font-size="12">y</text>
  <polygon points="40,170 200,170 40,70" fill="#0f172a" stroke="#22d3ee" stroke-width="2.5" filter="url(#glow)"/>
  <circle cx="200" cy="170" r="4" fill="#67e8f9"/><text x="206" y="184" fill="#e2e8f0" font-size="11">A(4,0)</text>
  <circle cx="40" cy="70" r="4" fill="#67e8f9"/><text x="10" y="66" fill="#e2e8f0" font-size="11">B(0,3)</text>
  <circle cx="40" cy="170" r="4" fill="#67e8f9"/><text x="18" y="184" fill="#e2e8f0" font-size="11">O</text>`,
    "স্থানাঙ্ক জ্যামিতি",
  ),
);

write(
  "geo-circle-equation.svg",
  geoSvg(
    `
  <line x1="40" y1="110" x2="280" y2="110" stroke="#475569" stroke-width="1"/>
  <line x1="160" y1="20" x2="160" y2="200" stroke="#475569" stroke-width="1"/>
  <circle cx="160" cy="110" r="70" fill="none" stroke="#22d3ee" stroke-width="2.5" filter="url(#glow)"/>
  <circle cx="160" cy="110" r="4" fill="#67e8f9"/>
  <text x="250" y="50" fill="#94a3b8" font-size="11">x²+y²=25</text>`,
    "বৃত্ত x² + y² = 25",
  ),
);

write(
  "geo-trapezoid.svg",
  geoSvg(
    `
  <polygon points="90,160 230,160 200,70 120,70" fill="#0f172a" stroke="#22d3ee" stroke-width="2.5" filter="url(#glow)"/>
  <line x1="105" y1="115" x2="215" y2="115" stroke="#f472b6" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="82" y="172" fill="#e2e8f0" font-size="12">P</text>
  <text x="236" y="172" fill="#e2e8f0" font-size="12">Q</text>
  <text x="112" y="62" fill="#e2e8f0" font-size="12">S</text>
  <text x="204" y="62" fill="#e2e8f0" font-size="12">R</text>
  <text x="148" y="108" fill="#fda4af" font-size="11">X</text>
  <text x="168" y="108" fill="#fda4af" font-size="11">Y</text>`,
    "ট্রাপিজিয়াম — মধ্যম রেখা XY",
  ),
);

write(
  "geo-cylinder-generator.svg",
  geoSvg(
    `
  <ellipse cx="160" cy="60" rx="55" ry="16" fill="#0f172a" stroke="#22d3ee" stroke-width="2"/>
  <line x1="105" y1="60" x2="105" y2="160" stroke="#22d3ee" stroke-width="2"/>
  <line x1="215" y1="60" x2="215" y2="160" stroke="#22d3ee" stroke-width="2"/>
  <ellipse cx="160" cy="160" rx="55" ry="16" fill="#0f172a" stroke="#22d3ee" stroke-width="2"/>
  <line x1="215" y1="60" x2="240" y2="20" stroke="#f472b6" stroke-width="2.5" filter="url(#glow)"/>
  <text x="244" y="22" fill="#fda4af" font-size="11">উৎপাদক</text>`,
    "বেলন — উৎপাদক রেখা",
  ),
);

write(
  "circuit-series.svg",
  geoSvg(
    `
  <rect x="50" y="60" width="220" height="100" rx="12" fill="#0f172a" stroke="#334155" stroke-width="2"/>
  <circle cx="80" cy="110" r="16" fill="#1e293b" stroke="#22d3ee" stroke-width="2"/><text x="74" y="114" fill="#e2e8f0" font-size="10">V</text>
  <rect x="130" y="98" width="36" height="24" rx="4" fill="#1e293b" stroke="#f472b6"/><text x="139" y="114" fill="#fda4af" font-size="10">R₁</text>
  <rect x="190" y="98" width="36" height="24" rx="4" fill="#1e293b" stroke="#34d399"/><text x="199" y="114" fill="#86efac" font-size="10">R₂</text>
  <line x1="96" y1="110" x2="130" y2="110" stroke="#94a3b8" stroke-width="2"/>
  <line x1="166" y1="110" x2="190" y2="110" stroke="#94a3b8" stroke-width="2"/>
  <line x1="226" y1="110" x2="250" y2="110" stroke="#94a3b8" stroke-width="2"/>`,
    "সিরিজ বর্তনী",
  ),
);

write(
  "circuit-parallel.svg",
  geoSvg(
    `
  <rect x="50" y="50" width="220" height="110" rx="12" fill="#0f172a" stroke="#334155" stroke-width="2"/>
  <circle cx="75" cy="105" r="14" fill="#1e293b" stroke="#22d3ee" stroke-width="2"/><text x="70" y="109" fill="#e2e8f0" font-size="9">V</text>
  <rect x="140" y="70" width="34" height="20" rx="3" fill="#1e293b" stroke="#f472b6"/><text x="149" y="84" fill="#fda4af" font-size="9">R₁</text>
  <rect x="140" y="120" width="34" height="20" rx="3" fill="#1e293b" stroke="#34d399"/><text x="149" y="134" fill="#86efac" font-size="9">R₂</text>
  <line x1="89" y1="105" x2="140" y2="80" stroke="#94a3b8" stroke-width="2"/>
  <line x1="89" y1="105" x2="140" y2="130" stroke="#94a3b8" stroke-width="2"/>
  <line x1="174" y1="80" x2="230" y2="80" stroke="#94a3b8" stroke-width="2"/>
  <line x1="174" y1="130" x2="230" y2="130" stroke="#94a3b8" stroke-width="2"/>`,
    "সমান্তরাল বর্তনী",
  ),
);

write(
  "wave-transverse.svg",
  geoSvg(
    `
  <line x1="30" y1="110" x2="290" y2="110" stroke="#475569" stroke-width="1.5" stroke-dasharray="4 4"/>
  <path d="M 30 110 Q 55 60 80 110 T 130 110 T 180 110 T 230 110 T 280 110" fill="none" stroke="#22d3ee" stroke-width="3" filter="url(#glow)"/>
  <line x1="80" y1="60" x2="80" y2="110" stroke="#f472b6" stroke-width="1.5"/>
  <line x1="130" y1="110" x2="130" y2="60" stroke="#f472b6" stroke-width="1.5"/>
  <text x="72" y="52" fill="#fda4af" font-size="11">চূড়া</text>`,
    "আড় তরঙ্গ",
  ),
);

const count = fs.readdirSync(OUT).filter((f) => f.endsWith(".svg")).length;
console.log(`Generated science diagram SVGs. Total in ${OUT}: ${count}`);
