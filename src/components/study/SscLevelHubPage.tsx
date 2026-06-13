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
} from "lucide-react";
import { fetchSubjects } from "@/lib/quiz-api";
import { SSC_CATALOG, SSC_MATH_CATALOG, SSC_SCIENCE_CATALOG } from "@/lib/quiz-catalog";
import {
  levelHubPath,
  levelModelTestsPath,
  unifiedSubjectBasePath,
} from "@/lib/quiz/unified-routes";
import type { ApiSubject } from "@/types/quiz";

const subjectIcons: Record<string, React.ElementType> = {
  physics: Atom,
  chemistry: FlaskConical,
  biology: Dna,
  "higher-math": Calculator,
  "general-math": Calculator,
};

const subjectColors: Record<string, string> = {
  physics: "cyan",
  chemistry: "purple",
  biology: "green",
  "higher-math": "gold",
  "general-math": "blue",
};

export function SscLevelHubPage() {
  const [subjects, setSubjects] = useState<ApiSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects("SSC").then((list) => {
      setSubjects(list.length ? list : fallbackList());
      setLoading(false);
    });
  }, []);

  function fallbackList(): ApiSubject[] {
    return SSC_CATALOG.map((s) => ({
      id: s.slug,
      name: s.name,
      slug: s.slug,
      category: "SSC",
    }));
  }

  const scienceSubjects = subjects.filter((s) =>
    SSC_SCIENCE_CATALOG.some((c) => c.slug === s.slug),
  );
  const mathSubjects = subjects.filter((s) =>
    SSC_MATH_CATALOG.some((c) => c.slug === s.slug),
  );

  function renderSubjectGrid(list: ApiSubject[]) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {list.map((subject) => {
          const Icon = subjectIcons[subject.slug] || BookOpen;
          const color = subjectColors[subject.slug] || "cyan";

          return (
            <Link
              key={subject.slug}
              href={`${unifiedSubjectBasePath("ssc", subject.slug)}?tab=chapter`}
            >
              <Card variant="glass" className="p-6 hoverable group glass-panel-cyan">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                      color === "cyan"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : color === "purple"
                          ? "bg-purple-500/20 text-purple-400"
                          : color === "green"
                            ? "bg-green-500/20 text-green-400"
                            : color === "gold"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge variant="default" className="text-[10px]">
                    ১০+ অধ্যায়
                  </Badge>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{subject.name}</h3>
                <p className="text-sm text-slate-400 mb-4">
                  অধ্যায়ভিত্তিক MCQ ও মডেল টেস্ট
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      ২০০+ MCQ
                    </span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                    <ChevronRight className="h-4 w-4 text-cyan-400" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bangla">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-slate-400">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-bangla pb-24">
      <section className="py-12 md:py-16 bg-gradient-to-b from-cyan-900/10 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="default" className="inline-flex items-center gap-2 mb-4">
              <BookOpen className="h-3 w-3" />
              Class 9-10 Science Group
            </Badge>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
              <span className="text-gradient-cyan">SSC Science</span> প্রস্তুতি
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto">
              তোমার subject বেছে নাও — অধ্যায়ভিত্তিক কুইজ, মডেল টেস্ট ও বোর্ড প্রশ্ন একসাথে
            </p>
          </div>

          <div className="space-y-10">
            <div>
              <h2 className="mb-4 text-center text-sm font-bold uppercase tracking-wider text-cyan-400/90">
                বিজ্ঞান বিষয়
              </h2>
              {renderSubjectGrid(scienceSubjects)}
            </div>
            <div>
              <h2 className="mb-4 text-center text-sm font-bold uppercase tracking-wider text-amber-400/90">
                গণিত বিষয়
              </h2>
              {renderSubjectGrid(mathSubjects)}
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Link href="/ssc-board-questions">
              <Card variant="glass" className="p-4 flex items-center gap-4 hoverable">
                <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-purple-400" />
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
            className="max-w-3xl mx-auto p-6 md:p-8 text-center border-cyan-500/20 bg-gradient-to-br from-[#07111F] via-[#0D1826] to-[#07111F]"
          >
            <h3 className="text-xl font-bold text-white mb-2">
              SSC মডেল টেস্ট ও বোর্ড প্রশ্ন
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              রিয়েল এক্সাম মোডে পরীক্ষা দাও — টাইমার, স্কোর ও বিস্তারিত ফলাফল বিশ্লেষণ
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={levelModelTestsPath("ssc")}>
                <Button variant="primary" className="flex items-center gap-2 min-h-[44px]">
                  <Target className="h-4 w-4" />
                  ফ্রি মডেল টেস্ট
                </Button>
              </Link>
              <Link href="/ssc-board-questions">
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
