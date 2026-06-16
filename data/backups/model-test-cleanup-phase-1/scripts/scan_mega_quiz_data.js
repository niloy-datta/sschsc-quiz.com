const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUIZ_DATA_DIR = path.join(ROOT, "public", "quiz-data");

const JUNK_OPTIONS = new Set([
  "360", "180", "0", "1", "-1", "2", "3", "4", "5", "7", "8", "10", "11",
  "15", "22", "25", "a+b", "x", "y", "b", "?", "ক", "খ", "গ", "ঘ"
]);

function loadJson(fp) {
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

function scanMegaFile(level, subjectFile) {
  const fp = path.join(QUIZ_DATA_DIR, level, subjectFile);
  let data;
  try {
    data = loadJson(fp);
  } catch (err) {
    return [{
      level,
      subjectFile,
      type: "CORRUPTED_JSON",
      details: err.message
    }];
  }

  const results = [];

  // 1. Scan Chapters
  const chapters = data.chapters || {};
  for (const [chapterSlug, questions] of Object.entries(chapters)) {
    if (!Array.isArray(questions)) continue;
    questions.forEach((q, idx) => {
      checkQuestion(q, `chapters.${chapterSlug}`, idx, results, level, subjectFile);
    });
  }

  // 2. Scan Model Tests
  const modelTests = data.modelTests || {};
  for (const [testSlug, questions] of Object.entries(modelTests)) {
    if (!Array.isArray(questions)) continue;
    questions.forEach((q, idx) => {
      checkQuestion(q, `modelTests.${testSlug}`, idx, results, level, subjectFile);
    });
  }

  // 3. Scan Board Questions
  const boardQuestions = data.boardQuestions || {};
  for (const [year, boards] of Object.entries(boardQuestions)) {
    if (typeof boards !== "object" || boards === null) continue;
    for (const [boardName, questions] of Object.entries(boards)) {
      if (!Array.isArray(questions)) continue;
      questions.forEach((q, idx) => {
        checkQuestion(q, `boardQuestions.${year}.${boardName}`, idx, results, level, subjectFile);
      });
    }
  }

  return results;
}

function checkQuestion(q, section, idx, results, level, subjectFile) {
  const text = String(q?.questionText || q?.question || q?.text || "").trim();
  const options = [
    q?.optionA ?? q?.options?.[0],
    q?.optionB ?? q?.options?.[1],
    q?.optionC ?? q?.options?.[2],
    q?.optionD ?? q?.options?.[3]
  ].map(o => String(o ?? "").trim());

  const correct = String(q?.correctOption || q?.correct || "").trim().toUpperCase();

  // 1. Check for empty question text
  if (!text || text.length < 5) {
    results.push({
      level,
      subjectFile,
      section,
      questionIndex: idx,
      type: "EMPTY_OR_SHORT_QUESTION",
      text,
      options
    });
    return;
  }

  // 2. Check for placeholder question text
  if (/^q\d+$/i.test(text) || /^question\s*\d+$/i.test(text)) {
    results.push({
      level,
      subjectFile,
      section,
      questionIndex: idx,
      type: "PLACEHOLDER_QUESTION_TEXT",
      text,
      options
    });
    return;
  }

  // 3. Check for empty options
  const emptyCount = options.filter(o => !o).length;
  if (emptyCount > 0) {
    results.push({
      level,
      subjectFile,
      section,
      questionIndex: idx,
      type: "EMPTY_OPTIONS",
      text,
      options,
      details: `${emptyCount} empty options`
    });
    return;
  }

  // 4. Check for invalid correctOption mapping (should map to A, B, C, or D if using correctOption)
  if (q?.correctOption !== undefined) {
    const validLetters = ["A", "B", "C", "D"];
    if (!validLetters.includes(correct)) {
      results.push({
        level,
        subjectFile,
        section,
        questionIndex: idx,
        type: "INVALID_CORRECT_OPTION",
        text,
        options,
        correctOption: q?.correctOption,
        details: `correctOption must be A/B/C/D`
      });
      return;
    }
  }

  // 5. Check if all options are junk/placeholder options
  const junkCount = options.filter(o => JUNK_OPTIONS.has(o)).length;
  if (junkCount >= 3) {
    results.push({
      level,
      subjectFile,
      section,
      questionIndex: idx,
      type: "JUNK_OPTIONS",
      text,
      options,
      details: `${junkCount} junk options`
    });
  }
}

function main() {
  if (!fs.existsSync(QUIZ_DATA_DIR)) {
    console.error("Quiz-data directory does not exist.");
    process.exit(1);
  }

  const levels = ["ssc", "hsc"];
  let allHits = [];

  for (const level of levels) {
    const dir = path.join(QUIZ_DATA_DIR, level);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith(".json") && !f.includes(".index.json"));
    for (const file of files) {
      const hits = scanMegaFile(level, file);
      if (hits.length > 0) {
        allHits.push(...hits);
      }
    }
  }

  // Filter out JUNK_OPTIONS false positives (valid numerical answers)
  const criticalHits = allHits.filter(h => h.type !== "JUNK_OPTIONS");

  console.log(JSON.stringify(criticalHits, null, 2));
}

main();
