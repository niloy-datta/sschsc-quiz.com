"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Loader2, Target } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  levelModelTestsPath,
  unifiedModelTestPathPrefix,
} from "@/lib/quiz/unified-routes";

interface QuizLink {
  title: string;
  subtitle: string;
  href: string;
  sets: number;
  questions?: number;
  accent: "cyan" | "purple";
}

function countSubject(
  manifest: Record<string, unknown>,
  slug: string,
): { sets: number; questions: number } {
  const entry = manifest[slug] as {
    modelTests?: Record<string, { questionCount?: number }>;
    chapters?: Record<string, { questionCount?: number }>;
  } | undefined;
  let sets = 0;
  let questions = 0;
  for (const mt of Object.values(entry?.modelTests || {})) {
    sets++;
    questions += mt.questionCount || 0;
  }
  for (const ch of Object.values(entry?.chapters || {})) {
    sets++;
    questions += ch.questionCount || 0;
  }
  return { sets, questions };
}

export function QuizLibrarySection() {
  const [links, setLinks] = useState<QuizLink[]>([]);
  const [totalSets, setTotalSets] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/quiz-data/manifest.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((manifest) => {
        if (!manifest) {
          setLoading(false);
          return;
        }

        const hsc = manifest.hsc || {};
        const ssc = manifest.ssc || {};

        const items: QuizLink[] = [
          {
            title: "HSC পদার্থবিজ্ঞান ১ম পত্র",
            subtitle: "100 অধ্যায়ভিত্তিক + পত্রভিত্তিক মডেল টেস্ট",
            href: `${unifiedModelTestPathPrefix("hsc", "physics-1st-paper")}?tab=chapter`,
            ...countSubject(hsc, "physics-1st-paper"),
            accent: "purple",
          },
          {
            title: "HSC জীববিজ্ঞান ১ম পত্র",
            subtitle: "60 অধ্যায়ভিত্তিক + 25 পত্রভিত্তিক সেট",
            href: `${unifiedModelTestPathPrefix("hsc", "biology-1st-paper")}?tab=chapter`,
            ...countSubject(hsc, "biology-1st-paper"),
            accent: "purple",
          },
          {
            title: "HSC রসায়ন ১ম পত্র",
            subtitle: "অধ্যায়ভিত্তিক high-priority সেট",
            href: `${unifiedModelTestPathPrefix("hsc", "chemistry-1st-paper")}?tab=chapter`,
            ...countSubject(hsc, "chemistry-1st-paper"),
            accent: "purple",
          },
          {
            title: "HSC উচ্চতর গণিত ১ম পত্র",
            subtitle: "100 অধ্যায়ভিত্তিক মডেল টেস্ট",
            href: `${unifiedModelTestPathPrefix("hsc", "higher-math-1st-paper")}?tab=chapter`,
            ...countSubject(hsc, "higher-math-1st-paper"),
            accent: "purple",
          },
          {
            title: "SSC উচ্চতর গণিত",
            subtitle: "20 মডেল টেস্ট সেট",
            href: unifiedModelTestPathPrefix("ssc", "higher-math"),
            ...countSubject(ssc, "higher-math"),
            accent: "cyan",
          },
          {
            title: "SSC জীববিজ্ঞান",
            subtitle: "বোর্ড স্ট্যান্ডার্ড সেট",
            href: unifiedModelTestPathPrefix("ssc", "biology"),
            ...countSubject(ssc, "biology"),
            accent: "cyan",
          },
          {
            title: "সব HSC মডেল টেস্ট",
            subtitle: "পত্রভিত্তিক + অধ্যায়ভিত্তিক",
            href: levelModelTestsPath("hsc"),
            sets: (Object.values(hsc) as Array<{ modelTests?: Record<string, unknown> }>).reduce(
              (n, d) => n + Object.keys(d.modelTests || {}).length,
              0,
            ),
            accent: "purple",
          },
        ];

        let allSets = 0;
        let allQ = 0;
        for (const level of [ssc, hsc]) {
          for (const entry of Object.values(level) as Array<{
            modelTests?: Record<string, { questionCount?: number }>;
            chapters?: Record<string, { questionCount?: number }>;
          }>) {
            for (const mt of Object.values(entry.modelTests || {})) {
              allSets++;
              allQ += mt.questionCount || 0;
            }
            for (const ch of Object.values(entry.chapters || {})) {
              allSets++;
              allQ += ch.questionCount || 0;
            }
          }
        }

        setLinks(items.filter((l) => l.sets > 0));
        setTotalSets(allSets);
        setTotalQuestions(allQ);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const accentClass = {
    cyan: "border-cyan-500/20 hover:border-cyan-500/40 bg-cyan-500/5",
    purple: "border-purple-500/20 hover:border-purple-500/40 bg-purple-500/5",
  };

  return (
    <section className="py-16 px-4 font-bangla">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-white">কুইজ লাইব্রেরি</h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            তোমার দেওয়া সব quiz data website-এ live — মডেল টেস্ট, অধ্যায়ভিত্তিক সেট, বোর্ড প্রশ্ন
          </p>
          {!loading && totalSets > 0 && (
            <p className="text-cyan-300 font-semibold text-sm">
              মোট {totalSets} সেট · {totalQuestions.toLocaleString()} MCQ
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-glow" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="group block">
                <Card
                  variant="glass"
                  className={`p-5 border transition-all ${accentClass[link.accent]}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {link.title}
                      </h3>
                      <p className="text-xs text-slate-400">{link.subtitle}</p>
                      <p className="text-xs text-emerald-400 font-semibold pt-1">
                        {link.sets} সেট
                        {link.questions ? ` · ${link.questions.toLocaleString()} MCQ` : ""}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-cyan-400 shrink-0" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <Link href={levelModelTestsPath("hsc", "tab=chapter")}>
            <Button variant="secondary" className="gap-2 min-h-[44px]">
              <Target className="h-4 w-4" />
              HSC অধ্যায়ভিত্তিক মডেল টেস্ট
            </Button>
          </Link>
          <Link href={levelModelTestsPath("hsc", "tab=paper")}>
            <Button className="gap-2 min-h-[44px]">
              <BookOpen className="h-4 w-4" />
              HSC পত্রভিত্তিক মডেল টেস্ট
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
