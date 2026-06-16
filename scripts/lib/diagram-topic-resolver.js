const LIBRARY_SLUGS = new Set([
  "ssc-charge-spheres", "ssc-concave-mirror", "ssc-convex-lens",
  "cell-division", "cell-wall", "sporangium", "plasmid", "fern-prothallus", "vascular-bundle", "dna-rna",
  "bio-nephron", "bio-neuron", "bio-eye", "bio-digestive", "bio-alveoli", "bio-xylem-phloem",
  "geo-circle-center-o", "geo-circle-equation", "geo-triangle-right", "geo-triangle-medians",
  "geo-triangle-altitudes", "geo-coord-triangle", "geo-trapezoid", "geo-cylinder-generator",
  "circuit-series", "circuit-parallel", "wave-transverse", "nor-gate",
  "photon-energy-1", "half-life-1", "electric-field-1", "pressure-depth-1",
  "heating-curve-1", "reaction-rate-1", "pv-cycle-1", "shm-graph-1", "vt-graph-1",
  "parabola-graph-1", "function-test-1",
]);

function normalizeHint(h) {
  return String(h || "").replace(/\s+/g, " ").trim();
}

function safeId(id) {
  return String(id || "unknown").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-").slice(0, 120);
}

function matchBracketChitra(text) {
  const m = text.match(/\[চিত্র\s*[:：]\s*([^\]]+)\]/i);
  if (!m) return null;
  const h = normalizeHint(m[1]);
  if (/গোলক/i.test(h) && /আধান/i.test(h)) return "ssc-charge-spheres";
  if (/অবতল দর্পণ/i.test(h)) return "ssc-concave-mirror";
  if (/বেলন|cylinder/i.test(h)) return "geo-cylinder-generator";
  return null;
}

function matchParenChitra(text) {
  const m = text.match(/\(\s*চিত্র\s*[:：]\s*([^)]+)\s*\)/i);
  if (!m) return null;
  const l = normalizeHint(m[1]).toLowerCase();
  if (l.includes("কোষ বিভাজন")) return "cell-division";
  if (l.includes("কোষপ্রাচীর") || l.includes("কোষ প্রাচীর")) return "cell-wall";
  if (l.includes("স্পোরাঞ্জ")) return "sporangium";
  if (l.includes("প্লাজমিড")) return "plasmid";
  if (l.includes("ফার্ন")) return "fern-prothallus";
  if (l.includes("সমপার্শ্ব") || l.includes("ভাস্কুলার")) return "vascular-bundle";
  if (/dna/i.test(l) && /rna/i.test(l)) return "dna-rna";
  return null;
}

function matchPhysics(text) {
  if (!/চিত্র|diagram|উদ্দীপক|চিত্রভিত্তিক/i.test(text)) return null;
  if (/দর্পণ|mirror|আয়না|আয়না|অবতল\s*দর্পণ|বক্রতার\s*কেন্দ্র|\\text\{PC\}|\\text\{PM\}/i.test(text)) return "ssc-concave-mirror";
  if (/লেন্স|lens|লেন্সটিতে|বিবর্ধন\s*এক/i.test(text)) return "ssc-convex-lens";
  if (/গোলক.*আধান|আধান.*গোলক/i.test(text)) return "ssc-charge-spheres";
  if (/তরঙ্গ|wave|চূড়া|crest/i.test(text)) return "wave-transverse";
  if (/বেলন|cylinder|উৎপাদক/i.test(text)) return "geo-cylinder-generator";
  if (/বর্তনী|circuit|রেজিস্ট|resistor|অ্যামিটার|voltmeter|V-I|I-V|VI\s*গ্রাফ/i.test(text)) return /সমান্তরাল|parallel/i.test(text) ? "circuit-parallel" : "circuit-series";
  if (/তড়িৎ\s*প্রাবল্য|electric\s*field/i.test(text)) return "electric-field-1";
  if (/ফোটন|photon|আলোক\s*তড়/i.test(text)) return "photon-energy-1";
  if (/অর্ধায়ু|half.?life|তেজস্ক্র/i.test(text)) return "half-life-1";
  if (/চাপ.*গভীরতা|pressure.*depth/i.test(text)) return "pressure-depth-1";
  if (/তাপীয়\s*বক্র|heating\s*curve|ঊর্ধ্বপাত/i.test(text)) return "heating-curve-1";
  if (/বিক্রিয়ক|reaction\s*rate|ঘনমাত্রা/i.test(text)) return "reaction-rate-1";
  if (/P-V|p-v\s*গ্রাফ|চক্রাকার/i.test(text)) return "pv-cycle-1";
  if (/সরল\s*ছন্দ|simple\s*harmonic|সরলদোলক/i.test(text)) return "shm-graph-1";
  if (/স্থির\s*চাপ|আদর্শ\s*গ্যাস|V-T|volume.*temperature/i.test(text)) return "vt-graph-1";
  return null;
}

