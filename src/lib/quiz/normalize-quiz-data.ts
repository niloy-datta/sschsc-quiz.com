import type { ApiQuestion } from "@/types/quiz";
import { expectedMcqForSubject } from "@/lib/quiz/registry";
import {
  isPlaceholderQuestionText,
  sanitizeQuizText,
} from "@/lib/sanitize-quiz-text";
import type {
  BanglaOptionLabel,
  AnswerIndex,
  NormalizedQuestion,
  NormalizedQuizSet,
  NormalizationStats,
  ParsedSubjectQuizData,
  QuizSetType,
} from "@/lib/quiz/types";

const BANGLA_LABELS: BanglaOptionLabel[] = ["ক", "খ", "গ", "ঘ"];
const LATIN_LABELS = ["A", "B", "C", "D"] as const;

export function isHiddenSourceKey(sourceKey: string): boolean {
  const s = sourceKey.toLowerCase();
  return (
    s.endsWith("_questions") ||
    s.endsWith("-questions") ||
    s.includes("prediction") ||
    s.includes("hscictprediction") ||
    s === "killer-set" ||
    s.includes("killer-set") ||
    s.includes("ai-prediction")
  );
}

/** User-imported chapter-wise sets (high-priority, set-XX, model-test-XX). */
export function isImportedChapterModelKey(sourceKey: string): boolean {
  const s = sourceKey.toLowerCase();
  return (
    /chapter-\d{2}-(?:high-priority-)?(?:set|model-test)-\d{2}/.test(s) ||
    /^hsc-[a-z0-9-]+-chapter-\d{2}-/.test(s)
  );
}

/** Legacy topic slug keys — hide when imported chapter sets exist. */
export function isLegacyChapterJunkKey(sourceKey: string): boolean {
  if (isImportedChapterModelKey(sourceKey)) return false;
  const s = sourceKey.toLowerCase();
  return (
    /^physicsfirstpaperch\d/.test(s) ||
    /^chemistryset\d/.test(s) ||
    /^physicsfirstpaperchset/.test(s) ||
    (/^model-test-\d+-[a-z]/i.test(sourceKey) && !s.includes("chapter"))
  );
}

/** @deprecated use isImportedChapterModelKey */
export function isStandardChapterModelKey(sourceKey: string): boolean {
  return isImportedChapterModelKey(sourceKey);
}

function emptyStats(): NormalizationStats {
  return {
    skippedEmpty: 0,
    skippedInvalidOptions: 0,
    skippedInvalidCorrect: 0,
    skippedBrokenOcr: 0,
    duplicateIdsFixed: 0,
    totalInput: 0,
    totalValid: 0,
  };
}

function mergeStats(a: NormalizationStats, b: NormalizationStats): NormalizationStats {
  return {
    skippedEmpty: a.skippedEmpty + b.skippedEmpty,
    skippedInvalidOptions: a.skippedInvalidOptions + b.skippedInvalidOptions,
    skippedInvalidCorrect: a.skippedInvalidCorrect + b.skippedInvalidCorrect,
    skippedBrokenOcr: a.skippedBrokenOcr + b.skippedBrokenOcr,
    duplicateIdsFixed: a.duplicateIdsFixed + b.duplicateIdsFixed,
    totalInput: a.totalInput + b.totalInput,
    totalValid: a.totalValid + b.totalValid,
  };
}

function labelToIndex(label: string): AnswerIndex | null {
  const s = label.trim();
  const banglaIdx = BANGLA_LABELS.indexOf(s as BanglaOptionLabel);
  if (banglaIdx >= 0) return banglaIdx as AnswerIndex;
  const upper = s.toUpperCase();
  const latinIdx = LATIN_LABELS.indexOf(upper as "A" | "B" | "C" | "D");
  if (latinIdx >= 0) return latinIdx as AnswerIndex;
  if (/^[1-4]$/.test(s)) return (parseInt(s, 10) - 1) as AnswerIndex;
  return null;
}

