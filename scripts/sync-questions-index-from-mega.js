/**
 * Sync public/questions/{subject}/index.json modelTests from quiz-data mega JSON.
 * Only includes sets that have a sidecar JSON file on disk.
 *
 * Usage: node scripts/sync-questions-index-from-mega.js [subject-slug]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUIZ_DATA = path.join(ROOT, "public", "quiz-data");
const QUESTIONS = path.join(ROOT, "public", "questions");

function inferScope(setId, meta) {
  if (meta?.scope) return meta.scope;
  if (/chapter-\d{2}/i.test(setId)) return "chapter";
  if (/tier-a-hot|paper|whole|full-book/i.test(setId)) return "paper";
  return "paper";
}

function titleFromId(setId) {
  const m = setId.match(/chapter-(\d{2}).*?(?:model-test|set)-(\d{2})/i);
  if (m) return `Chapter ${m[1]} Model Test ${m[2]}`;
  const hot = setId.match(/model-test-(\d{2})$/i);
  if (hot) return `Model Test ${hot[1]}`;
  return setId.replace(/-/g, " ");
}

function syncSubject(level, slug) {
  const megaPath = path.join(QUIZ_DATA, level, `${slug}.json`);
  const subjectDir = path.join(QUESTIONS, slug);
  const indexPath = path.join(subjectDir, "index.json");

  if (!fs.existsSync(megaPath)) {
    console.warn(`Skip — no mega JSON: ${level}/${slug}`);
    return null;
  }

  const mega = JSON.parse(fs.readFileSync(megaPath, "utf8"));
  const metaByKey = mega.modelTestsMeta || {};
  const modelTests = [];

  for (const [setId, questions] of Object.entries(mega.modelTests || {})) {
    if (!Array.isArray(questions) || questions.length === 0) continue;

    const sidecar = path.join(subjectDir, `${setId}.json`);
    const sidecarAlt = path.join(subjectDir, "model-tests", `${setId}.json`);
    if (!fs.existsSync(sidecar) && !fs.existsSync(sidecarAlt)) continue;

    const meta = metaByKey[setId] || {};
    modelTests.push({
      id: setId,
      title: meta.displayTitle || meta.name || titleFromId(setId),
      questionCount: questions.length,
      scope: inferScope(setId, meta),
      importance: meta.importance || (/chapter-\d{2}/.test(setId) ? "high" : undefined),
      tags: meta.tags || (/chapter-\d{2}/.test(setId) ? ["chapter-wise", "high-priority"] : []),
      chaptersCovered: meta.chaptersCovered,
    });
  }

  modelTests.sort((a, b) => a.id.localeCompare(b.id));

  let index = { subject: slug, chapters: [], modelTests: [], boards: [] };
  if (fs.existsSync(indexPath)) {
    try {
      index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    } catch {
      /* reset */
    }
  }

  index.modelTests = modelTests;

  const importedChapterCount = modelTests.filter(
    (m) =>
      m.scope === "chapter" &&
      /chapter-\d{2}-(?:high-priority-)?(?:set|model-test)-\d{2}/i.test(m.id),
  ).length;
  if (importedChapterCount > 0) {
    index.chapters = [];
  }

  if (!fs.existsSync(subjectDir)) fs.mkdirSync(subjectDir, { recursive: true });
  fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");

  console.log(`✅ ${level}/${slug}: ${modelTests.length} model tests synced to questions/index.json`);
  return modelTests.length;
}

function main() {
  const target = process.argv[2];
  const subjects = [];

  if (target) {
    const level = fs.existsSync(path.join(QUIZ_DATA, "hsc", `${target}.json`)) ? "hsc" : "ssc";
    subjects.push({ level, slug: target });
  } else {
    for (const level of ["ssc", "hsc"]) {
      const dir = path.join(QUIZ_DATA, level);
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir)) {
        if (file.endsWith(".json") && !file.includes(".model-tests.index")) {
          subjects.push({ level, slug: file.replace(".json", "") });
        }
      }
    }
  }

  let total = 0;
  for (const { level, slug } of subjects) {
    total += syncSubject(level, slug) || 0;
  }
  console.log(`\nDone. ${total} model test entries synced.`);
}

main();
