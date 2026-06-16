import type { NormalizedQuizSet } from "@/lib/quiz/types";
import { groupChapterQuizSets } from "@/lib/quiz/normalize-quiz-data";
import type { ModelTestDifficulty, ModelTestImportance } from "@/lib/format-model-test-title";
import { parseModelTestTitle, toBanglaNumber, isHyperMegaHotSource } from "@/lib/format-model-test-title";
import type { ModelTestItem } from "@/lib/model-test-filters";

/** MCQs per timed mock set in the UI */
export const MOCK_SET_SIZE = 25;

/** Chapter totals above this get split into virtual sets in the UI */
export const LARGE_CHAPTER_THRESHOLD = 30;

export type QuizDisplayMode = "practice" | "timed";

export type QuizListItem = {
  id: string;
  setId: string;
  title: string;
  slug: string;
  href: string;
  questionCount: number;
  difficulty?: ModelTestDifficulty;
  importance?: ModelTestImportance;
  sortNumber?: number;
  attemptCount?: number;
  completed?: boolean;
  bestScore?: number;
  lastAttemptAt?: string;
  isWeak?: boolean;
  isHighScore?: boolean;
  isRecommended?: boolean;
  setCount?: number;
  totalQuestions?: number;
  mode?: QuizDisplayMode;
  partLabel?: string;
  scope?: ModelTestItem["scope"];
  tags?: string[];
  isHyperMegaHot?: boolean;
};

export type ChapterGroupDisplay = {
  chapterSlug: string;
  chapterName: string;
  totalQuestions: number;
  physicalSetCount: number;
  displaySets: QuizListItem[];
  practiceMode: boolean;
};

const PART_SUFFIX_RE = /__part-(\d+)$/;

export function parseVirtualSetId(setId: string): {
  sourceSetId: string;
  partIndex: number | null;
} {
  const m = setId.match(PART_SUFFIX_RE);
  if (!m) return { sourceSetId: setId, partIndex: null };
  return {
    sourceSetId: setId.replace(PART_SUFFIX_RE, ""),
    partIndex: parseInt(m[1], 10) - 1,
  };
}

export function sliceQuestionsForVirtualSet<T>(
  questions: T[],
  setId: string,
): T[] {
  const { partIndex } = parseVirtualSetId(setId);
  if (partIndex === null) return questions;
  const start = partIndex * MOCK_SET_SIZE;
  return questions.slice(start, start + MOCK_SET_SIZE);
}

function normalizeTitleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s*-\s*part\s+[a-z]\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * De-duplicate by setId; when titles collide with different MCQ counts, append Part A/B.
 */
export function deduplicateQuizListItems(items: QuizListItem[]): QuizListItem[] {
  const bySetId = new Map<string, QuizListItem>();
  for (const item of items) {
    if (!bySetId.has(item.setId)) {
      bySetId.set(item.setId, item);
    }
  }
  const unique = Array.from(bySetId.values());

  const groups = new Map<string, QuizListItem[]>();
  for (const item of unique) {
    const key = normalizeTitleKey(item.title);
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  const result: QuizListItem[] = [];
  for (const [, group] of Array.from(groups.entries())) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }

    const sorted = [...group].sort((a, b) => {
      if (a.questionCount !== b.questionCount) {
        return a.questionCount - b.questionCount;
      }
      return a.setId.localeCompare(b.setId);
    });

    const baseTitle = sorted[0].title.replace(/\s*-\s*Part\s+[A-Z]\s*$/i, "").trim();
    const needsParts =
      sorted.length > 1 &&
      sorted.some((g, i) => i > 0 && g.title === sorted[0].title);

    sorted.forEach((item, index) => {
      if (!needsParts) {
        result.push(item);
        return;
      }
      const partLetter = String.fromCharCode(65 + index);
      result.push({
        ...item,
        title: `${baseTitle} - Part ${partLetter}`,
        partLabel: `Part ${partLetter}`,
      });
    });
  }

  return result.sort((a, b) => a.title.localeCompare(b.title, "en"));
}

