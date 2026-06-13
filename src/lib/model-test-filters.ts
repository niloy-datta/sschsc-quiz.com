import {
  assignContinuousDisplayTitles,
  defaultSortTests,
  type ModelTestDifficulty,
  type ModelTestImportance,
  type ModelTestScope,
} from "@/lib/format-model-test-title";
import { isImportedChapterModelKey } from "@/lib/quiz/normalize-quiz-data";

export interface ModelTestItem {
  id: string;
  sourceKey: string;
  slug: string;
  title: string;
  originalTitle: string;
  cleanTitle: string;
  displayTitle: string;
  displayIndex?: number;
  type: string;
  testNumber: number | null;
  priority?: number;
  importance?: ModelTestImportance;
  difficulty?: ModelTestDifficulty;
  attemptCount?: number;
  questionCount: number;
  durationMinutes: number;
  lastScore?: number;
  bestScore?: number;
  completed?: boolean;
  lastAttemptAt?: string;
  sortNumber: number;
  hasQuestions: boolean;
  scopeLabel?: string;
  sourceDisplayTitle?: string;
  scope: ModelTestScope;
  tags?: string[];
}

export type ModelTestCategoryTab =
  | "paperWise"
  | "chapterWise"
  | "boardWise"
  | "wholeSyllabus";

export type ModelTestSortTab =
  | "default"
  | "mostImportant"
  | "advanced"
  | "trending";

export interface TabFilterResult {
  items: ModelTestItem[];
  emptyMessage?: string;
  infoMessage?: string;
}

const EMPTY_MESSAGES: Record<ModelTestCategoryTab, string> = {
  paperWise: "পত্রভিত্তিক মডেল টেস্ট এখনো যোগ করা হয়নি।",
  chapterWise: "অধ্যায়ভিত্তিক মডেল টেস্ট এখনো যোগ করা হয়নি।",
  boardWise: "বোর্ডভিত্তিক মডেল টেস্ট এখনো যোগ করা হয়নি।",
  wholeSyllabus: "ফুল বুক মডেল টেস্ট এখনো যোগ করা হয়নি।",
};

function scopeForTab(tab: ModelTestCategoryTab): ModelTestScope {
  switch (tab) {
    case "paperWise":
      return "paper";
    case "chapterWise":
      return "chapter";
    case "boardWise":
      return "board";
    case "wholeSyllabus":
      return "whole-syllabus";
  }
}

export function isChapterScopeModelTest(sourceKey: string): boolean {
  const s = sourceKey.toLowerCase();
  if (isImportedChapterModelKey(sourceKey)) return true;
  return (
    /chapter-\d{2}-(?:high-priority-)?(?:set|model-test)-\d{2}/.test(s) ||
    /-chapter-\d{2}-model-test-\d{2}/.test(s)
  );
}

export function filterByCategoryTab(
  tests: ModelTestItem[],
  tab: ModelTestCategoryTab,
): TabFilterResult {
  const scope = scopeForTab(tab);
  let pool = tests.filter((t) => t.hasQuestions && t.scope === scope);
  if (tab === "chapterWise") {
    pool = pool.filter((t) => isChapterScopeModelTest(t.sourceKey));
  }
  if (!pool.length) {
    return { items: [], emptyMessage: EMPTY_MESSAGES[tab] };
  }
  return { items: defaultSortTests(pool) };
}

export function applySortTab(
  items: ModelTestItem[],
  sortTab: ModelTestSortTab,
): ModelTestItem[] {
  let sorted = [...items];

  switch (sortTab) {
    case "mostImportant":
      sorted.sort((a, b) => {
        const rank = { high: 0, medium: 1, low: 2 };
        const ia = rank[a.importance ?? "low"];
        const ib = rank[b.importance ?? "low"];
        if (ia !== ib) return ia - ib;
        return a.sortNumber - b.sortNumber;
      });
      break;
    case "advanced":
      sorted = sorted.filter(
        (t) =>
          t.difficulty === "advanced" ||
          t.difficulty === "hard" ||
          t.sortNumber >= 11,
      );
      if (!sorted.length) sorted = [...items];
      sorted.sort((a, b) => b.sortNumber - a.sortNumber);
      break;
    case "trending":
      sorted = sorted.filter((t) => (t.attemptCount ?? 0) > 0);
      if (!sorted.length) {
        return assignContinuousDisplayTitles(defaultSortTests(items));
      }
      sorted.sort((a, b) => (b.attemptCount ?? 0) - (a.attemptCount ?? 0));
      break;
    default:
      sorted = defaultSortTests(sorted);
  }

  return assignContinuousDisplayTitles(sorted);
}

export function applyTabFilter(
  categoryTab: ModelTestCategoryTab,
  allModelTests: ModelTestItem[],
  sortTab: ModelTestSortTab = "default",
): TabFilterResult {
  const result = filterByCategoryTab(allModelTests, categoryTab);
  return {
    ...result,
    items: applySortTab(result.items, sortTab),
  };
}

/** @deprecated use applyTabFilter */
export type ModelTestTab = ModelTestCategoryTab;

export function filterChapterWiseTab(tests: ModelTestItem[]): TabFilterResult {
  return filterByCategoryTab(tests, "chapterWise");
}

export function filterPaperWiseTab(tests: ModelTestItem[]): TabFilterResult {
  return filterByCategoryTab(tests, "paperWise");
}
