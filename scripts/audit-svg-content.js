#!/usr/bin/env node
/**
 * Audit SVG files for technical quality issues.
 *
 * Usage: node scripts/audit-svg-content.js
 */
const fs = require("fs");
const path = require("path");
const { walkSvgFiles } = require("./lib/svg-audit-shared");

const DEV_KEYWORDS_RE = /\b(variant|placeholder|stimulus|template|debug|fixme|todo|sample)\b/i;
const PLACEHOLDER_PHRASE_RE =
  /Auto-generated|Question-specific reference|valid SVG placeholder|placeholder diagram/i;
const TEXT_CONTENT_RE = /<text[^>]*>([^<]+)<\/text>/gi;
const REVEALING_PHRASES_RE = /ধ্রুব রেখা/i;

function auditSvgContent(filePath) {
  const issues = [];
  const rel = path.relative(process.cwd(), filePath);
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return [{ file: rel, category: "read_error", severity: "CRITICAL" }];
  }

  if (!content.trim()) {
    issues.push({ file: rel, category: "empty_svg", severity: "CRITICAL" });
    return issues;
  }

  const openCount = (content.match(/<svg[\s>]/gi) || []).length;
  const closeCount = (content.match(/<\/svg>/gi) || []).length;
  if (openCount === 0 || closeCount === 0 || openCount !== closeCount) {
    issues.push({ file: rel, category: "invalid_xml_structure", severity: "CRITICAL" });
  }

  if (!/xmlns\s*=\s*["']http:\/\/www\.w3\.org\/2000\/svg["']/i.test(content)) {
    issues.push({ file: rel, category: "missing_xmlns", severity: "MEDIUM" });
  }
  if (!/viewBox\s*=/i.test(content)) {
    issues.push({ file: rel, category: "missing_viewBox", severity: "MEDIUM" });
  }
  if (!/role\s*=\s*["']img["']/i.test(content)) {
    issues.push({ file: rel, category: "missing_role_img", severity: "MEDIUM" });
  }
  if (!/aria-label\s*=/i.test(content)) {
    issues.push({ file: rel, category: "missing_aria_label", severity: "MEDIUM" });
  }

  if (DEV_KEYWORDS_RE.test(content) || PLACEHOLDER_PHRASE_RE.test(content)) {
    issues.push({ file: rel, category: "placeholder_text", severity: "HIGH" });
  }
  if (REVEALING_PHRASES_RE.test(content)) {
    issues.push({ file: rel, category: "answer_revealing_text", severity: "HIGH" });
  }

  const textEls = Array.from(content.matchAll(TEXT_CONTENT_RE), (m) => m[1].trim());
  if (textEls.length > new Set(textEls).size) {
    issues.push({ file: rel, category: "duplicate_text_elements", severity: "MEDIUM" });
  }

  // Low contrast: white/light text on light background
  const hasLightBg = /#f8fafc|#ffffff|#fff["\s>]/i.test(content);
  const hasWhiteText = /fill\s*=\s*["']#fff(?:fff)?["']/i.test(content);
  if (hasLightBg && hasWhiteText) {
    issues.push({ file: rel, category: "poor_contrast_light_on_light", severity: "HIGH" });
  }

  // Gray on dark below readable threshold
  const hasDarkBg = /#0f172a|#1e293b|#111827/i.test(content);
  const hasMutedGrayText = /fill\s*=\s*["']#64748b["']/i.test(content);
  if (hasDarkBg && hasMutedGrayText && !/fill\s*=\s*["']#e2e8f0["']/i.test(content)) {
    issues.push({ file: rel, category: "poor_contrast_gray_on_dark", severity: "HIGH" });
  }

  return issues;
}

function main() {
  const files = walkSvgFiles();
  const allIssues = [];
  const byCategory = {};

  for (const f of files) {
    const issues = auditSvgContent(f);
    for (const issue of issues) {
      allIssues.push(issue);
      byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
    }
  }

  console.log(`🔍 SVG content audit: ${files.length} files scanned`);
  console.log(`⚠️  ${allIssues.length} issue(s) found`);
  console.log("By category:", byCategory);

  const critical = allIssues.filter((i) => i.severity === "CRITICAL");
  if (critical.length > 0) {
    console.log(`\n❌ ${critical.length} CRITICAL issue(s)`);
    process.exit(1);
  }
  console.log("\n✅ No CRITICAL SVG content issues\n");
}

main();