function indexToBangla(idx: AnswerIndex): BanglaOptionLabel {
  return BANGLA_LABELS[idx];
}

function indexToLatin(idx: AnswerIndex): string {
  return LATIN_LABELS[idx];
}

function isBrokenOcrQuestion(text: string): boolean {
  const t = text.trim();
  if (!t || t.length < 3) return true;
  if (isPlaceholderQuestionText(t)) return true;
  if (/^(graph|figure|image)\s*only/i.test(t)) return true;
  if (t === "..." || t === "---") return true;
  return false;
}

function extractOptions(raw: Record<string, unknown>): string[] | null {
  const sanitizeOpt = (s: string) => sanitizeQuizText(s, "option");

  if (Array.isArray(raw.options)) {
    const opts = raw.options.map((o) => {
      if (typeof o === "string") return sanitizeOpt(o.trim());
      if (o && typeof o === "object" && "text" in o) {
        return sanitizeOpt(String((o as { text: string }).text).trim());
      }
      return "";
    });
    if (opts.filter(Boolean).length >= 4) return opts.slice(0, 4);
  }

  const fromFields = [
    raw.optionA,
    raw.optionB,
    raw.optionC,
    raw.optionD,
  ].map((v) => sanitizeOpt(typeof v === "string" ? v.trim() : String(v ?? "").trim()));

  if (fromFields.filter(Boolean).length >= 4) return fromFields;

  return null;
}

function extractQuestionText(raw: Record<string, unknown>): string {
  const q =
    raw.questionText ??
    raw.question ??
    raw.text ??
    raw.q ??
    "";
  return sanitizeQuizText(String(q).trim(), "question");
}

function inferCorrectIndex(
  raw: Record<string, unknown>,
  options: string[],
): AnswerIndex | null {
  const correctRaw =
    raw.correctOption ??
    raw.correctAnswer ??
    raw.answer ??
    raw.correct;

  if (typeof raw.answerIndex === "number" && raw.answerIndex >= 0 && raw.answerIndex <= 3) {
    return raw.answerIndex as AnswerIndex;
  }

  if (correctRaw != null) {
    const idx = labelToIndex(String(correctRaw));
    if (idx !== null) return idx;
  }

  if (typeof raw.correctOptionText === "string") {
    const match = options.findIndex(
      (o) => o.trim() === String(raw.correctOptionText).trim(),
    );
    if (match >= 0 && match <= 3) return match as AnswerIndex;
  }

  return null;
}

