/**
 * Import SSC Chemistry Chapter 10 (Hydrocarbon) high-yield model test sets 1–5.
 * Usage: node scripts/import-ssc-chemistry-ch10-model-tests.js [payload.json]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INPUT = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, "data", "ssc-chemistry-ch10-high-yield.json");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions", "chemistry");
const ANSWERS_DIR = path.join(ROOT, "backend", "data", "answers", "chemistry");
const INDEX_PATH = path.join(QUESTIONS_DIR, "index.json");

const LABELS = ["ক", "খ", "গ", "ঘ"];
const LABEL_INDEX = { ক: 0, খ: 1, গ: 2, ঘ: 3 };

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toOptions(raw) {
  if (Array.isArray(raw)) return raw.slice(0, 4);
  if (raw && typeof raw === "object") {
    return LABELS.map((k) => String(raw[k] ?? "").trim());
  }
  return null;
}

function convertSet(set) {
  const setNo = set.set_no;
  const setId = `ssc-chemistry-chapter-10-model-test-${pad2(setNo)}`;
  const questions = [];
  const answers = {};

  for (const q of set.questions) {
    const qNum = pad2(q.id);
    const qid = `${setId}-q${qNum}`;
    const options = toOptions(q.options);
    if (!options || options.some((o) => !o)) {
      throw new Error(`Invalid options for ${qid}`);
    }

    const answerLabel = String(q.answer ?? "").trim();
    const answerIndex = LABEL_INDEX[answerLabel];
    if (answerIndex == null) {
      throw new Error(`Invalid answer label "${answerLabel}" for ${qid}`);
    }

    questions.push({
      id: qid,
      subject: "chemistry",
      chapter: setId,
      text: String(q.question ?? "").trim(),
      options,
      image: null,
      optionImages: null,
      timeLimit: 45,
    });

    answers[qid] = {
      answer: options[answerIndex],
      answerIndex,
      explanation: String(q.explanation ?? "").trim(),
      topic: String(q.topic ?? "hydrocarbon"),
      difficulty: 1200,
    };
  }

  return { setId, title: set.title, questions, answers };
}

function updateIndex(setId, title) {
  const idx = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  const entry = idx.modelTests.find((m) => m.id === setId);
  if (entry) {
    entry.title = title;
    entry.questionCount = 25;
    if (!entry.chaptersCovered?.length) {
      entry.chaptersCovered = [{ chapter: "10", chapterName: "হাইড্রোকার্বন" }];
    }
  }
  fs.writeFileSync(INDEX_PATH, `${JSON.stringify(idx, null, 2)}\n`, "utf8");
}

function main() {
  const payload = JSON.parse(fs.readFileSync(INPUT, "utf8"));
  fs.mkdirSync(QUESTIONS_DIR, { recursive: true });
  fs.mkdirSync(ANSWERS_DIR, { recursive: true });

  let totalQ = 0;
  for (const set of payload.sets) {
    const { setId, title, questions, answers } = convertSet(set);
    const qPath = path.join(QUESTIONS_DIR, `${setId}.json`);
    const aPath = path.join(ANSWERS_DIR, `${setId}.answers.json`);

    fs.writeFileSync(qPath, `${JSON.stringify(questions, null, 2)}\n`, "utf8");
    fs.writeFileSync(aPath, `${JSON.stringify(answers, null, 2)}\n`, "utf8");
    updateIndex(setId, title);
    totalQ += questions.length;
    console.log("OK", setId, questions.length, "questions");
  }

  console.log(`Done: ${payload.sets.length} sets, ${totalQ} questions imported`);
}

main();
