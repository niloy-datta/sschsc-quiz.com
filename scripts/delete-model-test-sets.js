/**
 * Remove model test sets from quiz-data, indexes, and per-set question/answer files.
 *
 * Usage:
 *   node scripts/delete-model-test-sets.js <level> <subjectSlug> <slugPattern>
 *
 * Examples:
 *   node scripts/delete-model-test-sets.js hsc biology-2nd-paper chapter
 *   node scripts/delete-model-test-sets.js ssc general-math "chapter-07-model-test|chapter-14-model-test"
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const BACKEND_ANSWERS = path.join(ROOT, "backend", "data", "answers");

function slugMatches(slug, pattern) {
  if (pattern === "chapter") {
    return slug.includes("chapter");
  }
  if (pattern.includes("|")) {
    const parts = pattern.split("|").map((p) => p.trim()).filter(Boolean);
    return parts.some((p) => slug.includes(p));
  }
  return slug.includes(pattern);
}

function deleteIfExists(filePath) {
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

function removeSets(level, subjectSlug, pattern) {
  const megaPath = path.join(PUBLIC, "quiz-data", level, `${subjectSlug}.json`);
  const modelIndexPath = path.join(
    PUBLIC,
    "quiz-data",
    level,
    `${subjectSlug}.model-tests.index.json`,
  );
  const questionsIndexPath = path.join(PUBLIC, "questions", subjectSlug, "index.json");

  if (!fs.existsSync(megaPath)) {
    console.error(`❌ Not found: ${megaPath}`);
    process.exit(1);
  }

  const mega = JSON.parse(fs.readFileSync(megaPath, "utf8"));
  const allSlugs = Object.keys(mega.modelTests ?? {});
  const toDelete = allSlugs.filter((slug) => slugMatches(slug, pattern));

  if (!toDelete.length) {
    console.log(`ℹ️  No sets matched for ${level}/${subjectSlug} pattern "${pattern}"`);
    return { deleted: 0, slugs: [] };
  }

  let filesRemoved = 0;
  for (const slug of toDelete) {
    delete mega.modelTests[slug];
    if (mega.modelTestsMeta) delete mega.modelTestsMeta[slug];

    if (deleteIfExists(path.join(PUBLIC, "questions", subjectSlug, `${slug}.json`))) {
      filesRemoved++;
    }
    if (
      deleteIfExists(path.join(BACKEND_ANSWERS, subjectSlug, `${slug}.answers.json`))
    ) {
      filesRemoved++;
    }
  }

  fs.writeFileSync(megaPath, `${JSON.stringify(mega, null, 2)}\n`, "utf8");

  if (fs.existsSync(modelIndexPath)) {
    const index = JSON.parse(fs.readFileSync(modelIndexPath, "utf8"));
    if (index.modelTests && !Array.isArray(index.modelTests)) {
      for (const slug of toDelete) {
        delete index.modelTests[slug];
      }
    } else if (Array.isArray(index.modelTests)) {
      index.modelTests = index.modelTests.filter((m) => !toDelete.includes(m.id));
    }
    if (Array.isArray(index.tests)) {
      index.tests = index.tests.filter((m) => !toDelete.includes(m.id));
    }
    fs.writeFileSync(modelIndexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  }

  if (fs.existsSync(questionsIndexPath)) {
    const qIndex = JSON.parse(fs.readFileSync(questionsIndexPath, "utf8"));
    if (Array.isArray(qIndex.modelTests)) {
      qIndex.modelTests = qIndex.modelTests.filter((m) => !toDelete.includes(m.id));
    }
    fs.writeFileSync(questionsIndexPath, `${JSON.stringify(qIndex, null, 2)}\n`, "utf8");
  }

  console.log(
    `✅ ${level}/${subjectSlug}: removed ${toDelete.length} sets (${filesRemoved} sidecar files)`,
  );
  return { deleted: toDelete.length, slugs: toDelete, filesRemoved };
}

function main() {
  const [level, subjectSlug, pattern] = process.argv.slice(2);
  if (!level || !subjectSlug || !pattern) {
    console.error(
      "Usage: node scripts/delete-model-test-sets.js <level> <subjectSlug> <slugPattern>",
    );
    process.exit(1);
  }

  console.log(`\n🗑️  Deleting sets: ${level}/${subjectSlug} matching "${pattern}"\n`);
  const result = removeSets(level, subjectSlug, pattern);
  console.log(`\nDone. Total sets removed: ${result.deleted}`);
}

main();