export function expandQuizSetForDisplay(
  set: NormalizedQuizSet,
  hrefBase: string,
  indexOffset = 0,
): QuizListItem[] {
  const count = set.questionCount;
  if (count <= LARGE_CHAPTER_THRESHOLD) {
    return [
      {
        id: set.id,
        setId: set.id,
        title: set.displayTitle || set.title || `Set ${indexOffset + 1}`,
        slug: set.sourceKey ?? set.id,
        href: `${hrefBase}/${encodeURIComponent(set.id)}`,
        questionCount: count,
        mode: count <= MOCK_SET_SIZE ? "timed" : "practice",
      },
    ];
  }

  const chunks = Math.ceil(count / MOCK_SET_SIZE);
  return Array.from({ length: chunks }, (_, i) => {
    const partNum = i + 1;
    const virtualId = `${set.id}__part-${partNum}`;
    const chunkCount = Math.min(MOCK_SET_SIZE, count - i * MOCK_SET_SIZE);
    return {
      id: virtualId,
      setId: virtualId,
      title: `Set ${partNum}`,
      slug: virtualId,
      href: `${hrefBase}/${encodeURIComponent(virtualId)}`,
      questionCount: chunkCount,
      mode: i === 0 ? "timed" : "practice",
      partLabel: `Set ${partNum}`,
      sortNumber: partNum,
      difficulty:
        partNum <= 3 ? "easy" : partNum <= 7 ? "medium" : partNum <= 10 ? "hard" : "advanced",
      importance: partNum <= 5 ? "high" : partNum <= 8 ? "medium" : "low",
    };
  });
}

export function groupItemsByModelTestChapter(
  items: QuizListItem[],
): ChapterGroupDisplay[] {
  const byChapter = new Map<number, QuizListItem[]>();
  for (const item of items) {
    const parsed = parseModelTestTitle(item.title || item.slug);
    const list = byChapter.get(parsed.sortChapter) ?? [];
    list.push(item);
    byChapter.set(parsed.sortChapter, list);
  }
  return Array.from(byChapter.entries())
    .sort(([a], [b]) => a - b)
    .map(([chNum, sets]) => {
      const sorted = [...sets].sort((a, b) => {
        const pa = parseModelTestTitle(a.title || a.slug);
        const pb = parseModelTestTitle(b.title || b.slug);
        return pa.sortTest - pb.sortTest;
      });
      const totalQuestions = sorted.reduce((n, s) => n + s.questionCount, 0);
      const chapterLabel = parseModelTestTitle(
        sorted[0]?.title || sorted[0]?.slug || "",
      ).chapterLabel;
      return {
        chapterSlug: `chapter-${String(chNum).padStart(2, "0")}`,
        chapterName: chapterLabel,
        totalQuestions,
        physicalSetCount: sorted.length,
        displaySets: sorted,
        practiceMode: sorted.length > 1,
      };
    });
}

/** One syllabus chapter card per chapter — links to chapter hub, not individual model tests. */
export function buildSyllabusChapterGroupsFromModelTests(
  chapterModelItems: QuizListItem[],
  chapterPathPrefix: string,
): ChapterGroupDisplay[] {
  return groupItemsByModelTestChapter(chapterModelItems).map((group) => ({
    chapterSlug: group.chapterSlug,
    chapterName: group.chapterName,
    totalQuestions: group.totalQuestions,
    physicalSetCount: group.physicalSetCount,
    practiceMode: false,
    displaySets: [
      {
        id: `${group.chapterSlug}-practice`,
        setId: group.chapterSlug,
        title: `${group.chapterName} — MCQ প্র্যাকটিস`,
        slug: group.chapterSlug,
        href: `${chapterPathPrefix}/${group.chapterSlug}`,
        questionCount: group.totalQuestions,
        setCount: group.physicalSetCount,
        totalQuestions: group.totalQuestions,
        mode: "practice",
      },
    ],
  }));
}

/** Subject hub "অধ্যায়ভিত্তিক কুইজ" tab — syllabus chapter cards with real set links. */
export function buildSubjectChapterTabGroups(
  chapterSets: NormalizedQuizSet[],
  syllabusChapterSlugs: string[],
  chapterPathPrefix: string,
): ChapterGroupDisplay[] {
  const indexGroups = groupChapterQuizSets(
    chapterSets.filter((s) => s.type === "chapter-wise" && s.questionCount > 0),
  );
  const setsBySlug = new Map(indexGroups.map((g) => [g.chapterSlug, g.sets]));

  const slugList = Array.from(
    new Set([
      ...syllabusChapterSlugs,
      ...indexGroups.map((g) => g.chapterSlug),
    ]),
  ).sort();

  return slugList.map((chapterSlug) => {
    const sets = setsBySlug.get(chapterSlug) ?? [];
    const fromIndex = indexGroups.find((g) => g.chapterSlug === chapterSlug);
    const chapterName =
      fromIndex?.chapterName ??
      formatChapterDisplayName(chapterSlug, chapterSlug);

    if (sets.length > 0) {
      return buildChapterGroupDisplay(
        chapterSlug,
        chapterName,
        sets,
        chapterPathPrefix,
      );
    }

    return {
      chapterSlug,
      chapterName,
      totalQuestions: 0,
      physicalSetCount: 0,
      practiceMode: false,
      displaySets: [],
    };
  });
}

