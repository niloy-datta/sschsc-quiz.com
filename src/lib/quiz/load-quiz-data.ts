import { inferModelTestScope } from "@/lib/format-model-test-title";
import {
  resolveFileSubjectSlug,
  type RegistryLevel,
} from "@/lib/quiz/registry";
import { extractChapterFromSourceKey } from "@/lib/quiz/normalize-quiz-data";
import type { NormalizedQuizSet, ParsedSubjectQuizData } from "@/lib/quiz/types";
import type { ApiQuestion } from "@/types/quiz";

function mapIndexModelTest(
  m: { id: string; title: string; questionCount: number; scope?: string; tags?: string[] },
  level: RegistryLevel,
  fileSlug: string,
  paper?: string,
): NormalizedQuizSet {
  const scope = inferModelTestScope(m.id, {
    scope: m.scope as "chapter" | "paper" | undefined,
    tags: m.tags,
  });
  const fromKey = extractChapterFromSourceKey(m.id);
  const chapter = fromKey.chapter;
  const chapterName = fromKey.chapterName;

  return {
    id: m.id,
    title: m.title,
    displayTitle: m.title,
    level,
    subject: fileSlug,
    paper: paper ?? null,
    type: scope === "chapter" ? "chapter-wise" : "model-test",
    chapter,
    chapterName,
    questionCount: m.questionCount,
    questions: [],
    scope,
    sourceKey: m.id,
  };
}

const clientCache = new Map<string, ParsedSubjectQuizData>();

/** Bump when chapter/model/board split logic changes — busts stale in-memory cache. */
const QUIZ_DATA_CACHE_VERSION = 12;

export async function loadSubjectQuizData(
  level: RegistryLevel,
  subject: string,
  paper?: string,
): Promise<ParsedSubjectQuizData | null> {
  const fileSlug = resolveFileSubjectSlug(level, subject, paper);
  const cacheKey = `v${QUIZ_DATA_CACHE_VERSION}/${level}/${fileSlug}`;

  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }

  const jsonPath = `/questions/${fileSlug}/index.json`;

  try {
    const res = await fetch(jsonPath, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const indexData = await res.json();
    
    // Map index.json to ParsedSubjectQuizData structure
    const mappedModelTests = (indexData.modelTests || []).map((m: {
      id: string;
      title: string;
      questionCount: number;
      scope?: string;
      tags?: string[];
    }) => mapIndexModelTest(m, level, fileSlug, paper));

    let chapterSets: NormalizedQuizSet[] = (indexData.chapters || []).map(
      (c: { id: string; title: string; questionCount: number }) => ({
        id: c.id,
        title: c.title,
        displayTitle: c.title,
        level,
        subject: fileSlug,
        paper: paper ?? null,
        type: "chapter-wise" as const,
        chapter: c.id,
        chapterName: c.title,
        questionCount: c.questionCount,
        questions: [],
        scope: "chapter" as const,
        sourceKey: c.id,
      }),
    );

    let modelTestSets = mappedModelTests.filter(
      (s: NormalizedQuizSet) => s.scope !== "chapter",
    );

    const parsed: ParsedSubjectQuizData = {
      level,
      subject: fileSlug,
      paper: paper ?? null,
      chapterSets,
      modelTestSets,
      boardSets: (indexData.boards || []).map((b: any) => ({
        id: b.id,
        title: b.title,
        displayTitle: b.title,
        level,
        subject: fileSlug,
        paper: paper ?? null,
        type: "board-wise",
        chapter: null,
        chapterName: null,
        questionCount: b.questionCount,
        questions: [], // loaded dynamically
        scope: "board",
        sourceKey: b.id,
      })),
      stats: {
        skippedEmpty: 0,
        skippedInvalidOptions: 0,
        skippedInvalidCorrect: 0,
        skippedBrokenOcr: 0,
        duplicateIdsFixed: 0,
        totalInput: 0,
        totalValid: 0,
      },
      rawFilePath: jsonPath,
    };

    clientCache.set(cacheKey, parsed);
    return parsed;
  } catch (err) {
    return {
      level,
      subject: fileSlug,
      paper: paper ?? null,
      chapterSets: [],
      modelTestSets: [],
      boardSets: [],
      stats: {
        skippedEmpty: 0,
        skippedInvalidOptions: 0,
        skippedInvalidCorrect: 0,
        skippedBrokenOcr: 0,
        duplicateIdsFixed: 0,
        totalInput: 0,
        totalValid: 0,
      },
      rawFilePath: jsonPath,
      loadError: String(err),
    };
  }
}

