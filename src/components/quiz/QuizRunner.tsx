"use client";

import React, { useEffect, useLayoutEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useQuizStore, type Question } from "@/store/quizStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { FormattedQuizText } from "@/lib/format-quiz-text";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Award,
  BookOpen,
  RotateCcw,
  Layout,
  Check,
  ChevronRight,
  TrendingUp,
  Lightbulb,
  Loader2,
} from "lucide-react";

const OPTIONS = ["A", "B", "C", "D"] as const;
const BANGLA_OPTS = ["ক", "খ", "গ", "ঘ"] as const;

function mapToStoreQuestion(
  q: Record<string, unknown>,
  meta?: QuizSubmitMeta,
): Question {
  const optionList = Array.isArray(q.options)
    ? (q.options as unknown[]).map((o) =>
        typeof o === "string" ? o : String(o ?? ""),
      )
    : [q.optionA, q.optionB, q.optionC, q.optionD].map((o) => String(o ?? ""));

  return {
    id: String(q.id ?? ""),
    subject: meta?.subject || String(q.subject ?? ""),
    chapter: meta?.chapterName || String(q.chapter ?? ""),
    text: String(q.questionText ?? q.text ?? q.question ?? ""),
    options: optionList.filter(Boolean).slice(0, 4),
    image: (q.image as string | null) ?? null,
    timeLimit: typeof q.timeLimit === "number" ? q.timeLimit : 45,
  };
}

export type QuizSubmitMeta = {
  quizId: string;
  level: "ssc" | "hsc";
  subject: string;
  paper?: string | null;
  chapter?: string | null;
  chapterName?: string | null;
  type: string;
  expectedMcq?: number;
};

type Props = {
  questions: any[];
  examSlug: string;
  examName: string;
  backUrl: string;
  onBack?: () => void;
  timeLimitSec?: number;
  quizSubmitMeta?: QuizSubmitMeta;
  /** Show embedded worked solutions in question stems (board / review-style content) */
  showWorkedSolution?: boolean;
};

