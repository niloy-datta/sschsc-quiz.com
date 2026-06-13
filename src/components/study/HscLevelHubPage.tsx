"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Atom,
  FlaskConical,
  Dna,
  Calculator,
  ChevronRight,
  Target,
  BookOpen,
  Trophy,
  Loader2,
  Layers,
} from "lucide-react";
import { fetchSubjects } from "@/lib/quiz-api";
import { HSC_SCIENCE_PAPERS } from "@/lib/quiz-catalog";
import {
  levelModelTestsPath,
  unifiedSubjectBasePath,
} from "@/lib/quiz/unified-routes";
import type { ApiSubject } from "@/types/quiz";

const subjectIcons: Record<string, React.ElementType> = {
  physics: Atom,
  chemistry: FlaskConical,
  biology: Dna,
  "higher-math": Calculator,
};

const subjectColors: Record<string, string> = {
  physics: "purple",
  chemistry: "cyan",
  biology: "green",
  "higher-math": "gold",
};

const subjectNames: Record<string, string> = {
  physics: "পদার্থবিজ্ঞান",
  chemistry: "রসায়ন",
  biology: "জীববিজ্ঞান",
  "higher-math": "উচ্চতর গণিত",
};

export function HscLevelHubPage() {
  const [subjects, setSubjects] = useState<ApiSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects("HSC").then((list) => {
      setSubjects(list.length ? list : fallbackList());
      setLoading(false);
    });
  }, []);

  function fallbackList(): ApiSubject[] {
    return HSC_SCIENCE_PAPERS.map((p) => ({
      id: `${p.subject}-${p.paper}`,
      name: p.name,
      slug: `${p.subject}-${p.paper}`,
      category: "HSC",
    }));
  }

  const groupedSubjects = subjects.reduce(
    (acc, subject) => {
      let baseSubject = subject.slug;
      if (subject.slug.endsWith("-1st-paper")) {
        baseSubject = subject.slug.replace(/-1st-paper$/, "");
      } else if (subject.slug.endsWith("-2nd-paper")) {
        baseSubject = subject.slug.replace(/-2nd-paper$/, "");
      }
      if (!acc[baseSubject]) acc[baseSubject] = [];
      acc[baseSubject].push(subject);
      return acc;
    },
    {} as Record<string, ApiSubject[]>,
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bangla">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-slate-400">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-bangla pb-24">
      <section className="py-12 md:py-16 bg-gradient-to-b from-purple-900/10 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="default" className="inline-flex items-center gap-2 mb-4">
              <Layers className="h-3 w-3" />
              Class 11-12 Science Group
            </Badge>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
              <span className="text-gradient-purple">HSC Science</span> প্রস্তুতি
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Paper অনুযায়ী practice করো — ১ম ও ২য় পত্রের জন্য আলাদা আলাদা কুইজ ও মডেল টেস্ট
            </p>
          </div>

          <div className="space-y-8 max-w-5xl mx-auto">
            {Object.entries(groupedSubjects).map(([baseSubject, papers]) => {
              const Icon = subjectIcons[baseSubject] || BookOpen;
              const color = subjectColors[baseSubject] || "purple";

              return (
                <div key={baseSubject}>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        color === "purple"
                          ? "bg-purple-500/20 text-purple-400"
                          : color === "cyan"
                            ? "bg-cyan-500/20 text-cyan-400"
                            : color === "green"
                              ? "bg-green-500/20 text-green-400"
                              : color === "gold"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-bold text-white">
                      {subjectNames[baseSubject] || baseSubject}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {papers.map((paper) => (
                      <Link
                        key={paper.slug}
                        href={unifiedSubjectBasePath("hsc", paper.slug)}
                      >
                        <Card variant="glass" className="p-5 hoverable glass-panel-purple">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-white">{paper.name}</h3>
                              <p className="text-xs text-slate-400 mt-1">
                                অধ্যায়ভিত্তিক MCQ ও মডেল টেস্ট
                              </p>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                              <ChevronRight className="h-4 w-4 text-purple-400" />
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Link href="/hsc-board-questions">
              <Card variant="glass" className="p-4 flex items-center gap-4 hoverable">
                <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white">বোর্ড প্রশ্ন</h4>
                  <p className="text-xs text-slate-400">২০২২-২০২৬</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Card>
            </Link>

            <Link href="/live-test">
              <Card variant="glass" className="p-4 flex items-center gap-4 hoverable border-red-500/20">
                <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white">লাইভ টেস্ট</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
                    আসন্ন
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Card>
            </Link>

            <Link href="/leaderboard">
              <Card variant="glass" className="p-4 flex items-center gap-4 hoverable">
                <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white">লিডারবোর্ড</h4>
                  <p className="text-xs text-slate-400">Top Students</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Card>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-5xl mx-auto">
          <Card
            variant="glass"
            className="max-w-3xl mx-auto p-6 md:p-8 text-center border-purple-500/20 bg-gradient-to-br from-[#07111F] via-[#0E1726] to-[#07111F]"
          >
            <h3 className="text-xl font-bold text-white mb-2">
              HSC মডেল টেস্ট ও বোর্ড প্রশ্ন
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              রিয়েল এক্সাম মোডে পরীক্ষা দাও — টাইমার, স্কোর ও বিস্তারিত ফলাফল বিশ্লেষণ
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={levelModelTestsPath("hsc", "tab=paper")}>
                <Button variant="primary" className="flex items-center gap-2 min-h-[44px]">
                  <Target className="h-4 w-4" />
                  পত্রভিত্তিক মডেল টেস্ট
                </Button>
              </Link>
              <Link href={levelModelTestsPath("hsc", "tab=chapter")}>
                <Button variant="secondary" className="flex items-center gap-2 min-h-[44px]">
                  <Target className="h-4 w-4" />
                  অধ্যায়ভিত্তিক মডেল টেস্ট
                </Button>
              </Link>
              <Link href="/hsc-board-questions">
                <Button variant="secondary" className="flex items-center gap-2 min-h-[44px]">
                  <Trophy className="h-4 w-4" />
                  বোর্ড প্রশ্ন ব্যাংক
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
