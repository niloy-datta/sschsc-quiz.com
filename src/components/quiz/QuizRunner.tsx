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
import { QuizQuestionStem } from "@/components/quiz/QuizQuestionStem";
import { QuizOptionText } from "@/components/quiz/QuizOptionText";
import { QuizResultShareCard, type ShareCardData } from "@/components/quiz/QuizResultShareCard";
import { QuizErrorBoundary } from "@/components/quiz/QuizErrorBoundary";
import {
  ArrowLeft,
  AlertCircle,
  Award,
  BookOpen,
  RotateCcw,
  Layout,
  Check,
  TrendingUp,
  Lightbulb,
  Loader2,
  Share2,
  X,
} from "lucide-react";

const OPTIONS = ["A", "B", "C", "D"] as const;
const BANGLA_OPTS = ["ক", "খ", "গ", "ঘ"] as const;

function extractOptionText(raw: unknown): string {
  if (typeof raw === "string") return raw.trim();
  if (raw && typeof raw === "object") {
    const rec = raw as Record<string, unknown>;
    if (typeof rec.text === "string") return rec.text.trim();
    if (typeof rec.label === "string" && typeof rec.value === "string") {
      return rec.value.trim();
    }
  }
  return String(raw ?? "").trim();
}

function buildOptionList(q: QuizRunnerQuestion): string[] {
  let options: string[] = [];

  if (Array.isArray(q.options)) {
    options = (q.options as unknown[]).map(extractOptionText);
  } else {
    options = [q.optionA, q.optionB, q.optionC, q.optionD].map((o) =>
      extractOptionText(o),
    );
  }

  return options.slice(0, 4).map((opt) => opt.trim());
}

