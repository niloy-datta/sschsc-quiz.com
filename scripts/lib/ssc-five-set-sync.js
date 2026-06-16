/**
 * Shared helpers: write SSC chapter model-test sets + sync mega / sidecar indexes.
 */
const fs = require("fs");
const path = require("path");

const LETTER_OPTIONS = ["A", "B", "C", "D"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function buildSetSlug(subjectSlug, chapterNo, setNo) {
  return `ssc-${subjectSlug}-chapter-${pad2(chapterNo)}-model-test-${pad2(setNo)}`;
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
      chapter: pad2(chapterNo),
      topic: ans?.topic ?? chapterName,
      difficulty: "Board Standard",
      questionNo: i + 1,
      image: q.image ?? null,
    };
  });
}

function writeSetBundle({
  root,
  subjectSlug,
  chapterNo,
  chapterName,
  setNo,
  title,
  publicQuestions,
  answers,
}) {
  const setId = buildSetSlug(subjectSlug, chapterNo, setNo);
  const ch = pad2(chapterNo);
  const displayTitle =
    title ?? `অধ্যায় ${chapterNo} · ${chapterName} · মডেল টেস্ট ${pad2(setNo)}`;

  const questionsDir = path.join(root, "public", "questions", subjectSlug);
  const answersDir = path.join(root, "backend", "data", "answers", subjectSlug);
  fs.mkdirSync(questionsDir, { recursive: true });
  fs.mkdirSync(answersDir, { recursive: true });

  const normalizedPublic = publicQuestions.map((q, i) => ({
    id: `${setId}-q${pad2(i + 1)}`,
    subject: subjectSlug,
    chapter: setId,
    text: String(q.text ?? "").trim(),
    options: q.options.map((o) => String(o).trim()),
    image: q.image ?? null,
    timeLimit: q.timeLimit ?? 45,
  }));

  const answerMap = {};
  normalizedPublic.forEach((q, i) => {
    const src = answers[i] ?? answers[q.id] ?? {};
    const answerIndex =
      src.answerIndex ??
      q.options.findIndex((o) => o === String(src.answer ?? "").trim());
    answerMap[q.id] = {
      answer: q.options[answerIndex >= 0 ? answerIndex : 0],
      answerIndex: answerIndex >= 0 ? answerIndex : 0,
      explanation: String(src.explanation ?? "").trim(),
      topic: String(src.topic ?? chapterName).trim(),
      difficulty: 1200,
    };
  });

  fs.writeFileSync(
    path.join(questionsDir, `${setId}.json`),
    `${JSON.stringify(normalizedPublic, null, 2)}\n`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(answersDir, `${setId}.answers.json`),
    `${JSON.stringify(answerMap, null, 2)}\n`,
    "utf8",
  );

  return {
    setId,
    displayTitle,
    chapterNo: ch,
    chapterName,
    publicQuestions: normalizedPublic,
    answers: answerMap,
  };
}

function loadMega(root, subjectSlug) {
  const megaPath = path.join(root, "public", "quiz-data", "ssc", `${subjectSlug}.json`);
  if (!fs.existsSync(megaPath)) {
    return { mega: { modelTests: {}, modelTestsMeta: {} }, megaPath };
  }
  const mega = JSON.parse(fs.readFileSync(megaPath, "utf8"));
  if (!mega.modelTests) mega.modelTests = {};
  if (!mega.modelTestsMeta) mega.modelTestsMeta = {};
  return { mega, megaPath };
}

function loadModelIndex(root, subjectSlug) {
  const modelIndexPath = path.join(
    root,
    "public",
    "quiz-data",
    "ssc",
    `${subjectSlug}.model-tests.index.json`,
  );
  if (!fs.existsSync(modelIndexPath)) {
    return {
      modelIndex: { level: "ssc", subject: subjectSlug, modelTests: {} },
      modelIndexPath,
    };
  }
  const modelIndex = JSON.parse(fs.readFileSync(modelIndexPath, "utf8"));
  if (!modelIndex.modelTests) modelIndex.modelTests = {};
  return { modelIndex, modelIndexPath };
}

function syncSetToMega(mega, modelIndex, bundle) {
  const { setId, displayTitle, chapterNo, chapterName, publicQuestions, answers } = bundle;
  const megaQuestions = toMegaQuestions(publicQuestions, chapterNo, chapterName, answers);
  mega.modelTests[setId] = megaQuestions;
  mega.modelTestsMeta[setId] = {
    displayTitle,
    name: displayTitle,
    scope: "chapter",
    tags: ["chapter-wise", "model-test"],
    chaptersCovered: [{ chapter: chapterNo, chapterName }],
    durationMinutes: 25,
    questionCount: megaQuestions.length,
    importance: "high",
  };

  if (modelIndex) {
    modelIndex.modelTests[setId] = {
      questionCount: megaQuestions.length,
      scope: "chapter",
      displayTitle,
      durationMinutes: 25,
      importance: "high",
      tags: ["chapter-wise", "model-test"],
      chaptersCovered: [{ chapter: chapterNo, chapterName }],
    };
  }
}

