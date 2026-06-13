"use client";

import React from "react";
import {
  Check,
  ChevronDown,
  Flame,
  ListFilter,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBnCount } from "@/lib/quiz-helper";

export type ModelTestFilterKey =
  | "all"
  | "default"
  | "easy"
  | "important"
  | "advanced"
  | "tried"
  | "not_tried"
  | "completed"
  | "weak"
  | "high_score"
  | "recommended";

export type ModelTestSortKey =
  | "default"
  | "most_tried"
  | "most_important"
  | "advanced_first"
  | "highest_score"
  | "lowest_score"
  | "recently_tried";

export const FILTER_CHIPS: {
  key: ModelTestFilterKey;
  label: string;
  icon: React.ElementType;
  activeClass: string;
}[] = [
  {
    key: "all",
    label: "সবগুলো",
    icon: Sparkles,
    activeClass:
      "border-cyan-400/60 bg-gradient-to-r from-cyan-600/30 to-blue-600/20 text-white shadow-[0_0_18px_rgba(34,211,238,0.35)]",
  },
  {
    key: "easy",
    label: "সহজ",
    icon: Zap,
    activeClass:
      "border-green-400/60 bg-gradient-to-r from-green-600/25 to-emerald-600/15 text-white shadow-[0_0_18px_rgba(74,222,128,0.3)]",
  },
  {
    key: "important",
    label: "গুরুত্বপূর্ণ",
    icon: Star,
    activeClass:
      "border-amber-400/60 bg-gradient-to-r from-amber-600/25 to-orange-600/15 text-white shadow-[0_0_18px_rgba(251,191,36,0.3)]",
  },
  {
    key: "advanced",
    label: "উন্নত",
    icon: Flame,
    activeClass:
      "border-orange-400/60 bg-gradient-to-r from-orange-600/25 to-red-600/15 text-white shadow-[0_0_18px_rgba(249,115,22,0.3)]",
  },
  {
    key: "tried",
    label: "বেশি চেষ্টা",
    icon: TrendingUp,
    activeClass:
      "border-blue-400/60 bg-gradient-to-r from-blue-600/25 to-indigo-600/15 text-white shadow-[0_0_18px_rgba(59,130,246,0.3)]",
  },
  {
    key: "not_tried",
    label: "দেখিনি",
    icon: Target,
    activeClass:
      "border-slate-400/50 bg-slate-700/40 text-white shadow-[0_0_14px_rgba(148,163,184,0.2)]",
  },
  {
    key: "weak",
    label: "দুর্বল",
    icon: Target,
    activeClass:
      "border-rose-400/60 bg-gradient-to-r from-rose-600/25 to-pink-600/15 text-white shadow-[0_0_18px_rgba(244,63,94,0.25)]",
  },
  {
    key: "completed",
    label: "সম্পন্ন",
    icon: Check,
    activeClass:
      "border-emerald-400/60 bg-gradient-to-r from-emerald-600/25 to-green-600/15 text-white shadow-[0_0_18px_rgba(52,211,153,0.3)]",
  },
  {
    key: "high_score",
    label: "ভালো স্কোর",
    icon: TrendingUp,
    activeClass:
      "border-violet-400/60 bg-gradient-to-r from-violet-600/25 to-purple-600/15 text-white shadow-[0_0_18px_rgba(139,92,246,0.3)]",
  },
  {
    key: "recommended",
    label: "রেকমেন্ডেড",
    icon: Star,
    activeClass:
      "border-fuchsia-400/60 bg-gradient-to-r from-fuchsia-600/30 to-pink-600/20 text-white shadow-[0_0_20px_rgba(217,70,239,0.4)]",
  },
  {
    key: "default",
    label: "ডিফল্ট",
    icon: ListFilter,
    activeClass:
      "border-slate-400/50 bg-slate-700/50 text-white shadow-[0_0_14px_rgba(148,163,184,0.2)]",
  },
];

export const PRIMARY_FILTER_KEYS: ModelTestFilterKey[] = [
  "all",
  "easy",
  "important",
  "advanced",
  "tried",
  "not_tried",
];

export const SECONDARY_FILTER_KEYS: ModelTestFilterKey[] = [
  "weak",
  "completed",
  "high_score",
  "recommended",
];

export const SORT_OPTIONS: { key: ModelTestSortKey; label: string }[] = [
  { key: "default", label: "ডিফল্ট" },
  { key: "most_tried", label: "বেশি চেষ্টা" },
  { key: "most_important", label: "গুরুত্বপূর্ণ" },
  { key: "advanced_first", label: "উন্নত আগে" },
  { key: "highest_score", label: "সর্বোচ্চ স্কোর" },
  { key: "lowest_score", label: "সর্বনিম্ন স্কোর" },
  { key: "recently_tried", label: "সম্প্রতি চেষ্টা" },
];

