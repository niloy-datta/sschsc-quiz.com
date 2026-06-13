"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Share2,
  X,
  XCircle,
  MinusCircle,
  Lightbulb,
  Trophy,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { FormattedQuizText } from "@/lib/format-quiz-text";

type ReviewQuestion = {
  id: string;
  text: string;
  options: string[];
  chapter?: string;
};

type AnswerMeta = {
  answerIndex: number;
  explanation: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  examId: string;
  examName: string;
  userAnswers: string;
  questionsPath?: string;
  userElo?: number;
};

const BANGLA_OPTS = ["ক", "খ", "গ", "ঘ"] as const;

function parseAnswerIndexes(raw: string): number[] {
  if (!raw.trim()) return [];
  return raw.split(",").map((part) => {
    const n = parseInt(part.trim(), 10);
    return Number.isNaN(n) ? -1 : n;
  });
}

export function DetailedReviewModal({
  open,
  onClose,
  examId,
  examName,
  userAnswers,
  questionsPath,
  userElo = 1200,
}: Props) {
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [meta, setMeta] = useState<Record<string, AnswerMeta>>({});
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const path = questionsPath || examId;
  const answerIndexes = useMemo(() => parseAnswerIndexes(userAnswers), [userAnswers]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [questionsRes, metaRes] = await Promise.all([
          fetch(`/questions/${path}.json`, { cache: "force-cache" }),
          api.get<{ answers: Record<string, AnswerMeta> }>(
            `/api/quiz/review-meta?questionsPath=${encodeURIComponent(path)}`,
          ),
        ]);

        if (!questionsRes.ok) {
          throw new Error("Question set not found on CDN");
        }

        const questionData = (await questionsRes.json()) as ReviewQuestion[];
        if (cancelled) return;

        setQuestions(Array.isArray(questionData) ? questionData : []);
        setMeta(metaRes.answers || {});
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "রিভিউ লোড করতে ব্যর্থ হয়েছে",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, path]);

  const stats = useMemo(
    () =>
      questions.reduce(
        (acc, q, idx) => {
          const userIdx = answerIndexes[idx] ?? -1;
          const correctIdx = meta[q.id]?.answerIndex ?? -1;
          if (userIdx === -1) acc.skipped += 1;
          else if (userIdx === correctIdx) acc.correct += 1;
          else acc.wrong += 1;
          return acc;
        },
        { correct: 0, wrong: 0, skipped: 0 },
      ),
    [questions, answerIndexes, meta],
  );

  const accuracy =
    stats.correct + stats.wrong > 0
      ? Math.round((stats.correct / (stats.correct + stats.wrong)) * 100)
      : 0;

  const handleShare = async () => {
    if (!shareCardRef.current) return;
    setSharing(true);
    try {
      const mod = await import("html-to-image");
      const dataUrl = await mod.toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#07111F",
      });
      const link = document.createElement("a");
      link.download = `quiz-battle-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setError("Screenshot তৈরি করতে ব্যর্থ হয়েছে");
    } finally {
      setSharing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center font-bangla">
      <div
        className="absolute inset-0 bg-[#030712]/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        className={cn(
          "relative w-full sm:max-w-3xl max-h-[92vh] overflow-hidden",
          "rounded-t-3xl sm:rounded-3xl border border-purple-glow/20",
          "bg-gradient-to-b from-[#0a1628]/98 to-[#070b14]/98",
          "shadow-[0_0_80px_rgba(168,85,247,0.15)]",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-title"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 bg-[#0a1628]/90 backdrop-blur-xl">
          <div className="min-w-0">
            <h2 id="review-title" className="text-lg font-bold text-white truncate">
              {examName}
            </h2>
            <p className="text-xs text-slate-400 truncate">{examId}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!loading && !error && (
              <Button
                variant="secondary"
                size="sm"
                className="min-h-[36px] hidden sm:flex"
                onClick={handleShare}
                disabled={sharing}
              >
                {sharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-1" />
                    Share Performance
                  </>
                )}
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:border-cyan-400/30 transition-colors"
              aria-label="Close review"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(92vh-72px)] px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
              <p className="text-slate-400 text-sm">উত্তর রিভিউ লোড হচ্ছে...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <XCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
              <p className="text-red-300 text-sm">{error}</p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={onClose}>
                বন্ধ করুন
              </Button>
            </div>
          ) : (
            <>
              {/* Shareable performance card */}
              <div
                ref={shareCardRef}
                className="rounded-2xl border border-cyan-400/25 p-5 bg-gradient-to-br from-[#0c1628] via-[#0a1020] to-[#150a24] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_55%)] pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/80 mb-1">
                      Quiz Battle Result
                    </p>
                    <h3 className="text-lg font-black text-white">{examName}</h3>
                    <p className="text-xs text-slate-400 mt-1">{accuracy}% accuracy</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 uppercase">Score</p>
                      <p className="text-2xl font-black text-white font-outfit">
                        {stats.correct}/{questions.length}
                      </p>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 uppercase flex items-center gap-1 justify-center">
                        <Trophy className="h-3 w-3 text-amber-400" /> ELO
                      </p>
                      <p className="text-2xl font-black text-cyan-400 font-outfit">{userElo}</p>
                    </div>
                  </div>
                </div>
                <div className="relative grid grid-cols-3 gap-2 mt-4">
                  <StatPill label="Correct" value={stats.correct} tone="green" />
                  <StatPill label="Wrong" value={stats.wrong} tone="red" />
                  <StatPill label="Skipped" value={stats.skipped} tone="slate" />
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                fullWidth
                className="min-h-[40px] sm:hidden"
                onClick={handleShare}
                disabled={sharing}
              >
                {sharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-1" />
                    Share Performance
                  </>
                )}
              </Button>

              {questions.map((q, idx) => {
                const userIdx = answerIndexes[idx] ?? -1;
                const correctIdx = meta[q.id]?.answerIndex ?? -1;
                const explanation = meta[q.id]?.explanation || "";
                const isSkipped = userIdx === -1;
                const isCorrect = !isSkipped && userIdx === correctIdx;
                const isWrong = !isSkipped && userIdx !== correctIdx;

                return (
                  <div
                    key={q.id}
                    className={cn(
                      "rounded-2xl border p-4 transition-all",
                      isCorrect && "border-green-500/30 bg-green-500/5",
                      isWrong && "border-red-500/30 bg-red-500/5",
                      isSkipped && "border-slate-500/20 bg-white/[0.02]",
                    )}
                  >
                    <div className="flex items-start gap-2 mb-3">
                      <span className="text-xs font-bold text-cyan-400/80 shrink-0 mt-0.5">
                        Q{idx + 1}
                      </span>
                      <div className="text-sm text-white leading-relaxed flex-1">
                        <FormattedQuizText text={q.text} hideWorkedSolution={false} />
                      </div>
                      {isCorrect && <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />}
                      {isWrong && <XCircle className="h-5 w-5 text-red-400 shrink-0" />}
                      {isSkipped && <MinusCircle className="h-5 w-5 text-slate-400 shrink-0" />}
                    </div>

                    <div className="grid gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isAnswer = optIdx === correctIdx;
                        const isUserPick = optIdx === userIdx;
                        return (
                          <div
                            key={`${q.id}-${optIdx}`}
                            className={cn(
                              "rounded-xl px-3 py-2.5 text-sm border flex items-center gap-2",
                              isAnswer &&
                                "border-green-400/50 bg-green-500/15 text-green-100 shadow-[0_0_16px_rgba(34,197,94,0.12)]",
                              isUserPick &&
                                !isAnswer &&
                                "border-red-400/40 bg-red-500/15 text-red-100",
                              !isAnswer &&
                                !isUserPick &&
                                "border-white/5 bg-white/[0.02] text-slate-300",
                            )}
                          >
                            <span className="text-xs font-bold opacity-70 w-4">
                              {BANGLA_OPTS[optIdx] || String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1">
                              <FormattedQuizText text={opt} inline />
                            </span>
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

                    {explanation && (
                      <div className="mt-3 flex gap-2 rounded-xl bg-cyan-500/5 border border-cyan-400/15 px-3 py-2.5">
                        <Lightbulb className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                        <FormattedQuizText
                          text={explanation}
                          className="text-xs text-slate-300 flex-1"
                          hideWorkedSolution={false}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "red" | "slate";
}) {
  const tones = {
    green: "border-green-500/25 bg-green-500/10 text-green-300",
    red: "border-red-500/25 bg-red-500/10 text-red-300",
    slate: "border-slate-500/25 bg-slate-500/10 text-slate-300",
  };
  return (
    <div className={cn("rounded-xl border px-3 py-2 text-center", tones[tone])}>
      <p className="text-[10px] uppercase opacity-80">{label}</p>
      <p className="text-lg font-black font-outfit">{value}</p>
    </div>
  );
}
