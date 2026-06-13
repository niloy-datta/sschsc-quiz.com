import type { ModelTestImportance } from "@/lib/format-model-test-title";
import { isHyperMegaHotSource } from "@/lib/format-model-test-title";
import type { ChapterGroupDisplay, QuizListItem } from "@/lib/quiz-helper";
import type { ModelTestFilterKey, ModelTestSortKey } from "@/components/quiz/ModelTestFilterBar";

export function isEasyQuizItem(item: QuizListItem): boolean {
  if (item.difficulty === "easy") return true;
  if (item.difficulty === "medium" && (item.sortNumber ?? 99) <= 5) return true;
  const num = item.sortNumber ?? extractTestNum(item.title);
  return num > 0 && num <= 3;
}

export function isAdvancedQuizItem(item: QuizListItem): boolean {
  if (item.difficulty === "advanced" || item.difficulty === "hard") return true;
  const num = item.sortNumber ?? extractTestNum(item.title);
  return num >= 11;
}

export function isImportantQuizItem(item: QuizListItem): boolean {
  if (item.isHyperMegaHot || isHyperMegaHotSource(item.slug, item.tags)) return true;
  if (item.importance === "high" || item.importance === "medium") return true;
  const num = item.sortNumber ?? extractTestNum(item.title);
  return num > 0 && num <= 5;
}

function extractTestNum(title: string): number {
  const m = title.match(/(?:test|set|model test)\s*0*(\d+)/i);
  return m ? parseInt(m[1], 10) : 0;
}

function matchesSearch(item: QuizListItem, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase().trim();
  return (
    item.title.toLowerCase().includes(q) ||
    item.slug.toLowerCase().includes(q) ||
    (item.partLabel?.toLowerCase().includes(q) ?? false)
  );
}

function applyFilterKey(item: QuizListItem, filter: ModelTestFilterKey): boolean {
  switch (filter) {
    case "all":
    case "default":
      return true;
    case "easy":
      return isEasyQuizItem(item);
    case "important":
      return isImportantQuizItem(item);
    case "advanced":
      return isAdvancedQuizItem(item);
    case "tried":
      return (item.attemptCount ?? 0) >= 1;
    case "not_tried":
      return !(item.completed ?? (item.attemptCount ?? 0) > 0);
    case "completed":
      return item.completed ?? (item.attemptCount ?? 0) > 0;
    case "weak":
      return item.isWeak === true;
    case "high_score":
      return item.isHighScore === true;
    case "recommended":
      return item.isRecommended === true;
    default:
      return true;
  }
}

function sortQuizItems(items: QuizListItem[], sort: ModelTestSortKey): QuizListItem[] {
  const list = [...items];
  switch (sort) {
    case "most_tried":
      list.sort((a, b) => (b.attemptCount ?? 0) - (a.attemptCount ?? 0));
      break;
    case "most_important": {
      const rank: Record<ModelTestImportance, number> = { high: 0, medium: 1, low: 2 };
      list.sort((a, b) => {
        const ia = rank[a.importance ?? "low"];
        const ib = rank[b.importance ?? "low"];
        if (ia !== ib) return ia - ib;
        return (a.sortNumber ?? 999) - (b.sortNumber ?? 999);
      });
      break;
    }
    case "advanced_first":
      list.sort((a, b) => (b.sortNumber ?? 0) - (a.sortNumber ?? 0));
      break;
    case "highest_score":
      list.sort((a, b) => (b.bestScore ?? 0) - (a.bestScore ?? 0));
      break;
    case "lowest_score":
      list.sort((a, b) => {
        if (a.bestScore == null) return 1;
        if (b.bestScore == null) return -1;
        return a.bestScore - b.bestScore;
      });
      break;
    case "recently_tried":
      list.sort((a, b) => {
        if (!a.lastAttemptAt) return 1;
        if (!b.lastAttemptAt) return -1;
        return new Date(b.lastAttemptAt).getTime() - new Date(a.lastAttemptAt).getTime();
      });
      break;
    case "default":
    default:
      list.sort((a, b) => {
        const na = a.sortNumber ?? (extractTestNum(a.title) || 999);
        const nb = b.sortNumber ?? (extractTestNum(b.title) || 999);
        if (na !== nb) return na - nb;
        return a.title.localeCompare(b.title, "en");
      });
  }
  return list;
}

export function filterQuizItems(
  items: QuizListItem[],
  filter: ModelTestFilterKey,
  search: string,
  sort: ModelTestSortKey,
): QuizListItem[] {
  const list = items.filter(
    (item) => matchesSearch(item, search) && applyFilterKey(item, filter),
  );
  return sortQuizItems(list, sort);
}

export function filterChapterGroups(
  groups: ChapterGroupDisplay[],
  filter: ModelTestFilterKey,
  search: string,
  sort: ModelTestSortKey,
): ChapterGroupDisplay[] {
  return groups
    .map((group) => ({
      ...group,
      displaySets: filterQuizItems(group.displaySets, filter, search, sort),
    }))
    .filter((group) => group.displaySets.length > 0);
}
