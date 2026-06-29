/**
 * Ensure SSC Biology chapters (01–14) have exactly 5 model-test sets × 25 MCQs.
 *
 * Usage: node scripts/ensure-ssc-biology-five-sets.js [chapterNo|all]
 */
const path = require("path");
const {
  pad2,
  writeSetBundle,
  loadMega,
  loadModelIndex,
  syncSetToMega,
  upsertQuestionsIndex,
  pruneChapterSets,
  saveMegaAndIndex,
} = require("./lib/ssc-five-set-sync");
const { BIOLOGY_CHAPTER_NAMES, generateBiologySet } = require("./lib/generate-ssc-biology-mcqs");
const { isLowQualitySet } = require("./lib/ssc-set-quality");

const ROOT = path.resolve(__dirname, "..");
const TARGET_SETS = 5;
const TARGET_Q = 25;
const chapterArg = process.argv[2] ?? "all";

function ensureChapter(chapterNo) {
  const ch = pad2(chapterNo);
  const chapterName = BIOLOGY_CHAPTER_NAMES[ch];
  if (!chapterName) return;

  console.log(`\nCh${ch} ${chapterName}`);
  pruneChapterSets(ROOT, "biology", chapterNo, TARGET_SETS);

  const { mega } = loadMega(ROOT, "biology");
  const { modelIndex } = loadModelIndex(ROOT, "biology");

  for (let setNo = 1; setNo <= TARGET_SETS; setNo++) {
    const questions = generateBiologySet(chapterNo, setNo);
    if (questions.length < TARGET_Q) {
      console.warn(`  WARN ${ch} set ${setNo}: only ${questions.length} questions`);
    }
    if (isLowQualitySet(questions, "biology", ch)) {
      console.warn(`  WARN low-quality set ch${ch} #${setNo}`);
    }

    const answers = questions.map((q) => ({
      answer: q.options[q.answerIndex ?? 0],
      answerIndex: q.answerIndex ?? 0,
      explanation: q.explanation ?? "",
      topic: q.topic ?? chapterName,
    }));

    const bundle = writeSetBundle({
      root: ROOT,
      subjectSlug: "biology",
      chapterNo,
      chapterName,
      setNo,
      publicQuestions: questions,
      answers,
    });
    syncSetToMega(mega, modelIndex, bundle);
    upsertQuestionsIndex(ROOT, "biology", bundle.setId, bundle.displayTitle, chapterNo, chapterName);
    console.log(`  OK ${bundle.setId} (${questions.length} Q)`);
  }

  if (!mega.chapters) mega.chapters = {};
  mega.chapters[`chapter-${ch}`] = mega.chapters[`chapter-${ch}`] ?? [];
  saveMegaAndIndex(ROOT, "biology", mega, modelIndex);
}

function audit() {
  console.log("\n--- Audit: SSC Biology ---");
  const questionsDir = path.join(ROOT, "public", "questions", "biology");
  const fs = require("fs");
  for (let ch = 1; ch <= 14; ch++) {
    const chs = pad2(ch);
    const prefix = `ssc-biology-chapter-${chs}-model-test-`;
    let good = 0;
    if (fs.existsSync(questionsDir)) {
      good = fs
        .readdirSync(questionsDir)
        .filter((f) => f.startsWith(prefix) && f.endsWith(".json"))
        .filter((f) => {
          const qs = JSON.parse(fs.readFileSync(path.join(questionsDir, f), "utf8"));
          return qs.length >= TARGET_Q && !isLowQualitySet(qs, "biology", chs);
        }).length;
    }
    console.log(`Ch${chs} ${BIOLOGY_CHAPTER_NAMES[chs]}: ${good}/${TARGET_SETS} ${good >= TARGET_SETS ? "OK" : "NEED"}`);
  }
}

function main() {
  console.log("=== SSC Biology — 5 sets/chapter ===");
  if (chapterArg === "all") {
    for (let ch = 1; ch <= 14; ch++) ensureChapter(ch);
  } else {
    ensureChapter(Number(chapterArg));
  }
  audit();
  console.log("\nDone.");
}

main();
