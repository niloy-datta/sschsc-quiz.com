/**
 * delete-all-duplicate-sets.js
 * Safely deletes completely duplicate model test sets (keeping the first one).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const BACKEND_ANSWERS = path.join(ROOT, "backend", "data", "answers");

function deleteIfExists(filePath) {
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

function cleanSubjectDuplicates(filepath) {
  const level = filepath.includes("hsc") ? "hsc" : "ssc";
  const subjectSlug = path.basename(filepath, ".json");
  
  const megaPath = filepath;
  const modelIndexPath = path.join(
    PUBLIC,
    "quiz-data",
    level,
    `${subjectSlug}.model-tests.index.json`
  );
  const questionsIndexPath = path.join(PUBLIC, "questions", subjectSlug, "index.json");

  const data = JSON.parse(fs.readFileSync(megaPath, "utf8"));
  const modelTests = data.modelTests || {};
  
  if (!Object.keys(modelTests).length) {
    return { deleted: 0 };
  }

  // Identify duplicate groups by question text lists
  const groupedSets = {};
  for (const [k, qs] of Object.entries(modelTests)) {
    const qtexts = JSON.stringify(qs.map(q => (q.questionText || "").trim()).sort());
    groupedSets[qtexts] = groupedSets[qtexts] || [];
    groupedSets[qtexts].push(k);
  }

  const toDelete = [];
  for (const [qtexts, sets] of Object.entries(groupedSets)) {
    if (sets.length > 1) {
      // Keep the first, delete the rest
      toDelete.push(...sets.slice(1));
    }
  }

  if (toDelete.length === 0) {
    console.log(`✓ ${level.toUpperCase()} ${subjectSlug}: No duplicate sets found.`);
    return { deleted: 0 };
  }

  console.log(`🗑️  ${level.toUpperCase()} ${subjectSlug}: Deleting ${toDelete.length} duplicate sets:`);
  console.log(`   Deleting slugs: ${toDelete.slice(0, 5).join(", ")}${toDelete.length > 5 ? "..." : ""}`);

  let sidecarDeleted = 0;
  for (const slug of toDelete) {
    // 1. Delete from mega JSON in memory
    delete data.modelTests[slug];
    if (data.modelTestsMeta) {
      delete data.modelTestsMeta[slug];
    }

    // 2. Delete sidecar files
    if (deleteIfExists(path.join(PUBLIC, "questions", subjectSlug, `${slug}.json`))) {
      sidecarDeleted++;
    }
    if (deleteIfExists(path.join(BACKEND_ANSWERS, subjectSlug, `${slug}.answers.json`))) {
      sidecarDeleted++;
    }
  }

  // Write updated mega JSON
  fs.writeFileSync(megaPath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");

  // Update model index file
  if (fs.existsSync(modelIndexPath)) {
    const index = JSON.parse(fs.readFileSync(modelIndexPath, "utf8"));
    if (index.modelTests && !Array.isArray(index.modelTests)) {
      for (const slug of toDelete) {
        delete index.modelTests[slug];
      }
    } else if (Array.isArray(index.modelTests)) {
      index.modelTests = index.modelTests.filter((m) => !toDelete.includes(m.id || m.slug));
    }
    if (Array.isArray(index.tests)) {
      index.tests = index.tests.filter((m) => !toDelete.includes(m.id));
    }
    fs.writeFileSync(modelIndexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  }

  // Update questions index file
  if (fs.existsSync(questionsIndexPath)) {
    const qIndex = JSON.parse(fs.readFileSync(questionsIndexPath, "utf8"));
    if (Array.isArray(qIndex.modelTests)) {
      qIndex.modelTests = qIndex.modelTests.filter((m) => !toDelete.includes(m.id));
    }
    fs.writeFileSync(questionsIndexPath, `${JSON.stringify(qIndex, null, 2)}\n`, "utf8");
  }

  console.log(`   ✓ Removed ${toDelete.length} sets and ${sidecarDeleted} sidecar files.`);
  return { deleted: toDelete.length };
}

function main() {
  const sscDir = path.join(PUBLIC, "quiz-data", "ssc");
  const hscDir = path.join(PUBLIC, "quiz-data", "hsc");
  const jsonFiles = [];

  if (fs.existsSync(sscDir)) {
    fs.readdirSync(sscDir).forEach((f) => {
      if (f.endsWith(".json")) jsonFiles.push(path.join(sscDir, f));
    });
  }
  if (fs.existsSync(hscDir)) {
    fs.readdirSync(hscDir).forEach((f) => {
      if (f.endsWith(".json")) jsonFiles.push(path.join(hscDir, f));
    });
  }

  // Filter index and manifest
  const subjectFiles = jsonFiles.filter(
    (f) => !f.endsWith(".model-tests.index.json") && !f.endsWith("manifest.json")
  );

  let totalDeleted = 0;
  for (const f of subjectFiles) {
    const res = cleanSubjectDuplicates(f);
    totalDeleted += res.deleted;
  }

  console.log(`\n🎉 Cleanup complete. Total duplicate sets deleted: ${totalDeleted}`);
}

main();
