"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  GraduationCap,
  Layers,
  Play,
  Target,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  type ChapterGroupDisplay,
  type QuizListItem,
  difficultyBadgeClass,
  difficultyBadgeLabel,
  formatBnCount,
  getQuizDisplayTitle,
  groupItemsByModelTestChapter,
  MOCK_SET_SIZE,
} from "@/lib/quiz-helper";
import {
  BOARD_QUESTION_YEARS,
  boardQuestionsHubPath,
  boardQuestionsYearPath,
  type RouteLevel,
} from "@/lib/quiz/unified-routes";

const PREVIEW_SETS = 3;

type ChapterListProps = {
  groups: ChapterGroupDisplay[];
  chapterPathPrefix: string;
  emptyMessage?: string;
  expandAll?: boolean;
  hideChapterLinks?: boolean;
};

type ModelListProps = {
  paperItems: QuizListItem[];
  chapterItems: QuizListItem[];
  modelTestPathPrefix: string;
  emptyMessage?: string;
  expandAll?: boolean;
  /** Show only paper-wise or chapter-wise model tests — never both. */
  category: "paperWise" | "chapterWise";
};

type BankListProps = {
  items: QuizListItem[];
  subjectSlug: string;
  emptyMessage?: string;
};

function StatusPill({ item }: { item: QuizListItem }) {
  if (item.completed) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
        <Check size={10} /> সম্পন্ন
      </span>
    );
  }
  if (item.isWeak) {
    return (
      <span className="rounded-md border border-orange-500/40 bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-300">
        দুর্বল
      </span>
    );
  }
  if ((item.attemptCount ?? 0) === 0) {
    return (
      <span className="rounded-md border border-slate-600/50 bg-slate-800/60 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
        দেখিনি
      </span>
    );
  }
  return null;
}

function ModeBadge({ mode, count }: { mode?: QuizListItem["mode"]; count: number }) {
  if (mode === "timed") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-cyan-300/90">
        <Clock size={11} />
        সময়সীমা · {formatBnCount(count)} MCQ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-purple-300/90">
      <Zap size={11} />
      প্র্যাকটিস
    </span>
  );
}

function HyperMegaHotBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-orange-400/50 bg-gradient-to-r from-orange-500/20 to-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-200 shadow-[0_0_12px_rgba(249,115,22,0.25)]">
      <Zap size={10} fill="currentColor" />
      Mega Hot
    </span>
  );
}

function QuizRow({
  item,
  variant = "cyan",
}: {
  item: QuizListItem;
  variant?: "cyan" | "purple" | "amber";
}) {
  const borderAccent =
    variant === "purple"
      ? "hover:border-purple-500/35"
      : variant === "amber"
        ? "hover:border-amber-500/35"
        : "hover:border-cyan-500/35";
  const btnGradient =
    variant === "purple"
      ? "from-purple-600 to-violet-600"
      : variant === "amber"
        ? "from-amber-600 to-orange-600"
        : "from-cyan-600 to-blue-600";

  const diffLabel = difficultyBadgeLabel(item.difficulty);

  return (
    <Link href={item.href} className="group block">
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-all",
          "hover:bg-white/[0.04] active:scale-[0.99]",
          borderAccent,
          item.completed && "border-emerald-500/20 bg-emerald-500/[0.03]",
        )}
      >
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white shadow-lg",
            btnGradient,
          )}
        >
          <Play size={16} fill="white" className="opacity-90" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white group-hover:text-cyan-200">
            {getQuizDisplayTitle(item)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[11px] text-slate-400">
              {item.questionCount > 0 ? `${formatBnCount(item.questionCount)} MCQ` : "অধ্যায় MCQ"}
            </span>
            {item.questionCount > 0 && (
              <ModeBadge mode={item.mode} count={item.questionCount} />
            )}
            {item.isHyperMegaHot && <HyperMegaHotBadge />}
            {diffLabel && (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-semibold border",
                  difficultyBadgeClass(item.difficulty),
                )}
              >
                {diffLabel}
              </span>
            )}
            <StatusPill item={item} />
          </div>
        </div>

        <span
          className={cn(
            "hidden shrink-0 rounded-lg bg-gradient-to-r px-3 py-1.5 text-xs font-bold text-white sm:inline-flex",
            btnGradient,
          )}
        >
          শুরু করো
        </span>
      </div>
    </Link>
  );
}

