#!/usr/bin/env node
/**
 * Fix question ↔ SVG mappings: relink library SVGs, existing per-question files,
 * and generate premium placeholder SVGs for critical missing diagrams.
 *
 * Usage:
 *   node scripts/fix-svg-mappings.js --dry-run
 *   node scripts/fix-svg-mappings.js --apply
 *   node scripts/fix-svg-mappings.js --apply --limit 100
 */
const fs = require("fs");
const path = require("path");
const {
  ROOT,
  QUESTIONS_DIR,
  collectQuestions,
  needsDiagram,
  questionText,
  imagePath,
  fileExists,
  isPlaceholderPath,
  analyzeImageState,
} = require("./lib/svg-audit-shared");
const {
  resolveDiagramTopic,
  imagePathForSlug,
  LIBRARY_SLUGS,
} = require("./lib/diagram-topic-resolver");

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const APPLY = process.argv.includes("--apply");
const LIMIT = (() => {
  const i = process.argv.indexOf("--limit");
  return i >= 0 ? parseInt(process.argv[i + 1], 10) : Infinity;
})();

const PREMIUM_DIR = path.join(ROOT, "public", "images", "quiz", "premium");
const PROTECTED = new Map([
  ["ssc-physics-chapter-12-model-test-06-q23", "/images/quiz/ssc-wave-standing.svg"],
  ["ssc-physics-chapter-12-model-test-06-q24", "/images/quiz/ssc-wave-standing.svg"],
]);

function svgExistsForSlug(slug) {
  return (
    fs.existsSync(path.join(ROOT, "public", "images", "quiz", `${slug}.svg`)) ||
    fs.existsSync(path.join(PREMIUM_DIR, `${slug}.svg`))
  );
}

function premiumPath(questionId) {
  return `/images/quiz/premium/${questionId}.svg`;
}

function wrapPremiumSvg(title, hint) {
  const safeTitle = escapeXml(title.slice(0, 80));
  const safeHint = escapeXml((hint || title).slice(0, 120));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520" width="900" height="520" role="img" aria-label="${safeTitle}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <filter id="glowCyan" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#22d3ee" flood-opacity="0.55"/>
    </filter>
  </defs>
  <rect width="900" height="520" rx="16" fill="url(#bgGrad)"/>
  <rect x="40" y="40" width="820" height="400" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
  <text x="450" y="200" fill="#e2e8f0" font-family="Noto Sans Bengali, Arial, sans-serif" font-size="16" text-anchor="middle">${safeHint}</text>
  <line x1="120" y1="280" x2="780" y2="280" stroke="#22d3ee" stroke-width="2.5" filter="url(#glowCyan)"/>
  <circle cx="450" cy="280" r="6" fill="#f472b6"/>
  <text x="450" y="480" fill="#94a3b8" font-family="Noto Sans Bengali, Arial, sans-serif" font-size="12" text-anchor="middle">${safeTitle}</text>
</svg>`;
}

function extractChitraHint(text) {
  const b = text.match(/\[চিত্র\s*[:：]\s*([^\]]+)\]/i);
  if (b) return b[1].trim();
  const p = text.match(/\(\s*চিত্র\s*[:：]\s*([^)]+)\s*\)/i);
  if (p) return p[1].trim();
  return null;
}

function resolveBestImage(q) {
  const id = String(q.id ?? "");
  const text = questionText(q);
  if (PROTECTED.has(id)) return { path: PROTECTED.get(id), action: "protected" };

  const resolved = resolveDiagramTopic(text, id);
  if (resolved.kind === "library" && LIBRARY_SLUGS.has(resolved.slug) && svgExistsForSlug(resolved.slug)) {
    return { path: imagePathForSlug(resolved.slug), action: "library" };
  }

  const prem = premiumPath(id);
  if (fileExists(prem)) return { path: prem, action: "existing_premium" };

  const rootPath = `/images/quiz/${id}.svg`;
  if (fileExists(rootPath)) return { path: rootPath, action: "existing_root" };

  return { path: prem, action: "generate", hint: extractChitraHint(text) || resolved.hint || text.slice(0, 80) };
}

function patchFile(filePath, stats) {
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  const questions = collectQuestions(data);
  let modified = false;
  let count = 0;

  for (const q of questions) {
    if (!q || typeof q !== "object") continue;
    if (!needsDiagram(q)) continue;
    if (stats.fixed >= LIMIT) break;

    const state = analyzeImageState(q);
    const current = imagePath(q);
    const best = resolveBestImage(q);

    const needsFix =
      state.status === "no_image" ||
      state.status === "broken_path" ||
      (state.status === "placeholder" && best.action === "library") ||
      (best.action === "library" && current !== best.path) ||
      (best.action === "existing_premium" && current !== best.path) ||
      (best.action === "existing_root" && current !== best.path);

    if (!needsFix && state.status === "ok") continue;

    if (best.action === "generate") {
      const outFile = path.join(PREMIUM_DIR, `${q.id}.svg`);
      if (!fs.existsSync(outFile)) {
        if (APPLY) {
          fs.mkdirSync(PREMIUM_DIR, { recursive: true });
          fs.writeFileSync(outFile, wrapPremiumSvg(String(q.id), best.hint), "utf8");
          stats.generated++;
        } else {
          stats.wouldGenerate++;
        }
      }
    }

    if (current !== best.path) {
      if (APPLY) q.image = best.path;
      stats.relinked++;
      modified = true;
      count++;
      stats.fixed++;
      stats.byAction[best.action] = (stats.byAction[best.action] || 0) + 1;
    }
  }

  if (modified && APPLY) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    stats.filesUpdated++;
  }
  return count;
}

function walkAndFix(stats) {
  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    if (stats.fixed >= LIMIT) break;
    const dir = path.join(QUESTIONS_DIR, subject);
    if (!fs.statSync(dir).isDirectory()) continue;
    if (/^ict$/i.test(subject)) continue;

    function walk(d) {
      for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
        if (stats.fixed >= LIMIT) break;
        const p = path.join(d, ent.name);
        if (ent.isDirectory()) walk(p);
        else if (ent.name.endsWith(".json") && ent.name !== "index.json") {
          patchFile(p, stats);
        }
      }
    }
    walk(dir);
  }
}

function main() {
  const stats = {
    fixed: 0,
    relinked: 0,
    generated: 0,
    wouldGenerate: 0,
    filesUpdated: 0,
    byAction: {},
  };

  walkAndFix(stats);

  console.log(`${APPLY ? "🔧 Applied" : "📋 Dry-run"} SVG mapping fixes`);
  console.log(`   Relinked: ${stats.relinked}`);
  console.log(`   Generated: ${APPLY ? stats.generated : stats.wouldGenerate}`);
  console.log(`   Files updated: ${stats.filesUpdated}`);
  console.log("   By action:", stats.byAction);
}

main();
