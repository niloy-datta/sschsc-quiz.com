#!/usr/bin/env node
/**
 * Validate that all question image/optionImages paths exist on disk.
 *
 * Usage: node scripts/validate-svg-links.js
 * Exit 1 if any broken links.
 */
const {
  walkQuestionFiles,
  fileExists,
  imagePath,
} = require("./lib/svg-audit-shared");

function main() {
  const broken = [];
  const seen = new Set();

  for (const { question: q, relFile } of walkQuestionFiles()) {
    const id = String(q.id ?? "unknown");
    const img = imagePath(q);
    if (img && !fileExists(img)) {
      const key = `${id}:${img}:image`;
      if (!seen.has(key)) {
        seen.add(key);
        broken.push({ questionId: id, file: relFile, field: "image", path: img });
      }
    }
    if (Array.isArray(q.optionImages)) {
      q.optionImages.forEach((p, i) => {
        if (typeof p === "string" && p.trim() && !fileExists(p)) {
          const key = `${id}:${p}:optionImages[${i}]`;
          if (!seen.has(key)) {
            seen.add(key);
            broken.push({
              questionId: id,
              file: relFile,
              field: `optionImages[${i}]`,
              path: p,
            });
          }
        }
      });
    }
  }

  console.log(`🔗 SVG link validation: ${broken.length} broken link(s)`);
  for (const b of broken.slice(0, 20)) {
    console.log(`  ${b.questionId} [${b.field}] → ${b.path}`);
    console.log(`    in ${b.file}`);
  }
  if (broken.length > 20) console.log(`  ... and ${broken.length - 20} more`);

  if (broken.length > 0) {
    console.log("\n❌ VALIDATION FAILED\n");
    process.exit(1);
  }
  console.log("\n✅ All SVG links valid\n");
}

main();
