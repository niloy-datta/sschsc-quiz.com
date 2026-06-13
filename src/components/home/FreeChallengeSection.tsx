"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { levelDetectorQuestions } from "@/lib/mockData";
import { FormattedQuizText } from "@/lib/format-quiz-text";
import { Timer, ArrowRight, RotateCcw, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export function FreeChallengeSection() {
  const [isStarted, setIsStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ qIdx: number; optionIdx: number; isCorrect: boolean }[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start Timer when quiz starts
  useEffect(() => {
    if (isStarted && !isFinished && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, isFinished, timeLeft]);

  // Restart Quiz
  const handleStart = () => {
    setIsStarted(true);
    setCurrentIdx(0);
    setSelectedOption(null);
    setScore(0);
    setTimeLeft(30);
    setIsFinished(false);
    setUserAnswers([]);
  };

  // Option Select Handler
  const handleOptionSelect = (optionIdx: number) => {
    if (selectedOption !== null) return; // Prevent double clicking
    
    setSelectedOption(optionIdx);
    const question = levelDetectorQuestions[currentIdx];
    const isCorrect = optionIdx === question.correctAnswer;
    
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setUserAnswers((prev) => [
      ...prev,
      { qIdx: currentIdx, optionIdx, isCorrect }
    ]);
  };

  // Move to next question
  const handleNext = () => {
    if (currentIdx < levelDetectorQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const currentQuestion = levelDetectorQuestions[currentIdx];
  const optionPrefixes = ["ক", "খ", "গ", "ঘ"];

  return (
    <section id="quiz" className="py-12 md:py-24 relative font-bangla">
      <div className="absolute top-1/2 left-1/4 w-[250px] h-[250px] bg-cyan-glow/5 rounded-full blur-[80px] pointer-events-none -z-10" />
      
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        
        {/* Header Title */}
        <div className="text-center space-y-3 mb-10">
          <Badge variant="premium" className="px-3 py-1">বিনামূল্যে পরীক্ষা করো</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            ৩০-সেকেন্ডের লেভেল ডিটেক্টর চ্যালেঞ্জ
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            ৫টি দ্রুত MCQ এর উত্তর দিয়ে দেখো তোমার প্রস্তুতি কেমন। কুইজ শেষে পাবে সম্পূর্ণ দুর্বল বিষয় বিশ্লেষণ রিপোর্ট!
          </p>
        </div>

        {/* Quiz Board Arena */}
        <Card variant="glass" className="p-6 md:p-10 border-purple-glow/15 shadow-[0_0_40px_rgba(139,92,246,0.08)] relative overflow-hidden">
          
          {/* Neon side accents */}
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-purple-glow to-cyan-glow" />

          {/* 1. START STATE */}
          {!isStarted && !isFinished && (
            <div className="text-center py-10 space-y-6">
              <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-2xl bg-purple-glow/10 border border-purple-glow/25 text-purple-glow shadow-glow-purple/20 animate-pulse">
                <Timer className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl md:text-2xl font-bold text-white">তুমি কি যুদ্ধের জন্য প্রস্তুত?</h3>
                <p className="text-slate-400 text-xs sm:text-sm">
                  প্রতিটি প্রশ্নের জন্য সময় সীমাবদ্ধ। দ্রুত সঠিক উত্তর নির্বাচন করে র্যাঙ্ক আপ করো।
                </p>
              </div>
              <div className="flex flex-wrap gap-4 items-center justify-center text-xs text-slate-400">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-navy-light/60 rounded-full border border-slate-900">
                  ⚡ ৫টি বিজ্ঞান প্রশ্ন
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-navy-light/60 rounded-full border border-slate-900">
                  ⏱️ ৩০ সেকেন্ড সময়সীমা
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-navy-light/60 rounded-full border border-slate-900">
                  📊 দুর্বল বিষয় বিশ্লেষণ
                </div>
              </div>
              <div>
                <Button variant="primary" size="lg" className="w-full sm:w-auto font-extrabold" onClick={handleStart}>
                  চ্যালেঞ্জ শুরু করো
                </Button>
              </div>
            </div>
          )}

          {/* 2. ACTIVE QUIZ STATE */}
          {isStarted && !isFinished && currentQuestion && (
            <div className="space-y-6">
              
              {/* Quiz Header: Progress & Timer */}
              <div className="flex items-center justify-between border-b border-purple-glow/10 pb-4">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-outfit uppercase tracking-wider">প্রশ্ন</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{currentIdx + 1}</span>
                    <span className="text-slate-500 font-outfit">/ ৫</span>
                    <Badge variant="default" className="text-[10px] ml-2 bg-navy-light">{currentQuestion.subject}</Badge>
                  </div>
                </div>
                
                {/* Countdown Timer */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 font-outfit font-bold">
                  <Timer className="h-4 w-4 animate-spin" />
                  <span>{timeLeft}s</span>
                </div>
              </div>

              {/* Progress Bar indicator */}
              <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-glow to-cyan-glow transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / levelDetectorQuestions.length) * 100}%` }}
                />
              </div>

              {/* Question Text */}
              <div className="py-2">
                <FormattedQuizText
                  text={currentQuestion.question}
                  className="text-lg md:text-xl font-bold text-slate-100"
                  hideWorkedSolution={false}
                />
              </div>

              {/* Question Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrectAnswer = idx === currentQuestion.correctAnswer;
                  
                  let optionStyles = "bg-navy-light/40 border-slate-800 text-slate-200 hover:border-purple-glow/40 hover:bg-purple-glow/5";
                  
                  if (selectedOption !== null) {
                    if (isCorrectAnswer) {
                      optionStyles = "bg-success-green/10 border-success-green text-success-green shadow-glow-green/10";
                    } else if (isSelected) {
                      optionStyles = "bg-error-red/10 border-error-red text-error-red shadow-glow-red/10";
                    } else {
                      optionStyles = "bg-navy-light/10 border-slate-950 text-slate-500 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={selectedOption !== null}
                      className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200 ${optionStyles}`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${
                        selectedOption !== null && isCorrectAnswer 
                          ? "bg-success-green border-success-green text-black"
                          : selectedOption !== null && isSelected
                          ? "bg-error-red border-error-red text-white"
                          : "bg-slate-950 border-slate-700 text-slate-400"
                      }`}>
                        {optionPrefixes[idx]}
                      </span>
                      <FormattedQuizText
                        text={option}
                        inline
                        className="text-sm md:text-base font-semibold"
                      />
                    </button>
                  );
                })}
              </div>

              {/* Explanations & Next Button */}
              {selectedOption !== null && (
                <div className="pt-4 border-t border-purple-glow/10 space-y-4 animate-fadeIn">
                  
                  {/* Detailed explanation */}
                  <div className="p-4 rounded-xl bg-purple-glow/5 border border-purple-glow/10 text-xs sm:text-sm text-slate-300">
                    <span className="font-bold text-purple-glow flex items-center gap-1.5 mb-1.5">
                      💡 ব্যাখ্যা বিশ্লেষণ:
                    </span>
                    <FormattedQuizText
                      text={currentQuestion.explanation}
                      className="leading-relaxed"
                      hideWorkedSolution={false}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button variant="primary" size="md" className="flex items-center gap-2" onClick={handleNext}>
                      {currentIdx === levelDetectorQuestions.length - 1 ? "ফলাফল দেখো" : "পরবর্তী প্রশ্ন"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 3. FINISHED REPORT CARD STATE */}
          {isFinished && (
            <div className="space-y-8 py-4">
              
              {/* Score HUD Header */}
              <div className="text-center space-y-2">
                <Badge variant="premium" className="text-xs">পরীক্ষা শেষ রিপোর্ট</Badge>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white">যুদ্ধ রিপোর্ট ও বিশ্লেষণ</h3>
                
                {/* Large score display */}
                <div className="py-4 flex justify-center items-baseline gap-1">
                  <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-glow to-cyan-glow font-outfit">
                    {score}
                  </span>
                  <span className="text-slate-500 font-outfit text-xl">/ ৫</span>
                </div>
                
                <p className="text-slate-300 text-sm max-w-sm mx-auto font-semibold">
                  {score === 5 
                    ? "🎉 অসাধারণ প্রস্তুতি! তুমি একজন জিনিয়াস র্যাঙ্কার!" 
                    : score >= 3 
                    ? "✨ ভালো প্রস্তুতি, তবে দুর্বল বিষয়গুলোতে আরও চর্চা প্রয়োজন।" 
                    : "⚠️ প্রস্তুতি আশঙ্কাজনক! ব্যাটেলে টিকে থাকতে দ্রুত রিভিশন প্রয়োজন।"}
                </p>
              </div>

              {/* Subject wise weaknesses analyzed dynamically */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide">বিষয়ভিত্তিক দুর্বলতা মূল্যায়ন:</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* Physics Analysis */}
                  <Card variant="dark" className="p-4 border-slate-900 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-purple-glow/10 text-purple-glow">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-500">পদার্থবিজ্ঞান বিশ্লেষণ</span>
                      <h5 className="text-sm font-bold text-slate-200">গতি ও বলবিদ্যা</h5>
                      <p className="text-xs text-slate-400">উচ্চতা ও বেগের গাণিতিক সূত্রে বিভ্রান্তি রয়েছে (গতি ভুল হয়েছে)।</p>
                      <Badge variant="warning" className="text-[9px] mt-1">দুর্বল অধ্যায়</Badge>
                    </div>
                  </Card>

                  {/* Chemistry Analysis */}
                  <Card variant="dark" className="p-4 border-slate-900 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-success-green/10 text-success-green">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-500">রসায়ন বিশ্লেষণ</span>
                      <h5 className="text-sm font-bold text-slate-200">তড়িৎ ঋণাত্মকতা</h5>
                      <p className="text-xs text-slate-400">পর্যায় সারণী ও বন্ধন অধ্যায়ে ধারণাগত জ্ঞান চমৎকার।</p>
                      <Badge variant="success" className="text-[9px] mt-1">সবল অধ্যায়</Badge>
                    </div>
                  </Card>

                </div>
              </div>

              {/* End of Quiz actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <Button variant="primary" className="flex items-center justify-center gap-2" onClick={() => {
                  const el = document.getElementById("premium");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}>
                  👑 প্রিমিয়াম যুদ্ধঘর আনলক করো
                </Button>
                <Button variant="secondary" className="flex items-center justify-center gap-2" onClick={handleStart}>
                  <RotateCcw className="h-4 w-4" />
                  আবার চেষ্টা করো
                </Button>
              </div>

            </div>
          )}

        </Card>

      </div>
    </section>
  );
}
