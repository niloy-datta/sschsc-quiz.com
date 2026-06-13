"use client";

import React, { useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { subjectBattles } from "@/lib/mockData";
import { Sword, Users, Award, ShieldAlert, Check } from "lucide-react";

export function SubjectBattleSection() {
  const [loadingBattleId, setLoadingBattleId] = useState<string | null>(null);
  const [successBattleId, setSuccessBattleId] = useState<string | null>(null);

  const handleLaunchBattle = (battleId: string) => {
    setLoadingBattleId(battleId);
    
    // Simulate matchmaking/loading battle arena
    setTimeout(() => {
      setLoadingBattleId(null);
      setSuccessBattleId(battleId);
      
      setTimeout(() => {
        setSuccessBattleId(null);
      }, 3000);
    }, 2000);
  };

  return (
    <section id="subjects" className="py-12 md:py-20 relative overflow-hidden font-bangla">
      <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-purple-glow/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <Badge variant="default" className="border-cyan-glow/20 text-cyan-glow bg-cyan-glow/5">অধ্যায়ভিত্তিক ব্যাটল এরিনা</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              বিজ্ঞান যুদ্ধঘর: বিষয়সমূহ
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-lg">
              তোমার পছন্দের বিষয় নির্বাচন করো এবং অন্যান্য শিক্ষার্থীদের সাথে রিয়েল-টাইম MCQ যুদ্ধে অবতীর্ণ হও।
            </p>
          </div>
          
          {/* Live Online Users Indicator */}
          <div className="inline-flex items-center gap-2 border border-green-500/20 rounded-xl px-4 py-2 bg-green-500/5">
            <div className="h-2 w-2 rounded-full bg-success-green animate-ping" />
            <span className="text-xs font-bold text-slate-300">
              <span className="text-success-green font-outfit">৫,৫৪০ জন</span> অনলাইনে যুদ্ধ করছে
            </span>
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {subjectBattles.map((subject) => {
            const isLoading = loadingBattleId === subject.id;
            const isSuccess = successBattleId === subject.id;

            // Render theme color classes
            let themeBorder = "border-slate-800 hover:border-purple-glow/30";
            let themeIconBg = "bg-purple-glow/10 text-purple-glow";
            let themeBtnVariant: "primary" | "secondary" | "premium" | "ghost" = "primary";

            if (subject.color === "cyan") {
              themeBorder = "border-slate-800 hover:border-cyan-glow/30";
              themeIconBg = "bg-cyan-glow/10 text-cyan-glow";
              themeBtnVariant = "secondary";
            } else if (subject.color === "green") {
              themeBorder = "border-slate-800 hover:border-success-green/30";
              themeIconBg = "bg-success-green/10 text-success-green";
              themeBtnVariant = "ghost";
            } else if (subject.color === "gold") {
              themeBorder = "border-slate-800 hover:border-gold-rank/30";
              themeIconBg = "bg-gold-rank/10 text-gold-rank";
              themeBtnVariant = "premium";
            }

            return (
              <Card
                key={subject.id}
                variant="glass"
                className={`p-6 border flex flex-col justify-between h-[340px] relative overflow-hidden transition-all duration-300 ${themeBorder} ${
                  isLoading ? "opacity-75 scale-[0.98]" : ""
                }`}
              >
                {/* Subject Details */}
                <div className="space-y-4">
                  
                  {/* Icon & XP details */}
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{subject.icon}</span>
                    <Badge variant="default" className="bg-slate-950 font-outfit text-slate-400">
                      +{subject.xpReward} XP
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xl font-bold text-slate-100">{subject.name}</h3>
                    <p className="text-xs text-slate-400 leading-normal min-h-[32px]">
                      {subject.subtitle}
                    </p>
                  </div>

                  {/* Active Counters */}
                  <div className="space-y-2 pt-2 border-t border-slate-900 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>সিলেবাস অধ্যায়</span>
                      <span className="font-bold text-slate-300">{subject.chaptersCount} টি চ্যাপ্টার</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        অনলাইন যুদ্ধরত
                      </span>
                      <span className="font-bold text-cyan-glow font-outfit">{subject.battlesActive} জন</span>
                    </div>
                  </div>

                </div>

                {/* Matchmaking Simulation Overlays */}
                {isLoading && (
                  <div className="absolute inset-0 bg-[#02030b]/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10 animate-fadeIn">
                    <div className="h-10 w-10 rounded-full border-2 border-purple-glow border-t-transparent animate-spin mb-3" />
                    <h4 className="text-sm font-bold text-white">প্রতিদ্বন্দ্বী খোঁজা হচ্ছে...</h4>
                    <p className="text-[11px] text-slate-500 mt-1">HSC এরিনা • এভারেজ পিং ১৫ms</p>
                  </div>
                )}

                {isSuccess && (
                  <div className="absolute inset-0 bg-green-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10 animate-fadeIn">
                    <div className="h-10 w-10 rounded-full bg-success-green/20 border border-success-green flex items-center justify-center text-success-green mb-3">
                      <Check className="h-5 w-5 stroke-[3]" />
                    </div>
                    <h4 className="text-sm font-bold text-white">ম্যাচ পাওয়া গেছে!</h4>
                    <p className="text-[11px] text-slate-300 mt-1">লোডিং কুইজ বোর্ড...</p>
                  </div>
                )}

                {/* CTA Action */}
                <div className="pt-4">
                  <Button
                    variant={themeBtnVariant}
                    fullWidth
                    size="sm"
                    className="flex items-center gap-1.5 font-bold"
                    onClick={() => handleLaunchBattle(subject.id)}
                  >
                    <Sword className="h-4 w-4" />
                    ব্যাটেল লড়ো
                  </Button>
                </div>

              </Card>
            );
          })}
        </div>

      </div>
    </section>
  );
}