export function normalizeQuestion(
  raw: unknown,
  ctx: {
    index: number;
    setId: string;
    usedIds: Set<string>;
    stats: NormalizationStats;
    chapter?: string;
    chapterName?: string;
  },
): NormalizedQuestion | null {
  if (!raw || typeof raw !== "object") {
    ctx.stats.skippedEmpty++;
    return null;
  }

  const record = raw as Record<string, unknown>;
  ctx.stats.totalInput++;

  const question = extractQuestionText(record);
  if (!question || isBrokenOcrQuestion(question)) {
    ctx.stats.skippedBrokenOcr++;
    return null;
  }

  const optionTexts = extractOptions(record);
  if (!optionTexts || optionTexts.some((o) => !o)) {
    ctx.stats.skippedInvalidOptions++;
    return null;
  }

  const answerIndex = inferCorrectIndex(record, optionTexts);
  if (answerIndex === null) {
    ctx.stats.skippedInvalidCorrect++;
    return null;
  }

  let id = String(record.id ?? `${ctx.setId}-q-${ctx.index}`);
  if (ctx.usedIds.has(id)) {
    id = `${id}-${ctx.index}`;
    ctx.stats.duplicateIdsFixed++;
  }
  ctx.usedIds.add(id);

  const options = optionTexts.map((text, i) => ({
    label: BANGLA_LABELS[i],
    text,
  }));

  const explanation =
    typeof record.explanation === "string" ? record.explanation : undefined;
  const shortSolution =
    typeof record.shortSolution === "string"
      ? record.shortSolution
      : explanation;

  ctx.stats.totalValid++;

  return {
    id,
    questionNo: typeof record.questionNo === "number" ? record.questionNo : ctx.index + 1,
    question,
    options,
    correctOption: indexToBangla(answerIndex),
    answerIndex,
    chapter: ctx.chapter ?? (typeof record.chapter === "string" ? record.chapter : undefined),
    chapterName:
      ctx.chapterName ??
      (typeof record.chapterName === "string" ? record.chapterName : undefined),
    topic: typeof record.topic === "string" ? record.topic : undefined,
    difficulty: typeof record.difficulty === "string" ? record.difficulty : undefined,
    shortSolution,
    explanation,
    whyImportant:
      typeof record.whyImportant === "string" ? record.whyImportant : undefined,
    sourceType: typeof record.sourceType === "string" ? record.sourceType : undefined,
    sourceYear:
      record.sourceYear != null ? String(record.sourceYear) : null,
    sourceBoard:
      record.sourceBoard != null ? String(record.sourceBoard) : null,
    stimulusId:
      record.stimulusId != null ? String(record.stimulusId) : null,
    stimulus:
      record.stimulus != null ? String(record.stimulus) : null,
    image:
      typeof record.image === "string"
        ? record.image
        : typeof record.svg === "string"
          ? record.svg
          : null,
  };
}

export function normalizeQuestionList(
  rawList: unknown[],
  setId: string,
  stats: NormalizationStats,
  chapter?: string,
  chapterName?: string,
): NormalizedQuestion[] {
  const usedIds = new Set<string>();
  const out: NormalizedQuestion[] = [];
  for (let i = 0; i < rawList.length; i++) {
    const q = normalizeQuestion(rawList[i], {
      index: i,
      setId,
      usedIds,
      stats,
      chapter,
      chapterName,
    });
    if (q) out.push(q);
  }
  return out;
}

/** Convert normalized question to legacy ApiQuestion for QuizRunner */
export function toApiQuestion(nq: NormalizedQuestion): ApiQuestion {
  return {
    id: nq.id,
    questionText: nq.question,
    optionA: nq.options[0]?.text ?? "",
    optionB: nq.options[1]?.text ?? "",
    optionC: nq.options[2]?.text ?? "",
    optionD: nq.options[3]?.text ?? "",
    correctOption: indexToLatin(nq.answerIndex),
    chapter: nq.chapter,
    explanation: nq.explanation ?? nq.shortSolution,
    image: nq.image ?? null,
  };
}

export function extractChapterFromSourceKey(sourceKey: string): {
  chapter: string | null;
  chapterName: string | null;
} {
  const s = sourceKey.toLowerCase();
  const m =
    s.match(/chapter[-_]?(\d{1,2})[-_]/) ||
    s.match(/ch(\d{1,2})[-_]/) ||
    s.match(/chapter[-_]?(\d{1,2})$/);
  if (!m) return { chapter: null, chapterName: null };
  const chapter = normalizeChapterId(m[1]);
  return { chapter, chapterName: null };
}

function extractChapterFromMeta(meta?: Record<string, unknown>): {
  chapter: string | null;
  chapterName: string | null;
} {
  const covered = meta?.chaptersCovered;
  if (!Array.isArray(covered) || !covered.length) {
    return { chapter: null, chapterName: null };
  }
  const first = covered[0];
  if (typeof first === "string") {
    return { chapter: null, chapterName: first };
  }
  if (first && typeof first === "object") {
    const rec = first as Record<string, unknown>;
    const chapter =
      rec.chapter != null ? normalizeChapterId(String(rec.chapter)) : null;
    const chapterName =
      typeof rec.chapterName === "string"
        ? rec.chapterName
        : typeof rec.name === "string"
          ? rec.name
          : null;
    return { chapter, chapterName };
  }
  return { chapter: null, chapterName: null };
}

