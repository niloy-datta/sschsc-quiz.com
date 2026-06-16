/**
 * Export all SSC Chemistry model tests to readable text files.
 * Usage: node scripts/export-ssc-chemistry-quiz-text.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions", "chemistry");
const ANSWERS_DIR = path.join(ROOT, "backend", "data", "answers", "chemistry");
const OUT_DIR = path.join(ROOT, "data", "quiz-text", "ssc-chemistry");

function pad2(n) {
  return String(n).padStart(2, "0");
}

function main() {
  const files = fs
    .readdirSync(QUESTIONS_DIR)
    .filter(
      (f) =>
        f.startsWith("ssc-chemistry-chapter-") &&
        f.endsWith(".json") &&
        f.includes("-model-test-"),
    )
    .sort();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  let count = 0;

  for (const file of files) {
    const setId = file.replace(/\.json$/, "");
    const qs = JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, file), "utf8"));
    const ansPath = path.join(ANSWERS_DIR, `${setId}.answers.json`);
    const answers = fs.existsSync(ansPath)
      ? JSON.parse(fs.readFileSync(ansPath, "utf8"))
      : {};
    const labels = ["ক", "খ", "গ", "ঘ"];
    const lines = [`# ${setId}`, `# Questions: ${qs.length}`, ""];

    qs.forEach((q, i) => {
      const ans = answers[q.id];
      const ansLabel =
        ans && typeof ans.answerIndex === "number"
          ? labels[ans.answerIndex]
          : ans?.answer
            ? String(ans.answer)
            : "?";
      lines.push(`Q${i + 1}. ${q.text}`);
      (q.options ?? []).forEach((o, j) => {
        if (labels[j]) lines.push(`  ${labels[j]}) ${o}`);
      });
      lines.push(`  ✓ ${ansLabel}`);
      lines.push("");
    });

    fs.writeFileSync(path.join(OUT_DIR, `${setId}.txt`), `${lines.join("\n")}\n`, "utf8");
    count++;
  }

  console.log(`Exported ${count} sets → ${OUT_DIR}`);
}

main();
