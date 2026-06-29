#!/usr/bin/env node
/**
 * Generate missing SVG files for question image paths that don't exist on disk.
 *
 * Usage: node scripts/ensure-svg-files-exist.js [--apply]
 */
const fs = require("fs");
const path = require("path");
const {
  ROOT,
  PUBLIC_DIR,
  walkQuestionFiles,
  imagePath,
  fileExists,
  questionText,
} = require("./lib/svg-audit-shared");

const APPLY = process.argv.includes("--apply");

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  </defs>
  <rect width="900" height="520" rx="16" fill="url(#bgGrad)"/>
  <rect x="40" y="40" width="820" height="400" rx="12" fill="#1e293b" stroke="#334155"/>
  <text x="450" y="220" fill="#e2e8f0" font-family="Noto Sans Bengali, Arial, sans-serif" font-size="14" text-anchor="middle">${safeHint}</text>
  <text x="450" y="480" fill="#94a3b8" font-family="Noto Sans Bengali, Arial, sans-serif" font-size="11" text-anchor="middle">${safeTitle}</text>
</svg>`;
}

function main() {
  const missing = new Map();
  for (const { question: q } of walkQuestionFiles()) {
    const img = imagePath(q);
    if (img && !fileExists(img)) {
      missing.set(img, String(q.id ?? img));
    }
    if (Array.isArray(q.optionImages)) {
      for (const p of q.optionImages) {
        if (typeof p === "string" && p.trim() && !fileExists(p)) {
          missing.set(p, String(q.id ?? p));
        }
      }
    }
  }

  console.log(`Missing SVG files referenced: ${missing.size}`);
  let created = 0;
  for (const [webPath, id] of missing) {
    const disk = path.join(PUBLIC_DIR, webPath.replace(/^\//, ""));
    if (APPLY) {
      fs.mkdirSync(path.dirname(disk), { recursive: true });
      fs.writeFileSync(disk, wrapPremiumSvg(id, questionText({ id, text: id })), "utf8");
      created++;
    }
  }
  console.log(`${APPLY ? "Created" : "Would create"}: ${created || missing.size}`);
}

main();
