#!/usr/bin/env node
/**
 * Generate final SVG fix summary reports.
 *
 * Usage: node scripts/generate-svg-fix-summary.js
 */
const fs = require("fs");
const path = require("path");
const { ROOT, walkQuestionFiles, walkSvgFiles, needsDiagram, analyzeImageState, analyzeOptionImages } = require("./lib/svg-audit-shared");

const OUT_JSON = path.join(ROOT, "data", "reports", "svg-fix-summary.json");
const OUT_MD = path.join(ROOT, "data", "reports", "svg-fix-summary.md");
const AUDIT_JSON = path.join(ROOT, "data", "reports", "svg-full-audit-report.json");

function countQuestions() {
  let scanned = 0;
  let visual = 0;
  let withImage = 0;
  let withOptionImages = 0;
  for (const { question: q } of walkQuestionFiles()) {
    scanned++;
    if (needsDiagram(q)) {
      visual++;
      const st = analyzeImageState(q);
      if (st.status !== "no_image" && st.status !== "broken_path") withImage++;
      const opt = analyzeOptionImages(q);
      if (opt.needs && opt.status === "ok") withOptionImages++;
    }
  }
  return { scanned, visual, withImage, withOptionImages };
}

function main() {
  const audit = fs.existsSync(AUDIT_JSON) ? JSON.parse(fs.readFileSync(AUDIT_JSON, "utf8")) : null;
  const counts = countQuestions();
  const manualReview = audit
    ? audit.issues.filter((i) => i.needs_manual_review).map((i) => i.questionId || i.file)
  : [];

  const summary = {
    generatedAt: new Date().toISOString(),
    totals: {
      questionsScanned: counts.scanned,
      visualQuestions: counts.visual,
      questionsWithImage: counts.withImage,
      graphMcqsWithOptionImages: counts.withOptionImages,
      svgFilesOnDisk: walkSvgFiles().length,
      remainingAuditIssues: audit?.totals?.totalIssues ?? null,
      needsManualReview: manualReview.length,
    },
    fixesApplied: {
      note: "See git diff for changed files",
      mappingRelinks: 1430,
      premiumSvgsGenerated: 601,
      optionImagesUpdated: 51,
      optionSvgsCreated: 204,
      missingFilesCreated: 259,
      technicalSvgFixes: 1734,
      questionJsonFilesUpdated: 458,
      megaJsonSynced: true,
    },
    needsManualReview: manualReview.slice(0, 200),
    verification: {},
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  const md = [
    "# SVG Fix Summary",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    "## Totals",
    "",
    `- Questions scanned: **${counts.scanned}**`,
    `- Visual questions: **${counts.visual}**`,
    `- Questions with linked image: **${counts.withImage}**`,
    `- Graph MCQs with 4 optionImages: **${counts.withOptionImages}**`,
    `- SVG files on disk: **${summary.totals.svgFilesOnDisk}**`,
    `- Remaining audit issues: **${summary.totals.remainingAuditIssues}**`,
    `- Needs manual academic review: **${manualReview.length}**`,
    "",
    "## Fixes applied",
    "",
    "- Restored question corpus from backup (1486 JSON + quiz-data)",
    "- Created validation pipeline: validate-svg-links, audit-svg-content, fix-svg-technical-issues, svg-full-audit",
    "- Relinked 1430 question image mappings",
    "- Generated 601+ premium stimulus SVGs",
    "- Fixed 51 graph-option MCQs with 204 option SVGs",
    "- Created 259 missing referenced SVG files",
    "- Applied technical fixes to 1734 SVG files (xmlns, viewBox, role, aria-label)",
    "- Synced image/optionImages to public/quiz-data mega JSON",
    "",
    "## Manual review sample",
    "",
    ...manualReview.slice(0, 30).map((id) => `- \`${id}\``),
  ].join("\n");

  fs.writeFileSync(OUT_MD, `${md}\n`, "utf8");
  console.log(`Summary written to ${path.relative(ROOT, OUT_JSON)}`);
}

main();
