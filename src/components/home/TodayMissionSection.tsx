"use client";

import React, { useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { dailyMissions as initialMissions } from "@/lib/mockData";
import { Award, CheckSquare, Square, Zap, Flame, AwardIcon } from "lucide-react";

export function TodayMissionSection() {
  const [missions, setMissions] = useState(initialMissions);
  const [streakDays, setStreakDays] = useState(7);
  const [earnedXp, setEarnedXp] = useState(0);

  const toggleMission = (id: string) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextCompleted = !m.completed;
          if (nextCompleted) {
            setEarnedXp((xp) => xp + m.xp);
          } else {
            setEarnedXp((xp) => xp - m.xp);
          }
          return { ...m, completed: nextCompleted };
        }
        return m;
      })
    );
  };

  const completedCount = missions.filter((m) => m.completed).length;
  const totalCount = missions.length;
  const percentComplete = Math.round((completedCount / totalCount) * 100);

  return (
    <section className="py-12 md:py-16 relative overflow-hidden font-bangla">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Mission checklist card */}
          <div className="lg:col-span-8">
            <Card variant="glass" className="p-6 md:p-8 h-full border-purple-glow/15 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-glow/5 rounded-full blur-[40px] pointer-events-none -z-10" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-glow/10 pb-6 mb-6">
                <div className="space-y-1">
                  <Badge variant="default" className="text-purple-glow bg-purple-glow/5 border-purple-glow/20">প্রতিদিনের চ্যালেঞ্জ</Badge>
                  <h3 className="text-2xl font-black text-white">আজকের যুদ্ধ মিশন</h3>
                  <p className="text-xs text-slate-400">মিশনগুলো পূরণ করে এক্সপি অর্জন করো এবং র্যাঙ্কিংয়ে এগিয়ে থাকো।</p>
                </div>
                
                {/* Progress stats */}
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-500 font-semibold">অগ্রগতি</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-outfit text-cyan-glow">{completedCount}</span>
                    <span className="text-slate-500 text-xs font-outfit">/ {totalCount} সম্পূর্ণ</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-6 space-y-1.5">
                <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-glow to-cyan-glow transition-all duration-500 rounded-full"
                    style={{ width: `${percentComplete}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>০%</span>
                  <span>{percentComplete}% সম্পন্ন</span>
                  <span>১০০%</span>
                </div>
              </div>

              {/* Mission List */}
              <div className="space-y-3">
                {missions.map((mission) => (
                  <div
                    key={mission.id}
                    onClick={() => toggleMission(mission.id)}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      mission.completed
                        ? "bg-purple-glow/[0.03] border-purple-glow/30 text-slate-200"
                        : "bg-navy-light/40 border-slate-900 text-slate-400 hover:border-purple-glow/10"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 transition-transform duration-200 active:scale-75">
                      {mission.completed ? (
                        <CheckSquare className="h-5 w-5 text-purple-glow fill-purple-glow/10" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-700 hover:text-purple-glow" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <p className={`text-sm md:text-base font-bold leading-normal transition-colors ${
                        mission.completed ? "text-slate-100 line-through opacity-70" : "text-slate-300"
                      }`}>
                        {mission.title}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-xs font-outfit font-extrabold ${
                        mission.completed ? "text-purple-glow/70" : "text-purple-glow"
                      }`}>
                        <Zap className="h-3.5 w-3.5 fill-purple-glow/20" />
                        +{mission.xp} XP
                      </span>
                    </div>

                    {mission.completed && (
                      <Badge variant="success" className="text-[10px] uppercase font-bold shrink-0">অর্জনকৃত</Badge>
                    )}
                  </div>
                ))}
              </div>

            </Card>
          </div>

          {/* Daily login streak card */}
          <div className="lg:col-span-4">
            <Card variant="glass" className="p-6 md:p-8 h-full flex flex-col justify-between relative overflow-hidden text-center border-amber-500/20">
              
              <div className="space-y-4">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/10 border border-gold-rank/30 flex items-center justify-center text-gold-rank animate-bounce">
                  <Flame className="h-8 w-8 fill-gold-rank/10" />
                </div>
                
                <div className="space-y-1">
                  <Badge variant="default" className="bg-amber-500/10 text-amber-300 border-amber-500/20">স্ট্রিক পুরষ্কার</Badge>
                  <h3 className="text-xl md:text-2xl font-black text-white">{streakDays} দিনের স্ট্রিক</h3>
                  <p className="text-xs text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                    প্রতিদিন কুইজ ব্যাটেলে অংশ নিয়ে ধরে রাখো তোমার লড়াকু স্ট্রিক!
                  </p>
                </div>
              </div>

              {/* Streak Bubbles (7 days visualization) */}
              <div className="flex justify-center gap-2 py-6">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const isCurrent = day === streakDays;
                  const isPast = day < streakDays;
                  
                  return (
                    <div key={day} className="flex flex-col items-center gap-1.5">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold font-outfit border transition-all ${
                        isCurrent 
                          ? "bg-gold-rank border-gold-rank text-black shadow-glow-gold/40 scale-110" 
                          : isPast 
                          ? "bg-gold-dark/40 border-gold-rank/40 text-gold-rank" 
                          : "bg-slate-950 border-slate-900 text-slate-700"
                      }`}>
                        {day}
                      </div>
                      <span className="text-[9px] text-slate-500 font-bangla">দিন</span>
                    </div>
                  );
                })}
              </div>

              {/* XP reward action */}
              <div className="space-y-2">
                {earnedXp > 0 && (
                  <p className="text-xs text-slate-300 font-bold animate-pulse font-outfit">
                    🎉 আজ অর্জিত হয়েছে: <span className="text-gold-rank">+{earnedXp} XP</span>
                  </p>
                )}
                <Button variant="primary" fullWidth size="sm" onClick={() => setStreakDays((prev) => prev + 1)}>
                  🔥 আজকের হাজিরা দাও
                </Button>
              </div>

            </Card>
          </div>

        </div>
      </div>
    </section>
  );
}