type Props = {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  selectedFilter: ModelTestFilterKey;
  onFilterChange: (key: ModelTestFilterKey) => void;
  selectedSort: ModelTestSortKey;
  onSortChange: (key: ModelTestSortKey) => void;
  resultCount: number;
  totalCount: number;
  countUnit?: string;
  searchPlaceholder?: string;
  onClearAll?: () => void;
  hasActiveFilters?: boolean;
  variant?: "compact" | "full";
};

export function ModelTestFilterBar({
  searchQuery,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  selectedSort,
  onSortChange,
  resultCount,
  totalCount,
  countUnit = "টেস্ট",
  searchPlaceholder = "অধ্যায় বা টেস্ট নম্বর লিখুন...",
  onClearAll,
  hasActiveFilters,
  variant = "full",
}: Props) {
  const [sortOpen, setSortOpen] = React.useState(false);
  const [showMoreFilters, setShowMoreFilters] = React.useState(false);

  const selectedSortLabel =
    SORT_OPTIONS.find((o) => o.key === selectedSort)?.label ?? "ডিফল্ট";

  const chipMap = React.useMemo(
    () => new Map(FILTER_CHIPS.map((c) => [c.key, c])),
    [],
  );

  const visibleKeys =
    variant === "compact"
      ? [
          ...PRIMARY_FILTER_KEYS,
          ...(showMoreFilters ? SECONDARY_FILTER_KEYS : []),
        ]
      : FILTER_CHIPS.map((c) => c.key);

  const secondaryActive = SECONDARY_FILTER_KEYS.includes(selectedFilter);

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-950/80 to-[#0a0b1e]/90 p-3 shadow-[0_0_28px_rgba(15,23,42,0.5)] backdrop-blur-sm sm:p-4">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_160px]">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/80"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-700/70 bg-black/30 pl-10 pr-10 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50 sm:h-12"
            placeholder={searchPlaceholder}
            aria-label="টেস্ট খুঁজুন"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="সার্চ মুছুন"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setSortOpen((v) => !v)}
            className={cn(
              "flex h-11 w-full items-center justify-between rounded-xl border px-3 text-sm font-bold text-white sm:h-12",
              sortOpen
                ? "border-cyan-400/50 bg-black/40"
                : "border-slate-700/70 bg-black/30 hover:border-slate-600",
            )}
          >
            <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
              <ListFilter size={15} className="shrink-0 text-cyan-400" />
              {selectedSortLabel}
            </span>
            <ChevronDown
              size={15}
              className={cn("shrink-0 transition", sortOpen && "rotate-180")}
            />
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-20" aria-hidden onClick={() => setSortOpen(false)} />
              <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-full min-w-[180px] rounded-xl border border-slate-700/80 bg-slate-950/98 p-1.5 shadow-2xl">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      onSortChange(opt.key);
                      setSortOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold",
                      selectedSort === opt.key
                        ? "bg-cyan-500/15 text-cyan-300"
                        : "text-slate-200 hover:bg-slate-800/80",
                    )}
                  >
                    {opt.label}
                    {selectedSort === opt.key && <Check size={14} className="text-cyan-400" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-400">দ্রুত ফিল্টার</p>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300">
            {formatBnCount(resultCount)}/{formatBnCount(totalCount)} {countUnit}
          </span>
          {hasActiveFilters && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[11px] font-bold text-slate-400 hover:text-white"
            >
              রিসেট
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {visibleKeys.map((key) => {
          const chip = chipMap.get(key);
          if (!chip) return null;
          const Icon = chip.icon;
          const active = selectedFilter === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => onFilterChange(chip.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition-all min-h-[44px]",
                active
                  ? chip.activeClass
                  : "border-slate-700/60 bg-slate-900/50 text-slate-300 hover:border-violet-400/30 hover:text-white",
              )}
            >
              <Icon size={13} />
              {chip.label}
            </button>
          );
        })}
        {variant === "compact" && (
          <button
            type="button"
            onClick={() => setShowMoreFilters((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-2 text-xs font-bold min-h-[44px]",
              showMoreFilters || secondaryActive
                ? "border-purple-400/50 bg-purple-500/15 text-purple-200"
                : "border-slate-700/60 text-slate-400 hover:text-white",
            )}
          >
            {showMoreFilters ? "কম দেখুন" : "আরও ফিল্টার"}
            <ChevronDown size={13} className={cn("transition", showMoreFilters && "rotate-180")} />
          </button>
        )}
      </div>
    </div>
  );
}
