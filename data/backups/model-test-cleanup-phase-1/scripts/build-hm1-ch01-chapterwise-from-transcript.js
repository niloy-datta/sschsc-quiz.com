/**
 * Extract HM1 Ch01 flat question array from agent transcript user message,
 * group into chapterWise import format, and write import JSON.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TRANSCRIPT = path.join(
  process.env.USERPROFILE || process.env.HOME || "",
  ".cursor",
  "projects",
  "c-Users-Niloy-Chandra-Documents-dev-quiz-dashboard",
  "agent-transcripts",
  "6018f294-d3c8-4bb3-86b0-706e3d77561d",
  "6018f294-d3c8-4bb3-86b0-706e3d77561d.jsonl",
);
const OUT = path.join(
  ROOT,
  "data",
  "imports",
  "hsc-higher-math-1st-paper-chapter-01-sets-01-05.json",
);

function extractJsonArray(text, startIdx) {
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = startIdx; i < text.length; i++) {
    const c = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === "\\") escape = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "[") depth += 1;
    else if (c === "]") {
      depth -= 1;
      if (depth === 0) return text.slice(startIdx, i + 1);
    }
  }
  return null;
}

function extractQuestionsFromTranscript() {
  if (!fs.existsSync(TRANSCRIPT)) {
    console.error(`Transcript not found: ${TRANSCRIPT}`);
    process.exit(1);
  }

  const lines = fs.readFileSync(TRANSCRIPT, "utf8").split("\n");
  for (const line of lines) {
    if (!line.includes("hsc-higher-math-1st-paper-chapter-01-set-01-q01")) continue;
    const row = JSON.parse(line);
    let text = row.message?.content?.[0]?.text ?? "";
    text = text.replace(/^<user_query>\s*/i, "").replace(/\s*<\/user_query>\s*$/i, "");
    const start = text.indexOf("[");
    if (start < 0) {
      console.error("Could not find JSON array in transcript line");
      process.exit(1);
    }
    const slice = extractJsonArray(text, start);
    if (!slice) {
      console.error("Could not find closing bracket for JSON array");
      process.exit(1);
    }
    return JSON.parse(slice);
  }

  console.error("No matching transcript line found");
  process.exit(1);
}

function groupBySet(questions) {
  const groups = new Map();
  for (const q of questions) {
    const m = String(q.id ?? "").match(
      /(hsc-higher-math-1st-paper-chapter-\d{2}-set-\d{2})/,
    );
    if (!m) {
      console.warn(`Skip question without set id: ${q.id}`);
      continue;
    }
    const setId = m[1];
    if (!groups.has(setId)) groups.set(setId, []);
    groups.get(setId).push(q);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function main() {
  const questions = extractQuestionsFromTranscript();
  console.log(`Extracted ${questions.length} questions from transcript`);

  const grouped = groupBySet(questions);
  const sets = grouped.map(([setId, qs]) => {
    const setNum = setId.match(/set-(\d{2})$/)?.[1] ?? "??";
    qs.sort((a, b) => {
      const na = parseInt(String(a.id).match(/q(\d+)$/)?.[1] ?? "0", 10);
      const nb = parseInt(String(b.id).match(/q(\d+)$/)?.[1] ?? "0", 10);
      return na - nb;
    });
    return {
      id: setId,
      title: `Chapter 01 Model Test ${parseInt(setNum, 10)}`,
      questions: qs,
    };
  });

  const payload = {
    level: "HSC",
    subject: "higher-math-1st-paper",
    chapterWise: [
      {
        chapter: "01",
        chapterName: "সেট ও ফাংশন",
        sets,
      },
    ],
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Wrote ${sets.length} sets (${questions.length} questions) → ${OUT}`);
}

main();