export function extractSyllabusChapterSlugs(sourceKeys: string[]): string[] {
  const slugs = new Set<string>();
  for (const key of sourceKeys) {
    const match = key.match(/chapter-(\d{2})/i);
    if (match) slugs.add(`chapter-${match[1]}`);
  }
  return Array.from(slugs).sort();
}

function formatChapterDisplayName(chapterSlug: string, rawName: string): string {
  if (/[\u0980-\u09FF]/.test(rawName) && !/^chapter\s/i.test(rawName)) {
    return rawName;
  }
  const num = chapterSlug.replace(/^chapter-/i, "").padStart(2, "0");
  const digitMap: Record<string, string> = {
    "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
    "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯",
  };
  const bg = num.split("").map((c) => digitMap[c] ?? c).join("");
  return `অধ্যায় ${bg}`;
}

export function buildChapterGroupDisplay(
  chapterSlug: string,
  chapterName: string,
  sets: NormalizedQuizSet[],
  chapterPathPrefix: string,
): ChapterGroupDisplay {
  const sortedSets = [...sets].sort((a, b) => a.id.localeCompare(b.id));
  const totalQuestions = sortedSets.reduce((n, s) => n + s.questionCount, 0);
  const practiceMode = totalQuestions > LARGE_CHAPTER_THRESHOLD;

  const displaySets: QuizListItem[] = [];
  sortedSets.forEach((set, setIndex) => {
    const hrefBase = `${chapterPathPrefix}/${chapterSlug}/set`;
    displaySets.push(...expandQuizSetForDisplay(set, hrefBase, setIndex));
  });

  return {
    chapterSlug,
    chapterName,
    totalQuestions,
    physicalSetCount: sortedSets.length,
    displaySets,
    practiceMode,
  };
}

export function modelTestToListItem(
  test: ModelTestItem,
  hrefPrefix: string,
): QuizListItem {
  return {
    id: test.id,
    setId: test.sourceKey,
    title:
      test.sourceDisplayTitle && test.sourceDisplayTitle !== test.displayTitle
        ? test.sourceDisplayTitle
        : test.displayTitle,
    slug: test.sourceKey,
    href: `${hrefPrefix}/${encodeURIComponent(test.sourceKey)}`,
    questionCount: test.questionCount,
    difficulty: test.difficulty,
    importance: test.importance,
    sortNumber: test.sortNumber,
    attemptCount: test.attemptCount,
    completed: test.completed,
    bestScore: test.bestScore,
    lastAttemptAt: test.lastAttemptAt,
    scope: test.scope,
    tags: test.tags,
    isHyperMegaHot: isHyperMegaHotSource(test.sourceKey, test.tags),
    mode: test.questionCount <= MOCK_SET_SIZE ? "timed" : "practice",
  };
}

export function boardSetToListItem(
  board: {
    id: string;
    title: string;
    displayTitle?: string;
    questionCount: number;
    sourceKey?: string;
  },
  modelTestPathPrefix: string,
): QuizListItem {
  const key = board.sourceKey ?? board.id;
  return {
    id: board.id,
    setId: key,
    title: board.displayTitle ?? board.title,
    slug: key,
    href: `${modelTestPathPrefix}/${encodeURIComponent(key)}`,
    questionCount: board.questionCount,
    mode: "practice",
  };
}

export function getQuizDisplayTitle(item: QuizListItem): string {
  const raw = item.title || item.slug;
  if (/[\u0980-\u09FF]/.test(raw)) return raw;
  if (item.sortNumber && /^set\s+\d+$/i.test(raw.trim())) {
    return parseModelTestTitle(`model test ${item.sortNumber}`).testLabel;
  }
  const { chapterLabel, testLabel } = parseModelTestTitle(raw);
  if (chapterLabel === "মডেল টেস্ট" && item.sortNumber) {
    return testLabel;
  }
  return `${chapterLabel} · ${testLabel}`;
}

export function formatBnCount(n: number): string {
  return toBanglaNumber(n);
}

export function difficultyBadgeLabel(
  difficulty?: ModelTestDifficulty,
): string | null {
  if (!difficulty) return null;
  switch (difficulty) {
    case "easy":
      return "সহজ";
    case "medium":
      return "মাধ্যম";
    case "hard":
      return "কঠিন";
    case "advanced":
      return "উন্নত";
    default:
      return null;
  }
}

export function difficultyBadgeClass(difficulty?: ModelTestDifficulty): string {
  switch (difficulty) {
    case "easy":
      return "bg-green-500/15 text-green-300 border-green-500/30";
    case "medium":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "hard":
    case "advanced":
      return "bg-red-500/15 text-red-300 border-red-500/30";
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  }
}
