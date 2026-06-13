"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Zap, Trophy, BookOpen, Users, ChevronRight, Target } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { levelHubPath } from "@/lib/quiz/unified-routes";

function DashboardPreviewCard({ className }: { className?: string }) {
  return (
    <Card variant="glass" className={cn("p-5 border-purple-500/20 glow-purple", className)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xl">
          📊
        </div>
        <div>
          <h3 className="text-base font-bold text-white">তোমার অগ্রগতি</h3>
          <p className="text-xs text-slate-400">কুইজ দিয়ে স্ট্রিক ও র‍্যাঙ্ক বাড়াও</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card variant="dark" className="p-3">
          <p className="text-xs text-slate-400 mb-1">স্ট্রিক</p>
          <p className="text-xl font-bold text-amber-400">—</p>
        </Card>
        <Card variant="dark" className="p-3">
          <p className="text-xs text-slate-400 mb-1">র‍্যাঙ্ক</p>
          <p className="text-xl font-bold text-cyan-400">—</p>
        </Card>
      </div>

      <Link href="/dashboard">
        <Button variant="primary" fullWidth size="sm" className="min-h-[44px]">
          ড্যাশবোর্ড দেখো
        </Button>
      </Link>
    </Card>
  );
}

export function HeroSectionNew() {
  return (
    <section className="relative py-10 md:py-16 overflow-hidden font-bangla scroll-mt-20">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-cyan-900/10 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-5 text-center lg:text-left">
            <Badge variant="premium" className="inline-flex items-center gap-2 motion-reduce:animate-none animate-pulse">
              <Zap className="h-3 w-3" />
              SSC ও HSC বিজ্ঞান MCQ প্ল্যাটফর্ম
            </Badge>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
              অধ্যায়ভিত্তিক কুইজ,{" "}
              <span className="text-gradient-purple">বোর্ড প্রশ্ন</span> ও{" "}
              <span className="text-gradient-gold">মডেল টেস্ট</span>
              <br />
              <span className="text-slate-300">এক জায়গায়</span>
            </h1>

            <p className="text-base text-slate-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              যে অধ্যায় দুর্বল, সেটাই আগে শক্তিশালী করো। MCQ দাও, র‍্যাঙ্ক দেখো, পরীক্ষার আত্মবিশ্বাস বাড়াও।
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-1">
              <Link href={levelHubPath("ssc")} className="w-full sm:w-auto">
                <Button variant="primary" size="lg" fullWidth className="flex items-center justify-center gap-2 group min-h-[48px]">
                  SSC শুরু করো
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href={levelHubPath("hsc")} className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" fullWidth className="flex items-center justify-center gap-2 group min-h-[48px]">
                  HSC শুরু করো
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <Link href="/leaderboard" className="block w-full sm:w-auto sm:inline-block">
              <Button variant="ghost" fullWidth className="flex items-center justify-center gap-2 min-h-[44px] border border-white/10">
                <Trophy className="h-4 w-4 text-yellow-400" />
                লিডারবোর্ড দেখো
              </Button>
            </Link>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-lg mx-auto lg:mx-0">
              {[
                { icon: BookOpen, value: "5000+", label: "MCQ", color: "text-cyan-400" },
                { icon: Users, value: "SSC + HSC", label: "বিজ্ঞান", color: "text-purple-400" },
                { icon: Trophy, value: "২০২২–২০২৬", label: "বোর্ড প্রশ্ন", color: "text-yellow-400" },
                { icon: Target, value: "মডেল", label: "টেস্ট", color: "text-red-400" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="glass-panel rounded-xl p-3 text-center border border-white/10"
                >
                  <stat.icon className={`h-4 w-4 mx-auto mb-1 ${stat.color}`} />
                  <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <DashboardPreviewCard className="hidden lg:block" />
          <DashboardPreviewCard className="lg:hidden mt-2" />
        </div>
      </div>
    </section>
  );
}
