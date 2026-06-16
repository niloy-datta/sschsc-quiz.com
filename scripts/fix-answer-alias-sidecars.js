/**
 * Create missing backend answer sidecars for public board-alias question files.
 *
 * This does not invent answers. It only copies an existing canonical answer file
 * when every public question id in the alias file is already present in that
 * canonical answer file.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_ROOT = path.join(ROOT, "public", "questions");
const ANSWERS_ROOT = path.join(ROOT, "backend", "data", "answers");

const BOARD_ALIASES = new Map([
  ["barisal", "barishal"],
  ["chittagong", "chattogram"],
  ["comilla", "cumilla"],
  ["jessore", "jashore"],
  ["khulna", "dhaka"],
]);

function walkJson(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkJson(fullPath));
    } else if (entry.name.endsWith(".json") && entry.name !== "index.json") {
      files.push(fullPath);
    }
  }

  return files;
}

function readQuestions(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.questions)) return data.questions;
  return [];
}

function allQuestionIdsCovered(publicFile, answerFile) {
  const questions = readQuestions(publicFile);
  const answers = JSON.parse(fs.readFileSync(answerFile, "utf8"));
  const answerIds = new Set(Object.keys(answers));

  return questions.length > 0 && questions.every((question) => answerIds.has(question.id));
}

function main() {
  const publicFiles = walkJson(PUBLIC_ROOT);
  const created = [];
  const skipped = [];

  for (const publicFile of publicFiles) {
    const subject = path.basename(path.dirname(publicFile));
    const setId = path.basename(publicFile, ".json");
    const targetAnswer = path.join(ANSWERS_ROOT, subject, `${setId}.answers.json`);

    if (fs.existsSync(targetAnswer)) continue;

    const match = setId.match(/^([a-z]+)-(\d{4})$/);
    if (!match) continue;

    const [, board, year] = match;
    const canonicalBoard = BOARD_ALIASES.get(board);
    if (!canonicalBoard) continue;

    const sourceSetId = `${canonicalBoard}-${year}`;
    const sourceAnswer = path.join(ANSWERS_ROOT, subject, `${sourceSetId}.answers.json`);

    if (!fs.existsSync(sourceAnswer)) {
      skipped.push({
        subject,
        setId,
        reason: "source_answer_missing",
        sourceSetId,
      });
      continue;
    }

    if (!allQuestionIdsCovered(publicFile, sourceAnswer)) {
      skipped.push({
        subject,
        setId,
        reason: "question_ids_not_covered_by_source_answer",
        sourceSetId,
      });
      continue;
    }

    fs.mkdirSync(path.dirname(targetAnswer), { recursive: true });
    fs.copyFileSync(sourceAnswer, targetAnswer);
    created.push({
      subject,
      setId,
      sourceSetId,
      path: path.relative(ROOT, targetAnswer),
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    created,
    skipped,
  };

  const reportPath = path.join(ROOT, "scripts", "answer-alias-sidecars-report.json");
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Created answer sidecars: ${created.length}`);
  console.log(`Skipped aliases: ${skipped.length}`);
  console.log(`Report: ${path.relative(ROOT, reportPath)}`);
}

main();
