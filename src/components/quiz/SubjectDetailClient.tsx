"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { fetchSubjects, isModelTestChapter } from "@/lib/quiz-api";
import { loadModelTestsFromStatic } from "@/lib/model-test-loader";
import { loadSubjectQuizData, clearQuizDataCache } from "@/lib/quiz/load-quiz-data";
import { isChapterScopeModelTest } from "@/lib/model-test-filters";
import { isSscMathSlug, isSscScienceSlug } from "@/lib/quiz-catalog";
import {
  buildSubjectChapterTabGroups,
  deduplicateQuizListItems,
  extractSyllabusChapterSlugs,
  formatBnCount,
  modelTestToListItem,
  type ChapterGroupDisplay,
  type QuizListItem,
} from "@/lib/quiz-helper";
import {
  BOARD_QUESTION_YEARS,
  type RouteLevel,
} from "@/lib/quiz/unified-routes";
import {
  filterChapterGroups,
  filterQuizItems,
} from "@/lib/quiz-list-filters";
import {
  SubjectChapterQuizList,
  SubjectModelTestList,
  SubjectBoardQuestionsList,
} from "@/components/subject/SubjectQuizList";
import {
  ModelTestFilterBar,
  type ModelTestFilterKey,
  type ModelTestSortKey,
} from "@/components/quiz/ModelTestFilterBar";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  level: "SSC" | "HSC";
  subjectSlug: string;
  basePath: string;
  chapterPathPrefix: string;
  modelTestPathPrefix: string;
  title: string;
};

type SubjectTab = "chapter" | "model" | "board";
type ModelCategoryTab = "paperWise" | "chapterWise";

const TABS: { id: SubjectTab; label: string }[] = [
  { id: "chapter", label: "অধ্যায়ভিত্তিক কুইজ" },
  { id: "model", label: "মডেল টেস্ট" },
  { id: "board", label: "বোর্ড প্রশ্ন" },
];

const MODEL_SUB_TABS: { id: ModelCategoryTab; label: string }[] = [
  { id: "paperWise", label: "পত্রভিত্তিক মডেল টেস্ট" },
  { id: "chapterWise", label: "অধ্যায়ভিত্তিক মডেল টেস্ট" },
];

interface AttemptRecord {
  examSlug?: string;
  score?: number;
  totalQuestions?: number;
  createdAt?: string;
}

function buildAttemptMap(
  attempts: AttemptRecord[],
  subjectSlug: string,
): Map<string, { count: number; bestScore: number; lastScore: number; lastAttemptAt?: string }> {
  const map = new Map<
    string,
    { count: number; bestScore: number; lastScore: number; lastAttemptAt?: string }
  >();
  for (const attempt of attempts) {
    const slug = attempt.examSlug ?? "";
    if (!slug.includes(subjectSlug) && !slug.includes("/")) continue;
    const key = slug.includes("/") ? slug.split("/").pop()! : slug;
    const score = attempt.score ?? 0;
    const total = attempt.totalQuestions ?? 25;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        count: 1,
        bestScore: score,
        lastScore: score,
        lastAttemptAt: attempt.createdAt,
      });
    } else {
      existing.count += 1;
      existing.lastScore = score;
      existing.bestScore = Math.max(existing.bestScore, score);
      if (attempt.createdAt) {
        if (
          !existing.lastAttemptAt ||
          new Date(attempt.createdAt) > new Date(existing.lastAttemptAt)
        ) {
          existing.lastAttemptAt = attempt.createdAt;
        }
      }
    }
    void total;
  }
  return map;
}

function enrichWithAttempts(
  items: QuizListItem[],
  attemptMap: Map<
    string,
    { count: number; bestScore: number; lastScore: number; lastAttemptAt?: string }
  >,
): QuizListItem[] {
  return items.map((item) => {
    const att = attemptMap.get(item.setId) ?? attemptMap.get(item.slug);
    if (!att) return item;
    const accuracy = att.lastScore / (item.questionCount || 25);
    return {
      ...item,
      attemptCount: att.count,
      completed: att.count > 0,
      bestScore: att.bestScore,
      lastAttemptAt: att.lastAttemptAt,
      isWeak: accuracy < 0.6,
      isHighScore: accuracy >= 0.8,
    };
  });
}

