"use client";

import React from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Trophy, Flame, Zap, Award, Target, ChevronRight } from "lucide-react";
import { userStats } from "@/lib/mockData";

export function HeroSection() {
  return (
    <section id="home" className="relative py-10 md:py-20 overflow-hidden font-bangla">
      {/* Decorative ambient glowing grids and shapes */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none -z-10" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-purple-glow/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Hero Pitch (Left Column on Desktop) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-dark/60 border border-purple-glow/30 text-purple-glow text-xs md:text-sm font-extrabold animate-pulse">
              <Zap className="h-4 w-4 fill-purple-glow" />
              <span>SSC ও HSC বিজ্ঞান MCQ যুদ্ধঘর</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
              বিজ্ঞান MCQ প্রস্তুতি <br />
              এখন <span className="bg-gradient-to-r from-purple-glow via-fuchsia-500 to-cyan-glow bg-clip-text text-transparent shadow-glow-purple/20">Battle Mode</span>-এ
            </h1>
            
            <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              অধ্যায়ভিত্তিক লাইভ যুদ্ধ, গতি পরীক্ষা, র্যাঙ্কিং এবং দুর্বল বিষয় ভিত্তিক রিপোর্ট — সবকিছুই সম্পূর্ণ বাংলায়। নিজেকে ছাড়িয়ে যাওয়ার মিশন শুরু করো এখনই!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <Button variant="primary" size="lg" className="flex items-center gap-2 group" onClick={() => {
                const el = document.getElementById("subjects");
                el?.scrollIntoView({ behavior: "smooth" });
              }}>
                যুদ্ধ শুরু করো 
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => {
                const el = document.getElementById("quiz");
                el?.scrollIntoView({ behavior: "smooth" });
              }}>
                লেভেল যাচাই কর
              </Button>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-slate-500 text-xs md:text-sm">
              <div className="flex items-center gap-2">
                <span className="text-cyan-glow text-lg font-bold">১০,০০০+</span>
                <span>সক্রিয় শিক্ষার্থী</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              <div className="flex items-center gap-2">
                <span className="text-purple-glow text-lg font-bold">২ মিলিয়নের+</span>
                <span>সমাধানকৃত MCQ</span>
              </div>
            </div>
          </div>

          {/* Gamified Cockpit HUD (Right Column on Desktop) */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <Card variant="glass" className="relative p-6 border-purple-glow/20 shadow-[0_0_50px_rgba(139,92,246,0.05)] overflow-hidden">
              
              {/* Cockpit Title Bar */}
              <div className="flex items-center justify-between border-b border-purple-glow/10 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🚀</div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{userStats.name}</h3>
                    <p className="text-xs text-slate-500 font-outfit">HSC Science Batch</p>
                  </div>
                </div>
                <Badge variant="premium" className="text-[10px] animate-pulse">PRO MEMBER</Badge>
              </div>

              {/* Progress HUD Circle & Level */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative flex items-center justify-center h-20 w-20">
                  {/* SVG circular progress */}
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="rgba(139, 92, 246, 0.1)"
                      strokeWidth="5"
                      fill="transparent"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="url(#purpleGradient)"
                      strokeWidth="5"
                      strokeDasharray={2 * Math.PI * 36}
                      strokeDashoffset={2 * Math.PI * 36 * (1 - userStats.levelProgress / 100)}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                    <defs>
                      <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="text-center">
                    <span className="text-xs text-slate-400">লেভেল</span>
                    <p className="text-xl font-bold font-outfit text-white">{userStats.level}</p>
                  </div>
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">লেভেল এক্সপি প্রোগ্রেস</span>
                    <span className="font-outfit text-purple-glow font-bold">{userStats.xp} / {userStats.nextLevelXp} XP</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-glow to-cyan-glow rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                      style={{ width: `${userStats.levelProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Grid Statistics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                
                {/* Stat 1: Leaderboard Rank */}
                <Card variant="dark" className="p-3 border-purple-glow/5 hover:border-purple-glow/10 transition-all">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Trophy className="h-4 w-4 text-gold-rank" />
                    <span>সার্বজনীন র্যাঙ্ক</span>
                  </div>
                  <p className="text-lg font-extrabold text-white">
                    #{userStats.rank} <span className="text-[10px] text-slate-500 font-normal">/{userStats.totalUsers}</span>
                  </p>
                </Card>

                {/* Stat 2: Streak Days */}
                <Card variant="dark" className="p-3 border-purple-glow/5 hover:border-purple-glow/10 transition-all">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Flame className="h-4 w-4 text-orange-500 fill-orange-500/10 animate-bounce" />
                    <span>চলমান স্ট্রিক</span>
                  </div>
                  <p className="text-lg font-extrabold text-white">
                    {userStats.streak} দিন
                  </p>
                </Card>

                {/* Stat 3: Win Rate */}
                <Card variant="dark" className="p-3 border-purple-glow/5 hover:border-purple-glow/10 transition-all">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Target className="h-4 w-4 text-cyan-glow" />
                    <span>সঠিকতার হার</span>
                  </div>
                  <p className="text-lg font-extrabold text-white">
                    {userStats.winRate}
                  </p>
                </Card>

                {/* Stat 4: Battles Played */}
                <Card variant="dark" className="p-3 border-purple-glow/5 hover:border-purple-glow/10 transition-all">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Award className="h-4 w-4 text-purple-glow" />
                    <span>মোট যুদ্ধ ম্যাচ</span>
                  </div>
                  <p className="text-lg font-extrabold text-white">
                    {userStats.battlesPlayed} টি
                  </p>
                </Card>

              </div>

              {/* Status footer inside HUD */}
              <div className="text-center py-2 bg-purple-glow/5 rounded-xl border border-purple-glow/10">
                <span className="text-[11px] text-slate-300">
                  🔥 স্ট্রিক বোনাস সক্রিয়! প্রতিদিন ২০ মিনিট অংশ নাও।
                </span>
              </div>

            </Card>
          </div>

        </div>
      </div>
    </section>
  );
}
