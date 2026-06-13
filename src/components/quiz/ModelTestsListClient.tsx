"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { loadModelTestsFromStatic } from "@/lib/model-test-loader";
import {
  applyTabFilter,
  type ModelTestCategoryTab,
  type ModelTestItem,
  type ModelTestSortTab,
} from "@/lib/model-test-filters";
import { Button } from "@/components/ui/Button";
import {
  BookOpen,
  HelpCircle,
  Play,
  Star,
} from "lucide-react";
import { ModelTestCard } from "@/components/quiz/ModelTestCard";
import { ModelTestsListSkeleton } from "@/components/quiz/ModelTestsListSkeleton";
import {
  ModelTestFilterBar,
  type ModelTestFilterKey,
  type ModelTestSortKey,
} from "@/components/quiz/ModelTestFilterBar";
import {
  AtomHeroGraphic,
  DASHBOARD_STAT_CONFIG,
  DashboardStatCard,
} from "@/components/quiz/smart-practice-ui";
import { parseModelTestTitle, toBanglaNumber, isHyperMegaHotSource } from "@/lib/format-model-test-title";
import { cn } from "@/lib/utils";

const CATEGORY_TABS: { id: ModelTestCategoryTab; label: string }[] = [
  { id: "paperWise", label: "পত্রভিত্তিক মডেল টেস্ট" },
  { id: "chapterWise", label: "অধ্যায়ভিত্তিক মডেল টেস্ট" },
];

function toModelTestSortTab(sort: ModelTestSortKey): ModelTestSortTab {
  switch (sort) {
    case "most_important":
      return "mostImportant";
    case "advanced_first":
      return "advanced";
    case "most_tried":
      return "trending";
    default:
      return "default";
  }
}

type Props = {
  level: "SSC" | "HSC";
  subjectSlug: string;
  basePath: string;
  modelTestBasePath: string;
  title: string;
  /** Optional English-style headline for hero (derived from route slugs). */
  headline?: string;
};

interface AttemptRecord {
  examSlug?: string;
  score?: number;
  totalQuestions?: number;
  createdAt?: string;
}

function isEasyTest(t: ModelTestItem): boolean {
  if (t.difficulty === "easy") return true;
  if (t.difficulty === "medium" && t.sortNumber <= 5) return true;
  if (!t.difficulty && t.sortNumber <= 3) return true;
  return false;
}

function buildAttemptMap(
  attempts: AttemptRecord[],
  subjectSlug: string,
): Map<string, { lastScore: number; bestScore: number; total: number; count: number; lastAttemptAt?: string }> {
  const map = new Map<
    string,
    { lastScore: number; bestScore: number; total: number; count: number; lastAttemptAt?: string }
  >();

  for (const attempt of attempts) {
    const slug = attempt.examSlug ?? "";
    if (!slug.includes(subjectSlug) && !slug.includes("/")) continue;

    const testKey = slug.includes("/") ? slug.split("/").pop()! : slug;
    const score = attempt.score ?? 0;
    const total = attempt.totalQuestions ?? 0;
    const existing = map.get(testKey);

    if (!existing) {
      map.set(testKey, { lastScore: score, bestScore: score, total, count: 1, lastAttemptAt: attempt.createdAt });
    } else {
      existing.count += 1;
      existing.lastScore = score;
      existing.bestScore = Math.max(existing.bestScore, score);
      if (total > 0) existing.total = total;
      if (attempt.createdAt) {
        if (!existing.lastAttemptAt || new Date(attempt.createdAt) > new Date(existing.lastAttemptAt)) {
          existing.lastAttemptAt = attempt.createdAt;
        }
      }
    }
  }

  return map;
}

