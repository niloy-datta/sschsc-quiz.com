"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Atom,
  FlaskConical,
  Dna,
  Calculator,
  ChevronRight,
  BookOpen,
  Target,
  ClipboardList,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { levelHubPath } from "@/lib/quiz/unified-routes";

const quickActions = [
  {
    href: "#explore-subjects",
    label: "অধ্যায় অনুশীলন",
    subtitle: "অধ্যায় ধরে MCQ",
    icon: BookOpen,
    color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-300",
  },
  {
    href: `${levelHubPath("ssc")}/model-tests`,
    label: "মডেল টেস্ট",
    subtitle: "সম্পূর্ণ পরীক্ষা",
    icon: Target,
    color: "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-300",
  },
  {
    href: "/hsc-board-questions",
    label: "বোর্ড প্রশ্ন",
    subtitle: "বোর্ড পরীক্ষা",
    icon: ClipboardList,
    color: "from-yellow-500/20 to-amber-600/10 border-yellow-500/30 text-yellow-300",
  },
  {
    href: "/leaderboard",
    label: "লিডারবোর্ড",
    subtitle: "র‍্যাঙ্ক দেখো",
    icon: Trophy,
    color: "from-pink-500/20 to-rose-600/10 border-pink-500/30 text-pink-300",
  },
];

const sscSubjects = [
  { name: "Physics", icon: Atom, bnName: "পদার্থবিজ্ঞান" },
  { name: "Chemistry", icon: FlaskConical, bnName: "রসায়ন" },
  { name: "Biology", icon: Dna, bnName: "জীববিজ্ঞান" },
  { name: "Higher Math", icon: Calculator, bnName: "উচ্চতর গণিত" },
  { name: "General Math", icon: Calculator, bnName: "সাধারণ গণিত" },
];

const hscSubjects = [
  { name: "Physics", icon: Atom, bnName: "পদার্থবিজ্ঞান (১ম ও ২য় পত্র)" },
  { name: "Chemistry", icon: FlaskConical, bnName: "রসায়ন (১ম ও ২য় পত্র)" },
  { name: "Biology", icon: Dna, bnName: "জীববিজ্ঞান (১ম ও ২য় পত্র)" },
  { name: "Higher Math", icon: Calculator, bnName: "উচ্চতর গণিত (১ম ও ২য় পত্র)" },
];

export function QuickStartSection() {
  return (
    <section id="quick-actions" className="py-10 md:py-14 font-bangla scroll-mt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl md:text-2xl font-bold text-center text-white mb-6">
          আজ কী করব? <span className="text-gradient-cyan">দ্রুত শুরু করো</span>
        </h2>

        <div className="grid grid-cols-2 gap-3 mb-10">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className={`flex min-h-[88px] flex-col justify-between rounded-2xl border bg-gradient-to-br p-4 transition active:scale-95 hover:border-white/20 ${action.color}`}
              >
                <Icon className="h-6 w-6" />
                <div>
                  <p className="font-bold text-white text-sm leading-snug">{action.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{action.subtitle}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <h3 className="text-lg font-bold text-center text-white mb-6">
          তোমার <span className="text-gradient-cyan">SSC</span> অথবা{" "}
          <span className="text-gradient-purple">HSC</span> বেছে নাও
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="glass" className="p-6 glass-panel-cyan hoverable">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                <span className="text-xl font-bold text-white">SSC</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">SSC বিজ্ঞান</h3>
                <p className="text-sm text-slate-400">নবম-দশম শ্রেণি</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {sscSubjects.map((subject) => (
                <div key={subject.name} className="flex items-center gap-2 text-sm text-slate-300">
                  <subject.icon className="h-4 w-4 text-cyan-400" />
                  <span>{subject.bnName}</span>
                </div>
              ))}
            </div>

            <Link href={levelHubPath("ssc")}>
              <Button variant="secondary" fullWidth className="flex items-center justify-center gap-2 group min-h-[44px]">
                SSC শুরু করো
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </Card>

          <Card variant="glass" className="p-6 glass-panel-purple hoverable">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <span className="text-xl font-bold text-white">HSC</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">HSC বিজ্ঞান</h3>
                <p className="text-sm text-slate-400">একাদশ-দ্বাদশ শ্রেণি</p>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {hscSubjects.map((subject) => (
                <div key={subject.name} className="flex items-center gap-2 text-sm text-slate-300">
                  <subject.icon className="h-4 w-4 text-purple-400" />
                  <span>{subject.bnName}</span>
                </div>
              ))}
            </div>

            <Link href={levelHubPath("hsc")}>
              <Button variant="primary" fullWidth className="flex items-center justify-center gap-2 group min-h-[44px]">
                HSC শুরু করো
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </section>
  );
}