function ChapterGroupCard({
  group,
  chapterPathPrefix,
  expandAll,
  hideChapterLinks,
  variant = "chapterMcq",
}: {
  group: ChapterGroupDisplay;
  chapterPathPrefix: string;
  expandAll?: boolean;
  hideChapterLinks?: boolean;
  variant?: "chapterMcq" | "modelTest";
}) {
  const isModelTest = variant === "modelTest";
  const [expanded, setExpanded] = useState(false);
  const showAll = expandAll || expanded;
  const sets = group.displaySets;
  const visible = showAll ? sets : sets.slice(0, PREVIEW_SETS);
  const hiddenCount = sets.length - PREVIEW_SETS;

  return (
    <Card
      variant="glass"
      className="overflow-hidden border-slate-700/40 bg-slate-950/40 p-0"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.05] bg-white/[0.02] px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
            {isModelTest ? <Target size={22} /> : <BookOpen size={22} />}
          </div>
          <div>
            <h3 className="text-base font-black text-white sm:text-lg">{group.chapterName}</h3>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {isModelTest ? (
                <Badge variant="default" className="text-[10px] border-purple-500/20 text-purple-200">
                  <Layers className="mr-1 inline h-3 w-3" />
                  {formatBnCount(group.displaySets.length)} মডেল টেস্ট
                </Badge>
              ) : (
                group.totalQuestions > 0 && (
                  <Badge variant="default" className="text-[10px] border-cyan-500/20 text-cyan-300/90">
                    {formatBnCount(group.totalQuestions)} প্র্যাকটিস MCQ
                  </Badge>
                )
              )}
              {!isModelTest && group.practiceMode && (
                <Badge variant="default" className="text-[10px] border-purple-500/20 text-purple-200">
                  <Layers className="mr-1 inline h-3 w-3" />
                  {formatBnCount(group.displaySets.length)} মডেল সেট
                </Badge>
              )}
            </div>
          </div>
        </div>
        {!hideChapterLinks && (
          <Link
            href={`${chapterPathPrefix}/${group.chapterSlug}`}
            className="shrink-0 text-xs font-bold text-cyan-400 hover:text-cyan-300 sm:text-sm"
          >
            {group.practiceMode ? "সব সেট →" : "অধ্যায় খুলো →"}
          </Link>
        )}
      </div>

      <div className="space-y-2 p-3">
        {group.practiceMode ? (
          <>
            {visible.map((set) => (
              <QuizRow key={set.setId} item={set} variant={isModelTest ? "purple" : "cyan"} />
            ))}
            {!showAll && hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-600/50 py-2.5 text-xs font-bold text-slate-400 transition hover:border-cyan-500/40 hover:text-cyan-300"
              >
                আরও {formatBnCount(hiddenCount)}টি টেস্ট দেখুন
                <ChevronDown size={14} />
              </button>
            )}
          </>
        ) : (
          <QuizRow
            item={
              group.displaySets[0] ?? {
                id: group.chapterSlug,
                setId: group.chapterSlug,
                title: group.chapterName,
                slug: group.chapterSlug,
                href: `${chapterPathPrefix}/${group.chapterSlug}/set/${encodeURIComponent(group.chapterSlug)}`,
                questionCount: group.totalQuestions,
                setCount: group.physicalSetCount,
                totalQuestions: group.totalQuestions,
                mode: group.totalQuestions <= MOCK_SET_SIZE ? "timed" : "practice",
              }
            }
          />
        )}
      </div>
    </Card>
  );
}

export function SubjectChapterQuizList({
  groups,
  chapterPathPrefix,
  emptyMessage = "এই বিষয়ে অধ্যায়ভিত্তিক MCQ এখনো যোগ করা হয়নি। মডেল টেস্ট ট্যাবে চেষ্টা করো।",
  expandAll = false,
  hideChapterLinks = false,
}: ChapterListProps) {
  if (groups.length === 0) {
    return (
      <Card variant="glass" className="p-8 text-center text-slate-500">
        <BookOpen className="mx-auto mb-2 h-8 w-8 text-slate-600" />
        <p className="font-semibold text-slate-300">{emptyMessage}</p>
        <p className="mt-2 text-xs text-slate-500">
          অধ্যায়ভিত্তিক কুইজ = সিলেবাসের প্রতিটি অধ্যায়ের MCQ প্র্যাকটিস
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <ChapterGroupCard
          key={group.chapterSlug}
          group={group}
          chapterPathPrefix={chapterPathPrefix}
          expandAll={expandAll}
          hideChapterLinks={hideChapterLinks}
        />
      ))}
    </div>
  );
}

