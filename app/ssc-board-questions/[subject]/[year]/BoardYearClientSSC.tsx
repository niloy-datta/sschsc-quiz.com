"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import type { ApiQuestion } from "@/types/quiz";
import { ArrowLeft, Trophy, Play, AlertCircle } from "lucide-react";

// Translations
const BENGALI_SUBJECTS: Record<string, string> = {
  physics: "পদার্থবিজ্ঞান",
  chemistry: "রসায়ন",
  biology: "জীববিজ্ঞান",
  "higher-math": "উচ্চতর গণিত",
  math: "সাধারণ গণিত",
};

const BENGALI_BOARDS: Record<string, string> = {
  dhaka: "ঢাকা বোর্ড",
  rajshahi: "রাজশাহী বোর্ড",
  cumilla: "কুমিল্লা বোর্ড",
  chattogram: "চট্টগ্রাম বোর্ড",
  sylhet: "সিলেট বোর্ড",
  barishal: "বরিশাল বোর্ড",
  dinajpur: "দিনাজপুর বোর্ড",
  jashore: "যশোর বোর্ড",
  mymensingh: "ময়মনসিংহ বোর্ড",
};

type Props = {
  subject: string;
  year: string;
  cleanQuizzesByBoard: Record<string, ApiQuestion[]>;
};

export default function BoardYearClientSSC({
  subject,
  year,
  cleanQuizzesByBoard,
}: Props) {
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"selection" | "quiz">("selection");

  const subjBengali = BENGALI_SUBJECTS[subject.toLowerCase()] || subject;
  const titleText = `${subjBengali}`;
  const yearText = `${year} সালের বোর্ড প্রশ্ন`;

  const availableBoards = Object.keys(cleanQuizzesByBoard);

  const handleQuizBack = () => {
    setSelectedBoard(null);
    setViewMode("selection");
  };

  if (viewMode === "quiz" && selectedBoard) {
    const questions = cleanQuizzesByBoard[selectedBoard] || [];
    const boardTitle = BENGALI_BOARDS[selectedBoard] || selectedBoard.toUpperCase();
    const examName = `${boardTitle} - ${year} (${titleText})`;
    const examSlug = `ssc-board-${subject}-${year}-${selectedBoard}`;

    return (
      <QuizRunner
        questions={questions}
        examSlug={examSlug}
        examName={examName}
        backUrl="#"
        onBack={handleQuizBack}
        timeLimitSec={1500} // 25 minutes limit for board exams
        showWorkedSolution
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 font-bangla pb-24 text-slate-100">
      {/* Back button */}
      <Link
        href={`/ssc-board-questions/${subject}`}
        className="text-slate-400 hover:text-white text-sm mb-6 inline-flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> বছর তালিকা
      </Link>

      {/* Hero Section */}
      <div className="text-center mb-12">
        <Badge variant="default" className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20 mb-3">
          SSC {year}
        </Badge>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
          {titleText}
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          {yearText} — তোমার বোর্ড নির্বাচন করে ইন্টারেক্টিভ পরীক্ষা দাও।
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-yellow-400" />
          ইন্টারেক্টিভ কুইজ পরীক্ষা (MCQs)
        </h2>

        {availableBoards.length === 0 ? (
          <Card variant="glass" className="p-8 text-center border-white/5">
            <AlertCircle className="h-10 w-10 text-amber-500/70 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold text-base mb-1">
              {year} সালের বোর্ড প্রশ্ন এখনো যোগ করা হয়নি
            </p>
            <p className="text-slate-500 text-sm">
              {parseInt(year) >= 2026
                ? "এই বিষয়ের ২০২৬ সালের বোর্ড MCQ প্রশ্ন শীঘ্রই আসছে। অন্য বিষয় বা বছর চেষ্টা করুন।"
                : "এই বছরের প্রশ্নপত্র এখনো আপলোড করা হয়নি।"}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableBoards.map((boardKey) => {
              const boardTitle = BENGALI_BOARDS[boardKey] || boardKey.toUpperCase();
              const questionCount = cleanQuizzesByBoard[boardKey].length;

              return (
                <Card
                  key={boardKey}
                  variant="glass"
                  className="p-5 border-white/5 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 group hoverable"
                >
                  <div className="flex flex-col justify-between h-full space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold text-lg group-hover:text-cyan-300 transition-colors">
                          {boardTitle}
                        </span>
                        <Badge variant="default" className="text-[10px] bg-cyan-500/10 text-cyan-300">
                          SSC {year}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">
                        মোট প্রশ্নসংখ্যা: {questionCount} টি
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedBoard(boardKey);
                        setViewMode("quiz");
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-900/30"
                    >
                      <Play className="h-3 w-3 fill-current" /> পরীক্ষা দিন
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
