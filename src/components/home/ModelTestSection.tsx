"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Clock, FileQuestion, Trophy, Target, Lock, ChevronRight, Zap, Radio } from "lucide-react";
import Link from "next/link";
import {
  levelModelTestsPath,
  unifiedModelTestPathPrefix,
  unifiedSubjectBasePath,
} from "@/lib/quiz/unified-routes";

const modelTests = [
  {
    id: "chapter-final",
    bnTitle: "অধ্যায় ফাইনাল টেস্ট",
    description: "প্রতি অধ্যায় শেষে ফাইনাল পরীক্ষা",
    duration: "20 মিনিট",
    mcqs: "20 MCQ",
    features: ["Score + Rank", "Result Analysis"],
    isPremium: false,
    icon: FileQuestion,
    color: "cyan",
    href: unifiedSubjectBasePath("hsc", "physics-1st-paper"),
  },
  {
    id: "subject-final",
    bnTitle: "বিষয় ফাইনাল টেস্ট",
    description: "পুরো বিষয়ের উপর কমপ্লিট টেস্ট",
    duration: "45 মিনিট",
    mcqs: "50 MCQ",
    features: ["Score + Rank", "Detailed Analysis", "Weak Chapter Report"],
    isPremium: false,
    icon: Target,
    color: "purple",
    href: unifiedModelTestPathPrefix("hsc", "physics-1st-paper"),
  },
  {
    id: "ssc-model-tests",
    bnTitle: "SSC মডেল টেস্ট",
    description: "SSC বিজ্ঞান বিষয়ের মডেল টেস্ট ব্যাংক",
    duration: "25–45 মিনিট",
    mcqs: "25 MCQ",
    features: ["Score + Rank", "Chapter + Paper sets"],
    isPremium: false,
    icon: Trophy,
    color: "gold",
    href: levelModelTestsPath("ssc"),
  },
  {
    id: "board-final",
    bnTitle: "বোর্ড ফাইনাল মডেল টেস্ট",
    description: "বোর্ড পরীক্ষার প্যাটার্নে মডেল টেস্ট",
    duration: "90 মিনিট",
    mcqs: "100 MCQ",
    features: ["Score + Rank", "Board Pattern", "ফ্রি মেডেল"],
    isPremium: false,
    icon: Zap,
    color: "gold",
    href: "/hsc-board-questions",
  },
  {
    id: "live-model",
    bnTitle: "লাইভ মডেল টেস্ট",
    description: "নির্দিষ্ট সময়ে সবাই একসাথে — র‍্যাঙ্ক সহ",
    duration: "৩০ মিনিট",
    mcqs: "৩০ MCQ",
    features: ["লাইভ র‍্যাঙ্ক", "রিয়েল টাইম ফলাফল"],
    isPremium: false,
    icon: Radio,
    color: "red",
    href: "/live-test",
  },
];

export function ModelTestSection() {
  return (
    <section className="py-16 font-bangla bg-gradient-to-b from-transparent via-cyan-900/5 to-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            রিয়েল এক্সাম মোড <span className="text-gradient-purple">মডেল টেস্ট</span>
          </h2>
          <p className="text-slate-400 mt-2">
            Timer, score, result, rank সব একসাথে
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {modelTests.map((test) => (
            <Card
              key={test.id}
              variant={test.isPremium ? "premium" : "glass"}
              className="p-5 hoverable group relative overflow-hidden"
            >
              {test.isPremium && (
                <div className="absolute top-3 right-3">
                  <Badge variant="premium" className="text-[10px] flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Premium
                  </Badge>
                </div>
              )}

              <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${
                test.color === "cyan" ? "bg-cyan-500/20 text-cyan-400" :
                test.color === "purple" ? "bg-purple-500/20 text-purple-400" :
                test.color === "red" ? "bg-red-500/20 text-red-400" :
                "bg-yellow-500/20 text-yellow-400"
              }`}>
                <test.icon className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{test.bnTitle}</h3>
              <p className="text-xs text-slate-400 mb-4">{test.description}</p>

              <div className="flex gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1 text-slate-300">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>{test.duration}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-300">
                  <FileQuestion className="h-4 w-4 text-slate-400" />
                  <span>{test.mcqs}</span>
                </div>
              </div>

              <div className="space-y-1 mb-4">
                {test.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-xs text-slate-400">
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      test.isPremium ? "bg-yellow-400" : "bg-cyan-400"
                    }`} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Link href={test.href}>
                <Button 
                  variant={test.isPremium ? "premium" : "secondary"} 
                  fullWidth 
                  size="sm"
                  className="flex items-center justify-center gap-2 group/btn"
                >
                  {test.isPremium ? (
                    <>
                      <Lock className="h-4 w-4" />
                      প্রিমিয়াম আনলক
                    </>
                  ) : (
                    <>
                      শুরু করো
                      <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
