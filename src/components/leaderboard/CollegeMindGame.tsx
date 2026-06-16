"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  type CollegeWarEntry,
  type LeaderboardEntry,
  formatBnNumber,
  getInitials,
} from "@/lib/leaderboard-api";
import { FormattedQuizText } from "@/lib/format-quiz-text";
import { type StudentLevel } from "@/lib/profile-utils";
import {
  Brain,
  Building2,
  Check,
  ChevronRight,
  Crown,
  Heart,
  Loader2,
  Swords,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────

interface Question {
  id: string;
  text: string;
  options: string[];
}

type GamePhase =
  | "select-a"     // Pick your college
  | "select-b"     // Pick opponent college
  | "countdown"    // 3-2-1 GO!
  | "playing"      // Answering questions
  | "result";      // Show winner

interface AnswerResult {
  questionId: string;
  correctIndex: number;
  playerChoice: number | null;
  opponentChoice: number | null;
  playerCorrect: boolean;
  opponentCorrect: boolean;
}

// ─── Sub-components ─────────────────────────

function CountdownOverlay({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(3);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const t = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(t);
          setTimeout(onDone, 200);
          return 0;
        }
        return c - 1;
      });
    }, 800);
    return () => clearInterval(t);
  }, [onDone]);

  const labels = ["প্রস্তুত?", "৩", "২", "১", "GO! ଗୋ!"];
  const label = labels[count] || "GO!";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07111F]/95 backdrop-blur-sm">
      <div className="text-center animate-fadeIn">
        <p className="text-8xl font-black text-white animate-pulseGlow">
          {label}
        </p>
        {count > 0 && count <= 3 && (
          <p className="mt-4 text-lg text-slate-400 font-bangla">
            মাইন্ড গেম শুরু হতে চলেছে...
          </p>
        )}
      </div>
    </div>
  );
}

function GameProgressBar({
  current,
  total,
  playerScore,
  opponentScore,
}: {
  current: number;
  total: number;
  playerScore: number;
  opponentScore: number;
}) {
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-purple-300 font-bold">
          <Brain className="h-3.5 w-3.5" />
          তুমি: {playerScore}
        </span>
        <span className="text-slate-500">
          {formatBnNumber(current + 1)} / {formatBnNumber(total)}
        </span>
        <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
          প্রতিপক্ষ: {opponentScore}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function OpponentAvatar({
  college,
  side,
}: {
  college: CollegeWarEntry;
  side: "left" | "right";
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl border-2",
          side === "left"
            ? "border-purple-500/40 bg-purple-500/15"
            : "border-cyan-500/40 bg-cyan-500/15",
        )}
      >
        <Building2
          className={cn(
            "h-7 w-7",
            side === "left" ? "text-purple-400" : "text-cyan-400",
          )}
        />
      </div>
      <p className="text-xs font-bold text-slate-300 text-center leading-tight max-w-[100px] truncate">
        {college.name}
      </p>
    </div>
  );
}