function enrichChapterGroups(
  groups: ChapterGroupDisplay[],
  attemptMap: Map<
    string,
    { count: number; bestScore: number; lastScore: number; lastAttemptAt?: string }
  >,
): ChapterGroupDisplay[] {
  return groups.map((g) => ({
    ...g,
    displaySets: enrichWithAttempts(g.displaySets, attemptMap),
  }));
}

export function SubjectDetailClient({
  level,
  subjectSlug,
  basePath,
  chapterPathPrefix,
  modelTestPathPrefix,
  title,
}: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SubjectTab>("chapter");
  const [modelCategory, setModelCategory] = useState<ModelCategoryTab>("paperWise");
  const [chapterGroups, setChapterGroups] = useState<ChapterGroupDisplay[]>([]);
  const [paperModelItems, setPaperModelItems] = useState<QuizListItem[]>([]);
  const [chapterModelItems, setChapterModelItems] = useState<QuizListItem[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<ModelTestFilterKey>("all");
  const [selectedSort, setSelectedSort] = useState<ModelTestSortKey>("default");

  const routeLevel = level.toLowerCase() as RouteLevel;

  useEffect(() => {
    clearQuizDataCache();
  }, [subjectSlug, level]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "model") {
      setActiveTab("model");
    } else if (tab === "board") {
      setActiveTab("board");
    } else {
      setActiveTab("chapter");
    }
    const model = searchParams.get("model");
    if (model === "paper" || model === "paperWise") {
      setModelCategory("paperWise");
    } else if (model === "chapter" || model === "chapterWise") {
      setModelCategory("chapterWise");
    }
  }, [searchParams]);

  const buildTabQuery = (tab: SubjectTab, model?: ModelCategoryTab) => {
    if (tab === "chapter") return "?tab=chapter";
    if (tab === "board") return "?tab=board";
    const cat = model ?? modelCategory;
    return cat === "paperWise" ? "?tab=model&model=paper" : "?tab=model&model=chapter";
  };

  const setTab = (tab: SubjectTab) => {
    if (tab === "model") {
      setModelCategory("paperWise");
    }
    setActiveTab(tab);
    setSearchQuery("");
    setSelectedFilter("all");
    setSelectedSort("default");
    router.replace(`${pathname}${buildTabQuery(tab, tab === "model" ? "paperWise" : modelCategory)}`, {
      scroll: false,
    });
  };

  const setModelTab = (category: ModelCategoryTab) => {
    setModelCategory(category);
    setSearchQuery("");
    setSelectedFilter("all");
    setSelectedSort("default");
    router.replace(`${pathname}${buildTabQuery("model", category)}`, { scroll: false });
  };

  useEffect(() => {
    async function loadData() {
      let attemptMap = new Map<
        string,
        { count: number; bestScore: number; lastScore: number; lastAttemptAt?: string }
      >();

      if (user) {
        try {
          const dash = await api.get<{ recentAttempts?: AttemptRecord[] }>(
            "/api/student/dashboard",
          );
          attemptMap = buildAttemptMap(dash.recentAttempts ?? [], subjectSlug);
        } catch {
          /* optional */
        }
      }

      try {
        const lvl = level.toLowerCase() as "ssc" | "hsc";
        let subj = subjectSlug;
        let paper: string | undefined;

        if (subj.endsWith("-1st-paper")) {
          subj = subj.replace(/-1st-paper$/, "");
          paper = "1st-paper";
        } else if (subj.endsWith("-2nd-paper")) {
          subj = subj.replace(/-2nd-paper$/, "");
          paper = "2nd-paper";
        }

        const parsed = await loadSubjectQuizData(lvl, subj, paper);
        if (parsed && !parsed.loadError) {
          const { items: normalized } = await loadModelTestsFromStatic({
            level,
            subjectSlug,
          });

          const paperTests = deduplicateQuizListItems(
            enrichWithAttempts(
              normalized
                .filter((t) => t.scope === "paper" && t.hasQuestions)
                .map((t) => modelTestToListItem(t, modelTestPathPrefix)),
              attemptMap,
            ),
          );
          const chapterScoped = normalized.filter(
            (t) =>
              t.scope === "chapter" &&
              t.hasQuestions &&
              isChapterScopeModelTest(t.sourceKey),
          );
          const chapterSlugs = extractSyllabusChapterSlugs(
            chapterScoped.map((t) => t.sourceKey),
          );
          const chapterTests = deduplicateQuizListItems(
            enrichWithAttempts(
              chapterScoped.map((t) => modelTestToListItem(t, modelTestPathPrefix)),
              attemptMap,
            ),
          );

          setChapterGroups(
            enrichChapterGroups(
              buildSubjectChapterTabGroups(
                parsed.chapterSets,
                chapterSlugs,
                chapterPathPrefix,
              ),
              attemptMap,
            ),
          );
          setPaperModelItems(paperTests);
          setChapterModelItems(chapterTests);

          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Failed to load static subject JSON, falling back to API:", err);
      }

      fetchSubjects(level).then((list) => {
        const found =
          list.find((s) => s.slug === subjectSlug) ||
          list.find((s) => s.slug?.includes(subjectSlug));

        if (found) {
          const chapters = found.chapters ?? [];
          const chList = chapters
            .filter((c) => !isModelTestChapter(c.slug))
            .map((c) => ({
              chapterSlug: c.slug,
              chapterName: c.title || getBengaliChapterName(c.slug, subjectSlug),
              totalQuestions: 0,
              physicalSetCount: 0,
              displaySets: [] as QuizListItem[],
              practiceMode: false,
            }));
          setChapterGroups(chList);

          loadModelTestsFromStatic({ level, subjectSlug }).then(({ items }) => {
            setPaperModelItems(
              deduplicateQuizListItems(
                enrichWithAttempts(
                  items
                    .filter((t) => t.scope === "paper" && t.hasQuestions)
                    .map((t) => modelTestToListItem(t, modelTestPathPrefix)),
                  attemptMap,
                ),
              ),
            );
            setChapterModelItems(
              deduplicateQuizListItems(
                enrichWithAttempts(
                  items
                    .filter(
                      (t) =>
                        t.scope === "chapter" &&
                        t.hasQuestions &&
                        isChapterScopeModelTest(t.sourceKey),
                    )
                    .map((t) => modelTestToListItem(t, modelTestPathPrefix)),
                  attemptMap,
                ),
              ),
            );
          });
        }
        setLoading(false);
      });
    }

    loadData();
  }, [level, subjectSlug, chapterPathPrefix, modelTestPathPrefix, user]);

  const filteredChapterGroups = useMemo(
    () => filterChapterGroups(chapterGroups, selectedFilter, searchQuery, selectedSort),
    [chapterGroups, selectedFilter, searchQuery, selectedSort],
  );

  const filteredPaperItems = useMemo(
    () => filterQuizItems(paperModelItems, selectedFilter, searchQuery, selectedSort),
    [paperModelItems, selectedFilter, searchQuery, selectedSort],
  );

  const filteredChapterModelItems = useMemo(
    () => filterQuizItems(chapterModelItems, selectedFilter, searchQuery, selectedSort),
    [chapterModelItems, selectedFilter, searchQuery, selectedSort],
  );

  const modelTestTotal = paperModelItems.length + chapterModelItems.length;

  const activeModelItems =
    modelCategory === "paperWise" ? filteredPaperItems : filteredChapterModelItems;
  const activeModelTotal =
    modelCategory === "paperWise" ? paperModelItems.length : chapterModelItems.length;

  const resultCount = useMemo(() => {
    if (activeTab === "chapter") {
      return filteredChapterGroups.length;
    }
    if (activeTab === "model") {
      return activeModelItems.length;
    }
    return BOARD_QUESTION_YEARS.length;
  }, [
    activeTab,
    filteredChapterGroups,
    activeModelItems,
  ]);

  const totalCount = useMemo(() => {
    if (activeTab === "chapter") {
      return chapterGroups.length;
    }
    if (activeTab === "model") {
      return activeModelTotal;
    }
    return BOARD_QUESTION_YEARS.length;
  }, [activeTab, chapterGroups, activeModelTotal]);

  const hasActiveFilters =
    searchQuery !== "" ||
    (selectedFilter !== "all" && selectedFilter !== "default") ||
    selectedSort !== "default";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedFilter("all");
    setSelectedSort("default");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-glow" />
      </div>
    );
  }

  const showEmptyFilter =
    (activeTab === "chapter" && filteredChapterGroups.length === 0 && chapterGroups.length > 0) ||
    (activeTab === "model" &&
      activeModelItems.length === 0 &&
      activeModelTotal > 0);

  const journeyLabel =
    level === "SSC" && isSscMathSlug(subjectSlug)
      ? "গণিত যাত্রা"
      : level === "SSC" && isSscScienceSlug(subjectSlug)
        ? "বিজ্ঞান যাত্রা"
        : level === "HSC"
          ? "বিজ্ঞান যাত্রা"
          : "প্রস্তুতি";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 font-bangla pb-24">
      <Link
        href={basePath}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-cyan-300"
      >
        ← {level} হাব
      </Link>

      <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-950 via-[#0a0b1e] to-slate-950 px-4 py-5 sm:px-6">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-6 right-12 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl" />
        <div className="relative">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-cyan-400/80">
            {level} · {journeyLabel}
          </p>
          <h1 className="text-2xl font-black text-white sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            তিনটি আলাদা সেকশন — অধ্যায় MCQ, মডেল টেস্ট, বোর্ড প্রশ্ন। ট্যাব বেছে নাও।
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300">
              {formatBnCount(chapterGroups.length)} অধ্যায়
            </span>
            <span className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-300">
              {formatBnCount(modelTestTotal)} মডেল টেস্ট
            </span>
            <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300">
              বোর্ড প্রশ্ন
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={cn(
              "min-h-[44px] min-w-[100px] flex-1 rounded-xl px-3 py-2.5 text-xs font-bold transition-all sm:text-sm",
              activeTab === tab.id
                ? "bg-gradient-to-r from-cyan-600/90 to-purple-600/80 text-white shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                : "text-slate-400 hover:bg-white/5 hover:text-white",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== "board" && (
        <ModelTestFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          selectedSort={selectedSort}
          onSortChange={setSelectedSort}
          resultCount={resultCount}
          totalCount={totalCount}
          countUnit={activeTab === "chapter" ? "অধ্যায়" : "টেস্ট"}
          searchPlaceholder={
            activeTab === "chapter"
              ? "অধ্যায় নম্বর বা নাম লিখুন..."
              : "অধ্যায় বা টেস্ট নম্বর লিখুন..."
          }
          hasActiveFilters={hasActiveFilters}
          onClearAll={clearAllFilters}
          variant="compact"
        />
      )}

      {activeTab === "board" ? (
        <SubjectBoardQuestionsList level={routeLevel} subjectSlug={subjectSlug} />
      ) : showEmptyFilter ? (
        <Card variant="glass" className="mt-4 p-8 text-center">
          <HelpCircle className="mx-auto mb-3 h-10 w-10 text-slate-600" />
          <p className="font-semibold text-slate-300">ফিল্টার অনুযায়ী কোনো টেস্ট পাওয়া যায়নি।</p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="mt-4 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/20"
          >
            সব ফিল্টার রিসেট করুন
          </button>
        </Card>
      ) : (
        <>
          {activeTab === "chapter" ? (
            <SubjectChapterQuizList
              groups={filteredChapterGroups}
              chapterPathPrefix={chapterPathPrefix}
              expandAll={hasActiveFilters}
            />
          ) : activeTab === "model" ? (
            <SubjectModelTestList
              paperItems={filteredPaperItems}
              chapterItems={filteredChapterModelItems}
              modelTestPathPrefix={modelTestPathPrefix}
              expandAll={hasActiveFilters}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

function getBengaliChapterName(slug: string, subjectSlug: string): string {
  void subjectSlug;
  const clean = slug.toLowerCase().replace(/chapter-/g, "").trim();
  if (clean === "wise") return "অধ্যায়ভিত্তিক কুইজ সংকলন";
  const digitMap: Record<string, string> = {
    "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
    "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯",
  };
  const bgDigits = clean.split("").map((char) => digitMap[char] || char).join("");
  return `অধ্যায় ${bgDigits}`;
}