function matchBiology(text) {
  if (!/চিত্র|diagram|উদ্দীপক/i.test(text)) return null;
  if (/নেফ্রন|glomerul|Ultrafiltration|ছাঁকনি/i.test(text)) return "bio-nephron";
  if (/নিউরন|neuron|স্নায়ু|synapse|সংযোগস্থল/i.test(text)) return "bio-neuron";
  if (/চক্ষু|retina|cornea|চোখ/i.test(text) && !/দর্পণ|লেন্স|mirror|lens/i.test(text)) return "bio-eye";
  if (/খাদ্যনাল|পাকস্থল|digestive/i.test(text)) return "bio-digestive";
  if (/অ্যালভিওল|alveoli/i.test(text)) return "bio-alveoli";
  if (/জাইলেম|ফ্লোয়েম|xylem|phloem/i.test(text)) return "bio-xylem-phloem";
  if (/\bGate\b|logic\s*gate|লজিক/i.test(text)) return "nor-gate";
  if (/\(\s*উদ্দীপক\s*[:：]\s*DNA\s*ও\s*RNA\s*\)/i.test(text)) return "dna-rna";
  return null;
}

function matchMathGeometry(text) {
  if (!/চিত্র|triangle|ত্রিভুজ|বৃত্ত|circle|coordinate|স্থানাঙ্ক|O\s*কেন্দ্র|angle|সমকোণ|median|মধ্যমা|altitude|লম্ব|orthocenter|trapezoid|ট্রাপিজ|parabola|graph|লেখচিত্র|গ্রাফ/i.test(text)) return null;
  if (/ট্রাপিজ|trapezoid|XY|মধ্যম\s*রেখা/i.test(text)) return "geo-trapezoid";
  if (/মধ্যমা|median/i.test(text)) return "geo-triangle-medians";
  if (/লম্ব|altitude|orthocenter|লম্ব\s*ত্র/i.test(text)) return "geo-triangle-altitudes";
  if (/স্থানাঙ্ক|coordinate|\(\s*\d+\s*,\s*\d+\s*\)/i.test(text)) return "geo-coord-triangle";
  if (/circle\s*equation|বৃত্ত.*সমীকরণ/i.test(text)) return "geo-circle-equation";
  if (/বৃত্ত|circle|কেন্দ্র\s*O|O\s*কেন্দ্র/i.test(text)) return "geo-circle-center-o";
  if (/সমকোণ|right\s*angle|90/i.test(text)) return "geo-triangle-right";
  if (/triangle|ত্রিভুজ|ABC/i.test(text)) return "geo-triangle-right";
  if (/parabola|প্যারাবোলা/i.test(text)) return "parabola-graph-1";
  if (/লেখচিত্র|graph|গ্রাফ|function|ফাংশন/i.test(text)) return "function-test-1";
  return null;
}

function resolveDiagramTopic(text, questionId) {
  const t = String(text || "");
  if (!t) return { slug: `generated/${safeId(questionId)}`, kind: "generated" };
  for (const fn of [matchBracketChitra, matchParenChitra, matchPhysics, matchBiology, matchMathGeometry]) {
    const slug = fn(t);
    if (slug && LIBRARY_SLUGS.has(slug)) return { slug, kind: "library" };
  }
  const hintMatch = t.match(/\[চিত্র\s*[:：]\s*([^\]]+)\]/i);
  const hint = hintMatch ? normalizeHint(hintMatch[1]).slice(0, 100) : normalizeHint(t).slice(0, 80);
  if (/বৃত্ত|circle|O\s*কেন্দ্র/i.test(t)) return { slug: "geo-circle-center-o", kind: "library" };
  if (/ত্রিভুজ|triangle/i.test(t)) return { slug: "geo-triangle-right", kind: "library" };
  if (/বর্তনী|circuit/i.test(t)) return { slug: "circuit-series", kind: "library" };
  if (/তরঙ্গ|wave/i.test(t)) return { slug: "wave-transverse", kind: "library" };
  if (/লেখচিত্র|graph|গ্রাফ/i.test(t)) return { slug: "function-test-1", kind: "library" };
  return { slug: `generated/${safeId(questionId)}`, kind: "generated", hint };
}

function imagePathForSlug(slug) {
  return `/images/quiz/${slug}.svg`;
}

function escapeXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function generatedReferenceSvg(hint, title = "Diagram") {
  const safeHint = escapeXml(String(hint || "Diagram"));
  const safeTitle = escapeXml(String(title || "Diagram"));
  return `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="200" rx="12" fill="#0f172a"/><rect x="24" y="24" width="272" height="112" rx="8" fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="6 4"/><text x="160" y="90" fill="#e2e8f0" font-family="Arial,sans-serif" font-size="12" text-anchor="middle">${safeHint}</text><text x="160" y="170" fill="#94a3b8" font-family="Arial,sans-serif" font-size="11" text-anchor="middle">${safeTitle}</text></svg>`;
}

module.exports = {
  LIBRARY_SLUGS,
  resolveDiagramTopic,
  imagePathForSlug,
  generatedReferenceSvg,
  safeId,
};
