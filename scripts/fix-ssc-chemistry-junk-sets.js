/**
 * Remove premium template-spam chemistry sets (e.g. "Metal সাধারণত..." × 25)
 * and rebuild from PYQ + generated Bengali MCQs.
 *
 * Usage: node scripts/fix-ssc-chemistry-junk-sets.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const { isLowQualitySet, isJunkQuestionText } = require("./lib/ssc-set-quality");
const { generateChemistrySet } = require("./lib/generate-ssc-chemistry-mcqs");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions", "chemistry");
const ANSWERS_DIR = path.join(ROOT, "backend", "data", "answers", "chemistry");
const QUARANTINE_DIR = path.join(ROOT, "data", "quarantine", "chemistry");
const INDEX_PATH = path.join(QUESTIONS_DIR, "index.json");
const MEGA_PATH = path.join(ROOT, "public", "quiz-data", "ssc", "chemistry.json");
const MODEL_INDEX_PATH = path.join(
  ROOT,
  "public",
  "quiz-data",
  "ssc",
  "chemistry.model-tests.index.json",
);
const PYQ_JSON = path.join(ROOT, "data", "ssc-chemistry-pyq-by-chapter.json");
const IMPORTER = path.join(__dirname, "import-ssc-chemistry-chapter-model-tests.js");
const DATA_DIR = path.join(__dirname, "data");

const TARGET_SETS = 5;
const Q_PER_SET = 25;

/** Never auto-replace these if quality passes. */
const PROTECT_CHAPTERS = new Set(["01", "02", "05", "06", "10"]);

/** User-removed / not ready — do not auto-rebuild. */
const SKIP_CHAPTERS = new Set(["11", "12"]);