export function QuizRunner({
  questions: rawQuestions,
  examSlug,
  examName,
  backUrl,
  onBack,
  timeLimitSec = 600,
  quizSubmitMeta,
  showWorkedSolution = false,
}: Props) {
  const { user, firebaseUser } = useAuth();

  // Zustand Store selectors
  const {
    currentQuestionIndex,
    selectedAnswers,
    markedQuestions,
    skippedQuestions,
    timer,
    timeTaken,
    quizStarted,
    quizSubmitted,
    questions,
    isLoading,
    isSubmitting,
    results,
    startQuiz,
    selectAnswer,
    markQuestion,
    skipQuestion,
    tickTimer,
    setQuestionIndex,
    resetQuiz,
    submitQuiz,
  } = useQuizStore();

  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [storeReady, setStoreReady] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollSpyRef = useRef<IntersectionObserver | null>(null);

  const mappedQuestions = useMemo(() => {
    if (!rawQuestions?.length) return [];
    return rawQuestions
      .map((q) => mapToStoreQuestion(q, quizSubmitMeta))
      .filter((q) => q.text && q.options.length > 0);
  }, [
    rawQuestions,
    quizSubmitMeta?.quizId,
    quizSubmitMeta?.subject,
    quizSubmitMeta?.chapter,
    quizSubmitMeta?.chapterName,
  ]);

  const metaQuizId = quizSubmitMeta?.quizId;
  const metaSubject = quizSubmitMeta?.subject ?? "";
  const metaChapter = quizSubmitMeta?.chapter ?? "";

  // Sync Zustand before paint so we never flash an empty quiz shell
  useLayoutEffect(() => {
    if (!mappedQuestions.length) {
      setStoreReady(false);
      return;
    }

    startQuiz(
      metaQuizId || examSlug,
      metaSubject,
      metaChapter,
      mappedQuestions,
      timeLimitSec,
      examName,
    );
    setStoreReady(true);
  }, [
    mappedQuestions,
    examSlug,
    timeLimitSec,
    examName,
    metaQuizId,
    metaSubject,
    metaChapter,
    startQuiz,
  ]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle countdown
  useEffect(() => {
    if (!quizStarted || quizSubmitted || timer <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (timer <= 0 && quizStarted && !quizSubmitted && !isSubmitting) {
        handleAutoSubmit();
      }
      return;
    }

    timerRef.current = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizStarted, quizSubmitted, isSubmitting, timer, tickTimer]);

  // Track visible question while scrolling for palette highlight
  useEffect(() => {
    if (quizSubmitted || questions.length === 0) return;

    scrollSpyRef.current?.disconnect();
    const elements = questions
      .map((_, qi) => document.getElementById(`quiz-q-${qi}`))
      .filter((el): el is HTMLElement => el !== null);

    scrollSpyRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (!visible.length) return;
        const idx = Number(visible[0].target.id.replace("quiz-q-", ""));
        if (!Number.isNaN(idx)) setQuestionIndex(idx);
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: 0 },
    );

    elements.forEach((el) => scrollSpyRef.current?.observe(el));
    return () => scrollSpyRef.current?.disconnect();
  }, [questions, quizSubmitted, setQuestionIndex]);

  const scrollToQuestion = (qi: number) => {
    setQuestionIndex(qi);
    document.getElementById(`quiz-q-${qi}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleAutoSubmit = async () => {
    if (!firebaseUser || !user || isSubmitting || quizSubmitted) return;
    try {
      const token = await firebaseUser.getIdToken();
      await submitQuiz(user.id, "exam", token);
    } catch (e) {
      console.error("Auto submit failed:", e);
    }
  };

  const handleManualSubmit = async () => {
    if (isSubmitting || quizSubmitted) return;
    if (!firebaseUser || !user) {
      alert("পরীক্ষা জমা দিতে অনুগ্রহ করে প্রথমে লগইন করুন।");
      return;
    }
    setConfirmSubmit(false);
    try {
      const token = await firebaseUser.getIdToken();
      await submitQuiz(user.id, "practice", token);
    } catch (e) {
      console.error("Manual submit failed:", e);
    }
  };

  if (!mappedQuestions.length) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center font-bangla">
        <p className="text-slate-400 mb-4">ডেটা লোড হচ্ছে অথবা নেই...</p>
        <Link href={backUrl}>
          <Button variant="secondary">ফিরে যাও</Button>
        </Link>
      </div>
    );
  }

  if (!storeReady) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-glow" />
        <p className="text-sm text-slate-500 font-bangla">প্রশ্ন লোড হচ্ছে...</p>
      </div>
    );
  }

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPct = totalQuestions
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0;

  // Results Screen Rendering
  if (quizSubmitted && results) {
    const durationMin = Math.floor(timeTaken / 60);
    const durationSec = timeTaken % 60;

    return (
      <div className="max-w-3xl mx-auto px-4 py-8 font-bangla pb-24 space-y-6">
        {reviewing ? (
          // Review Mode
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/60 backdrop-blur border border-white/5 rounded-2xl p-4 sticky top-[72px] z-20">
              <div>
                <h2 className="text-lg font-bold text-white">প্রশ্ন উত্তর ও ব্যাখ্যা রিভিউ</h2>
                <p className="text-xs text-slate-400">সঠিক এবং ভুল উত্তরগুলোর বিশদ বিশ্লেষণ নিচে দেয়া হলো।</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setReviewing(false)}>
                ফলাফলে ফিরুন
              </Button>
            </div>

            {questions.map((q, qi) => {
              const selected = selectedAnswers[q.id];
              const explanation = results.explanations?.[q.id];
              // Find index of selected option
              const selectedIdx = q.options.indexOf(selected);
              // Find correct index from explanation mapping or server results if provided.
              // Note: Since correct answer is not exposed in public questions,
              // backend returns explanation list which can indicate the correctness,
              // and the backend grading validates it. We display the student's choice and the correct option.
              // For safety in review mode, we can show which answers are correct or incorrect.
              const isSkipped = !selected;

              return (
                <Card key={q.id} variant="glass" className="p-5 space-y-3 border-white/5 bg-slate-950/40">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-800 text-slate-300 font-bold text-xs shrink-0 mt-0.5">
                      {qi + 1}
                    </div>
                    <div className="space-y-3 w-full">
                      <FormattedQuizText text={q.text} hideWorkedSolution={false} />
                      
                      <div className="grid gap-2 text-sm">
                        {q.options.map((opt, oi) => {
                          const isSelected = selected === opt;
                          return (
                            <div
                              key={opt}
                              className={cn(
                                "rounded-xl px-4 py-2.5 border transition-all flex items-center justify-between",
                                isSelected ? "border-purple-glow/40 bg-purple-glow/5 text-purple-200" : "border-white/5 bg-white/5 text-slate-300"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-400">{BANGLA_OPTS[oi]}.</span>
                                <FormattedQuizText text={opt} inline />
                              </div>
                              {isSelected && <Check className="h-4 w-4 text-purple-400" />}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation box */}
                      {explanation && (
                        <div className="rounded-xl p-4 bg-cyan-500/5 border border-cyan-500/10 space-y-2 text-sm leading-relaxed">
                          <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                            <Lightbulb className="h-4 w-4 shrink-0" />
                            <span>বিশ্লেষণ ও সমাধান:</span>
                          </div>
                          <FormattedQuizText
                            text={explanation}
                            className="text-slate-300 text-sm"
                            hideWorkedSolution={false}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          // Main Results Card
          <Card variant="glass" className="p-6 sm:p-8 space-y-6 bg-slate-900/40 border-white/10 text-center">
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-purple-500/10 border border-purple-500/20 mb-2">
                <Award className="h-10 w-10 text-purple-400 animate-bounce" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">অভিনন্দন! কুইজ সম্পন্ন হয়েছে</h1>
              <p className="text-sm text-slate-400">{examName}</p>
            </div>

            {/* Score ELO box */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-purple-500/5 border border-purple-500/10 p-4">
                <p className="text-xs text-slate-400 mb-1">মোট স্কোর</p>
                <p className="text-2xl font-black text-purple-300">{results.totalScore}/{totalQuestions}</p>
              </div>
              <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-4">
                <p className="text-xs text-slate-400 mb-1">সঠিক উত্তর</p>
                <p className="text-2xl font-black text-emerald-400">{results.correctCount}</p>
              </div>
              <div className="rounded-2xl bg-red-500/5 border border-red-500/10 p-4">
                <p className="text-xs text-slate-400 mb-1">ভুল উত্তর</p>
                <p className="text-2xl font-black text-red-400">{results.wrongCount}</p>
              </div>
              <div className="rounded-2xl bg-yellow-500/5 border border-yellow-500/10 p-4">
                <p className="text-xs text-slate-400 mb-1">ইলো রেটিং পরিবর্তন</p>
                <div className="flex items-center justify-center gap-1 font-black text-2xl text-yellow-400">
                  <TrendingUp className="h-5 w-5" />
                  <span>{results.eloRatingChange >= 0 ? `+${results.eloRatingChange}` : results.eloRatingChange}</span>
                </div>
              </div>
            </div>

            {/* Progress/Performance Gauges */}
            <div className="grid md:grid-cols-2 gap-6 pt-2 text-left">
              {/* Stats detail */}
              <div className="space-y-4 bg-slate-950/40 rounded-2xl p-5 border border-white/5">
                <h3 className="font-bold text-white border-b border-white/5 pb-2 text-sm flex items-center gap-2">
                  <Layout className="h-4 w-4 text-cyan-400" /> কুইজ অ্যানালিটিক্স
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">সঠিকতার হার (Accuracy):</span>
                    <span className="font-bold text-white">{results.accuracy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">মোট ব্যয়িত সময়:</span>
                    <span className="font-bold text-white">{durationMin} মিনিট {durationSec} সেকেন্ড</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">প্রশ্নপ্রতি গড় সময়:</span>
                    <span className="font-bold text-white">{results.timePerQuestion} সেকেন্ড</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">উত্তর না দেয়া প্রশ্ন (Skipped):</span>
                    <span className="font-bold text-white">{results.skippedCount}</span>
                  </div>
                </div>
              </div>

              {/* Weak/Strong topics */}
              <div className="space-y-4 bg-slate-950/40 rounded-2xl p-5 border border-white/5">
                <h3 className="font-bold text-white border-b border-white/5 pb-2 text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-400" /> বিষয়ভিত্তিক পারফরম্যান্স
                </h3>
                <div className="space-y-3">
                  {results.strongTopics?.length > 0 && (
                    <div>
                      <p className="text-xs text-emerald-400 font-bold mb-1">সবচেয়ে মজবুত টপিক:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {results.strongTopics.map((t) => (
                          <Badge key={t} className="bg-emerald-500/10 border-emerald-500/20 text-emerald-300">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {results.weakTopics?.length > 0 && (
                    <div>
                      <p className="text-xs text-red-400 font-bold mb-1">দুর্বল টপিক (অনুশীলন প্রয়োজন):</p>
                      <div className="flex flex-wrap gap-1.5">
                        {results.weakTopics.map((t) => (
                          <Badge key={t} className="bg-red-500/10 border-red-500/20 text-red-300">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions panel */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 border-t border-white/5">
              <Button variant="secondary" onClick={() => setReviewing(true)} className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                ব্যাখ্যাসহ রিভিউ দেখুন
              </Button>
              <Button variant="secondary" onClick={resetQuiz} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                আবার পরীক্ষা দিন
              </Button>
              <Link href="/dashboard">
                <Button className="w-full sm:w-auto">ড্যাশবোর্ডে ফিরে যান</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // Quiz Play Screen — scrollable all questions
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 font-bangla pb-28 scroll-smooth">
      {/* Sticky header: back, timer, progress, palette */}
      <div className="sticky top-[72px] z-30 -mx-4 px-4 pt-2 pb-4 bg-[#07111F]/95 backdrop-blur-md border-b border-white/5 mb-4 space-y-4">
        <div className="flex items-center justify-between">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="text-slate-400 hover:text-white flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4" /> ফিরে যাও
            </button>
          ) : (
            <Link href={backUrl} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm">
              <ArrowLeft className="h-4 w-4" /> ফিরে যাও
            </Link>
          )}
          <Badge variant="default" className="flex items-center gap-1 bg-slate-900 border-white/10 text-cyan-300 font-bold py-1 px-3">
            <Clock className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
            <span>{Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}</span>
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-bangla">
            <span className="truncate max-w-[65%] font-medium text-slate-300">{examName}</span>
            <span className="font-semibold text-cyan-300">{answeredCount}/{totalQuestions} উত্তর দিয়েছেন</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-900/60 border border-white/5 max-h-[120px] overflow-y-auto">
          {questions.map((q, qi) => {
            const selected = selectedAnswers[q.id];
            const isCurrent = qi === currentQuestionIndex;
            const isMarked = markedQuestions[q.id];

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => scrollToQuestion(qi)}
                className={cn(
                  "h-11 w-11 rounded-xl text-xs font-bold border transition-all duration-200 active:scale-90 shrink-0",
                  isCurrent && "border-cyan-400 bg-cyan-500/25 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]",
                  !isCurrent && isMarked && "border-yellow-500 bg-yellow-500/10 text-yellow-300",
                  !isCurrent && selected && !isMarked && "border-purple-500/40 bg-purple-500/15 text-purple-200",
                  !isCurrent && !selected && !isMarked && "border-white/5 bg-white/5 text-slate-500 hover:border-white/10"
                )}
              >
                {qi + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* All questions — vertical scroll */}
      <div className="space-y-5">
        {questions.map((q, qi) => (
          <Card
            key={q.id}
            id={`quiz-q-${qi}`}
            variant="glass"
            className={cn(
              "p-5 sm:p-6 space-y-4 bg-slate-900/40 border-white/10 scroll-mt-36 transition-colors",
              qi === currentQuestionIndex && "border-cyan-500/20 ring-1 ring-cyan-500/10"
            )}
          >
            <div className="flex justify-between items-center text-xs text-slate-400 border-b border-white/5 pb-3">
              <span className="font-bold text-slate-300">প্রশ্ন {qi + 1}/{totalQuestions}</span>
              <button
                type="button"
                onClick={() => markQuestion(q.id)}
                className={cn(
                  "px-3 py-2 rounded-full text-xs font-bold border tracking-wider transition-all min-h-[44px]",
                  markedQuestions[q.id]
                    ? "border-yellow-500 bg-yellow-500/10 text-yellow-300"
                    : "border-white/5 bg-white/5 text-slate-400 hover:border-white/10"
                )}
              >
                {markedQuestions[q.id] ? "রিভিউ চিহ্নিত" : "রিভিউ মার্ক"}
              </button>
            </div>

            <FormattedQuizText
              text={q.text}
              className="text-base sm:text-lg"
              hideWorkedSolution={!showWorkedSolution}
            />

            <div className="space-y-3">
              {q.options.map((opt, oi) => {
                const isSelected = selectedAnswers[q.id] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => selectAnswer(q.id, opt)}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all duration-300 min-h-[52px] flex items-center justify-between font-bangla group active:scale-[0.99]",
                      isSelected
                        ? "border-purple-glow bg-purple-glow/10 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                        : "border-slate-800/80 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex items-center justify-center h-6 w-6 rounded-lg font-bold text-xs border transition-colors",
                          isSelected
                            ? "bg-purple-600 text-white border-transparent"
                            : "bg-slate-900 text-slate-400 border-white/5 group-hover:border-white/10"
                        )}
                      >
                        {BANGLA_OPTS[oi]}
                      </span>
                      <FormattedQuizText
                        text={opt}
                        inline
                        className="text-sm md:text-base leading-relaxed flex-1"
                      />
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-purple-400" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* Sticky submit footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#07111F]/95 backdrop-blur-md px-4 py-4 pb-safe">
        <div className="max-w-3xl mx-auto space-y-3">
          {confirmSubmit && (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-200 font-bangla flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">আপনি কি নিশ্চিতভাবে পরীক্ষাটি সাবমিট করতে চান?</p>
                {answeredCount < totalQuestions && (
                  <p className="text-xs text-amber-400 mt-1">
                    ({totalQuestions - answeredCount}টি প্রশ্ন বাকি আছে)
                  </p>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400 hidden sm:block">
              স্ক্রল করে সব প্রশ্ন দেখুন · নম্বরে ক্লিক করে যেকোনো প্রশ্নে যান
            </p>
            <Button
              onClick={() => {
                if (isSubmitting || quizSubmitted) return;
                if (confirmSubmit) {
                  handleManualSubmit();
                } else {
                  setConfirmSubmit(true);
                }
              }}
              disabled={isSubmitting || isLoading || quizSubmitted}
              className="rounded-xl min-h-[48px] min-w-[140px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting || isLoading
                ? "জমা হচ্ছে..."
                : confirmSubmit
                  ? "নিশ্চিত জমা দাও"
                  : "জমা দাও"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
