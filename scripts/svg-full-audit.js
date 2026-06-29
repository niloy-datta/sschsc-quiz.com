#!/usr/bin/env node
/**
 * Full SVG / diagram audit across questions, quiz-data, and SVG assets.
 *
 * Output:
 *   data/reports/svg-full-audit-report.json
 *   data/reports/svg-full-audit-report.md
 *
 * Usage: node scripts/svg-full-audit.js
 */
const fs = require("fs");
const path = require("path");
const {
  ROOT,
  walkQuestionFiles,
  walkSvgFiles,
  needsDiagram,
  questionText,
  imagePath,
  slugFromImage,
  fileExists,
  isPlaceholderPath,
  analyzeImageState,
  analyzeOptionImages,
  optionsNeedGraph,
} = require("./lib/svg-audit-shared");
const { resolveDiagramTopic, imagePathForSlug, LIBRARY_SLUGS } = require("./lib/diagram-topic-resolver");

const OUT_JSON = path.join(ROOT, "data", "reports", "svg-full-audit-report.json");
const OUT_MD = path.join(ROOT, "data", "reports", "svg-full-audit-report.md");

function svgExistsForSlug(slug) {
  if (!slug) return false;
  const candidates = [
    path.join(ROOT, "public", "images", "quiz", `${slug}.svg`),
    path.join(ROOT, "public", "images", "quiz", "premium", `${slug}.svg`),
  ];
  return candidates.some((p) => fs.existsSync(p));
}

function recommendedLibraryImage(text, questionId) {
  const resolved = resolveDiagramTopic(text, questionId);
  if (resolved.kind === "library" && LIBRARY_SLUGS.has(resolved.slug) && svgExistsForSlug(resolved.slug)) {
    return imagePathForSlug(resolved.slug);
  }
  return null;
}

function perQuestionPremiumPath(questionId) {
  return `/images/quiz/premium/${questionId}.svg`;
}

function auditQuestions() {
  const issues = [];
  const usedImages = new Set();
  let scanned = 0;
  let visualQuestions = 0;

  for (const { question: q, relFile } of walkQuestionFiles()) {
    scanned++;
    const id = String(q.id ?? "unknown");
    const text = questionText(q);
    if (!needsDiagram(q)) continue;
    visualQuestions++;

    const img = imagePath(q);
    if (img) usedImages.add(img);

    const imgState = analyzeImageState(q);
    const optState = analyzeOptionImages(q);
    const libImage = recommendedLibraryImage(text, id);
    const premiumPath = perQuestionPremiumPath(id);
    const premiumExists = fileExists(premiumPath);
    const idSlugPath = `/images/quiz/${id}.svg`;
    const idSlugExists = fileExists(idSlugPath);

    if (imgState.status === "no_image") {
      const recommended = libImage || (premiumExists ? premiumPath : idSlugExists ? idSlugPath : null);
      issues.push({
        id: `missing-image-${id}`,
        questionId: id,
        file: relFile,
        severity: "CRITICAL",
        category: "missing_image",
        currentImage: null,
        recommendedAction: recommended || "generate_premium_svg",
        recommendedImage: recommended,
        needs_manual_review: !recommended,
      });
      continue;
    }

    if (imgState.status === "broken_path") {
      const recommended = libImage || (premiumExists ? premiumPath : idSlugExists ? idSlugPath : null);
      issues.push({
        id: `broken-path-${id}`,
        questionId: id,
        file: relFile,
        severity: "CRITICAL",
        category: "broken_image_path",
        currentImage: img,
        recommendedAction: recommended ? "relink" : "generate_premium_svg",
        recommendedImage: recommended,
        needs_manual_review: !recommended,
      });
      continue;
    }

    if (libImage && img !== libImage && (isPlaceholderPath(img) || imgState.status === "placeholder_path")) {
      issues.push({
        id: `library-relink-${id}`,
        questionId: id,
        file: relFile,
        severity: "HIGH",
        category: "placeholder_should_use_library",
        currentImage: img,
        recommendedAction: "relink_library",
        recommendedImage: libImage,
        needs_manual_review: false,
      });
    }

    if (libImage && img && slugFromImage(img) !== slugFromImage(libImage) && !isPlaceholderPath(img)) {
      // Suspicious: attached slug differs from resolver (e.g. bio-eye on optics)
      const attachedSlug = slugFromImage(img);
      const isOptics = /দর্পণ|লেন্স|mirror|lens/i.test(text);
      const isEyeSlug = attachedSlug === "bio-eye";
      if (isEyeSlug && isOptics) {
        issues.push({
          id: `wrong-mapping-${id}`,
          questionId: id,
          file: relFile,
          severity: "CRITICAL",
          category: "wrong_svg_attached",
          currentImage: img,
          recommendedAction: "relink_library",
          recommendedImage: libImage,
          needs_manual_review: false,
        });
      }
    }

    if (optState.needs && optState.status === "missing_or_invalid") {
      issues.push({
        id: `missing-option-images-${id}`,
        questionId: id,
        file: relFile,
        severity: "CRITICAL",
        category: "missing_option_images",
        currentImage: img,
        recommendedAction: "generate_option_images",
        needs_manual_review: false,
      });
    } else if (optState.needs && optState.status === "broken_paths") {
      issues.push({
        id: `broken-option-images-${id}`,
        questionId: id,
        file: relFile,
        severity: "CRITICAL",
        category: "broken_option_images",
        currentImage: img,
        recommendedAction: "fix_option_image_paths",
        brokenPaths: optState.broken,
        needs_manual_review: false,
      });
    } else if (optionsNeedGraph(q) && (!Array.isArray(q.optionImages) || q.optionImages.length !== 4)) {
      issues.push({
        id: `graph-mcq-no-options-${id}`,
        questionId: id,
        file: relFile,
        severity: "HIGH",
        category: "graph_mcq_missing_option_svgs",
        currentImage: img,
        recommendedAction: "generate_option_images",
        needs_manual_review: true,
      });
    }
  }

  return { issues, scanned, visualQuestions, usedImages };
}

