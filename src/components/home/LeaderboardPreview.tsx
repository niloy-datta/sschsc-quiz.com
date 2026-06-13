import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { leaderboardUsers } from "@/lib/mockData";
import { Trophy, ShieldCheck, Flame, ArrowUp } from "lucide-react";

export function LeaderboardPreview() {
  // Extract top 3 and others
  const top1 = leaderboardUsers.find((u) => u.rank === 1);
  const top2 = leaderboardUsers.find((u) => u.rank === 2);
  const top3 = leaderboardUsers.find((u) => u.rank === 3);
  const scrollUsers = leaderboardUsers.filter((u) => u.rank > 3);

  return (
    <section id="leaderboard" className="py-12 md:py-24 relative overflow-hidden font-bangla">
      <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-purple-glow/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-glow/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-16">
          <Badge variant="premium" className="px-3 py-1">বৈশ্বিক লিডারবোর্ড</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            বিজ্ঞান র্যাঙ্কারস হল অব ফেম
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            রিয়েল-টাইম লাইভ কুইজে সঠিক ও দ্রুততম উত্তর দিয়ে সর্বোচ্চ পয়েন্ট অর্জন করো এবং টপ থ্রি পোডিয়ামে স্থান পাও।
          </p>
        </div>

        {/* Podium Layout (Top 3) */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-3xl mx-auto mb-10 pt-8">
          
          {/* Rank 2 - Left */}
          {top2 && (
            <div className="flex flex-col items-center">
              {/* Profile Bubble */}
              <div className="relative mb-3 flex flex-col items-center">
                <div className="h-14 w-14 sm:h-18 sm:w-18 rounded-full border-2 border-slate-400 bg-slate-900/60 flex items-center justify-center text-2xl shadow-lg">
                  {top2.avatar}
                </div>
                <div className="absolute -bottom-1.5 bg-slate-400 text-black text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border border-slate-900 font-outfit">
                  2
                </div>
              </div>
              
              {/* Podium Column */}
              <div className="w-full h-32 sm:h-40 bg-gradient-to-t from-slate-950 to-slate-900 border-t border-x border-slate-800 rounded-t-2xl flex flex-col items-center justify-end p-3 text-center shadow-lg">
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-100 truncate w-full">{top2.name}</h4>
                <p className="text-[10px] sm:text-xs text-slate-400 font-outfit mt-1">{top2.points} XP</p>
                <Badge variant="default" className="text-[8px] sm:text-[9px] mt-1.5 px-1.5 py-0.5 border-slate-800">{top2.accuracy} সঠিকতা</Badge>
              </div>
            </div>
          )}

          {/* Rank 1 - Center */}
          {top1 && (
            <div className="flex flex-col items-center">
              {/* Crown & Avatar */}
              <div className="relative mb-4 flex flex-col items-center">
                <div className="absolute -top-6 text-2xl animate-bounce">👑</div>
                <div className="h-16 w-16 sm:h-22 sm:w-22 rounded-full border-4 border-gold-rank bg-gold-dark/40 flex items-center justify-center text-3xl shadow-[0_0_25px_rgba(251,191,36,0.2)]">
                  {top1.avatar}
                </div>
                <div className="absolute -bottom-1.5 bg-gold-rank text-black text-xs font-black h-6 w-6 rounded-full flex items-center justify-center border border-slate-900 font-outfit">
                  1
                </div>
              </div>
              
              {/* Podium Column */}
              <div className="w-full h-40 sm:h-52 bg-gradient-to-t from-gold-dark/40 to-yellow-900/10 border-t border-x border-gold-rank/30 rounded-t-2xl flex flex-col items-center justify-end p-4 text-center shadow-[0_0_30px_rgba(251,191,36,0.05)]">
                <h4 className="text-sm sm:text-base font-black text-gold-rank truncate w-full">{top1.name}</h4>
                <p className="text-xs sm:text-sm font-outfit font-black text-white mt-1">{top1.points} XP</p>
                <Badge variant="rank" className="text-[8px] sm:text-[10px] mt-2 px-2 py-0.5 border-yellow-300/30">{top1.accuracy} সঠিকতা</Badge>
              </div>
            </div>
          )}

          {/* Rank 3 - Right */}
          {top3 && (
            <div className="flex flex-col items-center">
              {/* Profile Bubble */}
              <div className="relative mb-3 flex flex-col items-center">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-2 border-amber-600 bg-slate-900/60 flex items-center justify-center text-2xl shadow-lg">
                  {top3.avatar}
                </div>
                <div className="absolute -bottom-1.5 bg-amber-600 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border border-slate-900 font-outfit">
                  3
                </div>
              </div>
              
              {/* Podium Column */}
              <div className="w-full h-28 sm:h-32 bg-gradient-to-t from-slate-950 to-slate-900 border-t border-x border-slate-800 rounded-t-2xl flex flex-col items-center justify-end p-3 text-center shadow-lg">
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-100 truncate w-full">{top3.name}</h4>
                <p className="text-[10px] sm:text-xs text-slate-400 font-outfit mt-1">{top3.points} XP</p>
                <Badge variant="default" className="text-[8px] sm:text-[9px] mt-1.5 px-1.5 py-0.5 border-slate-800">{top3.accuracy} সঠিকতা</Badge>
              </div>
            </div>
          )}

        </div>

        {/* Scroll list for other ranks */}
        <div className="max-w-3xl mx-auto space-y-2.5">
          {scrollUsers.map((user) => {
            const isSelf = user.isCurrentUser;
            
            return (
              <Card
                key={user.rank}
                variant={isSelf ? "premium" : "leaderboard"}
                className={`p-4 flex items-center justify-between border transition-all ${
                  isSelf 
                    ? "border-gold-rank/40 shadow-glow-gold/10 bg-gold-dark/20" 
                    : "border-purple-glow/5 hover:border-purple-glow/15"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank number */}
                  <span className={`w-6 text-center text-sm font-bold font-outfit ${
                    isSelf ? "text-gold-rank" : "text-slate-500"
                  }`}>
                    {user.rank}
                  </span>
                  
                  {/* Avatar icon */}
                  <span className="text-lg shrink-0">{user.avatar}</span>
                  
                  {/* Name details */}
                  <span className={`text-sm sm:text-base font-bold ${
                    isSelf ? "text-gold-rank" : "text-slate-200"
                  }`}>
                    {user.name}
                  </span>
                </div>

                <div className="flex items-center gap-6">
                  {/* Accuracy */}
                  <span className="hidden xs:inline-flex text-xs text-slate-500 font-semibold font-outfit">
                    {user.accuracy} সঠিকতা
                  </span>
                  
                  {/* XP Points */}
                  <span className={`text-sm sm:text-base font-bold font-outfit ${
                    isSelf ? "text-white" : "text-purple-glow"
                  }`}>
                    {user.points} XP
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

      </div>
    </section>
  );
}
