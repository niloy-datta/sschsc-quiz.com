"use client";

import React from "react";
import Link from "next/link";
import { BookOpenCheck, Gauge, RefreshCcw, Sparkles, Target, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { levelHubPath } from "@/lib/quiz/unified-routes";

const loopSteps = [
  { title: "দুর্বল অধ্যায় ধরো", text: "যেটা কম পারো, সেটাই আগে practice list-এ আনো।", icon: Target, tone: "text-cyan-300 border-cyan-400/25 bg-cyan-500/10" },
  { title: "৫ মিনিট MCQ দাও", text: "ছোট session, দ্রুত result—mobile-eও সহজ।", icon: Gauge, tone: "text-purple-300 border-purple-400/25 bg-purple-500/10" },
  { title: "ভুলগুলো retake করো", text: "একবার ভুল মানে শেষ না—review loop score বাড়ায়।", icon: RefreshCcw, tone: "text-amber-300 border-amber-400/25 bg-amber-500/10" },
  { title: "র‍্যাঙ্কে উঠো", text: "প্রতিদিন ছোট progress জমে বড় confidence হয়।", icon: Trophy, tone: "text-rose-300 border-rose-400/25 bg-rose-500/10" },
];

function StudyLoopSvg() {
  return (
    <svg viewBox="0 0 420 300" className="h-full min-h-[260px] w-full" role="img" aria-label="Study loop visual">
      <defs>
        <linearGradient id="loopGlow" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#a855f7" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <rect x="18" y="18" width="384" height="264" rx="28" fill="#08111f" stroke="#334155" strokeOpacity="0.9" />
      <circle cx="210" cy="150" r="88" fill="none" stroke="url(#loopGlow)" strokeWidth="8" strokeDasharray="38 18" />
      <circle cx="210" cy="150" r="48" fill="#0f172a" stroke="#475569" strokeWidth="2" />
      <text x="210" y="138" fill="#e2e8f0" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="700" textAnchor="middle">5 min</text>
      <text x="210" y="162" fill="#94a3b8" fontFamily="Arial, sans-serif" fontSize="12" textAnchor="middle">study loop</text>
      {[[210, 48, "1"], [318, 150, "2"], [210, 252, "3"], [102, 150, "4"]].map(([cx, cy, label]) => (
        <g key={label}>
          <circle cx={cx} cy={cy} r="24" fill="#111827" stroke="#22d3ee" strokeOpacity="0.55" strokeWidth="2" />
          <text x={cx} y={Number(cy) + 6} fill="#f8fafc" fontFamily="Arial, sans-serif" fontSize="17" fontWeight="700" textAnchor="middle">{label}</text>
        </g>
      ))}
    </svg>
  );
}

export function StudyLoopSection() {
  return (
    <section className="relative overflow-hidden py-10 md:py-16 font-bangla">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-5">
          <Badge variant="premium" className="mb-4 inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> smart study loop
          </Badge>
          <h2 className="text-2xl font-black leading-tight text-white md:text-4xl">
            প্রতিদিন ছোট progress—<span className="text-gradient-cyan"> পরীক্ষার confidence বেশি</span>
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-400 md:text-base">
            বড় syllabus দেখে আটকে না গিয়ে clear next step দেখাও: weak chapter, quick quiz, retake, rank.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href={levelHubPath("ssc")} className="w-full sm:w-auto">
              <Button variant="primary" fullWidth className="min-h-[46px] gap-2"><BookOpenCheck className="h-4 w-4" /> SSC loop শুরু</Button>
            </Link>
            <Link href={levelHubPath("hsc")} className="w-full sm:w-auto">
              <Button variant="secondary" fullWidth className="min-h-[46px] gap-2"><Target className="h-4 w-4" /> HSC loop শুরু</Button>
            </Link>
          </div>
        </div>

        <Card variant="glass" className="relative overflow-hidden p-4 lg:col-span-3">
          <StudyLoopSvg />
        </Card>

        <div className="grid gap-3 lg:col-span-4">
          {loopSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} variant="glass" className="p-4 hoverable border-white/10">
                <div className="flex gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${step.tone}`}><Icon className="h-5 w-5" /></div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Step {index + 1}</p>
                    <h3 className="mt-1 font-black text-white">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{step.text}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
