import {
  isHiddenSourceKey,
  isImportedChapterModelKey,
  isLegacyChapterJunkKey,
} from "@/lib/quiz/normalize-quiz-data";

import {

  assignContinuousDisplayTitles,

  defaultSortTests,

  extractTestNumber,

  getModelTestCategory,

  getSortNumber,

  inferModelTestDifficulty,

  inferModelTestImportance,

  inferModelTestPriority,

  inferModelTestScope,

  normalizeChaptersCovered,

  type ChapterCoveredEntry,

  type ModelTestScope,

} from "@/lib/format-model-test-title";

import type { ModelTestItem } from "@/lib/model-test-filters";

import { resolveFileSubjectSlug } from "@/lib/quiz/registry";



export interface LoadModelTestsParams {

  level: "SSC" | "HSC";

  subjectSlug: string;

}



export interface LoadModelTestsResult {

  items: ModelTestItem[];

  sourceTotal: number;

}



interface IndexEntry {

  questionCount: number;

  scope?: ModelTestScope;

  displayTitle?: string;

  durationMinutes?: number;

  importance?: "high" | "medium" | "low";

  tags?: unknown[];

  chaptersCovered?: ChapterCoveredEntry[];

}



interface ModelTestIndex {

  level: string;

  subject: string;

  modelTests: Record<string, IndexEntry>;

}



function inferScopeLabel(meta?: IndexEntry): string | undefined {

  const normalized = normalizeChaptersCovered(meta?.chaptersCovered);

  if (!normalized.length) return undefined;

  const unique = new Set(normalized);

  if (unique.size >= 3) return "সম্পূর্ণ সিলেবাস";

  return undefined;

}



function buildStableId(

  level: string,

  subjectSlug: string,

  sourceKey: string,

): string {

  return `${level}-${subjectSlug}-main-${sourceKey}`;

}



function shouldIncludeKey(
  sourceKey: string,
  allKeys: string[],
  meta?: IndexEntry,
): boolean {
  if (isHiddenSourceKey(sourceKey) || isLegacyChapterJunkKey(sourceKey)) {
    return false;
  }
  const scope =
    (meta?.scope as ModelTestScope) || inferModelTestScope(sourceKey, meta);
  const hasImportedChapter = allKeys.some(isImportedChapterModelKey);
  if (hasImportedChapter && scope === "chapter" && !isImportedChapterModelKey(sourceKey)) {
    return false;
  }
  return true;
}



export async function loadModelTestsFromStatic(

  params: LoadModelTestsParams,

): Promise<LoadModelTestsResult> {

  const { level, subjectSlug } = params;

  const parsedLevel = level.toLowerCase() as "ssc" | "hsc";

  let subj = subjectSlug;

  let paper: string | undefined = undefined;



  if (subj.endsWith("-1st-paper")) {

    subj = subj.replace(/-1st-paper$/, "");

    paper = "1st-paper";

  } else if (subj.endsWith("-2nd-paper")) {

    subj = subj.replace(/-2nd-paper$/, "");

    paper = "2nd-paper";

  }



  const fileSlug = resolveFileSubjectSlug(parsedLevel, subj, paper);

  const indexPath = `/quiz-data/${parsedLevel}/${fileSlug}.model-tests.index.json`;



  try {

    const res = await fetch(indexPath, { cache: "no-store" });

    if (!res.ok) {

      return { items: [], sourceTotal: 0 };

    }



    const index: ModelTestIndex = await res.json();

    const allKeys = Object.keys(index.modelTests || {});

    const sourceKeys = allKeys.filter((k) =>
      shouldIncludeKey(k, allKeys, index.modelTests[k]),
    );



    const items: ModelTestItem[] = sourceKeys.map((sourceKey) => {

      const entry = index.modelTests[sourceKey];

      const meta: IndexEntry = entry || { questionCount: 0 };

      const questionCount = meta.questionCount || 0;

      const type = getModelTestCategory(sourceKey);

      const testNumber = extractTestNumber(sourceKey);

      const sortNumber = getSortNumber(sourceKey, testNumber);

      const scope = (meta.scope as ModelTestScope) || inferModelTestScope(sourceKey, meta);



      return {

        id: buildStableId(level, subjectSlug, sourceKey),

        sourceKey,

        slug: sourceKey,

        title: meta.displayTitle || sourceKey,

        originalTitle: sourceKey,

        cleanTitle: "",

        displayTitle: "",

        type,

        testNumber,

        priority: inferModelTestPriority(type, testNumber, sourceKey),

        importance:
          meta.importance ||
          inferModelTestImportance(type, testNumber, sourceKey, meta.tags),

        scope,

        difficulty: inferModelTestDifficulty(sourceKey, sortNumber),

        questionCount,

        durationMinutes: meta.durationMinutes ?? (questionCount > 0 ? questionCount : 25),

        hasQuestions: questionCount > 0,

        sortNumber,

        scopeLabel: inferScopeLabel(meta),

        sourceDisplayTitle: meta.displayTitle,

        tags: (meta.tags ?? []).map((t) => String(t)),

      };

    });



    const sortedItems = assignContinuousDisplayTitles(defaultSortTests(items));



    return {

      items: sortedItems,

      sourceTotal: sortedItems.length,

    };

  } catch (err) {

    console.warn("Failed to load model test index", err);

    return { items: [], sourceTotal: 0 };

  }

}



/** @deprecated use loadModelTestsFromStatic */

export function normalizeModelTestItems(

  level: "SSC" | "HSC",

  subjectSlug: string,

  sourceKeys: string[],

  details: Record<string, unknown[]>,

  metaByKey: Record<string, IndexEntry> = {},

): ModelTestItem[] {

  const items: ModelTestItem[] = sourceKeys.map((sourceKey) => {

    const questionsList = (details[sourceKey] as unknown[]) || [];

    const meta = metaByKey[sourceKey];

    const questionCount = questionsList.length || meta?.questionCount || 0;

    const type = getModelTestCategory(sourceKey);

    const testNumber = extractTestNumber(sourceKey);

    const sortNumber = getSortNumber(sourceKey, testNumber);



    return {

      id: buildStableId(level, subjectSlug, sourceKey),

      sourceKey,

      slug: sourceKey,

      title: sourceKey,

      originalTitle: sourceKey,

      cleanTitle: "",

      displayTitle: "",

      type,

      testNumber,

      priority: inferModelTestPriority(type, testNumber, sourceKey),

      importance: inferModelTestImportance(type, testNumber, sourceKey),

      scope: inferModelTestScope(sourceKey, meta),

      difficulty: inferModelTestDifficulty(sourceKey, sortNumber),

      questionCount,

      durationMinutes:

        meta?.durationMinutes ?? (questionCount > 0 ? questionCount : 25),

      hasQuestions: questionCount > 0,

      sortNumber,

      scopeLabel: inferScopeLabel(meta),

      sourceDisplayTitle: meta?.displayTitle,

    };

  });



  return assignContinuousDisplayTitles(defaultSortTests(items));

}