function auditSvgFiles(usedImages) {
  const issues = [];
  const slugCounts = new Map();

  for (const filePath of walkSvgFiles()) {
    const rel = path.relative(path.join(ROOT, "public"), filePath).replace(/\\/g, "/");
    const webPath = `/${rel}`;
    const basename = path.basename(filePath, ".svg");

    slugCounts.set(basename, (slugCounts.get(basename) || 0) + 1);

    let content;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch {
      issues.push({
        id: `svg-read-${basename}`,
        file: rel,
        severity: "CRITICAL",
        category: "invalid_svg_file",
        needs_manual_review: true,
      });
      continue;
    }

    if (!content.trim() || !/<\/svg>/i.test(content)) {
      issues.push({
        id: `svg-invalid-${basename}`,
        file: rel,
        severity: "CRITICAL",
        category: "invalid_svg_file",
        needs_manual_review: true,
      });
    }

    if (!/viewBox\s*=/i.test(content)) {
      issues.push({
        id: `svg-viewbox-${basename}`,
        file: rel,
        severity: "MEDIUM",
        category: "missing_viewBox",
        needs_manual_review: false,
      });
    }
    if (!/xmlns/i.test(content)) {
      issues.push({
        id: `svg-xmlns-${basename}`,
        file: rel,
        severity: "MEDIUM",
        category: "missing_xmlns",
        needs_manual_review: false,
      });
    }
    if (!/role\s*=\s*["']img["']/i.test(content)) {
      issues.push({
        id: `svg-role-${basename}`,
        file: rel,
        severity: "MEDIUM",
        category: "missing_accessibility",
        needs_manual_review: false,
      });
    }

    if (/placeholder|Auto-generated|Question-specific reference/i.test(content)) {
      issues.push({
        id: `svg-placeholder-${basename}`,
        file: rel,
        severity: "HIGH",
        category: "placeholder_svg_content",
        needs_manual_review: true,
      });
    }

    if (!usedImages.has(webPath) && !LIBRARY_SLUGS.has(basename)) {
      issues.push({
        id: `svg-orphan-${basename}`,
        file: rel,
        severity: "MEDIUM",
        category: "unused_orphan_svg",
        needs_manual_review: false,
      });
    }
  }

  for (const [slug, count] of slugCounts) {
    if (count > 1) {
      issues.push({
        id: `svg-dup-${slug}`,
        severity: "MEDIUM",
        category: "duplicate_svg_slug",
        slug,
        count,
        needs_manual_review: false,
      });
    }
  }

  return issues;
}

function buildMarkdown(report) {
  const lines = [
    "# SVG Full Audit Report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Questions scanned: **${report.totals.questionsScanned}**`,
    `- Visual questions: **${report.totals.visualQuestions}**`,
    `- SVG files on disk: **${report.totals.svgFiles}**`,
    `- Total issues: **${report.totals.totalIssues}**`,
    `- Needs manual review: **${report.totals.needsManualReview}**`,
    "",
    "### By severity",
    "",
  ];

  for (const [sev, count] of Object.entries(report.bySeverity)) {
    lines.push(`- ${sev}: ${count}`);
  }

  lines.push("", "### By category", "");
  for (const [cat, count] of Object.entries(report.byCategory).sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${cat}: ${count}`);
  }

  lines.push("", "## CRITICAL issues (sample)", "");
  const critical = report.issues.filter((i) => i.severity === "CRITICAL").slice(0, 30);
  for (const i of critical) {
    lines.push(`- \`${i.questionId || i.file}\` — ${i.category}${i.currentImage ? ` (${i.currentImage})` : ""}`);
  }

  lines.push("", "## Manual review required", "");
  const manual = report.issues.filter((i) => i.needs_manual_review).slice(0, 50);
  for (const i of manual) {
    lines.push(`- \`${i.questionId || i.file}\` — ${i.category}`);
  }

  return lines.join("\n");
}

function main() {
  const { issues: qIssues, scanned, visualQuestions, usedImages } = auditQuestions();
  const svgIssues = auditSvgFiles(usedImages);
  const allIssues = [...qIssues, ...svgIssues];

  const bySeverity = {};
  const byCategory = {};
  let needsManualReview = 0;
  for (const i of allIssues) {
    bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
    byCategory[i.category] = (byCategory[i.category] || 0) + 1;
    if (i.needs_manual_review) needsManualReview++;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      questionsScanned: scanned,
      visualQuestions,
      svgFiles: walkSvgFiles().length,
      totalIssues: allIssues.length,
      needsManualReview,
    },
    bySeverity,
    byCategory,
    issues: allIssues,
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(OUT_MD, `${buildMarkdown(report)}\n`, "utf8");

  console.log(`📊 SVG full audit complete`);
  console.log(`   Questions: ${scanned}, visual: ${visualQuestions}`);
  console.log(`   Issues: ${allIssues.length} (${needsManualReview} need manual review)`);
  console.log(`   JSON: ${path.relative(ROOT, OUT_JSON)}`);
  console.log(`   MD:   ${path.relative(ROOT, OUT_MD)}`);
}

main();
