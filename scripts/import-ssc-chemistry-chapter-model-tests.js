/**
 * Import SSC Chemistry chapter model test sets from compact payload JSON.
 * Supports fields: q/o/a/t or question/options/answer/topic.
 *
 * Usage: node scripts/import-ssc-chemistry-chapter-model-tests.js [payload.json]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INPUT = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, "data", "ssc-chemistry-ch01-part-01.json");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions", "chemistry");
const ANSWERS_DIR = path.join(ROOT, "backend", "data", "answers", "chemistry");
const INDEX_PATH = path.join(QUESTIONS_DIR, "index.json");
const MEGA_PATH = path.join(ROOT, "public", "quiz-data", "ssc", "chemistry.json");
const MODEL_INDEX_PATH = path.join(
  ROOT,
  "public",
  "quiz-data",
  "ssc",
  "chemistry.model-tests.index.json",
);

const LABELS = ["ক", "খ", "গ", "ঘ"];
const LABEL_INDEX = { ক: 0, খ: 1, গ: 2, ঘ: 3 };
const LETTER_OPTIONS = ["A", "B", "C", "D"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toOptions(raw) {
  if (Array.isArray(raw)) return raw.slice(0, 4).map((o) => String(o).trim());
  if (raw && typeof raw === "object") {
    return LABELS.map((k) => String(raw[k] ?? "").trim());
  }
  return null;
}

function readQuestionFields(q) {
  return {
    num: q.id,
    text: String(q.q ?? q.question ?? "").trim(),
    options: q.o ?? q.options,
    answer: String(q.a ?? q.answer ?? "").trim(),
    topic: String(q.t ?? q.topic ?? "general").trim(),
    explanation: String(q.explanation ?? "").trim(),
  };
}

function convertSet(set, chapterNo, chapterName) {
  const setNo = set.set_no;
  const ch = pad2(chapterNo);
  const setId = `ssc-chemistry-chapter-${ch}-model-test-${pad2(setNo)}`;
  const questions = [];
  const answers = {};

  for (const raw of set.questions) {
    const q = readQuestionFields(raw);
    const qNum = pad2(q.num);
    const qid = `${setId}-q${qNum}`;
    const options = toOptions(q.options);
    if (!options || options.some((o) => !o)) {
      throw new Error(`Invalid options for ${qid}`);
    }
    if (!q.text) {
      throw new Error(`Missing question text for ${qid}`);
    }

    const answerIndex = LABEL_INDEX[q.answer];
    if (answerIndex == null) {
      throw new Error(`Invalid answer label "${q.answer}" for ${qid}`);
    }

    questions.push({
      id: qid,
      subject: "chemistry",
      chapter: setId,
      text: q.text,
      options,
      image: null,
      optionImages: null,
      timeLimit: 45,
    });

    answers[qid] = {
      answer: options[answerIndex],
      answerIndex,
      explanation: q.explanation,
      topic: q.topic,
      difficulty: 1200,
    };
  }

  const title =
    String(set.title ?? "").trim() ||
    `অধ্যায় ${chapterNo} · ${chapterName} · মডেল টেস্ট ${pad2(setNo)}`;

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

function loadMega() {
  if (!fs.existsSync(MEGA_PATH)) {
    return { modelTests: {}, modelTestsMeta: {} };
  }
  const mega = JSON.parse(fs.readFileSync(MEGA_PATH, "utf8"));
  if (!mega.modelTests) mega.modelTests = {};
  if (!mega.modelTestsMeta) mega.modelTestsMeta = {};
  return mega;
}

function loadModelIndex() {
  if (!fs.existsSync(MODEL_INDEX_PATH)) {
    return { level: "ssc", subject: "chemistry", modelTests: {} };
  }
  const idx = JSON.parse(fs.readFileSync(MODEL_INDEX_PATH, "utf8"));
  if (!idx.modelTests) idx.modelTests = {};
  return idx;
}

function syncMegaAndSidecar(mega, modelIndex, setId, title, chapterNo, chapterName, questions, answers) {
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

function upsertIndexEntry(setId, title, chapterNo, chapterName) {
  const idx = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  idx.modelTests = idx.modelTests ?? [];

  let entry = idx.modelTests.find((m) => m.id === setId);
  if (!entry) {
    entry = {
      id: setId,
      title,
      questionCount: 25,
      scope: "chapter",
      importance: "high",
      tags: ["chapter-wise", "premium", "model-test"],
      chaptersCovered: [{ chapter: chapterNo, chapterName }],
    };
    idx.modelTests.push(entry);
  } else {
    entry.title = title;
    entry.questionCount = 25;
    entry.scope = entry.scope ?? "chapter";
    entry.importance = entry.importance ?? "high";
    entry.tags = entry.tags ?? ["chapter-wise", "premium", "model-test"];
    entry.chaptersCovered = [{ chapter: chapterNo, chapterName }];
  }

  fs.writeFileSync(INDEX_PATH, `${JSON.stringify(idx, null, 2)}\n`, "utf8");
}

function main() {
  if (!fs.existsSync(INPUT)) {
    const dataDir = path.join(__dirname, "data");
    const hint = fs.existsSync(dataDir)
      ? fs
          .readdirSync(dataDir)
          .filter((f) => f.includes("ssc-chemistry-ch") && f.endsWith(".json"))
          .sort()
          .map((f) => `  scripts/data/${f}`)
          .join("\n")
      : "";
    throw new Error(
      `Payload not found: ${INPUT}\n` +
        (hint ? `Available chemistry chapter payloads:\n${hint}\n` : "") +
        `Example: pnpm run data:import-ssc-chemistry-chapter scripts/data/ssc-chemistry-ch03-rebuilt.json`,
    );
  }

  const payload = JSON.parse(fs.readFileSync(INPUT, "utf8"));
  const chapterNo = Number(payload.chapter_no ?? payload.chapter ?? 1);
  const chapterName = String(
    payload.chapter_name ?? payload.chapterName ?? `Chapter ${chapterNo}`,
  ).trim();

  if (!Array.isArray(payload.sets) || payload.sets.length === 0) {
    throw new Error("No sets in payload");
  }

  fs.mkdirSync(QUESTIONS_DIR, { recursive: true });
  fs.mkdirSync(ANSWERS_DIR, { recursive: true });

  const mega = loadMega();
  const modelIndex = loadModelIndex();

  let totalQ = 0;
  for (const set of payload.sets) {
    const { setId, title, questions, answers, chapterNo: ch, chapterName: chName } =
      convertSet(set, chapterNo, chapterName);
    const qPath = path.join(QUESTIONS_DIR, `${setId}.json`);
    const aPath = path.join(ANSWERS_DIR, `${setId}.answers.json`);

    fs.writeFileSync(qPath, `${JSON.stringify(questions, null, 2)}\n`, "utf8");
    fs.writeFileSync(aPath, `${JSON.stringify(answers, null, 2)}\n`, "utf8");
    upsertIndexEntry(setId, title, ch, chName);
    syncMegaAndSidecar(mega, modelIndex, setId, title, ch, chName, questions, answers);
    totalQ += questions.length;
    console.log("OK", setId, questions.length, "questions");
  }

  fs.mkdirSync(path.dirname(MEGA_PATH), { recursive: true });
  fs.writeFileSync(MEGA_PATH, `${JSON.stringify(mega, null, 2)}\n`, "utf8");
  fs.mkdirSync(path.dirname(MODEL_INDEX_PATH), { recursive: true });
  fs.writeFileSync(MODEL_INDEX_PATH, `${JSON.stringify(modelIndex, null, 2)}\n`, "utf8");
  console.log("SYNC mega + model-tests.index.json");

  console.log(
    `Done: chapter ${pad2(chapterNo)} — ${payload.sets.length} sets, ${totalQ} questions`,
  );
}

main();