function inferModelScope(
  sourceKey: string,
  meta?: Record<string, unknown>,
): "paper" | "chapter" | "board" | "whole-syllabus" {
  const s = sourceKey.toLowerCase();
  const tags = ((meta?.tags as string[]) ?? []).map((t) => t.toLowerCase());
  const scope = typeof meta?.scope === "string" ? meta.scope.toLowerCase() : "";

  if (scope === "chapter" || tags.includes("chapter-wise") || tags.includes("chapter")) {
    return "chapter";
  }
  if (scope === "board" || tags.includes("board-wise") || s.includes("board")) {
    return "board";
  }
  if (
    scope === "whole-syllabus" ||
    scope === "whole" ||
    tags.includes("whole-syllabus") ||
    tags.includes("full-book") ||
    s.includes("whole-syllabus") ||
    s.includes("full-book")
  ) {
    return "whole-syllabus";
  }
  if (/ch\d|chapter[-_]?\d|chapterwise/.test(s)) return "chapter";
  if (/tier-a-hot|board-standard|high-common|super-model/.test(s)) return "paper";
  return "paper";
}

function buildQuizSet(
  partial: Omit<NormalizedQuizSet, "questionCount"> & { questions: NormalizedQuestion[] },
): NormalizedQuizSet {
  const count = partial.questions.length;
  const duration =
    partial.durationMinutes ??
  (count > 0 ? Math.max(15, Math.ceil(count * 0.75)) : 25);

  return {
    ...partial,
    questionCount: count,
    durationMinutes: duration,
  };
}

function normalizeChapterId(ch: string): string {
  const clean = ch.trim();
  if (/^\d+$/.test(clean)) {
    return `chapter-${clean.padStart(2, "0")}`;
  }
  const match = clean.match(/^chapter[-_]?(\d+)$/i);
  if (match) {
    return `chapter-${match[1].padStart(2, "0")}`;
  }
  return clean;
}

function parseChaptersObject(
  chapters: Record<string, unknown[]>,
  level: "ssc" | "hsc",
  subject: string,
  paper: string | null | undefined,
  stats: NormalizationStats,
): NormalizedQuizSet[] {
  const sets: NormalizedQuizSet[] = [];

  for (const [chapterKey, rawQs] of Object.entries(chapters)) {
    if (!Array.isArray(rawQs)) continue;
    if (isHiddenSourceKey(chapterKey)) continue;

    const setId = chapterKey;
    const questions = normalizeQuestionList(
      rawQs,
      setId,
      stats,
      chapterKey,
    );

    const firstWithChName = questions.find((q) => q.chapterName);
    const chapterName = firstWithChName?.chapterName;

    sets.push(
      buildQuizSet({
        id: setId,
        title: chapterKey,
        displayTitle: chapterKey,
        level,
        subject,
        paper,
        type: "chapter-wise",
        chapter: chapterKey,
        chapterName,
        questions,
        scope: "chapter",
        sourceKey: chapterKey,
      }),
    );
  }

  return sets;
}

