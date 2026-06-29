/**
 * Strip "— MCQ 14 (সেট 5)?" junk from SSC Chemistry questions and rebuild bad sets.
 *
 * Usage: node scripts/fix-chemistry-mcq-stems.js [chapterNo]
 */
const fs = require("fs");
const path = require("path");

const { isLowQualitySet } = require("./lib/ssc-chemistry-quality");
const { generateChemistrySet } = require("./lib/generate-ssc-chemistry-mcqs");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions", "chemistry");
const ANSWERS_DIR = path.join(ROOT, "backend", "data", "answers", "chemistry");
const MEGA_PATH = path.join(ROOT, "public", "quiz-data", "ssc", "chemistry.json");
const MODEL_INDEX_PATH = path.join(
  ROOT,
  "public",
  "quiz-data",
  "ssc",
  "chemistry.model-tests.index.json",
);

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

const LABELS = ["ক", "খ", "গ", "ঘ"];
const LABEL_INDEX = { ক: 0, খ: 1, গ: 2, ঘ: 3 };
const LETTER_OPTIONS = ["A", "B", "C", "D"];

const chapterFilter = process.argv[2] ? String(process.argv[2]).padStart(2, "0") : null;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function cleanStem(text) {
  return String(text ?? "")
    .replace(/\s*—\s*MCQ\s+\d+\s*\(সেট\s+\d+\)\??/g, "")
    .replace(/\s*\[\d+\]\s*$/g, "")
    .replace(/\?+$/g, "?")
    .trim();
}

function hadJunkSuffix(text) {
  return / — MCQ \d+ \(সেট \d+\)/.test(String(text ?? "")) || /\[\d+\]\s*$/.test(String(text ?? ""));
}

function generatedToBundle(setId, chapterNo, chapterName, setNo, generated) {
  const questions = [];
  const answers = {};

  generated.forEach((q, i) => {
    const qid = `${setId}-q${pad2(i + 1)}`;
    const options = [q.o.ক, q.o.খ, q.o.গ, q.o.ঘ].map(String);
    const answerIndex = LABEL_INDEX[q.a] ?? 0;
    questions.push({
      id: qid,
      subject: "chemistry",
      chapter: setId,
      text: cleanStem(q.q),
      options,
      image: null,
      optionImages: null,
      timeLimit: 45,
    });
    answers[qid] = {
      answer: options[answerIndex],
      answerIndex,
      explanation: "",
      topic: q.t ?? chapterName,
      difficulty: 1200,
    };
  });

  const title = `অধ্যায় ${Number(chapterNo)} · ${chapterName} · মডেল টেস্ট ${pad2(setNo)}`;
  return { setId, title, questions, answers, chapterNo: pad2(chapterNo), chapterName };
}

function toMegaQuestions(publicQuestions, chapterNo, chapterName, answers) {
  return publicQuestions.map((q, i) => {
    const ans = answers[q.id];
    const answerIndex = ans?.answerIndex ?? 0;
    return {
      id: q.id,
      questionText: q.text,
      optionA: q.options[0] ?? "",
      optionB: q.options[1] ?? "",
      optionC: q.options[2] ?? "",
      optionD: q.options[3] ?? "",
      correctOption: LETTER_OPTIONS[answerIndex] ?? "A",
      explanation: ans?.explanation ?? "",
      chapter: chapterNo,
      topic: ans?.topic ?? chapterName,
      difficulty: "Board Standard",
      questionNo: i + 1,
      image: q.image ?? null,
    };
  });
}

function syncMega(mega, modelIndex, bundle) {
  const { setId, title, questions, answers, chapterNo, chapterName } = bundle;
  const megaQuestions = toMegaQuestions(questions, chapterNo, chapterName, answers);
  mega.modelTests[setId] = megaQuestions;
  mega.modelTestsMeta[setId] = {
    displayTitle: title,
    name: title,
    scope: "chapter",
    tags: ["chapter-wise", "premium", "model-test"],
    chaptersCovered: [{ chapter: chapterNo, chapterName }],
    durationMinutes: 25,
    questionCount: megaQuestions.length,
    importance: "high",
  };
  modelIndex.modelTests[setId] = {
    questionCount: megaQuestions.length,
    scope: "chapter",
    displayTitle: title,
    durationMinutes: 25,
    importance: "high",
    tags: ["chapter-wise", "premium", "model-test"],
    chaptersCovered: [{ chapter: chapterNo, chapterName }],
  };
}

