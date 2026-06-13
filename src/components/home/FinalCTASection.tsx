"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Rocket, ChevronRight, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { levelHubPath } from "@/lib/quiz/unified-routes";

export function FinalCTASection() {
  return (
    <section className="py-10 md:py-14 font-bangla">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-5">
          <Badge variant="premium" className="inline-flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            আজ থেকেই শুরু করো
          </Badge>

          <h2 className="text-xl md:text-3xl font-bold text-white leading-tight">
            আজ থেকেই <span className="text-gradient-cyan">SSC/HSC বিজ্ঞান</span> প্রস্তুতি শুরু করো
          </h2>

          <p className="text-slate-400 max-w-2xl mx-auto text-sm">
            অধ্যায়ভিত্তিক কুইজ, বোর্ড প্রশ্ন, মডেল টেস্ট, র‍্যাঙ্কিং ও অগ্রগতি রিপোর্ট — সব এক জায়গায়।
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href={levelHubPath("ssc")} className="w-full sm:w-auto">
              <Button variant="primary" size="lg" fullWidth className="flex items-center justify-center gap-2 group min-h-[48px]">
                <Rocket className="h-5 w-5" />
                ফ্রি শুরু করো
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/leaderboard" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" fullWidth className="flex items-center justify-center gap-2 min-h-[48px]">
                <Trophy className="h-5 w-5" />
                লিডারবোর্ড দেখো
              </Button>
            </Link>
          </div>

          <p className="text-xs text-slate-500 pt-2">
            ক্রেডিট কার্ড লাগবে না • ফ্রি প্ল্যান সবসময় উপলব্ধ
          </p>
        </div>
      </div>
    </section>
  );
}