const CHAPTER_NAMES = {
  "01": "রসায়নের ধারণা",
  "02": "পদার্থের অবস্থা",
  "03": "মৌলের পর্যায়বৃত্ত ধর্ম",
  "04": "রাসায়নিক বন্ধন",
  "05": "মোল ধারণা ও গণনা",
  "06": "অম্ল-ক্ষার",
  "07": "জারণ-বিজারণ",
  "08": "তাপ রসায়ন",
  "09": "জৈব রসায়ন",
  "10": "হাইড্রোকার্বন",
  "11": "ধাতু ও অধাতু",
  "12": "পরিবেশ রসায়ন",
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

function loadJson(fp, fallback) {
  if (!fs.existsSync(fp)) return fallback;
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

function writeJson(fp, data) {
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function quarantineSet(setId) {
  fs.mkdirSync(QUARANTINE_DIR, { recursive: true });
  const src = path.join(QUESTIONS_DIR, `${setId}.json`);
  const dest = path.join(QUARANTINE_DIR, `${setId}.json`);
  if (fs.existsSync(src)) {
    if (!fs.existsSync(dest)) fs.renameSync(src, dest);
    else fs.unlinkSync(src);
  }
  const ansSrc = path.join(ANSWERS_DIR, `${setId}.answers.json`);
  const ansDest = path.join(QUARANTINE_DIR, `${setId}.answers.json`);
  if (fs.existsSync(ansSrc)) {
    if (!fs.existsSync(ansDest)) fs.renameSync(ansSrc, ansDest);
    else fs.unlinkSync(ansSrc);
  }
}

function removeFromMega(mega, modelIndex, setId) {
  delete mega.modelTests?.[setId];
  delete mega.modelTestsMeta?.[setId];
  if (modelIndex?.modelTests) delete modelIndex.modelTests[setId];
}

function pruneJunkSets() {
  const mega = loadJson(MEGA_PATH, { modelTests: {}, modelTestsMeta: {} });
  const modelIndex = loadJson(MODEL_INDEX_PATH, { modelTests: {} });
  const idx = loadJson(INDEX_PATH, { modelTests: [] });
  let removed = 0;

  for (let ch = 1; ch <= 12; ch++) {
    const chs = pad2(ch);
    const prefix = `ssc-chemistry-chapter-${chs}-model-test-`;
    const files = fs
      .readdirSync(QUESTIONS_DIR)
      .filter((f) => f.startsWith(prefix) && f.endsWith(".json"));

    for (const f of files) {
      const setId = f.replace(".json", "");
      const questions = loadJson(path.join(QUESTIONS_DIR, f), []);
      if (!isLowQualitySet(questions, "chemistry")) continue;

      console.log("QUARANTINE junk", setId, `(unique=${new Set(questions.map((q) => q.text)).size})`);
      quarantineSet(setId);
      removeFromMega(mega, modelIndex, setId);
      removed++;
    }
  }

  idx.modelTests = (idx.modelTests ?? []).filter((m) => {
    const fp = path.join(QUESTIONS_DIR, `${m.id}.json`);
    return fs.existsSync(fp);
  });

  writeJson(INDEX_PATH, idx);
  writeJson(MEGA_PATH, mega);
  writeJson(MODEL_INDEX_PATH, modelIndex);
  console.log(`Pruned ${removed} junk set(s)\n`);
  return removed;
}

function pyqPoolForChapter(chapterNo) {
  const data = loadJson(PYQ_JSON, { chapters: [], unclassified: [] });
  const ch = data.chapters?.find((c) => Number(c.chapter_no) === chapterNo);
  const pool = [...(ch?.questions ?? [])];
  return pool;
}

function buildChapterPayload(chapterNo, chapterName) {
  const pyq = pyqPoolForChapter(chapterNo);
  const sets = [];

  for (let setNo = 1; setNo <= TARGET_SETS; setNo++) {
    const questions = [];
    const pyqStart = (setNo - 1) * Q_PER_SET;

    for (let i = 0; i < Q_PER_SET; i++) {
      const pyqQ = pyq[pyqStart + i];
      if (pyqQ?.text && pyqQ?.options?.length >= 4) {
        questions.push({
          id: i + 1,
          q: pyqQ.text,
          o: {
            ক: pyqQ.options[0],
            খ: pyqQ.options[1],
            গ: pyqQ.options[2],
            ঘ: pyqQ.options[3],
          },
          a: pyqQ.answer ?? "ক",
          t: pyqQ.topic ?? "pyq",
        });
      } else {
        const gen = generateChemistrySet(chapterNo, chapterName, setNo);
        questions.push(gen[i] ?? gen[gen.length - 1]);
      }
    }

    sets.push({
      set_no: setNo,
      title: `অধ্যায় ${chapterNo} · ${chapterName} · মডেল টেস্ট ${pad2(setNo)}`,
      questions: questions.slice(0, Q_PER_SET),
    });
  }

  return {
    app: "বিজ্ঞান র‍্যাঙ্কার",
    level: "SSC",
    subject: "রসায়ন",
    chapter_no: chapterNo,
    chapter_name: chapterName,
    sets_per_chapter: TARGET_SETS,
    questions_per_set: Q_PER_SET,
    source: pyq.length ? "pyq-plus-generated" : "generated-board-pattern",
    prediction_note:
      "বোর্ড-প্যাটার্ন অনুযায়ী প্র্যাকটিস প্রশ্ন; পরীক্ষায় হুবহু আসবে এমন নিশ্চয়তা নেই।",
    sets,
  };
}

function countGoodSets(chapterNo) {
  const chs = pad2(chapterNo);
  const prefix = `ssc-chemistry-chapter-${chs}-model-test-`;
  return fs
    .readdirSync(QUESTIONS_DIR)
    .filter((f) => f.startsWith(prefix) && f.endsWith(".json"))
    .filter((f) => !isLowQualitySet(loadJson(path.join(QUESTIONS_DIR, f), []), "chemistry"))
    .length;
}

function rebuildChapters() {
  let rebuilt = 0;
  for (let ch = 1; ch <= 12; ch++) {
    const chs = pad2(ch);
    const chapterName = CHAPTER_NAMES[chs];
    const good = countGoodSets(ch);

    if (SKIP_CHAPTERS.has(chs)) {
      console.log(`SKIP ch${chs} ${chapterName} (disabled)`);
      continue;
    }

    if (PROTECT_CHAPTERS.has(chs) && good >= TARGET_SETS) {
      console.log(`KEEP ch${chs} ${chapterName} (${good} good sets)`);
      continue;
    }

    if (good >= TARGET_SETS) {
      console.log(`SKIP ch${chs} ${chapterName} — already ${good} good sets`);
      continue;
    }

    console.log(`REBUILD ch${chs} ${chapterName} (had ${good} good sets)`);
    const payload = buildChapterPayload(ch, chapterName);
    const out = path.join(DATA_DIR, `ssc-chemistry-ch${chs}-rebuilt.json`);
    writeJson(out, payload);
    execSync(`node "${IMPORTER}" "${out}"`, { cwd: ROOT, stdio: "inherit" });
    rebuilt++;
  }
  return rebuilt;
}

function audit() {
  console.log("\n--- Audit ---");
  for (let ch = 1; ch <= 12; ch++) {
    const chs = pad2(ch);
    const good = countGoodSets(ch);
    const sample = (() => {
      const fp = path.join(QUESTIONS_DIR, `ssc-chemistry-chapter-${chs}-model-test-01.json`);
      if (!fs.existsSync(fp)) return "(missing)";
      const qs = loadJson(fp, []);
      return qs[0]?.text?.slice(0, 45) ?? "?";
    })();
    console.log(
      `Ch${chs} ${CHAPTER_NAMES[chs]}: ${good}/${TARGET_SETS} ${good >= TARGET_SETS ? "OK" : "NEED"} | ${sample}`,
    );
  }
}

function main() {
  console.log("=== Fix SSC Chemistry junk sets ===\n");
  pruneJunkSets();
  rebuildChapters();
  execSync("node scripts/export-ssc-chemistry-quiz-text.js", { cwd: ROOT, stdio: "inherit" });
  audit();
  console.log("\nDone.");
}

main();