export function SubjectModelTestList({
  paperItems,
  chapterItems,
  modelTestPathPrefix,
  emptyMessage = "মডেল টেস্ট এখনো যোগ করা হয়নি।",
  expandAll = false,
  category,
}: ModelListProps) {
  const showPaper = category === "paperWise";
  const showChapter = category === "chapterWise";
  const items = showPaper ? paperItems : chapterItems;
  const chapterGroups = useMemo(
    () => groupItemsByModelTestChapter(chapterItems),
    [chapterItems],
  );
  const useGroupedChapter = showChapter && chapterGroups.length > 1;

  if (items.length === 0) {
    return (
      <Card variant="glass" className="p-8 text-center text-slate-500">
        <Target className="mx-auto mb-2 h-8 w-8 text-slate-600" />
        <p>
          {showPaper
            ? "পত্রভিত্তিক মডেল টেস্ট এখনো যোগ করা হয়নি।"
            : showChapter
              ? "অধ্যায়ভিত্তিক মডেল টেস্ট এখনো যোগ করা হয়নি।"
              : emptyMessage}
        </p>
      </Card>
    );
  }

  if (showPaper) {
    return (
      <div className="space-y-2">
        {paperItems.map((item) => (
          <QuizRow key={item.setId} item={item} variant="purple" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {useGroupedChapter ? (
        chapterGroups.map((group) => (
          <Card
            key={group.chapterSlug}
            variant="glass"
            className="overflow-hidden border-slate-700/40 bg-slate-950/40 p-0"
          >
            <div className="flex items-center gap-3 border-b border-white/[0.05] bg-white/[0.02] px-4 py-3.5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-300">
                <Target size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-white sm:text-lg">{group.chapterName}</h3>
                <p className="mt-0.5 text-xs font-semibold text-slate-400">
                  {formatBnCount(group.displaySets.length)} মডেল টেস্ট
                </p>
              </div>
            </div>
            <div className="space-y-2 p-3">
              {(expandAll ? group.displaySets : group.displaySets.slice(0, 3)).map((item) => (
                <QuizRow key={item.setId} item={item} variant="purple" />
              ))}
              {!expandAll && group.displaySets.length > 3 && (
                <p className="py-1 text-center text-xs font-bold text-slate-500">
                  +{formatBnCount(group.displaySets.length - 3)} আরও মডেল টেস্ট
                </p>
              )}
            </div>
          </Card>
        ))
      ) : (
        <div className="space-y-2">
          {chapterItems.map((item) => (
            <QuizRow key={item.setId} item={item} variant="purple" />
          ))}
        </div>
      )}
    </div>
  );
}

type BoardListProps = {
  level: RouteLevel;
  subjectSlug: string;
  emptyMessage?: string;
};

export function SubjectBoardQuestionsList({
  level,
  subjectSlug,
  emptyMessage = "এই বিষয়ে বোর্ড প্রশ্ন এখনো যোগ করা হয়নি।",
}: BoardListProps) {
  const hubPath = boardQuestionsHubPath(level, subjectSlug);

  return (
    <div className="space-y-4">
      <Card variant="glass" className="border-amber-500/20 bg-amber-500/[0.04] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
              <GraduationCap size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-white sm:text-lg">বোর্ড পরীক্ষার প্রশ্ন</h3>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Dhaka, Rajshahi, Cumilla, Barishal সহ সব বোর্ড — বছর অনুযায়ী MCQ প্র্যাকটিস
              </p>
            </div>
          </div>
          <Link
            href={hubPath}
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-amber-200 sm:text-sm"
          >
            সব বোর্ড দেখুন
            <ChevronRight size={14} />
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {BOARD_QUESTION_YEARS.map((year) => (
          <Link
            key={year.value}
            href={boardQuestionsYearPath(level, subjectSlug, year.value)}
            className="group"
          >
            <Card
              variant="glass"
              className="border-white/[0.06] p-4 text-center transition hover:border-amber-500/35 hover:bg-amber-500/[0.04]"
            >
              <p className="text-lg font-black text-white group-hover:text-amber-200">
                {year.label}
              </p>
              <p className="mt-1 text-[10px] font-semibold text-slate-500">বোর্ড MCQ</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SubjectQuestionBankList({
  items,
  subjectSlug,
  emptyMessage = "বোর্ড প্রশ্ন ব্যাংক এখনো যোগ করা হয়নি।",
}: BankListProps) {
  if (items.length === 0) {
    return (
      <Card variant="glass" className="p-8 text-center text-slate-500">
        <BookOpen className="mx-auto mb-2 h-8 w-8 text-slate-600" />
        <p>{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <p className="mb-2 text-xs text-slate-400">
        বোর্ড প্রশ্ন ব্যাংক — {formatBnCount(items.length)} সেট
      </p>
      {items.map((item) => (
        <QuizRow key={item.setId} item={item} variant="amber" />
      ))}
    </div>
  );
}
