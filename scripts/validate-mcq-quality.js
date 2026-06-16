/**
 * Batch MCQ quality validation for public/questions JSON.
 * Usage: node scripts/validate-mcq-quality.js [--strict]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const REPORT_PATH = path.join(ROOT, "data", "mcq-qa-report.json");

const STRICT = process.argv.includes("--strict");

const TRUSTED_DIAGRAM_SLUGS = new Set([
  "ssc-charge-spheres",
  "ssc-wave-crests",
  "ssc-concave-mirror",
  "ssc-convex-lens",
  "cell-division",
  "cell-wall",
  "sporangium",
  "plasmid",
  "fern-prothallus",
  "vascular-bundle",
  "dna-rna",
  "bio-nephron",
  "bio-neuron",
  "bio-eye",
  "bio-digestive",
  "bio-alveoli",
  "bio-xylem-phloem",
  "bio-logic-gate",
]);

const BANGLA_LABELS = ["ক", "খ", "গ", "ঘ"];
const DIAGRAM_HINT_RE =
  /\[চিত্র\s*[:：]|\(চিত্র\s*[:：]|চিত্রে|উদ্দীপক|চিত্রভিত্তিক|লেখচিত্র|গ্রাফ|diagram|circuit|বৃত্ত|triangle|ত্রিভুজ|vector|সমন্বয়|অক্ষ|wave|তরঙ্গ|force|বল\s*চিত্র|V-I|I-V|E-ν|motion\s*graph/i;

function normalizeText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function extractQuestionText(q) {
  return String(q.question ?? q.questionText ?? q.text ?? "");
}

function isShortMathQuestion(text) {
  const value = String(text || "").trim();
  return (
    value.length >= 4 &&
    /[0-9০-৯]/.test(value) &&
    /[=+\-−–*/^⁰¹²³⁴⁵⁶⁷⁸⁹⁻√()]/.test(value)
  );
}

function extractOptions(q) {
  if (Array.isArray(q.options)) {
    return q.options.map((o) => (typeof o === "string" ? o : o?.text ?? ""));
  }
  return [q.optionA, q.optionB, q.optionC, q.optionD].map((v) => String(v ?? ""));
}

function extractCorrectLabel(q, options) {
  const correctRaw = q.correctOption ?? q.correctAnswer ?? q.answer ?? q.correct;
  if (typeof q.answerIndex === "number" && q.answerIndex >= 0 && q.answerIndex <= 3) {
    return BANGLA_LABELS[q.answerIndex];
  }
  if (correctRaw != null && String(correctRaw).trim()) {
    const s = String(correctRaw).trim();
    if (BANGLA_LABELS.includes(s)) return s;
    const map = { A: "ক", B: "খ", C: "গ", D: "ঘ" };
    if (map[s.toUpperCase()]) return map[s.toUpperCase()];
    const idx = options.findIndex((o) => o.trim() === s);
    if (idx >= 0 && idx <= 3) return BANGLA_LABELS[idx];
  }
  if (typeof q.correctOptionText === "string" && q.correctOptionText.trim()) {
    const idx = options.findIndex((o) => o.trim() === q.correctOptionText.trim());
    if (idx >= 0 && idx <= 3) return BANGLA_LABELS[idx];
  }
  if (correctRaw != null && String(correctRaw).trim()) return String(correctRaw).trim();
  return "";
}

