/**
 * Ensure SSC Physics (14 ch) and Higher Math (13 ch) have exactly 5 model-test sets × 25 MCQs.
 * - Higher Math: premium sets 1–5 where available; generate for ch 01, 02, 10, 11
 * - Physics: keep best existing questions; generate to fill gaps
 *
 * Usage: node scripts/ensure-ssc-physics-higher-math-five-sets.js [physics|higher-math|all]
 */
const fs = require("fs");
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
const { generateUniqueSet, HM_CHAPTER_NAMES, PHYSICS_CHAPTER_NAMES, isPlaceholder } = require("./lib/generate-ssc-chapter-mcqs");
const { isLowQualitySet, isGarbledBijoyText } = require("./lib/ssc-set-quality");

const ROOT = path.resolve(__dirname, "..");
const TARGET_SETS = 5;
const TARGET_Q = 25;
const HM_PREMIUM = path.join(ROOT, "ssc_higher_math_premium_full", "ssc_higher_math_premium.json");
const HM_GENERATE_CHAPTERS = new Set(["01", "02", "10", "11"]);
const HM_PREMIUM_CHAPTERS = new Set(["03", "04", "05", "06", "07", "08", "09", "12", "13"]);

const LABELS = ["ক", "খ", "গ", "ঘ"];
const LABEL_TO_LETTER = { ক: "A", খ: "B", গ: "C", ঘ: "D" };
const LETTER_INDEX = { A: 0, B: 1, C: 2, D: 3 };

const mode = (process.argv[2] ?? "all").toLowerCase();
const chapterArg = process.argv[3] ?? null;

function normalizeOptionsArray(options) {
  if (!Array.isArray(options)) return [];
  if (options[0]?.label != null || options[0]?.key != null) {
    const byLabel = {};
    for (const opt of options) {
      byLabel[String(opt.label ?? opt.key ?? "").trim()] = String(opt.text ?? "").trim();
    }
    return LABELS.map((l) => byLabel[l] ?? "");
  }
  return options.map((o) => String(o?.text ?? o ?? "").trim());
}

function scoreQuestions(questions, subject) {
  if (!Array.isArray(questions) || !questions.length) return -999;
  let score = 0;
  for (const q of questions) {
    const text = String(q.text ?? q.questionText ?? "").trim();
    if (isPlaceholder(text, subject)) {
      score -= 20;
      continue;
    }
    score += text.length > 15 ? 3 : 1;
    const opts = q.options ?? [q.optionA, q.optionB, q.optionC, q.optionD];
    if (Array.isArray(opts) && opts.filter(Boolean).length >= 4) score += 1;
  }
  score += Math.min(questions.length, TARGET_Q);
  return score;
}

function readPublicSet(filePath, subject) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return raw.map((q) => ({
    text: String(q.text ?? "").trim(),
    options: (q.options ?? []).map(String),
    image: q.image ?? null,
    answerIndex: null,
  }));
}

function readMegaSet(megaQuestions) {
  return (megaQuestions ?? []).map((q) => ({
    text: String(q.questionText ?? "").trim(),
    options: [q.optionA, q.optionB, q.optionC, q.optionD].map(String),
    image: q.image ?? null,
    answerIndex: LETTER_INDEX[String(q.correctOption ?? "A").trim()] ?? 0,
    explanation: String(q.explanation ?? "").trim(),
    topic: String(q.topic ?? "").trim(),
  }));
}

function loadChapterSetCandidates(subjectSlug, chapterNo, mega) {
  const ch = pad2(chapterNo);
  const prefix = `ssc-${subjectSlug}-chapter-${ch}-model-test-`;
  const questionsDir = path.join(ROOT, "public", "questions", subjectSlug);
  const answersDir = path.join(ROOT, "backend", "data", "answers", subjectSlug);
  const candidates = [];

  if (fs.existsSync(questionsDir)) {
    for (const f of fs.readdirSync(questionsDir)) {
      if (!f.startsWith(prefix) || !f.endsWith(".json")) continue;
      const setNum = Number(f.match(/model-test-(\d+)/)?.[1] ?? 0);
      const setId = f.replace(".json", "");
      const questions = readPublicSet(path.join(questionsDir, f), subjectSlug);
      const ansPath = path.join(answersDir, `${setId}.answers.json`);
      let answers = {};
      if (fs.existsSync(ansPath)) {
        answers = JSON.parse(fs.readFileSync(ansPath, "utf8"));
      }
      const enriched = questions.map((q, i) => {
        const qid = `${setId}-q${pad2(i + 1)}`;
        const ans = answers[qid];
        const answerIndex =
          ans?.answerIndex ??
          q.options.findIndex((o) => o === String(ans?.answer ?? "").trim());
        return { ...q, answerIndex: answerIndex >= 0 ? answerIndex : 0, explanation: ans?.explanation ?? "" };
      });
      candidates.push({ setNum, setId, questions: enriched, score: scoreQuestions(enriched, subjectSlug) });
    }
  }

  for (const [setId, megaQs] of Object.entries(mega.modelTests ?? {})) {
    if (!setId.startsWith(prefix)) continue;
    if (candidates.some((c) => c.setId === setId)) continue;
    const setNum = Number(setId.match(/model-test-(\d+)/)?.[1] ?? 0);
    const questions = readMegaSet(megaQs);
    candidates.push({ setNum, setId, questions, score: scoreQuestions(questions, subjectSlug) });
  }

  return candidates.sort((a, b) => b.score - a.score || a.setNum - b.setNum);
}

