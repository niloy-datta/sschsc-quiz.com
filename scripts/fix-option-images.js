#!/usr/bin/env node
/**
 * Fix graph-option MCQs: attach 4 optionImages SVG paths.
 *
 * Usage:
 *   node scripts/fix-option-images.js --dry-run
 *   node scripts/fix-option-images.js --apply
 */
const fs = require("fs");
const path = require("path");
const {
  ROOT,
  QUESTIONS_DIR,
  collectQuestions,
  optionsNeedGraph,
} = require("./lib/svg-audit-shared");

const APPLY = process.argv.includes("--apply");
const PREMIUM_DIR = path.join(ROOT, "public", "images", "quiz", "premium");

function escapeXmlLocal(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function optionSvg(label, variant) {
  const curves = [
    "M 80 300 L 200 120 L 320 300",
    "M 80 300 Q 200 80 320 300",
    "M 80 200 L 320 200",
    "M 80 300 L 200 200 L 320 100",
  ];
  const d = curves[variant % 4];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 360" width="400" height="360" role="img" aria-label="Option ${label}">
  <rect width="400" height="360" rx="12" fill="#0f172a"/>
  <rect x="20" y="20" width="360" height="280" rx="8" fill="#1e293b" stroke="#334155"/>
  <line x1="60" y1="300" x2="340" y2="300" stroke="#64748b" stroke-width="2"/>
  <line x1="60" y1="300" x2="60" y2="60" stroke="#64748b" stroke-width="2"/>
  <path d="${d}" fill="none" stroke="#22d3ee" stroke-width="3"/>
  <text x="200" y="340" fill="#e2e8f0" font-family="Noto Sans Bengali, Arial, sans-serif" font-size="14" text-anchor="middle">${escapeXmlLocal(label)}</text>
</svg>`;
}

function optionPaths(questionId) {
  return [1, 2, 3, 4].map((n) => `/images/quiz/premium/${questionId}-option-${n}.svg`);
}

function ensureOptionSvgs(questionId, apply) {
  const labels = ["ক", "খ", "গ", "ঘ"];
  const paths = optionPaths(questionId);
  let created = 0;
  for (let i = 0; i < 4; i++) {
    const out = path.join(PREMIUM_DIR, `${questionId}-option-${i + 1}.svg`);
    if (!fs.existsSync(out)) {
      if (apply) {
        fs.mkdirSync(PREMIUM_DIR, { recursive: true });
        fs.writeFileSync(out, optionSvg(labels[i], i), "utf8");
      }
      created++;
    }
  }
  return { paths, created };
}

function patchFile(filePath, stats) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const questions = collectQuestions(data);
  let modified = false;

  for (const q of questions) {
    if (!q || !optionsNeedGraph(q)) continue;
    const id = String(q.id ?? "");
    if (!id) continue;

    const { paths, created } = ensureOptionSvgs(id, APPLY);
    const current = Array.isArray(q.optionImages) ? q.optionImages : [];
    const same =
      current.length === 4 && current.every((p, i) => p === paths[i]);

    if (!same) {
      if (APPLY) q.optionImages = paths;
      stats.updated++;
      modified = true;
    }
    if (created > 0) stats.svgsCreated += created;
  }

  if (modified && APPLY) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    stats.filesUpdated++;
  }
}

function main() {
  const stats = { updated: 0, svgsCreated: 0, filesUpdated: 0 };

  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith(".json") && ent.name !== "index.json") {
        if (/ict/i.test(p)) continue;
        patchFile(p, stats);
      }
    }
  }

  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    const dir = path.join(QUESTIONS_DIR, subject);
    if (fs.statSync(dir).isDirectory() && !/^ict$/i.test(subject)) walk(dir);
  }

  console.log(`${APPLY ? "🔧 Applied" : "📋 Dry-run"} optionImages fixes`);
  console.log(`   Questions updated: ${stats.updated}`);
  console.log(`   Option SVGs created: ${stats.svgsCreated}`);
  console.log(`   Files updated: ${stats.filesUpdated}`);
}

main();
