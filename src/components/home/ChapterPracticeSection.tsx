"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Atom, FlaskConical, Dna, Calculator, ChevronRight, Target } from "lucide-react";
import Link from "next/link";
import { unifiedSubjectBasePath } from "@/lib/quiz/unified-routes";

const subjects = [
  {
    id: "physics",
    name: "পদার্থবিজ্ঞান",
    chapters: 12,
    mcqs: 450,
    icon: Atom,
    color: "cyan",
    href: unifiedSubjectBasePath("hsc", "physics-1st-paper"),
  },
  {
    id: "chemistry",
    name: "রসায়ন",
    chapters: 10,
    mcqs: 380,
    icon: FlaskConical,
    color: "purple",
    href: unifiedSubjectBasePath("hsc", "chemistry-1st-paper"),
  },
  {
    id: "biology",
    name: "জীববিজ্ঞান",
    chapters: 11,
    mcqs: 420,
    icon: Dna,
    color: "green",
    href: unifiedSubjectBasePath("hsc", "biology-1st-paper"),
  },
  {
    id: "math",
    name: "উচ্চতর গণিত",
    chapters: 14,
    mcqs: 520,
    icon: Calculator,
    color: "gold",
    href: unifiedSubjectBasePath("hsc", "higher-math-1st-paper"),
  },
  {
    id: "general-math",
    name: "সাধারণ গণিত",
    chapters: 10,
    mcqs: 350,
    icon: Calculator,
    color: "cyan",
    href: unifiedSubjectBasePath("ssc", "math"),
  },
];

export function ChapterPracticeSection() {
  return (
    <section
      id="explore-subjects"
      className="py-10 md:py-14 font-bangla bg-gradient-to-b from-transparent via-purple-900/5 to-transparent scroll-mt-36"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            বিষয় বেছে নিয়ে <span className="text-gradient-cyan">অধ্যায় অনুশীলন</span> করো
          </h2>
          <p className="text-slate-400 mt-2 text-sm">
            অধ্যায়ভিত্তিক MCQ — যেখানে দুর্বল, সেখান থেকেই শুরু করো
          </p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible">
          {subjects.map((subject) => (
            <Card
              key={subject.id}
              variant="glass"
              className="p-5 hoverable group min-w-[280px] snap-center md:min-w-0"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      subject.color === "cyan"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : subject.color === "purple"
                          ? "bg-purple-500/20 text-purple-400"
                          : subject.color === "green"
                            ? "bg-green-500/20 text-green-400"
                            : subject.color === "gold"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    <subject.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{subject.name}</h3>
                    <p className="text-xs text-slate-500">অধ্যায় অনুশীলন</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">অধ্যায়</span>
                  <span className="text-white font-medium">{subject.chapters}টি</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">MCQ</span>
                  <span className="text-white font-medium">{subject.mcqs}+</span>
                </div>
              </div>

              <Link href={subject.href}>
                <Button
                  variant="ghost"
                  fullWidth
                  className="flex items-center justify-center gap-2 group/btn min-h-[44px]"
                >
                  <Target className="h-4 w-4" />
                  অনুশীলন শুরু করো
                  <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
