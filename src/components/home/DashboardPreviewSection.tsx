"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  BarChart3,
  ChevronRight,
  Target,
  TrendingUp,
  BookOpen,
  Flame,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    label: "Total Score",
    description: "কুইজ থেকে অর্জিত ELO স্কোর",
    icon: Target,
    color: "cyan",
  },
  {
    label: "Current Rank",
    description: "লিডারবোর্ডে তোমার অবস্থান",
    icon: TrendingUp,
    color: "purple",
  },
  {
    label: "Accuracy",
    description: "সঠিক উত্তরের হার",
    icon: BarChart3,
    color: "green",
  },
  {
    label: "Completed Quiz",
    description: "সম্পন্ন পরীক্ষার সংখ্যা",
    icon: BookOpen,
    color: "blue",
  },
  {
    label: "Study Streak",
    description: "ধারাবাহিক অনুশীলন",
    icon: Flame,
    color: "orange",
  },
];

export function DashboardPreviewSection() {
  return (
    <section className="py-16 font-bangla">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            তোমার <span className="text-gradient-cyan">Progress</span> এক নজরে
          </h2>
          <p className="text-slate-400 mt-2">
            লগইন করে Dashboard-এ তোমার আসল পরিসংখ্যান দেখো
          </p>
        </div>

        <Card variant="glass" className="max-w-3xl mx-auto p-6 md:p-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
            {features.map((stat) => (
              <div key={stat.label} className="text-center p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${
                    stat.color === "cyan"
                      ? "bg-cyan-500/20 text-cyan-400"
                      : stat.color === "purple"
                        ? "bg-purple-500/20 text-purple-400"
                        : stat.color === "green"
                          ? "bg-green-500/20 text-green-400"
                          : stat.color === "blue"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-orange-500/20 text-orange-400"
                  }`}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-white">{stat.label}</p>
                <p className="text-[10px] text-slate-500 mt-1">{stat.description}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-slate-400 text-center mb-6">
            কুইজ দিলেই স্কোর, র‍্যাঙ্ক ও দুর্বল অধ্যায়ের রিপোর্ট স্বয়ংক্রিয়ভাবে আপডেট হয়।
          </p>

          <Link href="/dashboard">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              className="flex items-center justify-center gap-2 group"
            >
              <BarChart3 className="h-5 w-5" />
              Dashboard-এ যাও
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </Card>
      </div>
    </section>
  );
}
