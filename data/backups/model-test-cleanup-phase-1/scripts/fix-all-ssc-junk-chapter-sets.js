/**
 * Fix ALL SSC chapter model-test junk (repeated stems, template spam) across subjects.
 * - chemistry, physics, higher-math, biology, general-math
 *
 * Usage: node scripts/fix-all-ssc-junk-chapter-sets.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const { isLowQualitySet, uniqueStemCount, extractText } = require("./lib/ssc-set-quality");
const {
  writeSetBundle,
  loadMega,
  loadModelIndex,
  syncSetToMega,
  upsertQuestionsIndex,
  saveMegaAndIndex,
  pad2,
} = require("./lib/ssc-five-set-sync");
const {
  generateUniqueSet,
  HM_CHAPTER_NAMES,
  PHYSICS_CHAPTER_NAMES,
} = require("./lib/generate-ssc-chapter-mcqs");
const { generateChemistrySet } = require("./lib/generate-ssc-chemistry-mcqs");

const ROOT = path.resolve(__dirname, "..");
const QUARANTINE_ROOT = path.join(ROOT, "data", "quarantine");
const TARGET_SETS = 5;
const Q_PER_SET = 25;

const SSC_SUBJECTS = [
  { slug: "chemistry", chapters: 12, names: null, useChemistryFix: true },
  { slug: "physics", chapters: 14, names: PHYSICS_CHAPTER_NAMES },
  { slug: "higher-math", chapters: 13, names: HM_CHAPTER_NAMES },
  { slug: "biology", chapters: 25, names: null },
  { slug: "general-math", chapters: 14, names: null },
];

const CHAPTER_RE = /ssc-[\w-]+-chapter-(\d+)-model-test-(\d+)/;

function loadJson(fp, fb) {
  if (!fs.existsSync(fp)) return fb;
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

function harvestGoodPool(subjectSlug, chapterNo) {
  const ch = pad2(chapterNo);
  const prefix = `ssc-${subjectSlug}-chapter-${ch}-model-test-`;
  const dir = path.join(ROOT, "public", "questions", subjectSlug);
  const pool = [];
  const seen = new Set();
  if (!fs.existsSync(dir)) return pool;

  for (const f of fs.readdirSync(dir)) {
    if (!f.startsWith(prefix) || !f.endsWith(".json")) continue;
    const qs = loadJson(path.join(dir, f), []);
    if (isLowQualitySet(qs, subjectSlug)) continue;
    for (const q of qs) {
      const text = extractText(q);
      const key = text.slice(0, 80);
      if (!text || seen.has(key)) continue;
      seen.add(key);
      pool.push({
        text,
        options: (q.options ?? []).map(String),
        answerIndex: 0,
        explanation: "",
        topic: "",
        image: q.image ?? null,
      });
    }
  }
  return pool;
}

function quarantineSet(subjectSlug, setId) {
  const qDir = path.join(QUARANTINE_ROOT, subjectSlug);
  fs.mkdirSync(qDir, { recursive: true });
  for (const base of [
    path.join(ROOT, "public", "questions", subjectSlug, `${setId}.json`),
    path.join(ROOT, "backend", "data", "answers", subjectSlug, `${setId}.answers.json`),
  ]) {
    if (!fs.existsSync(base)) continue;
    const dest = path.join(qDir, path.basename(base));
    if (!fs.existsSync(dest)) fs.renameSync(base, dest);
    else fs.unlinkSync(base);
  }
}

function removeFromIndexes(subjectSlug, setId) {
  const { mega } = loadMega(ROOT, subjectSlug);
  const { modelIndex } = loadModelIndex(ROOT, subjectSlug);
  delete mega.modelTests?.[setId];
  delete mega.modelTestsMeta?.[setId];
  if (modelIndex?.modelTests) delete modelIndex.modelTests[setId];
  saveMegaAndIndex(ROOT, subjectSlug, mega, modelIndex);

  const indexPath = path.join(ROOT, "public", "questions", subjectSlug, "index.json");
  if (fs.existsSync(indexPath)) {
    const idx = loadJson(indexPath, { modelTests: [] });
    idx.modelTests = (idx.modelTests ?? []).filter((m) => m.id !== setId);
    fs.writeFileSync(indexPath, `${JSON.stringify(idx, null, 2)}\n`, "utf8");
  }
}

function writeFiveSets(subjectSlug, chapterNo, chapterName, setsQuestions) {
  const { mega } = loadMega(ROOT, subjectSlug);
  const { modelIndex } = loadModelIndex(ROOT, subjectSlug);

  for (let setNo = 1; setNo <= TARGET_SETS; setNo++) {
    const questions = setsQuestions[setNo - 1];
    const answers = questions.map((q) => ({
      answer: q.options[q.answerIndex ?? 0],
      answerIndex: q.answerIndex ?? 0,
      explanation: q.explanation ?? "",
      topic: q.topic ?? chapterName,
    }));
    const title = `অধ্যায় ${chapterNo} · ${chapterName} · মডেল টেস্ট ${pad2(setNo)}`;
    const bundle = writeSetBundle({
      root: ROOT,
      subjectSlug,
      chapterNo,
      chapterName,
      setNo,
      title,
      publicQuestions: questions,
      answers,
    });
    syncSetToMega(mega, modelIndex, bundle);
    upsertQuestionsIndex(ROOT, subjectSlug, bundle.setId, bundle.displayTitle, chapterNo, chapterName);
    console.log(`  OK ${bundle.setId} (unique=${uniqueStemCount(questions)})`);
  }
  saveMegaAndIndex(ROOT, subjectSlug, mega, modelIndex);
}

function rebuildChapter(subjectSlug, chapterNo, chapterName) {
  const pool = harvestGoodPool(subjectSlug, chapterNo);
  const hasGenerator = ["chemistry", "physics", "higher-math"].includes(subjectSlug);

  if (!hasGenerator && !pool.length) {
    console.log(`  SKIP rebuild ch${pad2(chapterNo)} (no good pool, no generator)`);
    return;
  }

  const sets = [];
  for (let setNo = 1; setNo <= TARGET_SETS; setNo++) {
    if (subjectSlug === "chemistry") {
      sets.push(
        generateChemistrySet(chapterNo, chapterName, setNo).map((q) => ({
          text: q.q,
          options: [q.o.ক, q.o.খ, q.o.গ, q.o.ঘ],
          answerIndex: ["ক", "খ", "গ", "ঘ"].indexOf(q.a),
          explanation: "",
          topic: chapterName,
        })),
      );
    } else {
      sets.push(generateUniqueSet(subjectSlug, chapterNo, chapterName, setNo, pool));
    }
  }
  writeFiveSets(subjectSlug, chapterNo, chapterName, sets);
}

function scanBadSets(subjectSlug) {
  const dir = path.join(ROOT, "public", "questions", subjectSlug);
  if (!fs.existsSync(dir)) return [];
  const bad = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".json") || f === "index.json") continue;
    if (!f.includes("-chapter-") || !f.includes("-model-test-")) continue;
    const qs = loadJson(path.join(dir, f), []);
    if (!Array.isArray(qs) || !qs.length) continue;
    if (isLowQualitySet(qs, subjectSlug)) {
      bad.push({ setId: f.replace(".json", ""), unique: uniqueStemCount(qs) });
    }
  }
  return bad;
}

function chapterNameFromIndex(subjectSlug, chapterNo) {
  const ch = pad2(chapterNo);
  const indexPath = path.join(ROOT, "public", "questions", subjectSlug, "index.json");
  const idx = loadJson(indexPath, { modelTests: [] });
  const entry = (idx.modelTests ?? []).find((m) => m.id?.includes(`chapter-${ch}-model-test`));
  return entry?.chaptersCovered?.[0]?.chapterName ?? `Chapter ${ch}`;
}

function fixSubject(subject) {
  const { slug, chapters, names, useChemistryFix } = subject;
  console.log(`\n=== ${slug.toUpperCase()} ===`);

  if (useChemistryFix) {
    execSync("node scripts/fix-ssc-chemistry-junk-sets.js", { cwd: ROOT, stdio: "inherit" });
    return;
  }

  const bad = scanBadSets(slug);
  if (!bad.length) {
    console.log("No junk chapter sets found.");
    return;
  }

  console.log(`Found ${bad.length} junk set(s)`);
  const chaptersToRebuild = new Set();
  for (const b of bad) {
    console.log(`  QUARANTINE ${b.setId} (unique=${b.unique})`);
    quarantineSet(slug, b.setId);
    removeFromIndexes(slug, b.setId);
    const m = b.setId.match(CHAPTER_RE);
    if (m) chaptersToRebuild.add(Number(m[1]));
  }

  for (const ch of [...chaptersToRebuild].sort((a, b) => a - b)) {
    if (ch > chapters) continue;
    const chs = pad2(ch);
    const chapterName = names?.[chs] ?? chapterNameFromIndex(slug, ch);
    console.log(`REBUILD ch${chs} ${chapterName}`);
    rebuildChapter(slug, ch, chapterName);
  }
}

function auditAll() {
  console.log("\n=== FINAL AUDIT (SSC chapter model-tests) ===");
  let totalBad = 0;
  for (const { slug } of SSC_SUBJECTS) {
    const bad = scanBadSets(slug);
    if (bad.length) {
      console.log(`${slug}: ${bad.length} BAD`);
      totalBad += bad.length;
    } else {
      console.log(`${slug}: OK`);
    }
  }
  console.log(totalBad ? `\n⚠️  ${totalBad} bad set(s) remain` : "\n✅ All SSC chapter sets pass quality check");
}

function main() {
  console.log("=== Fix ALL SSC junk chapter model-test sets ===");
  for (const subject of SSC_SUBJECTS) {
    fixSubject(subject);
  }
  auditAll();
  console.log("\nDone. Hard refresh browser (Ctrl+Shift+R).");
}

main();