function parseModelTestsObject(
  modelTests: Record<string, unknown[]>,
  metaByKey: Record<string, Record<string, unknown>>,
  level: "ssc" | "hsc",
  subject: string,
  paper: string | null | undefined,
  stats: NormalizationStats,
): NormalizedQuizSet[] {
  const sets: NormalizedQuizSet[] = [];

  for (const [key, rawQs] of Object.entries(modelTests)) {
    if (!Array.isArray(rawQs)) continue;
    if (isHiddenSourceKey(key)) continue;

    const meta = metaByKey[key] ?? {};
    const scope = inferModelScope(key, meta);
    const fromMeta = extractChapterFromMeta(meta);
    const fromKey = extractChapterFromSourceKey(key);
    const chapter = fromMeta.chapter ?? fromKey.chapter;
    const chapterName = fromMeta.chapterName ?? fromKey.chapterName;
    const questions = normalizeQuestionList(
      rawQs,
      key,
      stats,
      chapter ?? undefined,
      chapterName ?? undefined,
    );

    sets.push(
      buildQuizSet({
        id: key,
        title: key,
        displayTitle:
          typeof meta.displayTitle === "string"
            ? meta.displayTitle
            : key,
        level,
        subject,
        paper,
        type:
          scope === "chapter"
            ? "chapter-wise"
            : scope === "whole-syllabus"
              ? "whole-syllabus"
              : "model-test",
        chapter,
        chapterName,
        questions,
        scope,
        sourceKey: key,
        importance:
          typeof meta.importance === "string"
            ? (meta.importance as "high" | "medium" | "low")
            : undefined,
        difficulty:
          typeof meta.difficulty === "string"
            ? (meta.difficulty as "easy" | "medium" | "hard" | "advanced")
            : undefined,
        durationMinutes:
          typeof meta.durationMinutes === "number"
            ? meta.durationMinutes
            : undefined,
      }),
    );
  }

  return sets;
}

function parseChapterWiseArray(
  chapterWise: unknown[],
  level: "ssc" | "hsc",
  subject: string,
  paper: string | null | undefined,
  stats: NormalizationStats,
): NormalizedQuizSet[] {
  const sets: NormalizedQuizSet[] = [];

  for (const entry of chapterWise) {
    if (!entry || typeof entry !== "object") continue;
    const rec = entry as Record<string, unknown>;
    const chapterNo = rec.chapterNo ?? rec.chapter;
    const chapterName =
      typeof rec.chapterName === "string" ? rec.chapterName : undefined;
    const chapterSlug =
      typeof rec.chapterSlug === "string"
        ? rec.chapterSlug
        : chapterNo != null
          ? `chapter-${String(chapterNo).padStart(2, "0")}`
          : "chapter";

    const rawSets = rec.sets ?? rec.modelTests ?? [];
    if (!Array.isArray(rawSets)) continue;

    for (let si = 0; si < rawSets.length; si++) {
      const setEntry = rawSets[si];
      let rawQs: unknown[] = [];
      let setKey = `${chapterSlug}-set-${si + 1}`;

      if (Array.isArray(setEntry)) {
        rawQs = setEntry;
      } else if (setEntry && typeof setEntry === "object") {
        const se = setEntry as Record<string, unknown>;
        if (Array.isArray(se.questions)) rawQs = se.questions;
        if (typeof se.id === "string") setKey = se.id;
        if (typeof se.setId === "string") setKey = se.setId;
      }

      if (isHiddenSourceKey(setKey)) continue;

      const questions = normalizeQuestionList(
        rawQs,
        setKey,
        stats,
        chapterSlug,
        chapterName,
      );

      sets.push(
        buildQuizSet({
          id: setKey,
          title: setKey,
          displayTitle: setKey,
          level,
          subject,
          paper,
          type: "chapter-wise",
          chapter: chapterSlug,
          chapterName,
          questions,
          scope: "chapter",
          sourceKey: setKey,
        }),
      );
    }
  }

  return sets;
}

function parseBoardQuestions(
  boardQuestions: Record<string, Record<string, unknown[]>>,
  level: "ssc" | "hsc",
  subject: string,
  paper: string | null | undefined,
  stats: NormalizationStats,
): NormalizedQuizSet[] {
  const sets: NormalizedQuizSet[] = [];

  for (const [year, boards] of Object.entries(boardQuestions)) {
    if (!boards || typeof boards !== "object") continue;
    for (const [board, rawQs] of Object.entries(boards)) {
      if (!Array.isArray(rawQs)) continue;
      const setId = `${board}-${year}`;
      const questions = normalizeQuestionList(rawQs, setId, stats);
      sets.push(
        buildQuizSet({
          id: setId,
          title: setId,
          displayTitle: `${board} ${year}`,
          level,
          subject,
          paper,
          type: "board-wise",
          questions,
          scope: "board",
          sourceKey: setId,
        }),
      );
    }
  }

  return sets;
}