function upsertQuestionsIndex(root, subjectSlug, setId, title, chapterNo, chapterName) {
  const indexPath = path.join(root, "public", "questions", subjectSlug, "index.json");
  let idx = { modelTests: [] };
  if (fs.existsSync(indexPath)) {
    idx = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  }
  idx.modelTests = idx.modelTests ?? [];

  let entry = idx.modelTests.find((m) => m.id === setId);
  if (!entry) {
    entry = { id: setId };
    idx.modelTests.push(entry);
  }
  entry.title = title;
  entry.questionCount = 25;
  entry.scope = "chapter";
  entry.importance = "high";
  entry.tags = ["chapter-wise", "model-test"];
  entry.chaptersCovered = [{ chapter: pad2(chapterNo), chapterName }];

  fs.writeFileSync(indexPath, `${JSON.stringify(idx, null, 2)}\n`, "utf8");
}

function pruneChapterSets(root, subjectSlug, chapterNo, keepMax = 5) {
  const ch = pad2(chapterNo);
  const prefix = `ssc-${subjectSlug}-chapter-${ch}-model-test-`;
  const questionsDir = path.join(root, "public", "questions", subjectSlug);
  const answersDir = path.join(root, "backend", "data", "answers", subjectSlug);

  if (fs.existsSync(questionsDir)) {
    for (const f of fs.readdirSync(questionsDir)) {
      if (!f.startsWith(prefix) || !f.endsWith(".json")) continue;
      const num = Number(f.match(/model-test-(\d+)/)?.[1] ?? 0);
      if (num > keepMax) {
        fs.unlinkSync(path.join(questionsDir, f));
        const ans = path.join(answersDir, f.replace(".json", ".answers.json"));
        if (fs.existsSync(ans)) fs.unlinkSync(ans);
      }
    }
  }

  const indexPath = path.join(questionsDir, "index.json");
  if (fs.existsSync(indexPath)) {
    const idx = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    idx.modelTests = (idx.modelTests ?? []).filter((m) => {
      if (!m.id?.startsWith(prefix)) return true;
      const num = Number(m.id.match(/model-test-(\d+)/)?.[1] ?? 0);
      return num <= keepMax;
    });
    fs.writeFileSync(indexPath, `${JSON.stringify(idx, null, 2)}\n`, "utf8");
  }

  const { mega, megaPath } = loadMega(root, subjectSlug);
  const { modelIndex, modelIndexPath } = loadModelIndex(root, subjectSlug);
  let removed = 0;
  for (const id of Object.keys(mega.modelTests)) {
    if (!id.startsWith(prefix)) continue;
    const num = Number(id.match(/model-test-(\d+)/)?.[1] ?? 0);
    if (num > keepMax) {
      delete mega.modelTests[id];
      delete mega.modelTestsMeta[id];
      if (modelIndex?.modelTests) delete modelIndex.modelTests[id];
      removed++;
    }
  }
  if (removed) {
    fs.writeFileSync(megaPath, `${JSON.stringify(mega, null, 2)}\n`, "utf8");
    fs.writeFileSync(modelIndexPath, `${JSON.stringify(modelIndex, null, 2)}\n`, "utf8");
  }
}

function saveMegaAndIndex(root, subjectSlug, mega, modelIndex) {
  const megaPath = path.join(root, "public", "quiz-data", "ssc", `${subjectSlug}.json`);
  const modelIndexPath = path.join(
    root,
    "public",
    "quiz-data",
    "ssc",
    `${subjectSlug}.model-tests.index.json`,
  );
  fs.mkdirSync(path.dirname(megaPath), { recursive: true });
  fs.writeFileSync(megaPath, `${JSON.stringify(mega, null, 2)}\n`, "utf8");
  fs.writeFileSync(modelIndexPath, `${JSON.stringify(modelIndex, null, 2)}\n`, "utf8");
}

module.exports = {
  pad2,
  buildSetSlug,
  writeSetBundle,
  loadMega,
  loadModelIndex,
  syncSetToMega,
  upsertQuestionsIndex,
  pruneChapterSets,
  saveMegaAndIndex,
};
