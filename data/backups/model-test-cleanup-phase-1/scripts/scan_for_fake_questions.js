const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");

const JUNK_OPTIONS = new Set([
  "360", "180", "0", "1", "-1", "2", "3", "4", "5", "7", "8", "10", "11",
  "15", "22", "25", "a+b", "x", "y", "b", "?", "ক", "খ", "গ", "ঘ"
]);

function loadJson(fp) {
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

function scanSubject(subject) {
  const subjectDir = path.join(QUESTIONS_DIR, subject);
  if (!fs.existsSync(subjectDir)) return [];

  const files = fs.readdirSync(subjectDir).filter(f => f.endsWith(".json") && f !== "index.json");
  const results = [];

  for (const file of files) {
    const fp = path.join(subjectDir, file);
    let questions;
    try {
      questions = loadJson(fp);
    } catch (err) {
      results.push({
        subject,
        file,
        type: "CORRUPTED_JSON",
        details: err.message
      });
      continue;
    }

    if (!Array.isArray(questions)) continue;

    questions.forEach((q, idx) => {
      const text = String(q?.text || q?.questionText || q?.question || "").trim();
      const options = (q?.options || [q?.optionA, q?.optionB, q?.optionC, q?.optionD]).map(o => String(o || "").trim());

      // Check for extremely short/empty question text
      if (!text || text.length < 5) {
        results.push({
          subject,
          file,
          questionIndex: idx,
          type: "EMPTY_OR_SHORT_QUESTION",
          text,
          options
        });
        return;
      }

      // Check for question text that is just a placeholder name
      if (/^q\d+$/i.test(text) || /^question\s*\d+$/i.test(text)) {
        results.push({
          subject,
          file,
          questionIndex: idx,
          type: "PLACEHOLDER_QUESTION_TEXT",
          text,
          options
        });
        return;
      }

      // Check for empty options
      const emptyCount = options.filter(o => !o).length;
      if (emptyCount > 0) {
        results.push({
          subject,
          file,
          questionIndex: idx,
          type: "EMPTY_OPTIONS",
          text,
          options,
          details: `${emptyCount} empty options`
        });
        return;
      }

      // Check if all options are junk/placeholder options
      const junkCount = options.filter(o => JUNK_OPTIONS.has(o)).length;
      if (junkCount >= 3) {
        results.push({
          subject,
          file,
          questionIndex: idx,
          type: "JUNK_OPTIONS",
          text,
          options,
          details: `${junkCount} junk options`
        });
      }
    });
  }

  return results;
}

function main() {
  if (!fs.existsSync(QUESTIONS_DIR)) {
    console.error("Questions directory does not exist.");
    process.exit(1);
  }

  const subjects = fs.readdirSync(QUESTIONS_DIR).filter(f => fs.statSync(path.join(QUESTIONS_DIR, f)).isDirectory());
  let allHits = [];

  for (const subject of subjects) {
    const hits = scanSubject(subject);
    if (hits.length > 0) {
      allHits.push(...hits);
    }
  }

  // Filter out JUNK_OPTIONS to avoid false positives on valid numerical questions
  const criticalHits = allHits.filter(h => h.type !== "JUNK_OPTIONS");

  console.log(JSON.stringify(criticalHits, null, 2));
}

main();
