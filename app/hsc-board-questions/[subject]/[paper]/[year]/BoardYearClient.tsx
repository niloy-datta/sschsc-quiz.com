"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { FormattedQuizText } from "@/lib/format-quiz-text";
import type { ApiQuestion } from "@/types/quiz";
import { 
  ArrowLeft, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  Trophy, 
  Play, 
  ChevronRight, 
  AlertCircle
} from "lucide-react";

// Translations
const BENGALI_SUBJECTS: Record<string, string> = {
  physics: "পদার্থবিজ্ঞান",
  chemistry: "রসায়ন",
  biology: "জীববিজ্ঞান",
  "higher-math": "উচ্চতর গণিত",
  math: "সাধারণ গণিত",
};

const BENGALI_PAPERS: Record<string, string> = {
  "1st-paper": "১ম পত্র",
  "2nd-paper": "২য় পত্র",
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
  khulna: "খুলনা বোর্ড",
};

type Props = {
  subject: string;
  paper?: string;
  year: string;
  scannedQuestions: { image_url: string; text?: string }[];
  cleanQuizzesByBoard: Record<string, ApiQuestion[]>;
};

export default function BoardYearClient({
  subject,
  paper,
  year,
  scannedQuestions,
  cleanQuizzesByBoard,
}: Props) {
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"selection" | "quiz" | "scanned">("selection");

  const subjBengali = BENGALI_SUBJECTS[subject.toLowerCase()] || subject;
  const paperBengali = paper ? BENGALI_PAPERS[paper.toLowerCase()] || paper : "";
  const titleText = `${subjBengali} ${paperBengali ? `- ${paperBengali}` : ""}`;
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
    const examSlug = `hsc-board-${subject}-${paper || "none"}-${year}-${selectedBoard}`;

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

  if (viewMode === "scanned") {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 font-bangla pb-24 text-slate-100">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setViewMode("selection")}
            className="text-slate-400 hover:text-white flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> বোর্ড সিলেকশনে ফিরে যান
          </button>
          <Badge variant="default">স্ক্যান করা ভিউ (Original Pages)</Badge>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white">{titleText}</h1>
          <p className="text-purple-glow text-sm mt-1">{yearText} - মূল প্রশ্নপত্র ও OCR টেক্সট</p>
        </div>

        <div className="space-y-8">
          {scannedQuestions.map((item, index) => (
            <Card key={index} variant="glass" className="p-6 border-white/5 space-y-6">
              <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-400" />
                প্রশ্নপত্র পৃষ্ঠা {index + 1}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image Container */}
                <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/5 flex items-center justify-center p-2 min-h-[400px]">
                  <Image
                    src={item.image_url}
                    alt={`Question ${year} - Image ${index + 1}`}
                    width={800}
                    height={1200}
                    className="object-contain rounded-xl max-h-[70vh] w-auto h-auto"
                    unoptimized
                  />
                </div>
                {/* OCR Text Container */}
                <div className="flex flex-col justify-start">
                  <div className="p-5 bg-slate-950/60 rounded-2xl border border-white/5 font-sans h-full max-h-[70vh] overflow-y-auto">
                    <h4 className="font-bold text-purple-300 mb-3 border-b border-purple-500/20 pb-2 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      এক্সট্র্যাক্ট করা টেক্সট (OCR):
                    </h4>
                    {item.text ? (
                      <FormattedQuizText
                        text={item.text}
                        className="text-sm text-slate-300"
                        hideWorkedSolution={false}
                      />
                    ) : (
                      <p className="text-sm text-slate-300 leading-relaxed">
                        এই পৃষ্ঠার কোনো টেক্সট এক্সট্র্যাক্ট করা সম্ভব হয়নি।
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 font-bangla pb-24 text-slate-100">
      {/* Back button */}
      <Link
        href="/hsc-board-questions"
        className="text-slate-400 hover:text-white text-sm mb-6 inline-flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> বোর্ড প্রশ্নাবলী হাব
      </Link>

      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
          {titleText}
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          {yearText} — আপনার বোর্ড অনুযায়ী ইন্টারেক্টিভ পরীক্ষা দিন অথবা আসল প্রশ্নপত্র এবং OCR টেক্সট দেখুন।
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Interactive MCQ selection */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-yellow-400" />
            ইন্টারেক্টিভ কুইজ পরীক্ষা (MCQs)
          </h2>

          {availableBoards.length === 0 ? (
            <Card variant="glass" className="p-6 text-center border-white/5">
              <AlertCircle className="h-10 w-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                দুঃখিত, এই বিষয়ের জন্য কোনো ইন্টারেক্টিভ কুইজ ডেটা খুঁজে পাওয়া যায়নি।
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
                    className="p-5 border-white/5 hover:border-purple-glow/30 hover:shadow-lg hover:shadow-purple-500/5 group hoverable"
                  >
                    <div className="flex flex-col justify-between h-full space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-bold text-lg group-hover:text-purple-300 transition-colors">
                            {boardTitle}
                          </span>
                          <Badge variant="default" className="text-[10px] bg-purple-glow/20 text-purple-300">
                            HSC {year}
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
                        className="w-full flex items-center justify-center gap-2 bg-purple-glow hover:bg-purple-700/80 text-white rounded-xl shadow-lg shadow-purple-900/30"
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

        {/* Scanned/Original paper CTA */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-cyan-400" />
            আসল প্রশ্নপত্র ভিউ
          </h2>

          <Card
            variant="glass"
            className="p-6 border-white/5 flex flex-col justify-between space-y-6 bg-gradient-to-b from-slate-900/60 to-slate-950/80"
          >
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white">মূল কোশ্চেন ইমেজ এবং টেক্সট</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                বোর্ড কর্তৃক প্রকাশিত অরিজিনাল কোশ্চেন পেপারের ছবি দেখতে এবং ছবি থেকে এক্সট্র্যাক্ট করা সম্পূর্ণ টেক্সট কপি বা পড়তে এটি ব্যবহার করুন।
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={() => setViewMode("scanned")}
              className="w-full flex items-center justify-center gap-2 border-white/10 hover:bg-white/5"
            >
              মূল প্রশ্নপত্র দেখুন <ChevronRight className="h-4 w-4" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