function mapToStoreQuestion(
  q: QuizRunnerQuestion,
  meta?: QuizSubmitMeta,
): Question {
  const options = buildOptionList(q);
  const filledCount = options.filter(Boolean).length;

  return {
    id: String(q.id ?? ""),
    subject: meta?.subject || String(q.subject ?? ""),
    chapter: meta?.chapterName || String(q.chapter ?? ""),
    text: String(q.questionText ?? q.text ?? q.question ?? ""),
    options: filledCount > 0 ? options : [],
    image: (q.image as string | null) ?? null,
    optionImages: Array.isArray(q.optionImages)
      ? (q.optionImages as string[]).slice(0, 4)
      : null,
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

/** Runtime shape for questions passed into the runner */
export interface QuizRunnerQuestion {
  id?: string;
  questionText?: string;
  text?: string;
  question?: string;
  options?: string[] | Array<{ text?: string; label?: string; value?: string }>;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  image?: string | null;
  optionImages?: (string | null)[] | null;
  timeLimit?: number;
  subject?: string;
  chapter?: string;
}

type Props = {
  questions: QuizRunnerQuestion[];
  examSlug: string;
  examName: string;
  backUrl: string;
  onBack?: () => void;
  timeLimitSec?: number;
  quizSubmitMeta?: QuizSubmitMeta;
  /** Show embedded worked solutions in question stems (board / review-style content) */
  showWorkedSolution?: boolean;
};

/** @private — use exported `QuizRunner` which includes Error Boundary wrapper */
function QuizRunnerRaw({
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [flashOption, setFlashOption] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollSpyRef = useRef<IntersectionObserver | null>(null);

  const mappedQuestions = useMemo(() => {
    if (!rawQuestions?.length) return [];
    return rawQuestions
      .map((q) => mapToStoreQuestion(q, quizSubmitMeta))
      .filter((q) => q.text && q.options.filter(Boolean).length >= 2);
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

  // Keyboard shortcuts for quiz navigation
  useEffect(() => {
    if (quizSubmitted || !quizStarted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key >= "1" && e.key <= "4") {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        const currentQ = questions[currentQuestionIndex];
        if (currentQ && currentQ.options[idx]) {
          setFlashOption(currentQ.id);
          setTimeout(() => setFlashOption(null), 300);
          selectAnswer(currentQ.id, currentQ.options[idx]);
        }
        return;
      }

      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        if (currentQuestionIndex > 0) {
          scrollToQuestion(currentQuestionIndex - 1);
        }
        return;
      }

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        if (currentQuestionIndex < questions.length - 1) {
          scrollToQuestion(currentQuestionIndex + 1);
        }
        return;
      }

      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        const currentQ = questions[currentQuestionIndex];
        if (currentQ) markQuestion(currentQ.id);
        return;
      }

      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        const currentQ = questions[currentQuestionIndex];
        if (currentQ) skipQuestion(currentQ.id);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quizStarted, quizSubmitted, questions, currentQuestionIndex, selectAnswer, markQuestion, skipQuestion]);

  const scrollToQuestion = (qi: number) => {
    setQuestionIndex(qi);
    document.getElementById(`quiz-q-${qi}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Confetti effect
  useEffect(() => {
    if (quizSubmitted && results && !showConfetti) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [quizSubmitted, results]);

  // === Hoisted before early returns to preserve hook order ===
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPct = totalQuestions
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0;

  const confettiColors = [
    "#8B5CF6", "#22D3EE", "#FACC15", "#22C55E",
    "#EF4444", "#F97316", "#A78BFA", "#34D399",
    "#F472B6", "#60A5FA",
  ];

  const confettiPieces = useMemo(() => {
    if (!showConfetti) return [];
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: confettiColors[i % confettiColors.length],
      delay: Math.random() * 0.5,
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
    }));
  }, [showConfetti]);

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

  // Circular Timer SVG Ring
  const timerRadius = 18;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerProgress = timeLimitSec > 0 ? timer / timeLimitSec : 0;
  const timerOffset = timerCircumference * (1 - timerProgress);
  
  const timerColor =
    timerProgress > 0.5
      ? "#22c55e"
      : timerProgress > 0.25
        ? "#eab308"
        : "#ef4444";

  const getTimerBgColor = () => {
    if (timerProgress > 0.5) return "rgba(34,197,94,0.15)";
    if (timerProgress > 0.25) return "rgba(234,179,8,0.15)";
    return "rgba(239,68,68,0.15)";
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

  // Results Screen Rendering
  if (quizSubmitted && results) {
    const durationMin = Math.floor(timeTaken / 60);
    const durationSec = timeTaken % 60;
    const accuracyRadius = 40;
    const accuracyCircumference = 2 * Math.PI * accuracyRadius;
    const accuracyOffset = accuracyCircumference * (1 - results.accuracy / 100);

    return (
      <>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {confettiPieces.map((p) => (
              <div
                key={p.id}
                className="confetti-piece"
                style={{
                  left: `${p.left}%`,
                  backgroundColor: p.color,
                  width: p.size,
                  height: p.size * 0.6,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                  borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                }}
              />
            ))}
          </div>
        )}
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
                      <QuizQuestionStem text={q.text} image={q.image} hideWorkedSolution={false} />
                      
                      <div className="grid gap-2 text-sm">
                        {q.options.map((opt, oi) => {
                          const correctIdx = results.correctAnswerIndexes?.[q.id] ?? -1;
                          const isAnswer = oi === correctIdx;
                          const isUserPick = oi === selectedIdx;
                          return (
                            <div
                              key={`${q.id}-review-opt-${oi}`}
                              className={cn(
                                "rounded-xl px-4 py-2.5 border transition-all flex items-center justify-between",
                                isAnswer &&
                                  "border-green-400/50 bg-green-500/15 text-green-100 shadow-[0_0_16px_rgba(34,197,94,0.12)]",
                                isUserPick &&
                                  !isAnswer &&
                                  "border-red-400/40 bg-red-500/15 text-red-100",
                                !isAnswer &&
                                  !isUserPick &&
                                  "border-white/5 bg-white/5 text-slate-300"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-400">{BANGLA_OPTS[oi]}.</span>
                                <QuizOptionText
                                  text={opt}
                                  questionText={q.text}
                                  optionImage={q.optionImages?.[oi] ?? null}
                                />
                              </div>
                              {isAnswer && (
                                <span className="text-[10px] uppercase tracking-wide text-green-300 font-bold shrink-0">
                                  Correct
                                </span>
                              )}
                              {isUserPick && !isAnswer && (
                                <span className="text-[10px] uppercase tracking-wide text-red-300 font-bold shrink-0">
                                  Your pick
                                </span>
                              )}
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
                            mode="explanation"
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
            {/* Accuracy Circular Gauge */}
            <div className="flex justify-center py-4">
              <div className="relative">
                <svg width="120" height="120" className="count-up count-up-delay-1">
                  {/* BG ring */}
                  <circle
                    cx="60"
                    cy="60"
                    r={accuracyRadius}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="8"
                  />
                  {/* Progress ring */}
                  <circle
                    cx="60"
                    cy="60"
                    r={accuracyRadius}
                    fill="none"
                    stroke={
                      results.accuracy >= 80
                        ? "#22c55e"
                        : results.accuracy >= 50
                          ? "#eab308"
                          : "#ef4444"
                    }
                    strokeWidth="8"
                    strokeLinecap="round"
                    className="accuracy-ring"
                    strokeDasharray={accuracyCircumference}
                    strokeDashoffset={accuracyOffset}
                    transform="rotate(-90 60 60)"
                  />
                  {/* Center text */}
                  <text
                    x="60"
                    y="50"
                    textAnchor="middle"
                    className="font-bold text-2xl"
                    fill={
                      results.accuracy >= 80
                        ? "#22c55e"
                        : results.accuracy >= 50
                          ? "#eab308"
                          : "#ef4444"
                    }
                  >
                    {results.accuracy}%
                  </text>
                  <text
                    x="60"
                    y="70"
                    textAnchor="middle"
                    className="text-xs"
                    fill="#94a3b8"
                  >
                    সঠিকতা
                  </text>
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="count-up count-up-delay-1 rounded-2xl bg-purple-500/5 border border-purple-500/10 p-4 hover:bg-purple-500/10 transition-colors">
                <p className="text-xs text-slate-400 mb-1">মোট স্কোর</p>
                <p className="text-2xl font-black text-purple-300">{results.totalScore}/{totalQuestions}</p>
              </div>
              <div className="count-up count-up-delay-2 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-4 hover:bg-emerald-500/10 transition-colors">
                <p className="text-xs text-slate-400 mb-1">সঠিক উত্তর</p>
                <p className="text-2xl font-black text-emerald-400">{results.correctCount}</p>
              </div>
              <div className="count-up count-up-delay-3 rounded-2xl bg-red-500/5 border border-red-500/10 p-4 hover:bg-red-500/10 transition-colors">
                <p className="text-xs text-slate-400 mb-1">ভুল উত্তর</p>
                <p className="text-2xl font-black text-red-400">{results.wrongCount}</p>
              </div>
              <div className="count-up count-up-delay-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/10 p-4 hover:bg-yellow-500/10 transition-colors">
                <p className="text-xs text-slate-400 mb-1">ইলো রেটিং পরিবর্তন</p>
                <div className="flex items-center justify-center gap-1 font-black text-2xl text-yellow-400">
                  <TrendingUp className="h-5 w-5" />
                  <span>{results.eloRatingChange >= 0 ? `+${results.eloRatingChange}` : results.eloRatingChange}</span>
                </div>
              </div>
            </div>

            {/* Progress/Performance Gauges */}
            <div className="grid md:grid-cols-2 gap-6 pt-2 text-left count-up count-up-delay-5">
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

              {/* Share Result button */}
            <div className="flex justify-center pt-2">
              <Button
                onClick={() => setShowShareCard(true)}
                className="flex items-center gap-2 min-h-[44px] bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
              >
                <Share2 className="h-4 w-4" />
                ফলাফল শেয়ার করুন
              </Button>
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

      {/* Share Card Modal */}
      {showShareCard && results && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#030712]/90 backdrop-blur-sm"
            onClick={() => setShowShareCard(false)}
            aria-hidden
          />
          <div className="relative max-h-[95vh] overflow-y-auto rounded-3xl bg-[#0a1628]/95 border border-white/10 p-4 sm:p-6 shadow-[0_0_80px_rgba(168,85,247,0.15)] max-w-[520px] w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">🎴 আপনার রেজাল্ট কার্ড</h3>
              <button
                type="button"
                onClick={() => setShowShareCard(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <QuizResultShareCard
              data={{
                examName,
                subject: quizSubmitMeta?.subject || "",
                chapter: quizSubmitMeta?.chapterName || undefined,
                level: quizSubmitMeta?.level || undefined,
                totalQuestions,
                correctCount: results.correctCount,
                wrongCount: results.wrongCount,
                skippedCount: results.skippedCount,
                accuracy: results.accuracy,
                eloRating: (user?.elo as number) ?? 1200,
                eloChange: results.eloRatingChange,
                timeTaken,
                collegeName: user?.collegeName || user?.schoolName || undefined,
                studentName: user?.name || undefined,
              }}
            />
          </div>
        </div>
      )}

      {/* Keyboard shortcut hint */}
      <div className="fixed bottom-20 left-4 z-50 hidden lg:block opacity-30 hover:opacity-100 transition-opacity">
        <div className="bg-slate-900/80 backdrop-blur border border-white/5 rounded-xl px-3 py-2 text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
          <kbd className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded bg-slate-800 text-slate-400 text-[9px]">1</kbd>
          <kbd className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded bg-slate-800 text-slate-400 text-[9px]">2</kbd>
          <kbd className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded bg-slate-800 text-slate-400 text-[9px]">3</kbd>
          <kbd className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded bg-slate-800 text-slate-400 text-[9px]">4</kbd>
          <span>উত্তর</span>
          <span className="text-slate-600">|</span>
          <kbd className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded bg-slate-800 text-slate-400 text-[9px]">←</kbd>
          <kbd className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded bg-slate-800 text-slate-400 text-[9px]">→</kbd>
          <span>নেভি</span>
          <span className="text-slate-600">|</span>
          <kbd className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded bg-slate-800 text-slate-400 text-[9px]">M</kbd>
          <span>মার্ক</span>
        </div>
      </div>
    </>
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
          <div className="relative flex items-center gap-2">
            <svg
              width="48"
              height="48"
              className="shrink-0 glow-ring"
              style={{ filter: `drop-shadow(0 0 6px ${timerColor}40)` }}
            >
              {/* BG ring */}
              <circle
                cx="24"
                cy="24"
                r={timerRadius}
                fill="none"
                stroke={getTimerBgColor()}
                strokeWidth="3.5"
              />
              {/* Progress ring */}
              <circle
                cx="24"
                cy="24"
                r={timerRadius}
                fill="none"
                stroke={timerColor}
                strokeWidth="3.5"
                strokeLinecap="round"
                className="timer-ring"
                strokeDasharray={timerCircumference}
                strokeDashoffset={timerOffset}
                transform="rotate(-90 24 24)"
              />
            </svg>
            <span
              className="font-bold text-sm tabular-nums min-w-[3.5rem]"
              style={{ color: timerColor }}
            >
              {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
            </span>
          </div>
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

        <div className="flex gap-2 items-center">
          <div className="flex flex-wrap gap-1.5 flex-1 p-2.5 rounded-2xl bg-slate-900/60 border border-white/5 max-h-[132px] overflow-y-auto">
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
                    "relative h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold border transition-all duration-150 active:scale-90 shrink-0 flex items-center justify-center",
                    isCurrent && "border-cyan-400 bg-cyan-500/25 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]",
                    !isCurrent && isMarked && selected && "border-yellow-500/60 bg-yellow-500/10 text-yellow-300",
                    !isCurrent && isMarked && !selected && "border-yellow-500/40 bg-yellow-500/8 text-yellow-300/70",
                    !isCurrent && !isMarked && selected && "border-purple-500/40 bg-purple-500/15 text-purple-200",
                    !isCurrent && !selected && !isMarked && "border-white/5 bg-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300"
                  )}
                >
                  {qi + 1}
                  {/* Status dot indicator */}
                  <span
                    className={cn(
                      "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-1 ring-slate-900",
                      selected && isMarked && "bg-yellow-400",
                      selected && !isMarked && "bg-purple-400",
                      !selected && isMarked && "bg-yellow-400/60",
                      !selected && !isMarked && "hidden"
                    )}
                  />
                </button>
              );
            })}
          </div>
          {/* Legend */}
          <div className="hidden sm:flex flex-col gap-1.5 text-[10px] text-slate-500 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-400" />
              <span>উত্তর</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-yellow-400/70" />
              <span>মার্ক</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400 ring-1 ring-cyan-400/50" />
              <span>বর্তমান</span>
            </div>
          </div>
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
              <span className="flex items-center gap-2 font-bold text-slate-300">
                <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-black">
                  {qi + 1}
                </span>
                <span>/ {totalQuestions}</span>
              </span>
              <button
                type="button"
                onClick={() => markQuestion(q.id)}
                className={cn(
                  "px-3 py-2 rounded-full text-xs font-bold border tracking-wider transition-all min-h-[44px] flex items-center gap-1.5 group",
                  markedQuestions[q.id]
                    ? "border-yellow-500 bg-yellow-500/10 text-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.15)]"
                    : "border-white/5 bg-white/5 text-slate-400 hover:border-yellow-500/30 hover:text-yellow-300/70"
                )}
              >
                <svg
                  className={cn(
                    "h-3.5 w-3.5 transition-all",
                    markedQuestions[q.id] ? "text-yellow-400 fill-yellow-400/30" : "text-slate-500 fill-none"
                  )}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                {markedQuestions[q.id] ? "রিভিউ চিহ্নিত" : "রিভিউ মার্ক"}
              </button>
            </div>

            <QuizQuestionStem
              text={q.text}
              image={q.image}
              className="text-base sm:text-lg"
              hideWorkedSolution={!showWorkedSolution}
            />

            <div className="space-y-3">
              {q.options.map((opt, oi) => {
                const isSelected = selectedAnswers[q.id] === opt;
                return (
                  <button
                    key={`${q.id}-opt-${oi}`}
                    type="button"
                    onClick={() => {
                      selectAnswer(q.id, opt);
                      setFlashOption(q.id);
                      setTimeout(() => setFlashOption(null), 300);
                    }}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all duration-200 min-h-[52px] flex items-center justify-between font-bangla group",
                      isSelected
                        ? "border-purple-glow bg-purple-glow/10 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                        : "border-slate-800/80 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:text-white hover:bg-slate-900/40 hover:shadow-[0_0_12px_rgba(99,102,241,0.06)]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex items-center justify-center h-7 w-7 rounded-xl font-bold text-xs border transition-all duration-200",
                          isSelected
                            ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white border-transparent shadow-[0_0_8px_rgba(139,92,246,0.3)] "
                            : "bg-slate-900 text-slate-400 border-white/5 group-hover:border-white/10 group-hover:text-slate-200"
                        )}
                      >
                        {BANGLA_OPTS[oi]}
                      </span>
                      <QuizOptionText
                        text={opt}
                        questionText={q.text}
                        optionImage={q.optionImages?.[oi] ?? null}
                      />
                    </div>
                    {isSelected && (
                      <div className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center shrink-0 scale-pulse",
                        "bg-purple-500/20 border-2 border-purple-400/50"
                      )}>
                        <Check className="h-3.5 w-3.5 text-purple-400" />
                      </div>
                    )}
                    {/* Keyboard shortcut hint */}
                    {!isSelected && (
                      <span className="text-[10px] text-slate-600 group-hover:text-slate-500 font-mono shrink-0 transition-colors">
                        {oi + 1}
                      </span>
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
            <p className="text-xs text-slate-400 hidden sm:flex items-center gap-2">
              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">1-4</span>
              উত্তর
              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">← →</span>
              নেভিগেট
              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">M</span>
              মার্ক
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

export function QuizRunner(props: Props) {
  return (
    <QuizErrorBoundary>
      <QuizRunnerRaw {...props} />
    </QuizErrorBoundary>
  );
}