/** Map a single raw JSON question object to the ApiQuestion shape used by QuizRunner. */
export function mapRawQuestionToApi(
  raw: Record<string, unknown>,
  index: number,
): ApiQuestion | null {
  const questionText = String(
    raw.questionText ?? raw.text ?? raw.question ?? "",
  ).trim();
  if (!questionText) return null;

  let optionA = String(raw.optionA ?? "").trim();
  let optionB = String(raw.optionB ?? "").trim();
  let optionC = String(raw.optionC ?? "").trim();
  let optionD = String(raw.optionD ?? "").trim();

  if (Array.isArray(raw.options)) {
    const opts = raw.options.map((o) => {
      if (typeof o === "string") return o.trim();
      if (o && typeof o === "object" && "text" in o) {
        return String((o as { text: string }).text).trim();
      }
      return "";
    });
    optionA = opts[0] ?? optionA;
    optionB = opts[1] ?? optionB;
    optionC = opts[2] ?? optionC;
    optionD = opts[3] ?? optionD;
  }

  return {
    id: String(raw.id ?? `q-${index}`),
    questionText,
    optionA,
    optionB,
    optionC,
    optionD,
    correctOption: "",
    subject: typeof raw.subject === "string" ? raw.subject : undefined,
    chapter: typeof raw.chapter === "string" ? raw.chapter : undefined,
    explanation: "",
  };
}

function extractQuestionList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === "object",
    );
  }
  if (data && typeof data === "object" && Array.isArray((data as { questions?: unknown }).questions)) {
    return ((data as { questions: unknown[] }).questions ?? []).filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === "object",
    );
  }
  return [];
}

export function mapJsonPayloadToQuestions(data: unknown): ApiQuestion[] {
  return extractQuestionList(data)
    .map((pq, i) => mapRawQuestionToApi(pq, i))
    .filter((q): q is ApiQuestion => q !== null);
}

/** Unique filename candidates derived from setId (handles prefix mismatches). */
export function buildQuestionFilenameCandidates(
  setId: string,
  fileSlug: string,
  level: RegistryLevel,
): string[] {
  const candidates = new Set<string>([setId]);

  const prefixPatterns: RegExp[] = [
    new RegExp(`^${level}-${fileSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-`, "i"),
    new RegExp(`^ssc-${fileSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-`, "i"),
    new RegExp(`^hsc-${fileSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-`, "i"),
  ];

  if (fileSlug === "general-math") {
    prefixPatterns.push(/^ssc-general-math-/i, /^ssc-math-/i);
    candidates.add(setId.replace(/^ssc-math-/i, "ssc-general-math-"));
    candidates.add(setId.replace(/^ssc-general-math-/i, "ssc-math-"));
  }

  for (const pattern of prefixPatterns) {
    const stripped = setId.replace(pattern, "");
    if (stripped && stripped !== setId) {
      candidates.add(stripped);
    }
  }

  if (!setId.startsWith(`${level}-`) && !setId.startsWith("ssc-") && !setId.startsWith("hsc-")) {
    candidates.add(`${level}-${fileSlug}-${setId}`);
    candidates.add(`ssc-${fileSlug}-${setId}`);
    candidates.add(`hsc-${fileSlug}-${setId}`);
  }

  return Array.from(candidates);
}

/** All URL paths to try for a quiz set, in priority order. */
export function buildQuestionFetchPaths(
  fileSlug: string,
  setId: string,
  level: RegistryLevel,
): string[] {
  const paths = new Set<string>();
  for (const filename of buildQuestionFilenameCandidates(setId, fileSlug, level)) {
    paths.add(`/questions/${fileSlug}/${filename}.json`);
    paths.add(`/questions/${fileSlug}/model-tests/${filename}.json`);
  }
  return Array.from(paths);
}

export type FetchQuizResult = {
  questions: ApiQuestion[];
  path: string | null;
  attemptedPaths: string[];
};

async function tryFetchQuestionPath(path: string): Promise<ApiQuestion[] | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) {
      return null;
    }
    const data: unknown = await res.json();
    const mapped = mapJsonPayloadToQuestions(data);
    return mapped.length > 0 ? mapped : null;
  } catch {
    return null;
  }
}

export async function fetchNormalizedQuestionsWithMeta(
  level: RegistryLevel,
  subject: string,
  setId: string,
  paper?: string,
): Promise<FetchQuizResult> {
  const fileSlug = resolveFileSubjectSlug(level, subject, paper);
  const attemptedPaths = buildQuestionFetchPaths(fileSlug, setId, level);

  for (const path of attemptedPaths) {
    const mapped = await tryFetchQuestionPath(path);
    if (mapped) {
      console.log("Fetched Quiz Data:", {
        path,
        count: mapped.length,
        sample: mapped[0],
        setId,
        fileSlug,
      });
      return { questions: mapped, path, attemptedPaths };
    }
  }

  console.error("Failed to fetch quiz JSON — all paths returned 404 or empty:", {
    setId,
    fileSlug,
    attemptedPaths,
  });
  return { questions: [], path: null, attemptedPaths };
}

export async function fetchNormalizedQuestions(
  level: RegistryLevel,
  subject: string,
  setId: string,
  paper?: string,
): Promise<ApiQuestion[]> {
  const result = await fetchNormalizedQuestionsWithMeta(level, subject, setId, paper);
  return result.questions;
}

export function clearQuizDataCache(): void {
  clientCache.clear();
}