function validateQuestion(q) {
  const issues = [];
  const id = String(q.id ?? "").trim();
  const question = extractQuestionText(q).trim();
  const options = extractOptions(q).map((t) => t.trim());
  const correctOption = extractCorrectLabel(q, options);
  const shortSolution = String(q.shortSolution ?? q.explanation ?? "").trim();
  const image = typeof q.image === "string" ? q.image : null;

  if (!id) issues.push({ code: "missing_id", severity: "error", message: "Missing id" });
  if (!question || (question.length < 8 && !isShortMathQuestion(question))) {
    issues.push({ code: "missing_question", severity: "error", message: "Question too short" });
  }
  if (options.length !== 4) {
    issues.push({
      code: "invalid_option_count",
      severity: "error",
      message: `Expected 4 options, got ${options.length}`,
    });
  }
  for (let i = 0; i < options.length; i++) {
    if (!options[i]) {
      issues.push({
        code: "empty_option",
        severity: "error",
        message: `Empty option ${BANGLA_LABELS[i]}`,
      });
    }
  }
  const uniq = new Set(options.filter(Boolean).map(normalizeText));
  if (options.filter(Boolean).length >= 2 && uniq.size < options.filter(Boolean).length) {
    issues.push({
      code: "duplicate_options",
      severity: "error",
      message: "Duplicate options",
    });
  }
  if (!correctOption) {
    issues.push({
      code: "missing_correct_option",
      severity: "warn",
      message: "Missing correct answer field",
    });
  } else if (!BANGLA_LABELS.includes(correctOption)) {
    issues.push({
      code: "invalid_correct_option",
      severity: "error",
      message: `Invalid correctOption: ${correctOption}`,
    });
  }
  if (!shortSolution) {
    issues.push({ code: "missing_solution", severity: "warn", message: "No solution" });
  }
  if (DIAGRAM_HINT_RE.test(question) && !image) {
    issues.push({
      code: "needs_diagram",
      severity: "warn",
      message: "Diagram likely needed",
    });
  }
  if (image) {
    const slug = image.replace(/^\/images\/quiz\//, "").replace(/\.svg$/i, "");
    if (!TRUSTED_DIAGRAM_SLUGS.has(slug)) {
      issues.push({
        code: "untrusted_diagram",
        severity: "warn",
        message: `Untrusted diagram: ${slug}`,
      });
    }
  }

  return issues.map((issue) => ({ ...issue, id }));
}

function collectQuestions(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.questions)) return data.questions;
  const out = [];
  for (const v of Object.values(data)) {
    if (!Array.isArray(v)) continue;
    for (const item of v) {
      if (item?.questions) out.push(...item.questions);
      else out.push(item);
    }
  }
  return out;
}

function walkDir(dir, subject, report) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(p, subject, report);
    else if (ent.name.endsWith(".json") && ent.name !== "index.json") {
      const data = JSON.parse(fs.readFileSync(p, "utf8"));
      const questions = collectQuestions(data);
      report.totals.questions += questions.length;

      const textSeen = new Map();
      for (const q of questions) {
        const issues = validateQuestion(q);
        for (const issue of issues) {
          report.totals[issue.severity === "error" ? "errors" : "warnings"] += 1;
          report.issues.push({
            subject,
            file: path.relative(QUESTIONS_DIR, p),
            ...issue,
          });
        }
        const norm = normalizeText(extractQuestionText(q));
        const id = String(q.id ?? "");
        if (norm) {
          const prev = textSeen.get(norm);
          if (prev && prev !== id) {
            report.totals.errors += 1;
            report.issues.push({
              subject,
              file: path.relative(QUESTIONS_DIR, p),
              id,
              code: "duplicate_in_set",
              severity: "error",
              message: `Duplicate stem (also ${prev})`,
            });
          } else textSeen.set(norm, id);
        }
      }
    }
  }
}

function main() {
  const report = {
    generatedAt: new Date().toISOString(),
    strict: STRICT,
    totals: { questions: 0, errors: 0, warnings: 0 },
    issues: [],
  };

  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    const dir = path.join(QUESTIONS_DIR, subject);
    if (fs.statSync(dir).isDirectory()) walkDir(dir, subject, report);
  }

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(
    `MCQ QA: ${report.totals.questions} questions — ${report.totals.errors} errors, ${report.totals.warnings} warnings`,
  );
  console.log(`Report: ${path.relative(ROOT, REPORT_PATH)}`);

  const top = report.issues.slice(0, 15);
  for (const row of top) {
    console.log(`  [${row.severity}] ${row.file} ${row.id ?? ""} — ${row.code}: ${row.message}`);
  }
  if (report.issues.length > 15) {
    console.log(`  ... and ${report.issues.length - 15} more`);
  }

  if (STRICT && report.totals.errors > 0) process.exit(1);
}

main();
