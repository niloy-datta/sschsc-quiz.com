"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  Check, 
  Zap, 
  Target, 
  BookOpen, 
  Trophy,
  FileText,
  Sparkles,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { levelHubPath } from "@/lib/quiz/unified-routes";

const allFreeFeatures = [
  "অধ্যায়ভিত্তিক কুইজ (SSC & HSC)",
  "বোর্ড প্রশ্ন (Interactive MCQ)",
  "পূর্ণাঙ্গ মডেল টেস্ট ও স্কোর",
  "লাইভ ব্যাটল টেস্ট অ্যাক্সেস 🔴",
  "দুর্বল অধ্যায় ট্র্যাকিং",
  "ভুল উত্তর পুনরায় Practice",
  "ফাইনাল ফোকাস সাজেশন",
  "প্রোফাইল র‍্যাঙ্কিং ও ব্যাজ",
  "১০০% বিজ্ঞাপন-মুক্ত অভিজ্ঞতা",
  "সম্পূর্ণ ফ্রি ও আনলকড",
];

export function PremiumSection() {
  return (
    <section className="py-16 font-bangla bg-gradient-to-b from-transparent via-cyan-950/10 to-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <Badge variant="default" className="inline-flex items-center gap-2 mb-4 bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            সব ফ্রি প্রস্তুতি
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            অধ্যায়ভিত্তিক কুইজ, মডেল টেস্ট, লাইভ টেস্ট ও বোর্ড প্রশ্ন — <span className="text-gradient-purple">সব এক জায়গায় ফ্রি</span>
          </h2>
          <p className="text-slate-400 mt-2">
            কোনো লক বা সাবস্ক্রিপশন ফি নেই, সম্পূর্ণ আনলকড ও ফ্রি প্ল্যাটফর্ম।
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card variant="glass" className="p-8 relative overflow-hidden border-cyan-500/20 bg-gradient-to-br from-[#07111F]/80 via-[#0D1E36]/50 to-[#07111F]/80">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">ফ্রি ও আনলিমিটেড</h3>
                    <p className="text-sm text-cyan-400">বিজ্ঞান শিক্ষার্থীদের সেরা প্ল্যাটফর্ম</p>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  বিজ্ঞান র্যাঙ্কার তোমাদের জন্য নিয়ে এসেছে সম্পূর্ণ ফ্রি পড়াশোনার সুযোগ। এসএসসি ও এইচএসসি পরীক্ষার সেরা প্রস্তুতির জন্য প্রয়োজনীয় সকল অধ্যায়, বোর্ড প্রশ্ন ও লাইভ কুইজ ব্যাটল আজই শুরু করো।
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={levelHubPath("ssc")} className="flex-1">
                    <Button variant="primary" fullWidth size="lg" className="min-h-[44px]">
                      SSC প্রস্তুতি
                    </Button>
                  </Link>
                  <Link href={levelHubPath("hsc")} className="flex-1">
                    <Button variant="secondary" fullWidth size="lg" className="min-h-[44px]">
                      HSC প্রস্তুতি
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-900/40 p-5 rounded-2xl border border-white/5">
                {allFreeFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-emerald-400" />
                    </div>
                    <span className="text-xs font-medium text-slate-200">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Trust indicators */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-cyan-400" />
            <span>১০০% ফ্রি ও আনলকড</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-400" />
            <span>SSC ও HSC বিজ্ঞান র্যাঙ্কার</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-400" />
            <span>যেকোনো ডিভাইসে কাজ করে</span>
          </div>
        </div>
      </div>
    </section>
  );
}
