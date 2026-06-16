"use client";

import React, { useRef, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { formatBnNumber } from "@/lib/leaderboard-api";
import {
  Download,
  Share2,
  Loader2,
  Check,
  Zap,
  Brain,
  Swords,
  TrendingUp,
  Target,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ShareCardData = {
  examName: string;
  subject?: string;
  chapter?: string;
  level?: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  accuracy: number;
  eloRating: number;
  eloChange: number;
  timeTaken?: number;
  studentName?: string;
  collegeName?: string;
  schoolName?: string;
};

// ─────────────────────────────────────────────
// AI Roast Engine — generates contextual Bengali text
// ─────────────────────────────────────────────

function generateRoast(data: ShareCardData): { roast: string; flex: string; emoji: string } {
  const { accuracy, correctCount, totalQuestions, eloChange, eloRating } = data;
  const pct = accuracy;

  if (totalQuestions === 0) {
    return {
      roast: "কুইজ শুরুই করোনি! 🤨 বসে না থেকে একটা টেস্ট দাও।",
      flex: "প্রথম টেস্ট দিয়েই র‍্যাঙ্কিংয়ে উঠে আসো!",
      emoji: "😤",
    };
  }

  // Perfect score
  if (pct === 100) {
    return {
      roast: "১০০%?! তুমি কি আসলেই মানুষ নাকি রোবট? 🤖 ব্যাটা, তুমি তো বই খুলেও দেখো না!",
      flex: "পারফেক্ট স্কোর! তুমি এই সাবজেক্টের রাজা 👑 বোর্ড পরীক্ষাতেও তাই আসবে ইনশাআল্লাহ!",
      emoji: "👑",
    };
  }

  // Excellent (80-99)
  if (pct >= 80) {
    return {
      roast: `বাহ! ${pct}%! কিন্তু বাকি ${100 - pct}% ভুল কেন? 😏 তুমি তো টপার হতে পারতে!`,
      flex: `অসাধারণ! মাত্র ${100 - pct}% ভুল — তুমি যেকোনো বোর্ড পরীক্ষায় ${pct}%+ পেতে যাচ্ছ।`,
      emoji: "🔥",
    };
  }

  // Good (60-79)
  if (pct >= 60) {
    return {
      roast: `${pct}% — খারাপ না, কিন্তু ভালোও না। 😅 এই নিয়ে কি জিপিএ-৫ পাবা? আরও পড়তে হবে!`,
      flex: `ভালো ফলাফল! আর একটু পড়লেই ${Math.min(100, pct + 15)}%+ করা সম্ভব। লক্ষ্য রাখো!`,
      emoji: "💪",
    };
  }

  // Average (40-59)
  if (pct >= 40) {
    return {
      roast: `${pct}%? তুমি কি পরীক্ষার আগের রাতে পড়েছিলে? 😴 এভাবে চললে বোর্ড পরীক্ষায় বিপদ!`,
      flex: `এখনো সময় আছে! দুর্বল টপিকগুলো চিহ্নিত করে আরও ${10 - Math.floor(pct / 10)}টি মডেল টেস্ট দাও।`,
      emoji: "📚",
    };
  }

  // Low (<40%)
  return {
    roast: `অসম্ভব! ${pct}%?! 🤯 তুমি কি উত্তরগুলো উল্টো দিকে দিয়েছ? বইটা একটু খুলে দেখো!`,
    flex: `চিন্তা নেই! শুরুটা যত খারাপই হোক, নিয়মিত চর্চায় তুমি ${100 - pct}% উন্নতি করতে পারো।`,
    emoji: "🎯",
  };
}

// ─────────────────────────────────────────────
// AI "Weakness" Burn Generator
// ─────────────────────────────────────────────

function generateWeaknessBurn(data: ShareCardData): string {
  const { wrongCount, skippedCount, correctCount } = data;

  if (wrongCount === 0 && skippedCount === 0) return "কোনো ভুল নেই — তুমি আসলেই প্রস্তুত! 🏆";
  if (wrongCount >= 10) return `ওহ! ${wrongCount}টি ভুল? তুমি তো বসে বসে টিক দিয়েছ মনে হচ্ছে! 🎲`;
  if (skippedCount >= 5) return `${skippedCount}টি প্রশ্ন বাদ দিয়েছ? আন্দাজ করলেও তো কিছু হতো! 😤`;
  if (wrongCount > correctCount) return "ভুল উত্তর সঠিকের চেয়ে বেশি! বোর্ড পরীক্ষায় এই অবস্থা হলে বিপদ! ⚠️";
  if (wrongCount >= 5) return `${wrongCount}টি ভুল — মোটামুটি, কিন্তু আরও নিখুঁত হতে হবে! 🎯`;
  if (wrongCount >= 1) return `শুধু ${wrongCount}টি ভুল? বাকিগুলো ঠিক আছে, কিন্তু এগুলো কেন ভুল হলো? 🤔`;

  return "চমৎকার! সব প্রশ্নের উত্তর দেওয়ার চেষ্টা করেছ — এটাই সঠিক মানসিকতা! 🚀";
}

// ─────────────────────────────────────────────
// Accuracy Label
// ─────────────────────────────────────────────

function getAccuracyLabel(pct: number): { label: string; color: string } {
  if (pct === 100) return { label: "পরম বৈজ্ঞানিক", color: "text-amber-300" };
  if (pct >= 90) return { label: "বিজ্ঞান গুরু", color: "text-cyan-300" };
  if (pct >= 80) return { label: "মেধাবী র্যাঙ্কার", color: "text-emerald-300" };
  if (pct >= 60) return { label: "অনুশীলনরত", color: "text-blue-300" };
  if (pct >= 40) return { label: "শিক্ষার্থী", color: "text-yellow-300" };
  return { label: "নবিশ র্যাঙ্কার", color: "text-slate-300" };
}

// ─────────────────────────────────────────────
// Circular Accuracy Gauge
// ─────────────────────────────────────────────

function AccuracyGauge({ pct, size = 80 }: { pct: number; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  const color =
    pct >= 80 ? "#22d3ee" : pct >= 50 ? "#fbbf24" : "#ef4444";

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="5"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-1000"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

type Props = {
  data: ShareCardData;
  /** Optional className for the outer wrapper */
  className?: string;
};

export function QuizResultShareCard({ data, className }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const roastData = useMemo(() => generateRoast(data), [data]);
  const burnText = useMemo(() => generateWeaknessBurn(data), [data]);
  const titleLabel = getAccuracyLabel(data.accuracy);

  const durationStr = useMemo(() => {
    if (!data.timeTaken) return "";
    const min = Math.floor(data.timeTaken / 60);
    const sec = data.timeTaken % 60;
    return `${min}:${String(sec).padStart(2, "0")}`;
  }, [data.timeTaken]);

  /** Download the card as PNG */
  const handleDownload = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const mod = await import("html-to-image");
      const dataUrl = await mod.toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#07111F",
      });
      const link = document.createElement("a");
      link.download = `quiz-result-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate image:", err);
    } finally {
      setSharing(false);
    }
  };

  /** Share using Web Share API */
  const handleShare = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const mod = await import("html-to-image");
      const dataUrl = await mod.toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#07111F",
      });

      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `quiz-result-${Date.now()}.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "বিজ্ঞান র্যাঙ্কার — আমার কুইজ ফলাফল",
          text: `আমি ${data.examName} এ ${data.accuracy}% পেয়েছি! তুমিও চ্যালেঞ্জ নাও!`,
          files: [file],
        });
      } else {
        // Fallback: copy the data URL
        await navigator.clipboard.writeText(dataUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* The card — captured as PNG */}
      <div
        ref={cardRef}
        className="relative w-[480px] max-w-full mx-auto overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#0c1628] via-[#0a1020] to-[#0f0a1e] shadow-[0_0_60px_rgba(34,211,238,0.12)]"
        style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}
      >
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,0.08),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.06),transparent_50%)] pointer-events-none" />

        {/* Top decorative glow line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />

        {/* Content */}
        <div className="relative p-6 space-y-5">
          {/* Header: Brand + Level */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 shadow-lg">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-white tracking-tight">বিজ্ঞান র্যাঙ্কার</p>
                {data.level && (
                  <p className="text-[10px] uppercase tracking-[0.15em] text-cyan-400/70 font-bold">
                    {data.level === "hsc" ? "HSC" : "SSC"} · {data.subject || ""}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", titleLabel.color)}>
                {titleLabel.label}
              </span>
              {data.collegeName && (
                <p className="text-[9px] text-slate-500 mt-0.5">{data.collegeName}</p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />

          {/* AI Roast + Flex section */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-amber-200/90 leading-relaxed">
                {roastData.roast}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-xs text-cyan-200/80 leading-relaxed">
                {roastData.flex}
              </p>
            </div>
          </div>

          {/* Main Score Section */}
          <div className="flex items-center justify-center gap-6 py-2">
            <AccuracyGauge pct={data.accuracy} size={90} />
            <div className="text-center">
              <p className="text-5xl font-black text-white tracking-tight">
                {data.accuracy}<span className="text-2xl text-cyan-400">%</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">সঠিকতা</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-2.5 text-center">
              <p className="text-[9px] uppercase tracking-wider text-emerald-400/70 font-bold">সঠিক</p>
              <p className="text-lg font-black text-emerald-300">{formatBnNumber(data.correctCount)}</p>
            </div>
            <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-2.5 text-center">
              <p className="text-[9px] uppercase tracking-wider text-red-400/70 font-bold">ভুল</p>
              <p className="text-lg font-black text-red-300">{formatBnNumber(data.wrongCount)}</p>
            </div>
            <div className="rounded-xl border border-slate-500/15 bg-slate-500/5 p-2.5 text-center">
              <p className="text-[9px] uppercase tracking-wider text-slate-400/70 font-bold">বাদ</p>
              <p className="text-lg font-black text-slate-300">{formatBnNumber(data.skippedCount)}</p>
            </div>
            <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-2.5 text-center">
              <p className="text-[9px] uppercase tracking-wider text-amber-400/70 font-bold">ELO</p>
              <p className="text-lg font-black text-amber-300">{formatBnNumber(data.eloRating)}</p>
            </div>
          </div>

          {/* Weakness burn + ELO change */}
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
            <TrendingUp className={cn(
              "h-5 w-5 shrink-0",
              data.eloChange >= 0 ? "text-emerald-400" : "text-red-400",
            )} />
            <p className="text-xs text-slate-400 leading-relaxed flex-1">{burnText}</p>
            <div className="text-right shrink-0">
              <p className="text-[9px] text-slate-600 uppercase">ELO পরিবর্তন</p>
              <p className={cn(
                "text-sm font-black",
                data.eloChange >= 0 ? "text-emerald-400" : "text-red-400",
              )}>
                {data.eloChange >= 0 ? "+" : ""}{data.eloChange}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-1 flex items-center justify-between text-[9px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <Swords className="h-3 w-3" />
              <span>{data.examName}</span>
            </div>
            <div className="flex items-center gap-3">
              {durationStr && (
                <span>সময়: {durationStr}</span>
              )}
              <span>{data.correctCount}/{data.totalQuestions}</span>
            </div>
          </div>

          {/* Bottom watermark */}
          <div className="absolute bottom-2 right-4 text-[7px] text-slate-800 font-mono opacity-50">
            বিজ্ঞান র্যাঙ্কার v3
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button
          variant="secondary"
          onClick={handleDownload}
          disabled={sharing}
          className="flex items-center gap-2 min-h-[44px]"
        >
          {sharing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          ছবি ডাউনলোড
        </Button>
        <Button
          onClick={handleShare}
          disabled={sharing}
          className="flex items-center gap-2 min-h-[44px] bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500"
        >
          {sharing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : copied ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          {copied ? "কপি হয়েছে!" : "শেয়ার করুন"}
        </Button>
      </div>
    </div>
  );
}