function mergeAttempts(
  items: ModelTestItem[],
  attemptMap: Map<
    string,
    { lastScore: number; bestScore: number; total: number; count: number; lastAttemptAt?: string }
  >,
): ModelTestItem[] {
  return items.map((item) => {
    const attempt = attemptMap.get(item.sourceKey);
    const attemptCount = attempt?.count ?? 0;
    return {
      ...item,
      lastScore: attempt?.lastScore,
      bestScore: attempt?.bestScore,
      attemptCount: attemptCount > 0 ? attemptCount : undefined,
      completed: attemptCount > 0,
      lastAttemptAt: attempt?.lastAttemptAt,
    };
  });
}

export function ModelTestsListClient({
  level,
  subjectSlug,
  basePath,
  modelTestBasePath,
  title,
  headline,
}: Props) {
  const { user } = useAuth();
  const [allModelTests, setAllModelTests] = useState<ModelTestItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<ModelTestFilterKey>("all");
  const [selectedSort, setSelectedSort] = useState<ModelTestSortKey>("default");
  const [activeCategory, setActiveCategory] = useState<ModelTestCategoryTab>("chapterWise");
  const [chapterFilter, setChapterFilter] = useState<number | "all">("all");

  useEffect(() => {
    setChapterFilter("all");
  }, [activeCategory]);

  useEffect(() => {
    async function loadData() {
      const { items } = await loadModelTestsFromStatic({
        level,
        subjectSlug,
      });

      let attemptMap = new Map<
        string,
        { lastScore: number; bestScore: number; total: number; count: number; lastAttemptAt?: string }
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

      const merged = mergeAttempts(items, attemptMap);
      setAllModelTests(merged);
      setLoading(false);
    }

    loadData();
  }, [level, subjectSlug, user]);

  const activeSort = toModelTestSortTab(selectedSort);

  const tabResult = useMemo(() => {
    const base = applyTabFilter(activeCategory, allModelTests, activeSort);
    if (activeCategory !== "chapterWise" || chapterFilter === "all") {
      return base;
    }
    const ch = String(chapterFilter).padStart(2, "0");
    const filtered = base.items.filter(
      (t) =>
        t.sourceKey.includes(`chapter-${ch}`) ||
        parseModelTestTitle(t.sourceDisplayTitle || t.displayTitle || t.sourceKey)
          .sortChapter === chapterFilter,
    );
    return {
      ...base,
      items: filtered,
      emptyMessage: filtered.length
        ? undefined
        : `অধ্যায় ${chapterFilter} এর কোনো টেস্ট পাওয়া যায়নি।`,
    };
  }, [activeCategory, allModelTests, activeSort, chapterFilter]);

  const withQuestions = useMemo(
    () => tabResult.items.filter((t) => t.hasQuestions),
    [tabResult.items],
  );

  const chapterOptions = useMemo(() => {
    const chNums = new Set<number>();
    for (const t of allModelTests) {
      if (t.scope !== "chapter" || !t.hasQuestions) continue;
      const info = parseModelTestTitle(
        t.sourceDisplayTitle || t.displayTitle || t.sourceKey,
      );
      if (info.sortChapter > 0) chNums.add(info.sortChapter);
    }
    return Array.from(chNums).sort((a, b) => a - b);
  }, [allModelTests]);

  const totalMcq = useMemo(
    () => withQuestions.reduce((sum, t) => sum + t.questionCount, 0),
    [withQuestions],
  );

  // Statistics calculation
  const totalChapters = useMemo(() => {
    const chs = new Set(
      allModelTests
        .filter((t) => t.scope === "chapter" && t.hasQuestions)
        .map((t) =>
          parseModelTestTitle(t.sourceDisplayTitle || t.displayTitle || t.sourceKey)
            .sortChapter,
        ),
    );
    return chs.size;
  }, [allModelTests]);

  const attemptedTests = useMemo(() => {
    return withQuestions.filter(t => t.completed);
  }, [withQuestions]);

  const stats = useMemo(() => {
    if (attemptedTests.length === 0) {
      return {
        attempted: "Not started",
        avgScore: "—",
        highestScore: "—",
        lowestScore: "—",
      };
    }

    const avgLast =
      attemptedTests.reduce((sum, t) => sum + (t.lastScore ?? 0), 0) /
      attemptedTests.length;
    const typicalTotal =
      attemptedTests[0]?.questionCount ||
      withQuestions[0]?.questionCount ||
      25;
    const highest = Math.max(
      ...attemptedTests.map((t) => t.bestScore ?? t.lastScore ?? 0),
    );
    const lowest = Math.min(
      ...attemptedTests.map((t) => t.bestScore ?? t.lastScore ?? 0),
    );

    return {
      attempted: toBanglaNumber(attemptedTests.length) + " টি টেস্ট",
      avgScore: `${avgLast.toFixed(1)}/${typicalTotal}`,
      highestScore: `${highest}/${typicalTotal}`,
      lowestScore: `${lowest}/${typicalTotal}`,
    };
  }, [attemptedTests, withQuestions]);

  // Suggestion Algorithm
  const recommendedTest = useMemo(() => {
    if (!withQuestions.length) return null;

    // 1. Weak chapter/test first
    const weakTest = withQuestions.find((t) => {
      if (!t.completed || t.lastScore === undefined) return false;
      return (t.lastScore / t.questionCount) < 0.6;
    });
    if (weakTest) return weakTest;

    // 2. First not-tried test
    const notTriedTest = withQuestions.find((t) => !t.completed);
    if (notTriedTest) return notTriedTest;

    // 3. Fallback to first test
    return withQuestions[0];
  }, [withQuestions]);

  const heroTitle = headline ?? title;

  const recTitleInfo = recommendedTest
    ? parseModelTestTitle(
        recommendedTest.sourceDisplayTitle ||
          recommendedTest.displayTitle ||
          recommendedTest.sourceKey,
      )
    : null;

  // Filter & Sort Logic
  const filteredAndSorted = useMemo(() => {
    let list = [...withQuestions];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const titleParsed = parseModelTestTitle(t.sourceDisplayTitle || t.displayTitle || t.sourceKey);
        return (
          t.sourceKey.toLowerCase().includes(query) ||
          t.displayTitle.toLowerCase().includes(query) ||
          (t.sourceDisplayTitle && t.sourceDisplayTitle.toLowerCase().includes(query)) ||
          titleParsed.chapterLabel.toLowerCase().includes(query) ||
          titleParsed.testLabel.toLowerCase().includes(query)
        );
      });
    }

    // Filter Chips
    switch (selectedFilter) {
      case "default":
      case "all":
        break;
      case "important":
        list = list.filter(
          (t) =>
            isHyperMegaHotSource(t.sourceKey, t.tags) ||
            t.importance === "high" ||
            t.importance === "medium" ||
            t.sortNumber <= 5,
        );
        break;
      case "easy":
        list = list.filter(isEasyTest);
        break;
      case "advanced":
        list = list.filter((t) => t.difficulty === "advanced" || t.difficulty === "hard" || t.sortNumber >= 11);
        break;
      case "tried":
        list = list.filter((t) => (t.attemptCount ?? 0) >= 1);
        break;
      case "not_tried":
        list = list.filter((t) => !t.completed);
        break;
      case "completed":
        list = list.filter((t) => t.completed);
        break;
      case "weak":
        list = list.filter((t) => {
          if (!t.completed || t.lastScore === undefined) return false;
          return (t.lastScore / t.questionCount) < 0.6;
        });
        break;
      case "high_score":
        list = list.filter((t) => {
          if (!t.completed || t.lastScore === undefined) return false;
          return (t.lastScore / t.questionCount) >= 0.8;
        });
        break;
      case "recommended":
        if (recommendedTest) {
          list = list.filter((t) => t.sourceKey === recommendedTest.sourceKey);
        }
        break;
    }

    // Chapter filter only applies on chapter-wise tab (dropdown handled in tabResult)
    if (activeCategory === "chapterWise" && chapterFilter !== "all") {
      list = list.filter((t) => {
        const titleInfo = parseModelTestTitle(
          t.sourceDisplayTitle || t.displayTitle || t.sourceKey,
        );
        return titleInfo.sortChapter === chapterFilter;
      });
    }

    // Sorting options
    switch (selectedSort) {
      case "most_tried":
        list.sort((a, b) => (b.attemptCount ?? 0) - (a.attemptCount ?? 0));
        break;
      case "most_important":
        list.sort((a, b) => {
          const rank = { high: 0, medium: 1, low: 2 };
          const ia = rank[a.importance ?? "low"];
          const ib = rank[b.importance ?? "low"];
          if (ia !== ib) return ia - ib;
          return a.sortNumber - b.sortNumber;
        });
        break;
      case "advanced_first":
        list.sort((a, b) => {
          const titleA = parseModelTestTitle(a.sourceKey);
          const titleB = parseModelTestTitle(b.sourceKey);
          if (titleA.sortChapter !== titleB.sortChapter) {
            return titleB.sortChapter - titleA.sortChapter;
          }
          return titleB.sortTest - titleA.sortTest;
        });
        break;
      case "highest_score":
        list.sort((a, b) => (b.bestScore ?? 0) - (a.bestScore ?? 0));
        break;
      case "lowest_score":
        list.sort((a, b) => {
          if (a.bestScore === undefined) return 1;
          if (b.bestScore === undefined) return -1;
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
        list.sort((a, b) => a.sortNumber - b.sortNumber);
        break;
    }

    return list;
  }, [
    withQuestions,
    searchQuery,
    selectedFilter,
    selectedSort,
    chapterFilter,
    activeCategory,
    recommendedTest,
  ]);

  // Grouped by chapter for the default list view
  const groupedChapters = useMemo(() => {
    const groups: Record<number, ModelTestItem[]> = {};
    for (const test of filteredAndSorted) {
      const titleInfo = parseModelTestTitle(test.sourceDisplayTitle || test.displayTitle || test.sourceKey);
      const ch = titleInfo.sortChapter;
      if (!groups[ch]) groups[ch] = [];
      groups[ch].push(test);
    }
    return groups;
  }, [filteredAndSorted]);

  const sortedChapterKeys = useMemo(() => {
    return Object.keys(groupedChapters)
      .map(Number)
      .sort((a, b) => a - b);
  }, [groupedChapters]);

  const isDefaultView =
    activeCategory === "chapterWise" &&
    searchQuery === "" &&
    (selectedFilter === "all" || selectedFilter === "default") &&
    selectedSort === "default" &&
    chapterFilter === "all";

  const hasActiveFilters =
    searchQuery !== "" ||
    (selectedFilter !== "all" && selectedFilter !== "default") ||
    selectedSort !== "default" ||
    chapterFilter !== "all";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedFilter("all");
    setSelectedSort("default");
    setChapterFilter("all");
  };

  const switchCategory = (tab: ModelTestCategoryTab) => {
    setActiveCategory(tab);
    setSearchQuery("");
    setSelectedFilter("all");
    setSelectedSort("default");
  };

  const statValues: Record<string, string> = {
    chapters: toBanglaNumber(totalChapters),
    tests: toBanglaNumber(withQuestions.length),
    mcq: toBanglaNumber(totalMcq),
    attempted: stats.attempted,
    avg: stats.avgScore,
    high: stats.highestScore,
    low: stats.lowestScore,
  };

  if (loading) {
    return <ModelTestsListSkeleton />;
  }

  return (
    <div className="min-w-0 font-bangla pb-24">
      {/* Hero — strict mockup clone */}
      <div className="relative mb-4 overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-950/80 via-[#0a0b1e]/90 to-slate-950/60 px-4 py-5 sm:px-6 sm:py-6">
        <AtomHeroGraphic />
        <div className="relative pr-0 sm:pr-44 lg:pr-72 xl:pr-96">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold sm:text-base">
            <span className="text-cyan-400">{level}</span>
            <span className="text-slate-500">&gt;</span>
            <span className="text-slate-200">{heroTitle}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            {heroTitle}
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-medium text-slate-400 sm:text-base">
            প্রথমে অধ্যায়ভিত্তিক টেস্ট দিন, তারপর র‍্যান্ডম টেস্টে নিজেকে যাচাই করুন।
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {DASHBOARD_STAT_CONFIG.map((stat) => (
              <DashboardStatCard
                key={stat.key}
                label={stat.label}
                value={statValues[stat.key]}
                icon={stat.icon}
                color={stat.color}
                glow={stat.glow}
              />
            ))}
          </div>
        </div>
      </div>

      {/* আজকের সাজেশন */}
      {recommendedTest && recTitleInfo && (
        <div className="mb-4 overflow-hidden rounded-2xl border border-violet-500/50 bg-gradient-to-r from-violet-950/95 via-[#0c0d1e] to-violet-950/80 p-4 shadow-[0_0_32px_rgba(168,85,247,0.22)] sm:p-5">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-violet-300/50 bg-violet-600/20 shadow-[0_0_28px_rgba(168,85,247,0.65)] sm:h-16 sm:w-16">
                <Star size={28} fill="currentColor" className="text-white sm:h-8 sm:w-8" />
              </div>
              <div>
                <h2 className="text-lg font-black text-violet-200 sm:text-2xl">আজকের সাজেশন</h2>
                <p className="text-base font-bold text-white sm:text-xl">
                  {recTitleInfo.chapterLabel} • {recTitleInfo.testLabel}
                </p>
              </div>
            </div>
            <Link href={`${modelTestBasePath}/${recommendedTest.sourceKey}`} className="w-full md:w-auto">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-fuchsia-600 px-8 py-3 text-base font-black text-white shadow-[0_0_28px_rgba(59,130,246,0.45)] transition hover:scale-[1.02] sm:px-10 sm:text-lg"
              >
                <Play size={18} fill="white" />
                এখন শুরু করুন
              </button>
            </Link>
          </div>
        </div>
      )}

      {allModelTests.length === 0 ? (
        <EmptyState basePath={basePath} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchCategory(tab.id)}
                className={cn(
                  "min-h-[44px] flex-1 rounded-xl px-3 py-2.5 text-xs font-bold transition-all sm:text-sm",
                  activeCategory === tab.id
                    ? tab.id === "paperWise"
                      ? "bg-gradient-to-r from-purple-600/90 to-violet-600/80 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                      : "bg-gradient-to-r from-cyan-600/90 to-blue-600/80 text-white shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <ModelTestFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            selectedSort={selectedSort}
            onSortChange={setSelectedSort}
            resultCount={filteredAndSorted.length}
            totalCount={withQuestions.length}
            hasActiveFilters={hasActiveFilters}
            onClearAll={clearAllFilters}
          />

          {activeCategory === "chapterWise" && chapterOptions.length > 1 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-950/60 px-3 py-2.5">
              <label htmlFor="chapter-filter" className="text-xs font-bold text-slate-400">
                অধ্যায় ফিল্টার
              </label>
              <select
                id="chapter-filter"
                value={chapterFilter === "all" ? "all" : String(chapterFilter)}
                onChange={(e) => {
                  const val = e.target.value;
                  setChapterFilter(val === "all" ? "all" : Number(val));
                }}
                className="h-9 min-w-[140px] rounded-lg border border-slate-700/70 bg-black/30 px-3 text-sm font-semibold text-white outline-none focus:border-cyan-400/50"
              >
                <option value="all">সব অধ্যায়</option>
                {chapterOptions.map((ch) => (
                  <option key={ch} value={ch}>
                    অধ্যায় {toBanglaNumber(ch).padStart(2, "০")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeCategory === "chapterWise" && chapterFilter !== "all" && (
            <div className="mb-4 flex justify-between items-center rounded-xl border border-cyan-500/30 bg-slate-950/70 p-4">
              <span className="text-sm text-cyan-300">
                অধ্যায় {toBanglaNumber(chapterFilter).padStart(2, "০")} — সব টেস্ট
              </span>
              <button
                type="button"
                onClick={() => setChapterFilter("all")}
                className="text-sm font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                ← ফিরে যান
              </button>
            </div>
          )}

          {filteredAndSorted.length === 0 ? (
            <div className="rounded-2xl border border-slate-700/70 bg-slate-950/70 p-8 text-center text-slate-400 sm:p-10">
              <HelpCircle className="mx-auto mb-3 h-10 w-10 text-slate-600" />
              <p className="font-semibold text-slate-300">
                {tabResult.emptyMessage ?? "আপনার ফিল্টার অনুযায়ী কোনো টেস্ট পাওয়া যায়নি।"}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-4 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-bold text-cyan-300 transition hover:bg-cyan-500/20"
                >
                  সব ফিল্টার রিসেট করুন
                </button>
              )}
            </div>
          ) : isDefaultView ? (
            <div className="space-y-4">
              {sortedChapterKeys.map((ch) => {
                const chTestsCount = groupedChapters[ch].length;
                const chName = `অধ্যায় ${toBanglaNumber(ch).padStart(2, "০")}`;
                const visibleTests =
                  chapterFilter === "all"
                    ? groupedChapters[ch].slice(0, 2)
                    : groupedChapters[ch];

                return (
                  <div
                    key={ch}
                    className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-3 shadow-[0_0_20px_rgba(15,23,42,0.5)]"
                  >
                    <div className="mb-3 flex items-center justify-between px-1 sm:px-2">
                      <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-xl border border-blue-400/20 bg-blue-500/15 text-blue-300 shadow-[0_0_14px_rgba(59,130,246,0.35)] sm:h-12 sm:w-12">
                          <BookOpen size={24} />
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-white sm:text-xl">{chName}</h2>
                          <p className="text-xs font-semibold text-slate-400 sm:text-sm">
                            {toBanglaNumber(chTestsCount)} টি মডেল টেস্ট
                          </p>
                        </div>
                      </div>
                      {chapterFilter === "all" && chTestsCount > 2 && (
                        <button
                          type="button"
                          onClick={() => setChapterFilter(ch)}
                          className="shrink-0 text-sm font-bold text-cyan-400 transition hover:text-cyan-300 sm:text-base"
                        >
                          সব দেখুন →
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                      {visibleTests.map((test) => (
                        <ModelTestCard
                          key={test.id}
                          test={test}
                          href={`${modelTestBasePath}/${test.sourceKey}`}
                          isRecommended={recommendedTest?.sourceKey === test.sourceKey}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {filteredAndSorted.map((test) => (
                <ModelTestCard
                  key={test.id}
                  test={test}
                  href={`${modelTestBasePath}/${test.sourceKey}`}
                  isRecommended={recommendedTest?.sourceKey === test.sourceKey}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ basePath }: { basePath: string }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-8 sm:p-10 text-center">
      <HelpCircle className="h-10 w-10 mx-auto mb-3 text-slate-600" />
      <p className="text-slate-300 font-semibold mb-1">
        এই বিষয়ে মডেল টেস্ট এখনো যোগ করা হয়নি।
      </p>
      <p className="text-slate-500 text-sm mb-6">অধ্যায়ভিত্তিক কুইজ থেকে শুরু করুন।</p>
      <Link href={basePath}>
        <Button variant="secondary" className="min-h-[44px]">
          অধ্যায় কুইজ দেখুন
        </Button>
      </Link>
    </div>
  );
}