function ResultCard({
  q,
  result,
  qi,
}: {
  q: Question;
  result: AnswerResult;
  qi: number;
}) {
  const isPlayerRight = result.playerCorrect;
  const isOpponentRight = result.opponentCorrect;
  const isBothRight = isPlayerRight && isOpponentRight;
  const isBothWrong = !isPlayerRight && !isOpponentRight;
  const isPlayerOnly = isPlayerRight && !isOpponentRight;
  const isOpponentOnly = !isPlayerRight && isOpponentRight;

  return (
    <Card
      variant="glass"
      className={cn(
        "p-4 space-y-3 border",
        isBothRight && "border-emerald-500/30",
        isBothWrong && "border-red-500/20",
        isPlayerOnly && "border-purple-500/30",
        isOpponentOnly && "border-cyan-500/30",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          প্রশ্ন {formatBnNumber(qi + 1)}
        </span>
        <div className="flex items-center gap-2">
          {isBothRight && (
            <Badge variant="success" className="text-[9px]">উভয়েই সঠিক</Badge>
          )}
          {isPlayerOnly && (
            <Badge variant="default" className="bg-purple-500/15 text-purple-300 border-purple-500/30 text-[9px]">শুধু তুমি</Badge>
          )}
          {isOpponentOnly && (
            <Badge variant="default" className="bg-cyan-500/15 text-cyan-300 border-cyan-500/30 text-[9px]">শুধু প্রতিপক্ষ</Badge>
          )}
          {isBothWrong && (
            <Badge variant="warning" className="text-[9px]">উভয়েই ভুল</Badge>
          )}
        </div>
      </div>

      <FormattedQuizText text={q.text} className="text-sm" />

      <div className="grid gap-1.5">
        {q.options.map((opt, oi) => {
          const isCorrect = oi === result.correctIndex;
          const playerPicked = oi === result.playerChoice;
          const opponentPicked = oi === result.opponentChoice;

          return (
            <div
              key={oi}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2 text-xs border",
                isCorrect && "border-emerald-400/30 bg-emerald-500/10",
                !isCorrect && playerPicked && "border-red-400/30 bg-red-500/10",
                !isCorrect && !playerPicked && !opponentPicked && "border-white/5 bg-white/[0.02]",
              )}
            >
              <span className="flex items-center gap-2">
                <span className="font-bold text-slate-500">{"কখগঘ"[oi]}.</span>
                <FormattedQuizText text={opt} inline className="text-slate-300" />
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {playerPicked && (
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", isCorrect ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300")}>
                    তুমি
                  </span>
                )}
                {opponentPicked && (
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", isCorrect ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300")}>
                    প্রতিপক্ষ
                  </span>
                )}
                {isCorrect && <Check className="h-3.5 w-3.5 text-emerald-400" />}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Main Component ─────────────────────────

export function CollegeMindGame({
  colleges,
  entries,
  level = "ssc",
  onExit,
}: {
  colleges: CollegeWarEntry[];
  entries: LeaderboardEntry[];
  level?: StudentLevel;
  onExit: () => void;
}) {
  const isSchool = level === "ssc";
  // ── State ──
  const [phase, setPhase] = useState<GamePhase>("select-a");
  const [myCollege, setMyCollege] = useState<CollegeWarEntry | null>(null);
  const [opponentCollege, setOpponentCollege] = useState<CollegeWarEntry | null>(null);
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<AnswerResult[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [countdownDone, setCountdownDone] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const GAME_QUESTIONS = 10;

  // ── Filtered list ──
  const filteredColleges = useMemo(() => {
    return colleges.filter(
      (c) => c.name !== myCollege?.name && c.name !== opponentCollege?.name,
    );
  }, [colleges, myCollege, opponentCollege]);

  // ── Load questions from board files ──
  const loadQuestionsForGame = useCallback(async () => {
    setLoadingQuestions(true);
    const allQs: Question[] = [];

    // Try loading from multiple board files & chapter sets to get a good mix
    const pathsToTry = level === "ssc" ? [
      // SSC Physics chapter sets
      "/questions/physics/ssc-physics-chapter-01-model-test-01.json",
      "/questions/physics/ssc-physics-chapter-02-model-test-01.json",
      "/questions/physics/ssc-physics-chapter-03-model-test-01.json",
      "/questions/physics/ssc-physics-chapter-04-model-test-01.json",
      "/questions/physics/ssc-physics-chapter-05-model-test-01.json",
      // SSC Chemistry chapter sets
      "/questions/chemistry/ssc-chemistry-chapter-01-model-test-01.json",
      "/questions/chemistry/ssc-chemistry-chapter-02-model-test-01.json",
      // SSC Biology chapter sets
      "/questions/biology/ssc-biology-chapter-01-model-test-01.json",
      // Board questions (SSC Physics/Chemistry/Biology)
      "/questions/physics/barishal-2025.json",
      "/questions/physics/dhaka-2025.json",
      "/questions/chemistry/dhaka-2025.json",
    ] : [
      // HSC Biology 2nd paper chapter sets
      "/questions/biology-2nd-paper/hsc-biology-2nd-paper-chapter-01-high-priority-set-01.json",
      "/questions/biology-2nd-paper/hsc-biology-2nd-paper-chapter-08-high-priority-set-02.json",
      "/questions/biology-2nd-paper/hsc-biology-2nd-paper-chapter-10-high-priority-set-01.json",
      // HSC Physics 1st paper chapter sets
      "/questions/physics-1st-paper/hsc-physics-1st-paper-chapter-01-model-test-01.json",
      "/questions/physics-1st-paper/hsc-physics-1st-paper-chapter-02-model-test-01.json",
      "/questions/physics-1st-paper/hsc-physics-1st-paper-chapter-03-model-test-01.json",
      // HSC Chemistry chapter sets
      "/questions/chemistry-1st-paper/hsc-chemistry-1st-paper-chapter-01-high-priority-set-01.json",
      // HSC Board questions
      "/questions/chemistry-1st-paper/dhaka-2025.json",
      "/questions/biology-1st-paper/dhaka-2025.json",
      "/questions/physics-1st-paper/dhaka-2025.json",
    ];

    for (const p of pathsToTry) {
      if (allQs.length >= GAME_QUESTIONS) break;
      try {
        const res = await fetch(p);
        if (!res.ok) continue;
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.questions ?? [];
        for (const item of items) {
          if (allQs.length >= GAME_QUESTIONS) break;
          const text = item.text || item.questionText || item.question || "";
          const opts = item.options || [item.optionA, item.optionB, item.optionC, item.optionD].filter(Boolean);
          if (text && opts.length >= 2) {
            allQs.push({
              id: item.id || String(Math.random()),
              text,
              options: opts.slice(0, 4).map((o: unknown) => String(o).trim()),
            });
          }
        }
      } catch { /* skip */ }
    }

    // Shuffle for variety
    const shuffled = allQs.sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, Math.min(GAME_QUESTIONS, shuffled.length)));
    setLoadingQuestions(false);
  }, [myCollege, level]);

  useEffect(() => {
    if (phase === "countdown" && questions.length === 0) {
      loadQuestionsForGame();
    }
  }, [phase, questions.length, loadQuestionsForGame]);

  // ── Start countdown ──
  const startGame = () => {
    setPhase("countdown");
  };

  const handleCountdownDone = () => {
    setCountdownDone(true);
    setPhase("playing");
  };

  // ── Handle answer selection ──
  const handleAnswer = (optionIndex: number) => {
    if (selectedOption !== null || showResult || gameOver) return;
    setSelectedOption(optionIndex);

    const q = questions[currentQ];
    if (!q) return;

    // Determine correct answer (for simulation, use a hash-based deterministic approach
    // In a real app, this would come from answer keys)
    const correctIndex = Math.abs(hashCode(q.text)) % q.options.length;

    // Player answer
    const playerCorrect = optionIndex === correctIndex;

    // Opponent answer (simulated based on college avg accuracy)
    const opponentAccuracy = opponentCollege
      ? Math.min(opponentCollege.avgScore / 100, 0.85)
      : 0.5;
    const opponentCorrect = Math.random() < opponentAccuracy;
    const opponentChoice = opponentCorrect
      ? correctIndex
      : (correctIndex + 1 + Math.floor(Math.random() * 3)) % q.options.length;

    const result: AnswerResult = {
      questionId: q.id,
      correctIndex,
      playerChoice: optionIndex,
      opponentChoice,
      playerCorrect,
      opponentCorrect,
    };

    setAnswers((prev) => [...prev, result]);
    if (playerCorrect) setPlayerScore((s) => s + 1);
    if (opponentCorrect) setOpponentScore((s) => s + 1);
    setShowResult(true);
  };

  // ── Next question ──
  const nextQuestion = () => {
    if (currentQ >= GAME_QUESTIONS - 1) {
      setGameOver(true);
      setPhase("result");
      return;
    }
    setCurrentQ((q) => q + 1);
    setSelectedOption(null);
    setShowResult(false);
  };

  // ── Reset game ──
  const resetGame = () => {
    setPhase("select-a");
    setMyCollege(null);
    setOpponentCollege(null);
    setQuestions([]);
    setCurrentQ(0);
    setAnswers([]);
    setPlayerScore(0);
    setOpponentScore(0);
    setSelectedOption(null);
    setShowResult(false);
    setCountdownDone(false);
    setGameOver(false);
    setSearchA("");
    setSearchB("");
  };

  useEffect(() => {
    resetGame();
  }, [level]);

  // ── College selection UI ──
  if (phase === "select-a") {
    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExit}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
          <Badge variant="default" className="border-purple-500/30 bg-purple-500/10 gap-2">
            <Brain className="h-4 w-4 text-purple-400" />
            মাইন্ড গেম
          </Badge>
        </div>

        <Card variant="glass" className="p-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white">🧠 মাইন্ড গেম</h2>
          <p className="text-slate-400 max-w-md mx-auto text-sm">
            {GAME_QUESTIONS}টি MCQ এর যুদ্ধ! তুমি ও প্রতিপক্ষ {isSchool ? "স্কুল" : "কলেজ"} — কে বেশি সঠিক উত্তর দিতে পারে?
            তোমার {isSchool ? "স্কুল" : "কলেজ"} বাছাই করে যুদ্ধে নামো!
          </p>
        </Card>

        <Card variant="glass" className="p-6 space-y-4">
          <h3 className="flex items-center gap-2 font-bold text-white">
            <Building2 className="h-5 w-5 text-purple-400" />
            তোমার {isSchool ? "স্কুল" : "কলেজ"} নির্বাচন করো
          </h3>

          <div className="relative w-full">
            <input
              type="text"
              value={searchA}
              onChange={(e) => setSearchA(e.target.value)}
              placeholder={`${isSchool ? "স্কুলের" : "কলেজের"} নাম লিখুন...`}
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-3 pl-4 pr-10 text-sm text-white placeholder:text-slate-600 focus:border-purple-400/40 focus:outline-none"
            />
            <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          </div>

          {searchA && (
            <ul className="space-y-1 max-h-60 overflow-y-auto">
              {colleges
                .filter((c) => c.name.toLowerCase().includes(searchA.toLowerCase()))
                .slice(0, 8)
                .map((c) => (
                  <li key={c.name}>
                    <button
                      type="button"
                      onClick={() => {
                        setMyCollege(c);
                        setPhase("select-b");
                        setSearchA("");
                      }}
                      className="flex w-full items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition"
                    >
                      <Building2 className="h-5 w-5 shrink-0 text-purple-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {c.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          স্কোর: {formatBnNumber(c.score)} · {formatBnNumber(c.studentCount)} জন
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </button>
                  </li>
                ))}
              {colleges.filter((c) =>
                c.name.toLowerCase().includes(searchA.toLowerCase()),
              ).length === 0 && (
                <p className="py-3 text-center text-xs text-slate-600">
                  কোনো {isSchool ? "স্কুল" : "কলেজ"} পাওয়া যায়নি
                </p>
              )}
            </ul>
          )}
        </Card>
      </div>
    );
  }

  // ── Opponent selection UI ──
  if (phase === "select-b") {
    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setPhase("select-a"); setMyCollege(null); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
          <Badge variant="default" className="border-purple-500/30 bg-purple-500/10 gap-2">
            <Brain className="h-4 w-4 text-purple-400" />
            প্রতিপক্ষ বাছাই
          </Badge>
        </div>

        {myCollege && (
          <Card variant="glass" className="p-4 border-purple-500/30 bg-purple-500/5 flex items-center gap-3">
            <Building2 className="h-6 w-6 text-purple-400" />
            <div>
              <p className="text-sm font-bold text-white">তোমার {isSchool ? "স্কুল" : "কলেজ"}</p>
              <p className="text-xs text-slate-400">{myCollege.name}</p>
            </div>
          </Card>
        )}

        <Card variant="glass" className="p-6 space-y-4">
          <h3 className="flex items-center gap-2 font-bold text-white">
            <Swords className="h-5 w-5 text-orange-400" />
            প্রতিপক্ষ {isSchool ? "স্কুল" : "কলেজ"} নির্বাচন করো
          </h3>

          <div className="relative w-full">
            <input
              type="text"
              value={searchB}
              onChange={(e) => setSearchB(e.target.value)}
              placeholder={`প্রতিপক্ষ ${isSchool ? "স্কুলের" : "কলেজের"} নাম লিখুন...`}
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-3 pl-4 pr-10 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
            />
            <Swords className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          </div>

          {searchB && (
            <ul className="space-y-1 max-h-60 overflow-y-auto">
              {filteredColleges
                .filter((c) => c.name.toLowerCase().includes(searchB.toLowerCase()))
                .slice(0, 8)
                .map((c) => (
                  <li key={c.name}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpponentCollege(c);
                        setSearchB("");
                        startGame();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition"
                    >
                      <Building2 className="h-5 w-5 shrink-0 text-cyan-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {c.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          স্কোর: {formatBnNumber(c.score)} · {formatBnNumber(c.studentCount)} জন ·
                          গড়: {formatBnNumber(c.avgScore)}
                        </p>
                      </div>
                      <Swords className="h-4 w-4 text-orange-400" />
                    </button>
                  </li>
                ))}
              {filteredColleges.filter((c) =>
                c.name.toLowerCase().includes(searchB.toLowerCase()),
              ).length === 0 && (
                <p className="py-3 text-center text-xs text-slate-600">
                  কোনো {isSchool ? "স্কুল" : "কলেজ"} পাওয়া যায়নি
                </p>
              )}
            </ul>
          )}
        </Card>
      </div>
    );
  }

  // ── Countdown ──
  if (phase === "countdown") {
    if (loadingQuestions) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-purple-glow" />
          <p className="text-sm text-slate-400 font-bangla">প্রশ্ন লোড হচ্ছে...</p>
        </div>
      );
    }
    return <CountdownOverlay onDone={handleCountdownDone} />;
  }

  // ── Result screen ──
  if (phase === "result" && gameOver) {
    const isWin = playerScore > opponentScore;
    const isDraw = playerScore === opponentScore;
    const totalCorrect = playerScore + opponentScore;
    const totalQuestions_seen = answers.length;

    return (
      <div className="space-y-4 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Badge variant="default" className="border-purple-500/30 bg-purple-500/10 gap-2">
            <Trophy className="h-4 w-4 text-purple-400" />
            মাইন্ড গেম — ফলাফল
          </Badge>
        </div>

        {/* Result hero */}
        <Card variant="glass" className={cn(
          "p-8 text-center space-y-4 border-2",
          isWin && "border-emerald-500/40",
          isDraw && "border-yellow-500/40",
          !isWin && !isDraw && "border-red-500/30",
        )}>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10">
            {isWin ? (
              <Crown className="h-10 w-10 text-yellow-400" />
            ) : isDraw ? (
              <Swords className="h-10 w-10 text-orange-400" />
            ) : (
              <Heart className="h-10 w-10 text-red-400" />
            )}
          </div>

          <h2 className="text-3xl font-black text-white">
            {isWin ? "🎉 অভিনন্দন! তুমি জিতেছ!" : isDraw ? "🤝 সমতা!" : "😔 প্রতিপক্ষ জিতেছে!"}
          </h2>

          {/* Score comparison */}
          <div className="flex items-center justify-center gap-6 py-4">
            {/* Player */}
            <div className="flex flex-col items-center gap-2">
              <Building2 className="h-6 w-6 text-purple-400" />
              <p className="text-xs font-bold text-purple-300 truncate max-w-[120px]">
                {myCollege?.name}
              </p>
              <p className="text-4xl font-black text-white">{playerScore}</p>
            </div>

            <div className="text-2xl font-black text-slate-600">:</div>

            {/* Opponent */}
            <div className="flex flex-col items-center gap-2">
              <Building2 className="h-6 w-6 text-cyan-400" />
              <p className="text-xs font-bold text-cyan-300 truncate max-w-[120px]">
                {opponentCollege?.name}
              </p>
              <p className="text-4xl font-black text-white">{opponentScore}</p>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            {formatBnNumber(totalQuestions_seen)} টি প্রশ্ন · {formatBnNumber(totalCorrect)} টি সঠিক উত্তর
          </p>
        </Card>

        {/* Per-question review */}
        <Card variant="glass" className="p-4 space-y-3">
          <h3 className="flex items-center gap-2 font-bold text-white">
            <Zap className="h-4 w-4 text-orange-400" />
            প্রশ্নভিত্তিক বিশ্লেষণ
          </h3>
          <div className="space-y-2">
            {answers.map((r, i) => (
              <ResultCard key={r.questionId} q={questions[i]} result={r} qi={i} />
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="primary"
            onClick={resetGame}
            className="flex items-center gap-2"
          >
            <Swords className="h-4 w-4" />
            আবার খেলো
          </Button>
          <Button
            variant="secondary"
            onClick={onExit}
            className="flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            {isSchool ? "স্কুল" : "কলেজ"} র‍্যাঙ্কিং
          </Button>
        </div>
      </div>
    );
  }

  // ── Playing screen ──
  const currentQuestion = questions[currentQ];
  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-purple-glow" />
        <p className="text-sm text-slate-400 font-bangla">প্রশ্ন লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* VS header */}
      <div className="flex items-center justify-between px-2">
        <OpponentAvatar college={myCollege!} side="left" />
        <div className="flex flex-col items-center gap-1">
          <Badge variant="default" className="border-orange-400/30 bg-orange-500/10 gap-1.5">
            <Zap className="h-3 w-3 text-orange-400" />
            মাইন্ড গেম
          </Badge>
          <div className="flex items-center gap-2 text-lg font-black text-white">
            <span className="text-purple-400">{playerScore}</span>
            <span className="text-slate-600">VS</span>
            <span className="text-cyan-400">{opponentScore}</span>
          </div>
        </div>
        <OpponentAvatar college={opponentCollege!} side="right" />
      </div>

      {/* Progress */}
      <GameProgressBar
        current={currentQ}
        total={GAME_QUESTIONS}
        playerScore={playerScore}
        opponentScore={opponentScore}
      />

      {/* Question card */}
      <Card variant="glass" className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <Brain className="h-3.5 w-3.5 text-purple-400" />
            প্রশ্ন {formatBnNumber(currentQ + 1)}
          </span>
          <span className="text-[10px] text-slate-600 font-mono">
            {formatBnNumber(GAME_QUESTIONS - currentQ)} বাকি
          </span>
        </div>

        <FormattedQuizText text={currentQuestion.text} className="text-base sm:text-lg" />

        <div className="space-y-2">
          {currentQuestion.options.map((opt, oi) => {
            const isSelected = selectedOption === oi;
            const isDisabled = selectedOption !== null;
            const isCorrect = showResult && oi === answers[answers.length - 1]?.correctIndex;
            const isWrong = showResult && isSelected && !isCorrect;

            return (
              <button
                key={oi}
                type="button"
                onClick={() => handleAnswer(oi)}
                disabled={isDisabled}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border transition-all duration-200 min-h-[52px] flex items-center justify-between group",
                  isSelected && !showResult && "border-purple-glow bg-purple-glow/10 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]",
                  isCorrect && "border-emerald-400/50 bg-emerald-500/15 text-emerald-100",
                  isWrong && "border-red-400/40 bg-red-500/15 text-red-100",
                  !isSelected && !showResult && "border-slate-800/80 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:text-white",
                  !isSelected && showResult && !isCorrect && "border-white/5 bg-white/5 text-slate-500",
                )}
              >
                <span className="flex items-center gap-3">
                  <span className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-xl font-bold text-xs border transition-all",
                    isSelected && !showResult && "bg-gradient-to-br from-purple-600 to-indigo-600 text-white border-transparent",
                    isCorrect && "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
                    isWrong && "bg-red-500/20 text-red-300 border-red-400/30",
                    !isSelected && !showResult && "bg-slate-900 text-slate-400 border-white/5",
                    !isSelected && showResult && "bg-slate-900 text-slate-600 border-white/5",
                  )}>
                    {"কখগঘ"[oi]}
                  </span>
                  <FormattedQuizText text={opt} inline className="text-sm" />
                </span>
                {isCorrect && <Check className="h-5 w-5 text-emerald-400" />}
                {isWrong && <X className="h-5 w-5 text-red-400" />}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Next button */}
      {showResult && (
        <Button
          variant="primary"
          fullWidth
          onClick={nextQuestion}
          className="min-h-[48px] flex items-center justify-center gap-2"
        >
          {currentQ >= GAME_QUESTIONS - 1 ? (
            <>ফলাফল দেখুন <Trophy className="h-4 w-4" /></>
          ) : (
            <>পরবর্তী প্রশ্ন <ChevronRight className="h-4 w-4" /></>
          )}
        </Button>
      )}
    </div>
  );
}

// ─── Helper ──────────────────────────────────

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