function harvestQuestionPool(candidates, subjectSlug) {
  const seen = new Set();
  const pool = [];
  for (const c of candidates) {
    for (const q of c.questions) {
      if (isPlaceholder(q.text, subjectSlug)) continue;
      if (!q.options || q.options.length < 4) continue;
      const key = q.text.slice(0, 80);
      if (seen.has(key)) continue;
      seen.add(key);
      pool.push(q);
    }
  }
  return pool;
}

function pickFromPool(pool, setNo, qIndex) {
  if (!pool.length) return null;
  const idx = ((setNo - 1) * TARGET_Q + qIndex - 1) % pool.length;
  return pool[idx];
}

function isUsableQuestion(q, subjectSlug) {
  const text = String(q.text ?? "").trim();
  if (isPlaceholder(text, subjectSlug)) return false;
  if (isGarbledBijoyText(text)) return false;
  if (!q.options || q.options.length < 4) return false;
  return true;
}

function buildSetQuestions(subjectSlug, chapterNo, chapterName, setNo, candidates, pool) {
  const ch = pad2(chapterNo);
  const best = candidates.find((c) => c.setNum === setNo && c.score >= TARGET_Q - 5);
  const useBest = best && !isLowQualitySet(best.questions, subjectSlug, ch);
  const hasLowQuality = candidates.some((c) => isLowQualitySet(c.questions, subjectSlug, ch));
  const usePool = pool.length > 0 && !hasLowQuality;
  const generated = generateUniqueSet(subjectSlug, chapterNo, chapterName, setNo);
  const out = [];

  for (let i = 0; i < TARGET_Q; i++) {
    const fromBest = useBest ? best?.questions[i] : null;
    if (fromBest && isUsableQuestion(fromBest, subjectSlug)) {
      out.push(fromBest);
      continue;
    }
    const fromPool = usePool ? pickFromPool(pool, setNo, i + 1) : null;
    if (fromPool && isUsableQuestion(fromPool, subjectSlug)) {
      out.push(fromPool);
      continue;
    }
    out.push(generated[i]);
  }
  return out.slice(0, TARGET_Q);
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

    const bundle = writeSetBundle({
      root: ROOT,
      subjectSlug,
      chapterNo,
      chapterName,
      setNo,
      publicQuestions: questions,
      answers,
    });
    syncSetToMega(mega, modelIndex, bundle);
    upsertQuestionsIndex(ROOT, subjectSlug, bundle.setId, bundle.displayTitle, chapterNo, chapterName);
    console.log(`  OK ${bundle.setId} (${questions.length} Q)`);
  }

  saveMegaAndIndex(ROOT, subjectSlug, mega, modelIndex);
}

function ensureSubjectChapter(subjectSlug, chapterNo, chapterNames) {
  const ch = pad2(chapterNo);
  const chapterName = chapterNames[ch] ?? `Chapter ${ch}`;
  pruneChapterSets(ROOT, subjectSlug, chapterNo, TARGET_SETS);

  const { mega } = loadMega(ROOT, subjectSlug);
  const candidates = loadChapterSetCandidates(subjectSlug, chapterNo, mega);
  const pool = harvestQuestionPool(candidates, subjectSlug);

  const setsQuestions = [];
  for (let setNo = 1; setNo <= TARGET_SETS; setNo++) {
    setsQuestions.push(buildSetQuestions(subjectSlug, chapterNo, chapterName, setNo, candidates, pool));
  }

  writeFiveSets(subjectSlug, chapterNo, chapterName, setsQuestions);
}

function premiumSetToPublic(premiumSet, setId, subjectSlug, chapterName) {
  return premiumSet.questions.map((q, i) => {
    const opts = normalizeOptionsArray(q.options);
    const correct = LABEL_TO_LETTER[String(q.correctOption ?? "ক").trim()] ?? "A";
    const answerIndex = LETTER_INDEX[correct] ?? 0;
    return {
      text: String(q.question ?? "").trim(),
      options: opts,
      answerIndex,
      explanation: String(q.shortSolution ?? q.explanation ?? "").trim(),
      topic: chapterName,
      image: null,
    };
  });
}

