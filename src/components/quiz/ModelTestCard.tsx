"use client";

import Link from "next/link";
import {
  Check,
  ClipboardList,
  Clock,
  Grid2X2,
  Play,
  Star,
  Zap,
} from "lucide-react";
import type { ModelTestItem } from "@/lib/model-test-filters";
import { parseModelTestTitle, isHyperMegaHotSource } from "@/lib/format-model-test-title";
import { cn } from "@/lib/utils";

type CardStatus = "not-tried" | "completed" | "weak" | "recommended";

function resolveStatus(
  test: ModelTestItem,
  isRecommended: boolean,
): { status: CardStatus; label: string } {
  const completed = test.completed ?? (test.attemptCount ?? 0) > 0;
  if (isRecommended) return { status: "recommended", label: "রেকমেন্ডেড" };
  if (!completed) return { status: "not-tried", label: "দেখিনি" };
  const accuracy =
    test.lastScore !== undefined && test.questionCount > 0
      ? test.lastScore / test.questionCount
      : 1;
  if (accuracy < 0.6) return { status: "weak", label: "দুর্বল" };
  return { status: "completed", label: "সম্পন্ন" };
}

function StatusBadge({ status, label }: { status: CardStatus; label: string }) {
  const styles: Record<CardStatus, string> = {
    "not-tried": "border-slate-500/40 bg-slate-800/80 text-slate-200",
    completed: "border-emerald-400/50 bg-emerald-500/15 text-emerald-200",
    weak: "border-orange-400/50 bg-orange-500/15 text-orange-200",
    recommended: "border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-100",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold sm:text-sm",
        styles[status],
      )}
    >
      {status === "completed" && <Check size={13} />}
      {status === "recommended" && <Star size={13} fill="currentColor" />}
      {label}
    </span>
  );
}

export function ModelTestCard({
  test,
  href,
  isRecommended = false,
}: {
  test: ModelTestItem;
  href: string;
  showAttemptCount?: boolean;
  isRecommended?: boolean;
}) {
  const { chapterLabel, testLabel } = parseModelTestTitle(
    test.sourceDisplayTitle || test.displayTitle || test.sourceKey,
  );
  const { status, label } = resolveStatus(test, isRecommended);
  const showReviewRetry = status === "completed";
  const isMegaHot = isHyperMegaHotSource(test.sourceKey, test.tags);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-slate-950/75 p-3.5 sm:p-4",
        "border-slate-700/70 shadow-[0_0_20px_rgba(30,64,175,0.12)]",
        "transition-all duration-200 hover:border-cyan-400/40 hover:shadow-[0_0_28px_rgba(34,211,238,0.15)]",
        isRecommended && "border-fuchsia-500/30 shadow-[0_0_24px_rgba(168,85,247,0.2)]",
        isMegaHot && "border-orange-500/35 shadow-[0_0_24px_rgba(249,115,22,0.18)]",
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-cyan-500/8 blur-3xl" />
      </div>

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-violet-400/25 bg-violet-600/15 text-violet-300 shadow-[0_0_18px_rgba(168,85,247,0.3)] sm:h-14 sm:w-14">
            <ClipboardList size={26} className="sm:w-[30px] sm:h-[30px]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-start justify-between gap-2 sm:hidden">
              <StatusBadge status={status} label={label} />
            </div>
            <h3 className="text-base font-black leading-snug text-white sm:text-lg">
              {chapterLabel}
              <span className="text-slate-300"> · </span>
              {testLabel}
            </h3>

            <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-slate-400 sm:text-xs">
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-700/80 bg-slate-900/70 px-2 py-0.5">
                <Grid2X2 size={11} />
                {test.questionCount} MCQ
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-700/80 bg-slate-900/70 px-2 py-0.5">
                <Clock size={11} />
                {test.durationMinutes} min
              </span>
              {isMegaHot && (
                <span className="inline-flex items-center gap-1 rounded-md border border-orange-400/40 bg-orange-500/15 px-2 py-0.5 text-orange-200">
                  <Zap size={11} fill="currentColor" />
                  Mega Hot
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end sm:gap-2.5">
          <div className="hidden sm:block">
            <StatusBadge status={status} label={label} />
          </div>

          {!test.hasQuestions ? (
            <span className="text-center text-xs text-slate-500 sm:text-right">শীঘ্র আসছে</span>
          ) : showReviewRetry ? (
            <div className="flex gap-2">
              <Link href={href} className="flex-1 sm:flex-none">
                <button
                  type="button"
                  className="w-full rounded-lg border border-blue-400/50 px-4 py-2 text-sm font-bold text-blue-300 transition hover:bg-blue-500/10 sm:px-5"
                >
                  Review
                </button>
              </Link>
              <Link href={href} className="flex-1 sm:flex-none">
                <button
                  type="button"
                  className="w-full rounded-lg border border-emerald-400/50 px-4 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/10 sm:px-5"
                >
                  Retry
                </button>
              </Link>
            </div>
          ) : (
            <Link href={href}>
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-fuchsia-600 px-6 py-2 text-sm font-extrabold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] transition hover:scale-[1.02] sm:w-auto sm:px-7"
              >
                <Play size={15} fill="white" />
                শুরু করুন
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
