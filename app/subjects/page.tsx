"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BookOpen, GraduationCap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { unifiedSubjectBasePath } from "@/lib/quiz/unified-routes";

const SSC_SUBJECTS = [
  { name: "পদার্থবিজ্ঞান", slug: "physics", desc: "গতি, বল, কাজ ও শক্তি এবং আলোকবিজ্ঞান", color: "from-cyan-500 to-blue-600" },
  { name: "রসায়ন", slug: "chemistry", desc: "পদার্থের গঠন, রাসায়নিক বন্ধন ও অম্ল-ক্ষারক সমতা", color: "from-emerald-500 to-teal-600" },
  { name: "জীববিজ্ঞান", slug: "biology", desc: "কোষ বিভাজন, সালোকসংশ্লেষণ ও মানব শারীরবৃত্ত", color: "from-green-500 to-emerald-600" },
  { name: "উচ্চতর গণিত", slug: "higher-math", desc: "ত্রিকোণমিতি, বীজগণিতীয় সূত্র ও স্থানাঙ্ক জ্যামিতি", color: "from-indigo-500 to-purple-600" },
  { name: "সাধারণ গণিত", slug: "math", desc: "বাস্তব সংখ্যা, সেট-ফাংশন ও পরিমিতি", color: "from-pink-500 to-rose-600" },
];

const HSC_SUBJECTS = [
  { name: "পদার্থবিজ্ঞান ১ম পত্র", slug: "physics-1st-paper", desc: "ভেক্টর, নিউটনীয় বলবিদ্যা ও আদর্শ গ্যাস", color: "from-cyan-500 to-blue-600" },
  { name: "পদার্থবিজ্ঞান ২য় পত্র", slug: "physics-2nd-paper", desc: "তাপগতিবিদ্যা, স্থির তড়িৎ ও আধুনিক পদার্থবিজ্ঞান", color: "from-blue-500 to-indigo-600" },
  { name: "রসায়ন ১ম পত্র", slug: "chemistry-1st-paper", desc: "গুণগত রসায়ন, মৌলের পর্যায়বৃত্ত ধর্ম", color: "from-emerald-500 to-teal-600" },
  { name: "রসায়ন ২য় পত্র", slug: "chemistry-2nd-paper", desc: "তড়িৎ রসায়ন ও জৈব রসায়ন বিশদ আলোচনা", color: "from-teal-500 to-green-600" },
  { name: "জীববিজ্ঞান ১ম পত্র", slug: "biology-1st-paper", desc: "কোষ ও এর গঠন, জিনতত্ত্ব ও বিবর্তন", color: "from-green-500 to-emerald-600" },
  { name: "জীববিজ্ঞান ২য় পত্র", slug: "biology-2nd-paper", desc: "প্রাণীর পরিচিতি ও মানব শারীরতত্ত্ব", color: "from-emerald-600 to-teal-600" },
  { name: "উচ্চতর গণিত ১ম পত্র", slug: "higher-math-1st-paper", desc: "ম্যাট্রিক্স-নির্ণায়ক, ক্যালকুলাস ও ভেক্টর", color: "from-indigo-500 to-purple-600" },
  { name: "উচ্চতর গণিত ২য় পত্র", slug: "higher-math-2nd-paper", desc: "বাস্তব সংখ্যা, স্থিতিবিদ্যা ও গতিবিদ্যা", color: "from-purple-500 to-pink-600" },
];

export default function SubjectsPage() {
  const [levelTab, setLevelTab] = useState<"ssc" | "hsc">("hsc");

  const subjects = levelTab === "ssc" ? SSC_SUBJECTS : HSC_SUBJECTS;

  return (
    <div className="min-h-screen bg-[#07111F] py-10 pb-24 font-bangla text-white">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="text-center mb-10 space-y-3">
          <Badge variant="default" className="bg-cyan-500/10 border-cyan-500/20 text-cyan-300 gap-1.5 py-1 px-3">
            <GraduationCap className="h-4 w-4" />
            <span>শিক্ষাক্রম তালিকা</span>
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black">বিষয়সমূহ নির্বাচন করো</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            অধ্যায়ভিত্তিক এমসিকিউ অনুশীলন ও নিজেকে যাচাই করতে তোমার কাঙ্ক্ষিত বিষয় সিলেক্ট করো।
          </p>
        </div>

        {/* Level Selector Tabs */}
        <div className="flex gap-3 justify-center mb-8">
          <button
            type="button"
            onClick={() => setLevelTab("ssc")}
            className={cn(
              "min-h-[46px] px-6 py-2.5 rounded-2xl text-sm font-bold border transition-all duration-300",
              levelTab === "ssc"
                ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                : "bg-white/5 text-slate-400 border-white/5 hover:border-white/10"
            )}
          >
            SSC (মাধ্যমিক)
          </button>
          <button
            type="button"
            onClick={() => setLevelTab("hsc")}
            className={cn(
              "min-h-[46px] px-6 py-2.5 rounded-2xl text-sm font-bold border transition-all duration-300",
              levelTab === "hsc"
                ? "bg-purple-500/20 text-purple-300 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                : "bg-white/5 text-slate-400 border-white/5 hover:border-white/10"
            )}
          >
            HSC (উচ্চ মাধ্যমিক)
          </button>
        </div>

        {/* Subjects List Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subj) => {
            const targetPath = unifiedSubjectBasePath(levelTab, subj.slug);

            return (
              <Link href={targetPath} key={subj.slug} className="group">
                <Card
                  variant="glass"
                  className="p-5 h-full border-white/5 bg-slate-950/20 hover:border-white/10 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group-hover:shadow-[0_0_20px_rgba(255,255,255,0.02)]"
                >
                  {/* Decorative background gradient */}
                  <div className={cn(
                    "absolute -right-16 -top-16 h-32 w-32 rounded-full opacity-10 blur-2xl bg-gradient-to-br transition-all group-hover:scale-125",
                    subj.color
                  )} />

                  <div className="space-y-3 relative z-10">
                    <div className={cn(
                      "inline-flex p-2.5 rounded-xl bg-gradient-to-br text-white shadow-sm",
                      subj.color
                    )}>
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold group-hover:text-cyan-300 transition-colors leading-snug">{subj.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{subj.desc}</p>
                  </div>

                  <div className="pt-4 flex items-center text-xs font-bold text-cyan-400 group-hover:text-cyan-300 transition-all gap-1 mt-auto relative z-10">
                    <span>প্রস্তুতি শুরু করো</span>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