function importHmPremiumChapter(chapterNo) {
  const ch = pad2(chapterNo);
  if (!fs.existsSync(HM_PREMIUM)) {
    console.warn(`  ⚠️ Premium not found for HM ch${ch}`);
    return false;
  }
  const raw = JSON.parse(fs.readFileSync(HM_PREMIUM, "utf8"));
  const premiumCh = (raw.chapters ?? []).find((c) => String(c.chapter).padStart(2, "0") === ch);
  if (!premiumCh) return false;

  const chapterName = premiumCh.chapterName ?? HM_CHAPTER_NAMES[ch];
  const setsQuestions = [];

  for (let setNo = 1; setNo <= TARGET_SETS; setNo++) {
    const premiumSet = (premiumCh.sets ?? []).find((s) => Number(s.set ?? s.setNo) === setNo);
    if (!premiumSet?.questions?.length) {
      setsQuestions.push(generateUniqueSet("higher-math", chapterNo, chapterName, setNo));
      continue;
    }
    const setId = `ssc-higher-math-chapter-${ch}-model-test-${pad2(setNo)}`;
    const converted = premiumSetToPublic(premiumSet, setId, "higher-math", chapterName);
    const goodCount = converted.filter((q) => !isPlaceholder(q.text, "higher-math")).length;
    if (goodCount < TARGET_Q - 5) {
      const gen = generateUniqueSet("higher-math", chapterNo, chapterName, setNo);
      for (let i = 0; i < TARGET_Q; i++) {
        if (!converted[i] || isPlaceholder(converted[i].text, "higher-math")) {
          converted[i] = gen[i];
        }
      }
    }
    while (converted.length < TARGET_Q) {
      converted.push(generateUniqueSet("higher-math", chapterNo, chapterName, setNo)[converted.length]);
    }
    setsQuestions.push(converted.slice(0, TARGET_Q));
  }

  writeFiveSets("higher-math", chapterNo, chapterName, setsQuestions);
  return true;
}

function ensureHigherMath() {
  console.log("\n=== SSC Higher Math — 5 sets/chapter ===");
  for (let ch = 1; ch <= 13; ch++) {
    const chs = pad2(ch);
    console.log(`\nCh${chs} ${HM_CHAPTER_NAMES[chs]}`);
    if (HM_GENERATE_CHAPTERS.has(chs)) {
      ensureSubjectChapter("higher-math", ch, HM_CHAPTER_NAMES);
    } else if (HM_PREMIUM_CHAPTERS.has(chs)) {
      importHmPremiumChapter(ch);
    } else {
      ensureSubjectChapter("higher-math", ch, HM_CHAPTER_NAMES);
    }
  }
}

function ensurePhysics(chapterFilter = null) {
  console.log("\n=== SSC Physics — 5 sets/chapter ===");
  for (let ch = 1; ch <= 14; ch++) {
    const chs = pad2(ch);
    if (chapterFilter && chs !== pad2(chapterFilter)) continue;
    console.log(`\nCh${chs} ${PHYSICS_CHAPTER_NAMES[chs]}`);
    ensureSubjectChapter("physics", ch, PHYSICS_CHAPTER_NAMES);
  }
}

function audit(subjectSlug, chapterCount, chapterNames) {
  console.log(`\n--- Audit: ${subjectSlug} ---`);
  for (let ch = 1; ch <= chapterCount; ch++) {
    const chs = pad2(ch);
    const prefix = `ssc-${subjectSlug}-chapter-${chs}-model-test-`;
    const dir = path.join(ROOT, "public", "questions", subjectSlug);
    let good = 0;
    if (fs.existsSync(dir)) {
      good = fs
        .readdirSync(dir)
        .filter((f) => f.startsWith(prefix) && f.endsWith(".json"))
        .filter((f) => {
          const qs = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
          return qs.length >= TARGET_Q && !isLowQualitySet(qs, subjectSlug, chs);
        }).length;
    }
    console.log(`Ch${chs} ${chapterNames[chs]}: ${good}/${TARGET_SETS} ${good >= TARGET_SETS ? "OK" : "NEED"}`);
  }
}

function main() {
  if (mode === "all" || mode === "higher-math") ensureHigherMath();
  if (mode === "all" || mode === "physics") ensurePhysics(chapterArg);

  if (mode === "all" || mode === "higher-math") audit("higher-math", 13, HM_CHAPTER_NAMES);
  if (mode === "all" || mode === "physics") audit("physics", 14, PHYSICS_CHAPTER_NAMES);
  console.log("\nDone.");
}

main();