function writeBundle(bundle) {
  const { setId, questions, answers } = bundle;
  fs.writeFileSync(
    path.join(QUESTIONS_DIR, `${setId}.json`),
    `${JSON.stringify(questions, null, 2)}\n`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(ANSWERS_DIR, `${setId}.answers.json`),
    `${JSON.stringify(answers, null, 2)}\n`,
    "utf8",
  );
}

function main() {
  const mega = JSON.parse(fs.readFileSync(MEGA_PATH, "utf8"));
  if (!mega.modelTests) mega.modelTests = {};
  if (!mega.modelTestsMeta) mega.modelTestsMeta = {};
  const modelIndex = fs.existsSync(MODEL_INDEX_PATH)
    ? JSON.parse(fs.readFileSync(MODEL_INDEX_PATH, "utf8"))
    : { modelTests: {} };
  if (!modelIndex.modelTests) modelIndex.modelTests = {};

  let cleaned = 0;
  let rebuilt = 0;

  const files = fs
    .readdirSync(QUESTIONS_DIR)
    .filter((f) => f.startsWith("ssc-chemistry-chapter-") && f.endsWith(".json"));

  for (const file of files.sort()) {
    const setId = file.replace(".json", "");
    const chapterNo = setId.match(/chapter-(\d{2})/)?.[1];
    if (!chapterNo) continue;
    if (chapterFilter && chapterNo !== chapterFilter) continue;

    const chapterName = CHAPTER_NAMES[chapterNo] ?? `Chapter ${chapterNo}`;
    const setNo = Number(setId.match(/model-test-(\d+)/)?.[1] ?? 1);
    const fp = path.join(QUESTIONS_DIR, file);
    const questions = JSON.parse(fs.readFileSync(fp, "utf8"));
    const hadJunk = questions.some((q) => hadJunkSuffix(q.text));

    for (const q of questions) {
      const next = cleanStem(q.text);
      if (next !== q.text) {
        q.text = next;
        cleaned++;
      }
    }

    const needsRebuild = hadJunk || isLowQualitySet(questions);
    let bundle;

    if (needsRebuild) {
      const generated = generateChemistrySet(Number(chapterNo), chapterName, setNo);
      if (generated.length < 25) {
        console.error(`FAIL ${setId}: only ${generated.length} questions generated`);
        continue;
      }
      bundle = generatedToBundle(setId, chapterNo, chapterName, setNo, generated);
      writeBundle(bundle);
      rebuilt++;
      console.log(`REBUILD ${setId} (${bundle.questions.length} Q)`);
    } else {
      fs.writeFileSync(fp, `${JSON.stringify(questions, null, 2)}\n`, "utf8");
      const answers = JSON.parse(
        fs.readFileSync(path.join(ANSWERS_DIR, `${setId}.answers.json`), "utf8"),
      );
      bundle = {
        setId,
        title: `অধ্যায় ${Number(chapterNo)} · ${chapterName} · মডেল টেস্ট ${pad2(setNo)}`,
        questions,
        answers,
        chapterNo,
        chapterName,
      };
      console.log(`CLEAN ${setId}`);
    }

    syncMega(mega, modelIndex, bundle);
  }

  fs.writeFileSync(MEGA_PATH, `${JSON.stringify(mega, null, 2)}\n`, "utf8");
  fs.writeFileSync(MODEL_INDEX_PATH, `${JSON.stringify(modelIndex, null, 2)}\n`, "utf8");
  console.log(`\nDone. cleaned=${cleaned} fields, rebuilt=${rebuilt} sets`);
}

main();
