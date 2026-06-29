#!/usr/bin/env node
/**
 * Safely fix technical SVG structure (xmlns, viewBox, role, aria-label, font-family).
 * Does NOT modify academic diagram content.
 *
 * Usage:
 *   node scripts/fix-svg-technical-issues.js           # dry-run
 *   node scripts/fix-svg-technical-issues.js --apply
 */
const fs = require("fs");
const path = require("path");
const { walkSvgFiles } = require("./lib/svg-audit-shared");

const APPLY = process.argv.includes("--apply");
const FONT_FALLBACK = "Noto Sans Bengali, Arial, sans-serif";

function slugToLabel(slug) {
  return slug.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim() || "Quiz diagram";
}

function fixSvgContent(content, filePath) {
  let fixed = content;
  let changed = false;
  const basename = path.basename(filePath, ".svg");
  const label = slugToLabel(basename);

  if (!/xmlns\s*=\s*["']http:\/\/www\.w3\.org\/2000\/svg["']/i.test(fixed)) {
    fixed = fixed.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
    changed = true;
  }

  if (!/viewBox\s*=/i.test(fixed)) {
    fixed = fixed.replace(/<svg\b([^>]*)>/i, (m, attrs) => {
      if (/viewBox/i.test(attrs)) return m;
      return `<svg${attrs} viewBox="0 0 900 520">`;
    });
    changed = true;
  }

  if (!/role\s*=\s*["']img["']/i.test(fixed)) {
    fixed = fixed.replace(/<svg\b([^>]*)>/i, (m, attrs) => {
      if (/role=/i.test(attrs)) return m;
      return `<svg${attrs} role="img">`;
    });
    changed = true;
  }

  if (!/aria-label\s*=/i.test(fixed)) {
    const safeLabel = label.replace(/"/g, "'");
    fixed = fixed.replace(/<svg\b([^>]*)>/i, (m, attrs) => {
      if (/aria-label=/i.test(attrs)) return m;
      return `<svg${attrs} aria-label="${safeLabel}">`;
    });
    changed = true;
  }

  // Add font-family to <text> without one
  fixed = fixed.replace(/<text\b([^>]*)>/gi, (m, attrs) => {
    if (/font-family/i.test(attrs)) return m;
    changed = true;
    return `<text${attrs} font-family="${FONT_FALLBACK}">`;
  });

  return { fixed, changed };
}

function main() {
  const files = walkSvgFiles();
  let fixedCount = 0;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf8");
    const { fixed, changed } = fixSvgContent(content, filePath);
    if (changed) {
      fixedCount++;
      if (APPLY) fs.writeFileSync(filePath, fixed, "utf8");
    }
  }

  console.log(
    `${APPLY ? "🔧 Applied" : "📋 Dry-run"}: ${fixedCount} / ${files.length} SVG(s) need technical fixes`,
  );
  if (!APPLY && fixedCount > 0) {
    console.log("Run with --apply to write changes.");
  }
}

main();
