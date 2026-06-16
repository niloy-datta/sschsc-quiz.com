/**
 * Structural MCQ QA validation (SSC/HSC board prep).
 * Conceptual correctness still requires human/AI review.
 */

export type McqOption = { label: "ক" | "খ" | "গ" | "ঘ"; text: string };

export type McqQaRecord = {
  id: string;
  question: string;
  options: McqOption[];
  correctOption: "ক" | "খ" | "গ" | "ঘ";
  shortSolution?: string;
  image?: string | null;
  topic?: string;
  difficulty?: "Easy" | "Medium" | "Hard" | string;
};

export type McqQaIssueCode =
  | "missing_id"
  | "missing_question"
  | "missing_options"
  | "invalid_option_count"
  | "empty_option"
  | "duplicate_options"
  | "missing_correct_option"
  | "invalid_correct_option"
  | "correct_not_in_options"
  | "missing_solution"
  | "duplicate_in_set"
  | "needs_diagram"
  | "untrusted_diagram";

export type McqQaIssue = {
  code: McqQaIssueCode;
  message: string;
  severity: "error" | "warn";
};

const BANGLA_LABELS = ["ক", "খ", "গ", "ঘ"] as const;

const DIAGRAM_HINT_RE =
  /\[চিত্র\s*[:：]|\(চিত্র\s*[:：]|চিত্রে|উদ্দীপক|চিত্রভিত্তিক|লেখচিত্র|গ্রাফ|diagram|circuit|বৃত্ত|triangle|ত্রিভুজ|vector|সমন্বয়|অক্ষ|wave|তরঙ্গ|force|বল\s*চিত্র|V-I|I-V|E-ν|motion\s*graph/i;

export function normalizeMcqText(text: string): string {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/\$\$/g, "")
    .trim()
    .toLowerCase();
}

export function extractOptionsFromRaw(raw: Record<string, unknown>): string[] {
  if (Array.isArray(raw.options)) {
    return raw.options.map((o) => {
      if (typeof o === "string") return o;
      if (o && typeof o === "object" && "text" in o) return String((o as { text: string }).text);
      return "";
    });
  }
  return [
    raw.optionA,
    raw.optionB,
    raw.optionC,
    raw.optionD,
  ].map((v) => (typeof v === "string" ? v : ""));
}

export function extractQuestionText(raw: Record<string, unknown>): string {
  const t = raw.question ?? raw.questionText ?? raw.text;
  return typeof t === "string" ? t : "";
}

export function inferCorrectLabelFromRaw(
  raw: Record<string, unknown>,
  options: string[],
): string {
  const correctRaw =
    raw.correctOption ?? raw.correctAnswer ?? raw.answer ?? raw.correct;

  if (typeof raw.answerIndex === "number" && raw.answerIndex >= 0 && raw.answerIndex <= 3) {
    return BANGLA_LABELS[raw.answerIndex];
  }

  if (correctRaw != null && String(correctRaw).trim()) {
    const s = String(correctRaw).trim();
    if (BANGLA_LABELS.includes(s as (typeof BANGLA_LABELS)[number])) return s;
    const map: Record<string, string> = { A: "ক", B: "খ", C: "গ", D: "ঘ" };
    if (map[s.toUpperCase()]) return map[s.toUpperCase()];
    const idx = options.findIndex((o) => o.trim() === s);
    if (idx >= 0 && idx <= 3) return BANGLA_LABELS[idx];
  }

  const cot = raw.correctOptionText;
  if (typeof cot === "string" && cot.trim()) {
    const idx = options.findIndex((o) => o.trim() === cot.trim());
    if (idx >= 0 && idx <= 3) return BANGLA_LABELS[idx];
  }

  if (correctRaw != null && String(correctRaw).trim()) {
    return String(correctRaw).trim();
  }

  return "";
}

export function extractCorrectLabel(raw: Record<string, unknown>): string {
  const options = extractOptionsFromRaw(raw);
  return inferCorrectLabelFromRaw(raw, options);
}

export function questionNeedsDiagram(text: string): boolean {
  return DIAGRAM_HINT_RE.test(text);
}

export function validateMcqStructure(
  raw: Record<string, unknown>,
  ctx?: { trustedDiagramSlugs?: Set<string> },
): McqQaIssue[] {
  const issues: McqQaIssue[] = [];
  const id = String(raw.id ?? "").trim();
  const question = extractQuestionText(raw).trim();
  const options = extractOptionsFromRaw(raw).map((t) => t.trim());
  const correctOption = extractCorrectLabel(raw);
  const shortSolution = String(raw.shortSolution ?? raw.explanation ?? "").trim();
  const image = typeof raw.image === "string" ? raw.image : null;

  if (!id) {
    issues.push({ code: "missing_id", message: "Missing question id", severity: "error" });
  }
  if (!question || question.length < 8) {
    issues.push({
      code: "missing_question",
      message: "Question text missing or too short",
      severity: "error",
    });
  }
  if (options.length === 0) {
    issues.push({ code: "missing_options", message: "No options found", severity: "error" });
  } else if (options.length !== 4) {
    issues.push({
      code: "invalid_option_count",
      message: `Expected 4 options, got ${options.length}`,
      severity: "error",
    });
  }

  for (let i = 0; i < options.length; i++) {
    if (!options[i]) {
      issues.push({
        code: "empty_option",
        message: `Option ${BANGLA_LABELS[i] ?? i + 1} is empty`,
        severity: "error",
      });
    }
  }

  const normalizedOpts = options.filter(Boolean).map(normalizeMcqText);
  const unique = new Set(normalizedOpts);
  if (normalizedOpts.length >= 2 && unique.size < normalizedOpts.length) {
    issues.push({
      code: "duplicate_options",
      message: "Duplicate option text within question",
      severity: "error",
    });
  }

  if (!correctOption) {
    issues.push({
      code: "missing_correct_option",
      message: "Missing correctOption / answerIndex (verify against answer key)",
      severity: "warn",
    });
  } else if (!BANGLA_LABELS.includes(correctOption as (typeof BANGLA_LABELS)[number])) {
    issues.push({
      code: "invalid_correct_option",
      message: `Invalid correctOption: "${correctOption}"`,
      severity: "error",
    });
  } else {
    const idx = BANGLA_LABELS.indexOf(correctOption as (typeof BANGLA_LABELS)[number]);
    if (options[idx] && !options[idx].trim()) {
      issues.push({
        code: "correct_not_in_options",
        message: "Correct option points to empty option slot",
        severity: "error",
      });
    }
  }

  if (!shortSolution) {
    issues.push({
      code: "missing_solution",
      message: "Missing shortSolution / explanation",
      severity: "warn",
    });
  }

  if (questionNeedsDiagram(question) && !image) {
    issues.push({
      code: "needs_diagram",
      message: "Question references diagram/graph but image is missing",
      severity: "warn",
    });
  }

  if (image && ctx?.trustedDiagramSlugs) {
    const slug = image.replace(/^\/images\/quiz\//, "").replace(/\.svg$/i, "");
    if (!ctx.trustedDiagramSlugs.has(slug)) {
      issues.push({
        code: "untrusted_diagram",
        message: `Untrusted diagram slug: ${slug}`,
        severity: "warn",
      });
    }
  }

  return issues;
}

export function toMcqQaRecord(raw: Record<string, unknown>): McqQaRecord {
  const options = extractOptionsFromRaw(raw);
  return {
    id: String(raw.id ?? ""),
    question: extractQuestionText(raw),
    options: BANGLA_LABELS.map((label, i) => ({
      label,
      text: options[i] ?? "",
    })),
    correctOption: extractCorrectLabel(raw) as McqQaRecord["correctOption"],
    shortSolution: String(raw.shortSolution ?? raw.explanation ?? ""),
    image: typeof raw.image === "string" ? raw.image : null,
    topic: typeof raw.topic === "string" ? raw.topic : undefined,
    difficulty: typeof raw.difficulty === "string" ? raw.difficulty : undefined,
  };
}

export function findDuplicateQuestionIds(
  questions: Array<Record<string, unknown>>,
): string[] {
  const seen = new Map<string, string>();
  const dupes: string[] = [];
  for (const q of questions) {
    const id = String(q.id ?? "");
    const text = normalizeMcqText(extractQuestionText(q));
    if (!text) continue;
    const prev = seen.get(text);
    if (prev && prev !== id) dupes.push(id);
    else seen.set(text, id);
  }
  return dupes;
}
