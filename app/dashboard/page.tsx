"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { fetchLeaderboard, filterLeaderboard } from "@/lib/leaderboard-api";
import { subjectLabel } from "@/lib/profile-options";
import { isProfileComplete, needsOnboarding, normalizeLevel } from "@/lib/profile-utils";
import { ProfileCompletionPrompt } from "@/components/profile/ProfileCompletionPrompt";
import { OnboardingModal } from "@/components/dashboard/OnboardingModal";
import { DetailedReviewModal } from "@/components/dashboard/DetailedReviewModal";
import { AnalyticsSection } from "@/components/dashboard/AnalyticsSection";
import type { RecentExamAttempt } from "@/lib/dashboard-analytics";
import { subjectPracticeHref } from "@/lib/dashboard-analytics";
import { levelHubPath } from "@/lib/quiz/unified-routes";
import {
  BarChart3,
  BookOpen,
  Eye,
  Brain,
  Clock,
  Flame,
  Radio,
  Target,
  TrendingUp,
  Trophy,
  Zap,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface DashboardStats {
  totalExams: number;
  averageScore: number;
  correctPercentage: number;
}

interface WeakChapter {
  slug: string;
  count: number;
}

interface RecentAttempt extends RecentExamAttempt {}

type ReviewState = {
  examId: string;
  examName: string;
  userAnswers: string;
  questionsPath?: string;
} | null;

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weakChapters, setWeakChapters] = useState<WeakChapter[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);
  const [playerElo, setPlayerElo] = useState(1200);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [fetching, setFetching] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<ReviewState>(null);

  useEffect(() => {
    if (user) {
      fetchDashboard();
    } else {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (fetching) return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [fetching]);

  const fetchDashboard = async () => {
    try {
      const data = await api.get<{
        stats: DashboardStats;
        weakChapters?: WeakChapter[];
        recentAttempts?: RecentAttempt[];
        player?: { elo?: number; streak?: number };
      }>("/api/student/dashboard");
      setStats(data.stats);
      setWeakChapters(data.weakChapters || []);
      setRecentAttempts(data.recentAttempts || []);
      setPlayerElo(data.player?.elo ?? user?.elo ?? 1200);

      if (user && isProfileComplete(user)) {
        const lb = await fetchLeaderboard();
        const level = normalizeLevel(user.className, user.level) || "ssc";
        const year = user.examYear ?? user.targetExamYear;
        const yearNum = year ? parseInt(String(year), 10) : undefined;
        const filtered = filterLeaderboard(
          lb,
          level,
          yearNum && !Number.isNaN(yearNum) ? yearNum : "all",
        );
        const mine = filtered.find((e) => e.userId === user.id);
        if (mine) setMyRank(mine.rank);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setFetching(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07111F]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <p className="text-slate-400 font-bangla">ড্যাশবোর্ড লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07111F] font-bangla px-4 pb-24">
        <Card variant="glass" className="max-w-md w-full p-8 text-center">
          <Brain className="h-16 w-16 mx-auto text-purple-glow mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            ড্যাশবোর্ড দেখতে লগইন করুন
          </h2>
          <p className="text-slate-400 mb-6">
            তোমার অগ্রগতি ট্র্যাক করতে অ্যাকাউন্টে সাইন ইন করো
          </p>
          <Link href="/login">
            <Button variant="primary" className="w-full min-h-[44px]">
              লগইন করুন
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const todayTarget = 3;
  const completedToday = recentAttempts.filter((a) => {
    const d = new Date(a.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const recommendedHref = user.weakSubjects
    ? user.weakSubjects.includes("physics")
      ? subjectPracticeHref("physics", "hsc")
      : user.weakSubjects.includes("chemistry")
        ? subjectPracticeHref("chemistry", "hsc")
        : levelHubPath("ssc")
    : levelHubPath("ssc");

  return (
    <div className="min-h-screen bg-[#07111F] py-8 pb-24 font-bangla">
      {user && needsOnboarding(user) && <OnboardingModal />}
      {reviewTarget && (
        <DetailedReviewModal
          open
          onClose={() => setReviewTarget(null)}
          examId={reviewTarget.examId}
          examName={reviewTarget.examName}
          userAnswers={reviewTarget.userAnswers}
          questionsPath={reviewTarget.questionsPath}
          userElo={playerElo}
        />
      )}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              স্বাগতম, {user.name || "যোদ্ধা"}! 👋
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              আজকের টার্গেট: {todayTarget}টি কুইজ — সম্পন্ন {completedToday}/{todayTarget}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="default" className="px-3 py-1.5">ফ্রি প্ল্যান</Badge>
            <Link href="/profile">
              <Badge variant="default" className="px-3 py-1.5 cursor-pointer hover:border-cyan-400/30">
                প্রোফাইল সম্পাদনা
              </Badge>
            </Link>
          </div>
        </div>

        {!isProfileComplete(user) && (
          <ProfileCompletionPrompt variant="hint" className="mb-6" />
        )}

        <AnalyticsSection recentExams={recentAttempts} currentElo={playerElo} />

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Card variant="glass" className="p-4 border-purple-glow/10">
              <Trophy className="h-5 w-5 text-purple-glow mb-2" />
              <p className="text-xs text-slate-500">মোট স্কোর (গড়)</p>
              <p className="text-2xl font-black text-white">{stats.averageScore}</p>
            </Card>
            <Card variant="glass" className="p-4 border-cyan-500/10">
              <TrendingUp className="h-5 w-5 text-cyan-400 mb-2" />
              <p className="text-xs text-slate-500">বর্তমান র‍্যাঙ্ক</p>
              <p className="text-2xl font-black text-white">
                {myRank ? `#${myRank}` : "—"}
              </p>
            </Card>
            <Card variant="glass" className="p-4 border-green-500/10">
              <Target className="h-5 w-5 text-green-400 mb-2" />
              <p className="text-xs text-slate-500">সঠিকতা</p>
              <p className="text-2xl font-black text-white">{stats.correctPercentage}%</p>
            </Card>
            <Card variant="glass" className="p-4 border-amber-500/10">
              <BookOpen className="h-5 w-5 text-amber-400 mb-2" />
              <p className="text-xs text-slate-500">সম্পন্ন কুইজ</p>
              <p className="text-2xl font-black text-white">{stats.totalExams}</p>
            </Card>
          </div>
        )}

        <Card variant="glass" className="p-4 mb-6 border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Radio className="h-6 w-6 text-red-400 live-pulse" />
            <div>
              <p className="font-bold text-white">লাইভ টেস্ট রিমাইন্ডার</p>
              <p className="text-xs text-slate-400">শুক্রবার রাত ৮টা — পদার্থবিজ্ঞান ১ম পত্র</p>
            </div>
          </div>
          <Link href="/live-test">
            <Button variant="secondary" size="sm" className="min-h-[44px]">
              লাইভ টেস্ট দেখো
            </Button>
          </Link>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card variant="glass" className="p-5" id="recent-exams">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-cyan-400" />
                  সাম্প্রতিক পরীক্ষা
                </h3>
              </div>

              {recentAttempts.length === 0 ? (
                <div className="text-center py-10">
                  <BookOpen className="h-12 w-12 mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-400 mb-1">এখনো কোনো কুইজ দেওয়া হয়নি।</p>
                  <p className="text-slate-500 text-sm mb-4">আজই প্রথম কুইজ শুরু করো।</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href={levelHubPath("ssc")}>
                      <Button variant="secondary" size="sm">SSC Practice শুরু করো</Button>
                    </Link>
                    <Link href={levelHubPath("hsc")}>
                      <Button size="sm">HSC Practice শুরু করো</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                            attempt.percentage >= 80
                              ? "bg-green-500/10 text-green-400"
                              : attempt.percentage >= 40
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {attempt.percentage >= 80 ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : attempt.percentage >= 40 ? (
                            <AlertTriangle className="h-5 w-5" />
                          ) : (
                            <XCircle className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {attempt.examName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(attempt.createdAt).toLocaleDateString("bn-BD")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-2">
                        <div>
                          <p className="font-bold text-white">
                            {attempt.score}/{attempt.totalQuestions}
                          </p>
                          <p className="text-xs text-slate-400">{attempt.percentage}%</p>
                        </div>
                        {attempt.userAnswers && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="min-h-[44px] text-cyan-400 hover:text-cyan-300 px-2"
                            onClick={() =>
                              setReviewTarget({
                                examId: attempt.examSlug,
                                examName: attempt.examName,
                                userAnswers: attempt.userAnswers || "",
                                questionsPath: attempt.questionsPath || attempt.examSlug,
                              })
                            }
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            উত্তর পর্যালোচনা
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card variant="glass" className="p-5">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-glow" />
                পরবর্তী কুইজ সাজেশন
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                {user.weakSubjects
                  ? `দুর্বল বিষয়: ${subjectLabel(user.weakSubjects)} — এখান থেকে শুরু করো`
                  : "প্রোফাইলে দুর্বল বিষয় সেট করো, সাজেশন পাবে"}
              </p>
              <Link href={recommendedHref}>
                <Button variant="secondary" className="min-h-[44px]">
                  Practice শুরু করো <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </Card>
          </div>

          <div className="space-y-6">
            <Card variant="glass" className="p-5" id="weak-chapters">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-orange-400" />
                দুর্বল অধ্যায়
              </h3>
              {weakChapters.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">
                  এখনো দুর্বল অধ্যায় চিহ্নিত হয়নি
                </p>
              ) : (
                <div className="space-y-3">
                  {weakChapters.map((ch, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex justify-between mb-2">
                        <p className="text-sm font-semibold text-white truncate">{ch.slug}</p>
                        <Badge variant="warning" className="text-[10px]">{ch.count} বার</Badge>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${Math.min(ch.count * 20, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card variant="glass" className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                <h3 className="font-bold text-white">দুর্বল অধ্যায় রিপোর্ট</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                কুইজ দিয়ে দুর্বল অধ্যায় ট্র্যাক করো — সম্পূর্ণ ফ্রি
              </p>
              <Link href="/profile">
                <Button variant="secondary" fullWidth size="sm" className="min-h-[44px]">
                  প্রোফাইল আপডেট করো
                </Button>
              </Link>
            </Card>

            <Card variant="glass" className="p-5">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-400" />
                দ্রুত পদক্ষেপ
              </h3>
              <div className="grid gap-2">
                <Link href={levelHubPath("ssc")}>
                  <Button variant="secondary" fullWidth className="min-h-[44px] justify-start">
                    <BookOpen className="h-4 w-4 mr-2" /> SSC Practice শুরু করো
                  </Button>
                </Link>
                <Link href={levelHubPath("hsc")}>
                  <Button variant="secondary" fullWidth className="min-h-[44px] justify-start">
                    <BookOpen className="h-4 w-4 mr-2" /> HSC Practice শুরু করো
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button variant="ghost" fullWidth className="min-h-[44px] justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" /> লিডারবোর্ড দেখো
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
