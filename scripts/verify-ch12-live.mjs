/**
 * Verify Chapter 12 Model Test 06 through the same server pipeline the UI uses.
 */
import { loadQuizQuestionsFromDisk } from "../src/lib/quiz-server-loader.ts";
import { sanitizeQuizText, sanitizeOptionText } from "../src/lib/sanitize-quiz-text.ts";

const TEST_ID = "ssc-physics-chapter-12-model-test-06";

const { questions, path } = await loadQuizQuestionsFromDisk(
  "ssc",
  "physics",
  TEST_ID,
);

console.log("Loaded from:", path);
console.log("Question count:", questions.length);
console.log("");

const issues = [];

for (let i = 0; i < questions.length; i++) {
  const q = questions[i];
  const n = i + 1;
  const stem = sanitizeQuizText(q.questionText ?? q.text ?? "", "question");
  const opts = (q.options ?? []).map((o) => sanitizeOptionText(String(o)));

  if (/\\t\\text|\\t ms/.test(stem)) {
    issues.push(`Q${n}: broken LaTeX in stem`);
  }
  if (opts.some((o) => /\d+\s+A\s+A/.test(o))) {
    issues.push(`Q${n}: double "A A" in options`);
  }
  if (/পরিবাহীর রোধ \d+ Ω/.test(stem) && n > 5) {
    issues.push(`Q${n}: duplicate Ohm template at Q${n}`);
  }
  if (n === 19 && q.image) {
    issues.push(`Q19: should have no image, got ${q.image}`);
  }
  if (n === 23 && q.image !== "/images/quiz/ssc-wave-standing.svg") {
    issues.push(`Q23: wrong image ${q.image}`);
  }
  if (n === 24 && !/উপরের চিত্রানুসারে/.test(stem)) {
    issues.push(`Q24: expected shortened uddepok stem`);
  }
  if (n === 24 && q.image !== "/images/quiz/ssc-wave-standing.svg") {
    issues.push(`Q24: wrong image ${q.image}`);
  }

  console.log(
    `Q${String(n).padStart(2)} | img: ${(q.image ?? "none").slice(-40)} | ${stem.slice(0, 60).replace(/\n/g, " ")}`,
  );
  if (opts.some((o) => /A A/.test(o))) {
    console.log("     OPTIONS BAD:", opts.filter((o) => /A A/.test(o)));
  }
}

console.log("");
if (issues.length) {
  console.log("ISSUES FOUND:");
  issues.forEach((x) => console.log(" -", x));
  process.exit(1);
}
console.log("All checks passed.");
