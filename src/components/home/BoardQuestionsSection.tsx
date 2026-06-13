"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FileText, Lock, ChevronRight } from "lucide-react";
import Link from "next/link";

const years = ["2022", "2023", "2024", "2025", "2026"];

const boardData = [
  {
    level: "SSC",
    levelBn: "এসএসসি",
    subjects: ["পদার্থবিজ্ঞান", "রসায়ন", "জীববিজ্ঞান", "উচ্চতর গণিত", "সাধারণ গণিত"],
    availableYears: [] as string[],
    boardHref: null as string | null,
    yearHref: (_year: string) => null,
  },
  {
    level: "HSC",
    levelBn: "এইচএসসি",
    subjects: ["পদার্থবিজ্ঞান", "রসায়ন", "জীববিজ্ঞান", "উচ্চতর গণিত", "আইসিটি"],
    availableYears: ["2023", "2024"],
    boardHref: "/hsc-board-questions",
    yearHref: (year: string) =>
      `/hsc-board-questions/physics/1st-paper/${year}`,
  },
];

export function BoardQuestionsSection() {
  return (
    <section className="py-16 font-bangla">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            বোর্ড প্রশ্ন দিয়ে <span className="text-gradient-gold">Final Preparation</span>
          </h2>
          <p className="text-slate-400 mt-2">
            Board Questions 2022–2026 — আসল পরীক্ষার প্রস্তুতি
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {boardData.map((data) => (
            <Card key={data.level} variant="glass" className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                  data.level === "SSC" 
                    ? "bg-cyan-500/20 text-cyan-400" 
                    : "bg-purple-500/20 text-purple-400"
                }`}>
                  {data.level}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{data.levelBn} বোর্ড প্রশ্ন</h3>
                  <p className="text-sm text-slate-400">বিজ্ঞান বিভাগ</p>
                </div>
              </div>

              {/* Years */}
              <div className="mb-6">
                <p className="text-sm text-slate-400 mb-3">বছর নির্বাচন করো</p>
                <div className="flex flex-wrap gap-2">
                  {years.map((year) => {
                    const isAvailable = data.availableYears.includes(year);
                    const href = isAvailable ? data.yearHref(year) : null;

                    if (href) {
                      return (
                        <Link key={year} href={href}>
                          <Badge variant="success" className="cursor-pointer hover:bg-success/20">
                            {year}
                          </Badge>
                        </Link>
                      );
                    }

                    return (
                      <Badge
                        key={year}
                        variant="default"
                        className="opacity-60 cursor-default"
                      >
                        <Lock className="h-3 w-3 mr-1" />
                        {year} — শীঘ্রই আসছে
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Subjects */}
              <div>
                <p className="text-sm text-slate-400 mb-3">বিষয়সমূহ</p>
                <div className="flex flex-wrap gap-2">
                  {data.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="px-3 py-1 rounded-full bg-slate-800/50 text-slate-300 text-xs border border-slate-700"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              {data.boardHref ? (
                <Link href={data.boardHref}>
                  <div className="mt-6 flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <span className="text-sm text-slate-300">সব বোর্ড প্রশ্ন দেখো</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ) : (
                <div className="mt-6 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 text-sm text-slate-500 text-center">
                  এসএসসি বোর্ড প্রশ্ন শীঘ্রই যোগ হবে
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