function parseWholeModelTests(
  wholeModelTests: unknown[],
  level: "ssc" | "hsc",
  subject: string,
  paper: string | null | undefined,
  stats: NormalizationStats,
): NormalizedQuizSet[] {
  const sets: NormalizedQuizSet[] = [];

  for (let i = 0; i < wholeModelTests.length; i++) {
    const entry = wholeModelTests[i];
    let rawQs: unknown[] = [];
    let setKey = `whole-syllabus-${i + 1}`;

    if (Array.isArray(entry)) {
      rawQs = entry;
    } else if (entry && typeof entry === "object") {
      const e = entry as Record<string, unknown>;
      if (Array.isArray(e.questions)) rawQs = e.questions;
      if (typeof e.id === "string") setKey = e.id;
    }

    if (isHiddenSourceKey(setKey)) continue;

    const questions = normalizeQuestionList(rawQs, setKey, stats);
    sets.push(
      buildQuizSet({
        id: setKey,
        title: setKey,
        displayTitle: setKey,
        level,
        subject,
        paper,
        type: "whole-syllabus",
        questions,
        scope: "whole-syllabus",
        sourceKey: setKey,
      }),
    );
  }

  return sets;
}

/**
 * Parse raw subject JSON into normalized quiz sets.
 */
export function parseSubjectQuizJson(
  raw: unknown,
  filePath: string,
): ParsedSubjectQuizData {
  const stats = emptyStats();

  if (!raw || typeof raw !== "object") {
    return {
      level: "ssc",
      subject: "unknown",
      chapterSets: [],
      modelTestSets: [],
      boardSets: [],
      stats,
      rawFilePath: filePath,
      loadError: "Invalid JSON root",
    };
  }

  let data = raw as Record<string, unknown>;
  const levelRaw = String(data.level ?? "SSC").toLowerCase();
  const level: "ssc" | "hsc" = levelRaw === "hsc" ? "hsc" : "ssc";
  const subject = String(data.subject ?? filePath.split("/").pop()?.replace(".json", "") ?? "unknown");

  if (data.subjects && typeof data.subjects === "object") {
    const subjectsMap = data.subjects as Record<string, unknown>;
    const matchingKey = Object.keys(subjectsMap).find(
      (k) => k.toLowerCase() === subject.toLowerCase() || subject.toLowerCase().includes(k.toLowerCase())
    ) || Object.keys(subjectsMap)[0];

    if (matchingKey && subjectsMap[matchingKey] && typeof subjectsMap[matchingKey] === "object") {
      data = {
        ...data,
        ...(subjectsMap[matchingKey] as Record<string, unknown>),
      };
    }
  }

  let paper: string | null = null;
  if (subject.includes("-1st-paper")) paper = "1st-paper";
  if (subject.includes("-2nd-paper")) paper = "2nd-paper";

  const metaByKey = (data.modelTestsMeta as Record<string, Record<string, unknown>>) ?? {};

  let chapterSets: NormalizedQuizSet[] = [];
  let modelTestSets: NormalizedQuizSet[] = [];
  let boardSets: NormalizedQuizSet[] = [];

  if (data.chapters && typeof data.chapters === "object") {
    chapterSets = parseChaptersObject(
      data.chapters as Record<string, unknown[]>,
      level,
      subject,
      paper,
      stats,
    );
  }

  if (Array.isArray(data.chapterWise)) {
    chapterSets = [
      ...chapterSets,
      ...parseChapterWiseArray(data.chapterWise, level, subject, paper, stats),
    ];
  }

  if (data.modelTests && typeof data.modelTests === "object") {
    modelTestSets = parseModelTestsObject(
      data.modelTests as Record<string, unknown[]>,
      metaByKey,
      level,
      subject,
      paper,
      stats,
    );
  }

  if (Array.isArray(data.boardWise)) {
    modelTestSets = [
      ...modelTestSets,
      ...parseWholeModelTests(data.boardWise, level, subject, paper, stats).map(
        (s) => ({ ...s, type: "model-test" as QuizSetType, scope: "board" as const }),
      ),
    ];
  }

  if (Array.isArray(data.wholeModelTests)) {
    modelTestSets = [
      ...modelTestSets,
      ...parseWholeModelTests(data.wholeModelTests, level, subject, paper, stats),
    ];
  }

  if (data.boardQuestions && typeof data.boardQuestions === "object") {
    boardSets = parseBoardQuestions(
      data.boardQuestions as Record<string, Record<string, unknown[]>>,
      level,
      subject,
      paper,
      stats,
    );
  }

  // If no legacy chapter buckets exist, expose chapter-scoped model tests as individual sets (25 MCQ each).
  if (chapterSets.length === 0) {
    chapterSets = modelTestSets
      .filter((s) => s.scope === "chapter" && s.questionCount > 0)
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  return {
    level,
    subject,
    paper,
    chapterSets,
    modelTestSets,
    boardSets,
    stats,
    rawFilePath: filePath,
  };
}

export function findQuizSetById(
  parsed: ParsedSubjectQuizData,
  setId: string,
): NormalizedQuizSet | undefined {
  const all = [
    ...parsed.chapterSets,
    ...parsed.modelTestSets,
    ...parsed.boardSets,
  ];
  const lower = setId.toLowerCase();
  return all.find(
    (s) =>
      s.id === setId ||
      s.sourceKey === setId ||
      s.id.toLowerCase() === lower ||
      (s.sourceKey?.toLowerCase() === lower),
  );
}

export function getChapterQuizSets(
  parsed: ParsedSubjectQuizData,
  chapterSlug: string,
): NormalizedQuizSet[] {
  const target = normalizeChapterId(chapterSlug);
  return parsed.chapterSets
    .filter((s) => {
      const ch = s.chapter ? normalizeChapterId(s.chapter) : "";
      if (ch === target) return true;
      const fromKey = extractChapterFromSourceKey(s.sourceKey ?? s.id);
      if (!fromKey.chapter) return false;
      return normalizeChapterId(fromKey.chapter) === target;
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function groupChapterQuizSets(
  sets: NormalizedQuizSet[],
): Array<{
  chapterSlug: string;
  chapterName: string;
  sets: NormalizedQuizSet[];
  questionCount: number;
}> {
  const map = new Map<
    string,
    { chapterName: string; sets: NormalizedQuizSet[] }
  >();

  for (const set of sets) {
    const fromKey = extractChapterFromSourceKey(set.sourceKey ?? set.id);
    const slug = set.chapter
      ? normalizeChapterId(set.chapter)
      : fromKey.chapter ?? set.id;
    const name =
      set.chapterName ??
      fromKey.chapterName ??
      `অধ্যায় ${slug.replace(/^chapter-/, "").padStart(2, "0")}`;

    if (!map.has(slug)) {
      map.set(slug, { chapterName: name, sets: [] });
    }
    const group = map.get(slug)!;
    if (set.chapterName && group.chapterName.startsWith("অধ্যায়")) {
      group.chapterName = set.chapterName;
    }
    group.sets.push(set);
  }

  return Array.from(map.entries())
    .map(([chapterSlug, { chapterName, sets: chapterSets }]) => ({
      chapterSlug,
      chapterName,
      sets: chapterSets.sort((a, b) => a.id.localeCompare(b.id)),
      questionCount: chapterSets.reduce((n, s) => n + s.questionCount, 0),
    }))
    .sort((a, b) => a.chapterSlug.localeCompare(b.chapterSlug));
}

export function getExpectedMcqForSet(
  fileSubject: string,
  set: NormalizedQuizSet,
): number {
  return expectedMcqForSubject(fileSubject);
}
