"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useWrongAnswers } from "@/hooks/useWrongAnswers";
import type { WrongQuestion } from "@/lib/wrong-answers";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { QuizQuestionStem } from "@/components/quiz/QuizQuestionStem";
import { QuizOptionText } from "@/components/quiz/QuizOptionText";
import { cn } from "@/lib/utils";
import { FormattedQuizText } from "@/lib/format-quiz-text";
import {
  AlertCircle,
  Check,
  Clock,
  Layers,
  Trash2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  RotateCcw,
} from "lucide-react";
import type { RouteLevel } from "@/lib/quiz/unified-routes";

const BANGLA_OPTS = ["ক", "খ", "গ", "ঘ"] as const;

type Props = {
  level: RouteLevel;
};

/** Group wrong questions by subject */
function groupBySubject(items: WrongQuestion[]): Map<string, WrongQuestion[]> {
  const map = new Map<string, WrongQuestion[]>();
  for (const item of items) {
    const key = item.subject || "general";
    const arr = map.get(key);
    if (arr) {
      arr.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}

/** Format ISO timestamp to Bangla-friendly short form */
function formatSavedTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);

  if (diffMin < 1) return "এইমাত্র";
  if (diffMin < 60) return `${diffMin} মিনিট আগে`;
  if (diffHr < 24) return `${diffHr} ঘণ্টা আগে`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} দিন আগে`;
  return d.toLocaleDateString("bn-BD", { day: "numeric", month: "short" });
}

export function WrongAnswersClient({ level }: Props) {
  const { wrong, mounted, remove, clearAll, count } = useWrongAnswers();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  if (!mounted) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-500" />
      </div>
    );
  }

  const grouped = groupBySubject(wrong);
  const subjects = Array.from(grouped.keys());
  const filtered = selectedSubject
    ? wrong.filter((q) => (q.subject || "general") === selectedSubject)
    : wrong;

  const subjectLabel = (slug: string): string => {
    const map: Record<string, string> = {
      physics: "পদার্থবিজ্ঞান",
      chemistry: "রসায়ন",
      biology: "জীববিজ্ঞান",
      "higher-math": "উচ্চতর গণিত",
      math: "সাধারণ গণিত",
      "physics-1st-paper": "পদার্থবিজ্ঞান ১ম পত্র",
      "physics-2nd-paper": "পদার্থবিজ্ঞান ২য় পত্র",
      "chemistry-1st-paper": "রসায়ন ১ম পত্র",
      "chemistry-2nd-paper": "রসায়ন ২য় পত্র",
      "biology-1st-paper": "জীববিজ্ঞান ১ম পত্র",
      "biology-2nd-paper": "জীববিজ্ঞান ২য় পত্র",
      "higher-math-1st-paper": "উচ্চতর গণিত ১ম পত্র",
      "higher-math-2nd-paper": "উচ্চতর গণিত ২য় পত্র",
      general: "সাধারণ",
    };
    return map[slug] || slug;
  };

  if (count === 0) {
    return (
      <div className="min-h-[60vh] font-bangla py-8">
        <Card variant="glass" className="max-w-xl mx-auto p-8 text-center text-slate-200">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10">
            <Check className="h-7 w-7 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            কোনো ভুল উত্তর নেই!
          </h1>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            দারুণ! তোমার ভুল উত্তরের তালিকা এখন খালি। কুইজ অনুশীলন চালিয়ে যাও এবং কোনো প্রশ্ন ভুল হলে তা অটোমেটিক্যালি এখানে যোগ হয়ে যাবে।
          </p>
          <Link href={`/${level}`}>
            <Button variant="secondary">কুইজে ফিরে যান</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 font-bangla pb-24 text-slate-200">
      {/* Header */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-950 via-[#0a0b1e] to-slate-950 px-4 py-5 sm:px-6">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-red-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-6 right-12 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-red-400/80">
              {level.toUpperCase()} · ভুল উত্তরের তালিকা
            </p>
            <h1 className="text-2xl font-black text-white sm:text-3xl">
              ভুল উত্তরের অনুশীলন
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              পরীক্ষায় যেসব প্রশ্ন ভুল করেছো সেগুলো এখানে জমা আছে। আবার অনুশীলন করে তোমার ঘাটতি পূরণ করো।
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-300">
                <Layers className="mr-1 inline h-3 w-3" />
                {count}টি প্রশ্ন ভুল তালিকায় আছে
              </span>
              {subjects.length > 1 && (
                <span className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-300">
                  {subjects.length}টি বিষয়
                </span>
              )}
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (confirmClear) {
                clearAll();
                setConfirmClear(false);
              } else {
                setConfirmClear(true);
              }
            }}
            className={cn(
              "shrink-0 text-xs",
              confirmClear
                ? "border-red-500/40 text-red-300 hover:bg-red-500/10"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Trash2 className="mr-1 inline h-3.5 w-3.5" />
            {confirmClear ? "নিশ্চিতভাবে মুছুন?" : "সব মুছুন"}
          </Button>
        </div>
      </div>

      {/* Subject filter chips */}
      {subjects.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedSubject(null)}
            className={cn(
              "rounded-xl px-3 py-2 text-xs font-bold border transition-all",
              !selectedSubject
                ? "border-red-400/50 bg-red-500/15 text-red-300"
                : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            )}
          >
            সব ({count})
          </button>
          {subjects.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() =>
                setSelectedSubject(selectedSubject === sub ? null : sub)
              }
              className={cn(
                "rounded-xl px-3 py-2 text-xs font-bold border transition-all",
                selectedSubject === sub
                  ? "border-red-400/50 bg-red-500/15 text-red-300"
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
              )}
            >
              {subjectLabel(sub)} ({grouped.get(sub)?.length ?? 0})
            </button>
          ))}
        </div>
      )}

      {/* Wrong question cards */}
      <div className="space-y-3">
        {filtered.map((q, idx) => {
          const isExpanded = expandedId === q.id;
          return (
            <Card
              key={q.id}
              variant="glass"
              className="overflow-hidden border-white/5 bg-slate-900/40"
            >
              {/* Collapsed header — click to expand */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
                className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-white/[0.02]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-black">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-slate-200">
                    {q.questionText}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatSavedTime(q.savedAt)}</span>
                    {q.subject && (
                      <>
                        <span className="text-slate-600">·</span>
                        <Badge className="border-red-500/20 bg-red-500/10 px-1.5 py-0 text-[10px] text-red-300">
                          {subjectLabel(q.subject)}
                        </Badge>
                      </>
                    )}
                    {q.chapter && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span>{q.chapter}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(q.id);
                    }}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    title="তালিকা থেকে সরান"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  )}
                </div>
              </button>

              {/* Expanded — show question + options for practice */}
              {isExpanded && (
                <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-4">
                  <QuizQuestionStem text={q.questionText} image={q.image} />

                  {/* Info about previous choice */}
                  {q.studentOption && q.correctOption && (
                    <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-3 text-xs text-red-400/90 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>
                        পরীক্ষায় তোমার দেওয়া উত্তর ছিল অপশন: <strong>{q.studentOption}</strong> (সঠিক উত্তর ছিল: <strong>{q.correctOption}</strong>)
                      </span>
                    </div>
                  )}

                  <div className="grid gap-2">
                    {q.options.map((opt, oi) => {
                      const correctIdx = q.correctOption ? ["A", "B", "C", "D"].indexOf(q.correctOption) : -1;
                      const hasSelected = selectedAnswers[q.id] !== undefined;
                      const isSelected = selectedAnswers[q.id] === oi;
                      const isCorrect = correctIdx !== -1 && oi === correctIdx;

                      let optionStyle = "border-white/5 bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/[0.05]";
                      if (hasSelected) {
                        if (isCorrect) {
                          optionStyle = "border-green-400/40 bg-green-500/10 text-green-200 shadow-[0_0_12px_rgba(34,197,94,0.08)]";
                        } else if (isSelected) {
                          optionStyle = "border-red-400/40 bg-red-500/10 text-red-200";
                        } else {
                          optionStyle = "border-white/5 bg-white/[0.01] text-slate-500 opacity-60 cursor-default";
                        }
                      }

                      return (
                        <button
                          key={`${q.id}-opt-${oi}`}
                          type="button"
                          disabled={hasSelected}
                          onClick={() => {
                            setSelectedAnswers((prev) => ({
                              ...prev,
                              [q.id]: oi,
                            }));
                          }}
                          className={cn(
                            "w-full text-left rounded-xl border px-4 py-3 text-sm flex items-center justify-between gap-2.5 transition-all",
                            optionStyle
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={cn(
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold border",
                              hasSelected
                                ? isCorrect
                                  ? "bg-green-500/20 text-green-300 border-green-500/30"
                                  : isSelected
                                    ? "bg-red-500/20 text-red-300 border-red-500/30"
                                    : "bg-slate-800 text-slate-600 border-slate-700/50"
                                : "bg-slate-800 text-slate-400 border-white/5"
                            )}>
                              {BANGLA_OPTS[oi]}
                            </span>
                            <QuizOptionText
                              text={opt}
                              questionText={q.questionText}
                              optionImage={q.optionImages?.[oi] ?? null}
                            />
                          </div>

                          {hasSelected && (
                            <div className="shrink-0">
                              {isCorrect && <Check className="h-4 w-4 text-green-400" />}
                              {isSelected && !isCorrect && <AlertCircle className="h-4 w-4 text-red-400" />}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Show explanation and try again/remove options */}
                  {selectedAnswers[q.id] !== undefined && (
                    <div className="space-y-3 pt-1">
                      {q.explanation && (
                        <div className="rounded-xl border border-cyan-500/10 bg-cyan-950/20 p-4 space-y-1.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                            <Lightbulb className="h-3.5 w-3.5" />
                            ব্যাখ্যা
                          </h4>
                          <div className="text-xs text-slate-300 leading-relaxed">
                            <FormattedQuizText text={q.explanation} />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => remove(q.id)}
                          className="text-xs text-green-400 border-green-500/15 hover:bg-green-500/10 hover:text-green-300"
                        >
                          <Check className="mr-1.5 h-3.5 w-3.5" />
                          ভুল তালিকা থেকে বাদ দিন
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedAnswers((prev) => {
                              const copy = { ...prev };
                              delete copy[q.id];
                              return copy;
                            });
                          }}
                          className="text-xs text-slate-400 hover:text-slate-200"
                        >
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                          আবার চেষ্টা করুন
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
