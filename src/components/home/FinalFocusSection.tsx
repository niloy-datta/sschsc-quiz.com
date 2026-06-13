"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Target, Calendar, Repeat, AlertTriangle, Lock, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { levelModelTestsPath } from "@/lib/quiz/unified-routes";

const focusFeatures = [
  {
    id: "high-probability",
    bnTitle: "গুরুত্বপূর্ণ প্রশ্ন সেট",
    description: "আগের বোর্ড প্রশ্ন ও repeated MCQ pattern দেখে তৈরি",
    icon: Target,
    color: "gold",
  },
  {
    id: "revision-plan",
    bnTitle: "৭ দিনের রিভিশন প্ল্যান",
    description: "পরীক্ষার আগের সপ্তাহে smart revision schedule",
    icon: Calendar,
    color: "purple",
  },
  {
    id: "board-pattern",
    bnTitle: "বোর্ড প্যাটার্ন প্রশ্ন",
    description: "বোর্ডে বারবার আসা প্রশ্নের ধরন অনুযায়ী practice",
    icon: Repeat,
    color: "cyan",
  },
  {
    id: "weak-chapter",
    bnTitle: "দুর্বল অধ্যায় সাজেশন",
    description: "তোমার দুর্বল অধ্যায় অনুযায়ী কাস্টম সাজেশন",
    icon: AlertTriangle,
    color: "orange",
  },
];

export function FinalFocusSection({ embedded = false }: { embedded?: boolean }) {
  return (
    <section className={cn("font-bangla", embedded ? "py-8" : "py-16")}>
      <div
        className={cn(
          "mx-auto max-w-5xl",
          !embedded && "max-w-7xl px-4 sm:px-6 lg:px-8",
        )}
      >
        <Card variant="glass" className="p-6 md:p-10 border-cyan-500/20 bg-gradient-to-br from-[#07111F] via-[#0D1E36] to-[#07111F]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left - Content */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="flex items-center gap-1 bg-cyan-500/10 text-cyan-300 border-cyan-500/20">
                  <Sparkles className="h-3 w-3 text-cyan-400" />
                  ফাইনাল ফোকাস সাজেশন
                </Badge>
              </div>

              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  ফাইনাল <span className="text-gradient-cyan">ফোকাস সাজেশন</span>
                </h2>
                <p className="text-slate-400">
                  আগের বোর্ড প্রশ্ন, গুরুত্বপূর্ণ অধ্যায় ও repeated MCQ pattern দেখে তৈরি practice set।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {focusFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-start gap-3 p-3 rounded-xl bg-black/20 border border-slate-700/50">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      feature.color === "gold" ? "bg-yellow-500/20 text-yellow-400" :
                      feature.color === "purple" ? "bg-purple-500/20 text-purple-400" :
                      feature.color === "cyan" ? "bg-cyan-500/20 text-cyan-400" :
                      "bg-orange-500/20 text-orange-400"
                    }`}>
                      <feature.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{feature.bnTitle}</h4>
                      <p className="text-xs text-slate-400 mt-1">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href={levelModelTestsPath("ssc")} className="flex-1">
                  <Button variant="primary" fullWidth className="flex items-center justify-center gap-1.5 min-h-[44px]">
                    <Sparkles className="h-4 w-4" />
                    SSC মডেল টেস্ট
                  </Button>
                </Link>
                <Link href={levelModelTestsPath("hsc")} className="flex-1">
                  <Button variant="secondary" fullWidth className="flex items-center justify-center gap-1.5 min-h-[44px]">
                    <Sparkles className="h-4 w-4" />
                    HSC মডেল টেস্ট
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right - Visual */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
                
                <Card variant="glass" className="p-6 relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Final Focus Set</h3>
                      <p className="text-xs text-slate-400">HSC Physics 1st Paper</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">MCQ Count</span>
                      <span className="text-white font-medium">50</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Duration</span>
                      <span className="text-white font-medium">45 min</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Difficulty</span>
                      <span className="text-yellow-400 font-medium">Board Level</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Based On</span>
                      <span className="text-white font-medium">2022-2024 Pattern</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs text-yellow-400 text-center">
                      <Sparkles className="h-3 w-3 inline mr-1" />
                      বোর্ড প্যাটার্ন ও গুরুত্বপূর্ণ অধ্যায়ভিত্তিক সেট
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
