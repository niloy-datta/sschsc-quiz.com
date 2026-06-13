"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { subjectLabel } from "@/lib/profile-options";
import { normalizeLevel } from "@/lib/profile-utils";
import {
  quizWithinLast24Hours,
  subjectPracticeHref,
  topSubjectKeys,
  type RecentExamAttempt,
} from "@/lib/dashboard-analytics";
import {
  AlertTriangle,
  BookOpen,
  Flame,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function DailyTaskSection() {
  const { user } = useAuth();
  const [recentExams, setRecentExams] = useState<RecentExamAttempt[]>([]);
  const [playerStreak, setPlayerStreak] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setRecentExams([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api.get<{
          recentAttempts?: RecentExamAttempt[];
          player?: { streak?: number };
        }>("/api/student/dashboard");
        if (!cancelled) {
          setRecentExams(data.recentAttempts || []);
          setPlayerStreak(data.player?.streak ?? user.streak ?? 0);
        }
      } catch {
        if (!cancelled) setRecentExams([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const level = normalizeLevel(user?.className, user?.level) || "ssc";
  const activeToday = useMemo(
    () => quizWithinLast24Hours(recentExams),
    [recentExams],
  );
  const suggestedSubjects = useMemo(
    () => topSubjectKeys(recentExams, 3),
    [recentExams],
  );

  if (!user) {
    return (
      <section id="continue-learning" className="py-10 md:py-14 font-bangla scroll-mt-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card variant="glass" className="p-8 text-center border-purple-glow/15">
            <Target className="h-10 w-10 text-purple-glow mx-auto mb-3" />
            <h3 className="text-xl font-black text-white mb-2">দৈনিক মিশন</h3>
            <p className="text-sm text-slate-400 mb-5">
              লগইন করলে তোমার স্ট্রিক ও প্রস্তাবিত বিষয় দেখতে পারবে।
            </p>
            <Link href="/login">
              <Button variant="primary" className="min-h-[44px]">
                লগইন করুন
              </Button>
            </Link>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="continue-learning" className="py-10 md:py-14 relative overflow-hidden font-bangla scroll-mt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {!activeToday && !loading && (
          <div
            className={cn(
              "mb-6 rounded-2xl border border-orange-500/40 p-4 md:p-5",
              "bg-gradient-to-r from-orange-500/15 via-red-500/10 to-transparent",
              "shadow-[0_0_30px_rgba(249,115,22,0.15)] animate-pulse",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center shrink-0">
                <Flame className="h-6 w-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-black text-orange-200">
                  🔥 স্ট্রিক ঝুঁকিতে
                </p>
                <p className="text-sm text-orange-100/80 mt-1">
                  গত ২৪ ঘণ্টায় কোনো কুইজ নেই — {playerStreak} দিনের স্ট্রিক ধরে রাখতে এখনই একটি
                  ব্যাটল শেষ করো!
                </p>
              </div>
              <Link href="/dashboard" className="shrink-0 hidden sm:block">
                <Button variant="primary" size="sm" className="min-h-[44px]">
                  <Zap className="h-4 w-4 mr-1" /> দ্রুত কুইজ
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7">
            <Card variant="glass" className="p-6 h-full border-cyan-500/15 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <Badge variant="default" className="text-cyan-300 border-cyan-400/20 mb-2">
                    দৈনিক মিশন
                  </Badge>
                  <h3 className="text-2xl font-black text-white">আজকের মিশন</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-slate-500">স্ট্রিক</p>
                  <p className="text-2xl font-black text-amber-400 font-outfit flex items-center gap-1 justify-end">
                    <Flame className="h-5 w-5 fill-amber-400/20" />
                    {playerStreak}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <QuestRow
                  done={activeToday}
                  title="২৪ ঘণ্টার মধ্যে ১টি কুইজ সম্পন্ন করো"
                  icon={<Target className="h-4 w-4" />}
                />
                <QuestRow
                  done={recentExams.length >= 3}
                  title="সপ্তাহে ৩+ কুইজ — ধারাবাহিকতা বোনাস"
                  icon={<Sparkles className="h-4 w-4" />}
                />
                <QuestRow
                  done={recentExams.some((e) => e.percentage >= 70)}
                  title="৭০%+ স্কোর — দক্ষতা বোনাস"
                  icon={<Zap className="h-4 w-4" />}
                />
              </div>

              {activeToday ? (
                <p className="mt-5 text-sm text-green-400 flex items-center gap-2">
                  <Flame className="h-4 w-4" /> স্ট্রিক নিরাপদ — আজকের কুইজ সম্পন্ন!
                </p>
              ) : (
                <Link href="/dashboard" className="block mt-5 sm:hidden">
                  <Button variant="primary" fullWidth className="min-h-[44px]">
                    দ্রুত কুইজ শুরু করো
                  </Button>
                </Link>
              )}
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card variant="glass" className="p-6 h-full border-purple-glow/15">
              <h3 className="text-lg font-black text-white mb-1 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-glow" />
                প্রস্তাবিত বিষয়
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                তোমার সাম্প্রতিক কুইজ ইতিহাস অনুযায়ী
              </p>

              {loading ? (
                <p className="text-sm text-slate-500 text-center py-8">লোড হচ্ছে...</p>
              ) : (
                <div className="space-y-3">
                  {suggestedSubjects.map((key, idx) => (
                    <Link
                      key={key}
                      href={subjectPracticeHref(key, level)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all",
                        "bg-white/[0.03] border-white/10 hover:border-cyan-400/30 hover:bg-cyan-500/5",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-8 rounded-lg bg-purple-glow/10 border border-purple-glow/20 flex items-center justify-center text-xs font-black text-purple-glow font-outfit">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-white">{subjectLabel(key)}</p>
                          <p className="text-xs text-slate-500">
                            {recentExams.length > 0 ? "তোমার কুইজ অনুযায়ী" : "শুরু করার জন্য ভালো"}
                          </p>
                        </div>
                      </div>
                      <AlertTriangle className="h-4 w-4 text-cyan-400/60" />
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuestRow({
  done,
  title,
  icon,
}: {
  done: boolean;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3.5 rounded-xl border transition-colors",
        done
          ? "bg-green-500/10 border-green-500/25 text-green-100"
          : "bg-white/[0.02] border-white/10 text-slate-300",
      )}
    >
      <div
        className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
          done ? "bg-green-500/20 text-green-400" : "bg-slate-800 text-slate-400",
        )}
      >
        {icon}
      </div>
      <p className={cn("text-sm font-semibold flex-1", done && "line-through opacity-80")}>
        {title}
      </p>
      {done && (
        <Badge variant="success" className="text-xs shrink-0">
          সম্পন্ন
        </Badge>
      )}
    </div>
  );
}
