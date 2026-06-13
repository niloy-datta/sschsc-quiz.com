"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProfileCompletionPrompt } from "@/components/profile/ProfileCompletionPrompt";
import { LeaderboardSkeleton } from "@/components/leaderboard/LeaderboardSkeleton";
import { RankTierBadge } from "@/components/leaderboard/RankTierBadge";
import {
  BADGE_LABELS,
  aggregateColleges,
  fetchLeaderboard,
  filterLeaderboard,
  formatAccuracy,
  formatBnNumber,
  getCollegeLabel,
  getInitials,
  type LeaderboardEntry,
} from "@/lib/leaderboard-api";
import { isProfileComplete, normalizeLevel, type StudentLevel } from "@/lib/profile-utils";
import {
  ChevronDown,
  Crown,
  Flame,
  Globe,
  Medal,
  Target,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { levelHubPath } from "@/lib/quiz/unified-routes";

type TimeFilter = "all" | "today" | "week" | "month" | "alltime";

const TIME_FILTERS: { id: TimeFilter; label: string }[] = [
  { id: "all", label: "সবগুলো" },
  { id: "today", label: "আজ" },
  { id: "week", label: "এই সপ্তাহ" },
  { id: "month", label: "এই মাস" },
  { id: "alltime", label: "সর্বকালীন" },
];

const INITIAL_ROWS = 15;

function Avatar({ entry, size = "md" }: { entry: LeaderboardEntry; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-9 w-9 text-xs", md: "h-11 w-11 text-sm", lg: "h-14 w-14 text-base" };
  if (entry.picture) {
    return (
      <img
        src={entry.picture}
        alt=""
        className={cn("rounded-full object-cover border border-white/10 shrink-0", sizes[size])}
      />
    );
  }
  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-purple-600/40 to-cyan-500/30 flex items-center justify-center font-bold text-white border border-white/10 shrink-0",
        sizes[size],
      )}
    >
      {getInitials(entry.name || "নাম নেই")}
    </div>
  );
}

function PodiumCard({ entry, place }: { entry: LeaderboardEntry; place: 1 | 2 | 3 }) {
  const styles = {
    1: {
      order: "order-2",
      height: "min-h-[200px] sm:min-h-[220px]",
      border: "border-gold-rank/40 shadow-glow-gold",
      bg: "bg-gradient-to-b from-gold-rank/10 to-transparent",
      icon: <Crown className="h-5 w-5 text-gold-rank" />,
      rankBg: "bg-gold-rank text-black",
    },
    2: {
      order: "order-1",
      height: "min-h-[170px] sm:min-h-[190px]",
      border: "border-cyan-400/30 shadow-glow-cyan",
      bg: "bg-gradient-to-b from-cyan-500/10 to-transparent",
      icon: <Medal className="h-5 w-5 text-cyan-300" />,
      rankBg: "bg-slate-300 text-black",
    },
    3: {
      order: "order-3",
      height: "min-h-[160px] sm:min-h-[175px]",
      border: "border-amber-600/30",
      bg: "bg-gradient-to-b from-amber-700/10 to-transparent",
      icon: <Medal className="h-5 w-5 text-amber-500" />,
      rankBg: "bg-amber-600 text-black",
    },
  }[place];

  return (
    <div className={cn("flex flex-col items-center", styles.order)}>
      <div className="relative mb-3">
        {place === 1 && (
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xl">👑</span>
        )}
        <Avatar entry={entry} size={place === 1 ? "lg" : "md"} />
        <span
          className={cn(
            "absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black",
            styles.rankBg,
          )}
        >
          {place}
        </span>
      </div>
      <Card
        variant="glass"
        className={cn(
          "w-full p-4 text-center",
          styles.height,
          styles.border,
          styles.bg,
        )}
      >
        <div className="mb-2 flex justify-center">{styles.icon}</div>
        <p className="truncate font-bold text-white">{entry.name || "নাম নেই"}</p>
        <p className="mt-0.5 truncate text-xs text-slate-400">{getCollegeLabel(entry)}</p>
        <RankTierBadge rank={entry.rank} className="mt-2" />
        <p className="mt-3 text-xl font-black text-white">{formatBnNumber(entry.points || 0)}</p>
        <p className="text-xs text-slate-500">স্কোর</p>
      </Card>
    </div>
  );
}

function LeaderboardTableRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
}) {
  const badgeLabel = entry.badge ? BADGE_LABELS[entry.badge] : null;

  return (
    <>
      <div
        className={cn(
          "hidden md:grid grid-cols-[56px_1fr_1.2fr_80px_72px_56px_72px] items-center gap-2 rounded-xl border px-3 py-3 text-sm transition",
          isCurrentUser
            ? "border-cyan-400/40 bg-cyan-500/5 shadow-glow-cyan"
            : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]",
        )}
      >
        <span className="font-bold text-slate-400">#{formatBnNumber(entry.rank)}</span>
        <div className="flex items-center gap-2 min-w-0">
          <Avatar entry={entry} size="sm" />
          <span className="truncate font-semibold text-white">
            {entry.name || "নাম নেই"}
            {isCurrentUser && (
              <span className="ml-1.5 text-[10px] font-bold text-cyan-300">(আপনি)</span>
            )}
          </span>
        </div>
        <span className="truncate text-slate-400 text-xs">{getCollegeLabel(entry)}</span>
        <span className="font-bold text-white">{formatBnNumber(entry.points || 0)}</span>
        <span className="text-slate-400">{formatAccuracy(entry.accuracy)}</span>
        <span className="text-slate-400">
          {entry.examsTaken != null ? formatBnNumber(entry.examsTaken) : "—"}
        </span>
        <div className="flex flex-col gap-1">
          <RankTierBadge rank={entry.rank} />
          {badgeLabel && (
            <span className="truncate text-[9px] text-yellow-300/80">{badgeLabel}</span>
          )}
        </div>
      </div>

      <div
        className={cn(
          "md:hidden rounded-xl border p-3 space-y-2",
          isCurrentUser
            ? "border-cyan-400/40 bg-cyan-500/5"
            : "border-white/5 bg-white/[0.02]",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar entry={entry} size="sm" />
            <div>
              <p className="font-bold text-white">
                {entry.name || "নাম নেই"}
                {isCurrentUser && (
                  <span className="ml-1 text-[10px] text-cyan-300">(আপনি)</span>
                )}
              </p>
              <p className="text-xs text-slate-400">{getCollegeLabel(entry)}</p>
            </div>
          </div>
          <span className="text-lg font-black text-white">#{formatBnNumber(entry.rank)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-lg bg-white/5 px-2 py-1">
            স্কোর: <strong>{formatBnNumber(entry.points || 0)}</strong>
          </span>
          <span className="rounded-lg bg-white/5 px-2 py-1">
            Accuracy: {formatAccuracy(entry.accuracy)}
          </span>
          <span className="rounded-lg bg-white/5 px-2 py-1">
            টেস্ট: {entry.examsTaken != null ? formatBnNumber(entry.examsTaken) : "—"}
          </span>
          <RankTierBadge rank={entry.rank} />
        </div>
      </div>
    </>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition min-h-[44px]",
        active
          ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-300 shadow-glow-cyan"
          : "border-white/10 bg-white/5 text-slate-400 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

function DisabledFilter({ label }: { label: string }) {
  return (
    <div
      className="flex shrink-0 items-center gap-1 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
      title="শীঘ্রই আসছে"
    >
      {label}
      <ChevronDown className="h-3.5 w-3.5 opacity-50" />
    </div>
  );
}

function computeTop100Insight(
  rank: number | null | undefined,
  points: number,
  list: LeaderboardEntry[],
) {
  if (!rank || rank <= 0) {
    return {
      progress: 0,
      message: "আরও টেস্ট দিলে র‍্যাঙ্ক আপডেট হবে।",
    };
  }
  if (rank <= 100) {
    const progress = Math.min(100, Math.round(((100 - rank + 1) / 100) * 100));
    return {
      progress,
      message: `আপনি Top ${formatBnNumber(100)}-এ আছেন! 🎉`,
    };
  }
  const cutoff = list[99];
  if (cutoff && cutoff.points > points) {
    const needed = cutoff.points - points + 1;
    const progress = Math.min(99, Math.round((points / cutoff.points) * 100));
    return {
      progress,
      message: `আপনি Top 100-এর বাইরে আছেন। Top 100-এ যেতে আর ${formatBnNumber(needed)} পয়েন্ট দরকার।`,
    };
  }
  return {
    progress: 0,
    message: "আরও টেস্ট দিলে র‍্যাঙ্ক আপডেট হবে।",
  };
}

export function LeaderboardHub() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("alltime");
  const [showAll, setShowAll] = useState(false);

  const levelTab = useMemo<StudentLevel>(() => {
    const q = searchParams.get("level");
    return q === "hsc" ? "hsc" : "ssc";
  }, [searchParams]);

  useEffect(() => {
    fetchLeaderboard().then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  const setLevelTab = (level: StudentLevel) => {
    router.replace(`/leaderboard?level=${level}`, { scroll: false });
  };

  const filtered = useMemo(
    () => filterLeaderboard(entries, levelTab, "all"),
    [entries, levelTab],
  );

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);
  const visibleRest = showAll ? rest : rest.slice(0, INITIAL_ROWS);

  const myEntry = useMemo((): LeaderboardEntry | null => {
    const found = user ? filtered.find((e) => e.userId === user.id) : null;
    if (found) return found;
    if (!user || !isProfileComplete(user)) return null;
    if (normalizeLevel(user.className, user.level) !== levelTab) return null;
    return {
      rank: user.rank ?? filtered.length + 1,
      userId: user.id,
      name: user.name || "নাম নেই",
      picture: user.picture,
      points: user.elo ?? user.score ?? 0,
      examsTaken: undefined,
      accuracy: undefined,
      streak: user.streak,
      collegeName: user.collegeName,
      schoolName: user.schoolName,
    };
  }, [user, filtered, levelTab]);

  const collegeWars = useMemo(() => aggregateColleges(filtered), [filtered]);
  const top100 = computeTop100Insight(myEntry?.rank, myEntry?.points ?? 0, filtered);

  const hasPerformance =
    myEntry != null &&
    (myEntry.points > 0 || (myEntry.accuracy != null && myEntry.accuracy > 0));

  if (loading) return <LeaderboardSkeleton />;

  return (
    <div className="pb-8 font-bangla animate-fadeIn">
      <header className="mb-6">
        <Badge variant="default" className="mb-3 inline-flex gap-2 border-gold-rank/30 bg-gold-rank/10">
          <Trophy className="h-4 w-4 text-gold-rank" />
          🏆 লিডারবোর্ড
        </Badge>
        <h1 className="text-3xl font-black text-white sm:text-4xl">র‍্যাঙ্কিং</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          SSC ও HSC শিক্ষার্থীদের আলাদা র‍্যাঙ্কিং — স্কোর, Accuracy ও টেস্ট পারফরম্যান্স অনুযায়ী।
        </p>
      </header>

      {user && !isProfileComplete(user) && (
        <ProfileCompletionPrompt variant="hint" className="mb-6" />
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(["ssc", "hsc"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setLevelTab(tab)}
            className={cn(
              "min-h-[44px] rounded-xl px-5 py-2.5 text-sm font-bold border transition-all",
              levelTab === tab
                ? "border-transparent bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-glow-purple"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white",
            )}
          >
            {tab === "ssc" ? "SSC র‍্যাঙ্কিং" : "HSC র‍্যাঙ্কিং"}
          </button>
        ))}
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {TIME_FILTERS.map((f) => (
          <FilterChip
            key={f.id}
            active={timeFilter === f.id}
            onClick={() => setTimeFilter(f.id)}
          >
            {f.label}
          </FilterChip>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <DisabledFilter label="সব বোর্ড" />
        <DisabledFilter label="সব বিষয়" />
        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
          <Globe className="h-3.5 w-3.5 text-cyan-400" />
          Global
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card variant="glass" className="p-10 text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-slate-600" />
          <p className="mb-2 font-bold text-white">
            এখনো কোনো র‍্যাঙ্কিং নেই। প্রথম কুইজ দিয়ে র‍্যাঙ্কে উঠো!
          </p>
          <Link href={levelHubPath(levelTab)}>
            <Button className="mt-4">কুইজ শুরু করো</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
          <div className="min-w-0 space-y-6">
            {top3.length >= 3 && (
              <div className="relative">
                <div className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 text-4xl opacity-20">
                  🏆
                </div>
                <div className="grid grid-cols-3 items-end gap-2 sm:gap-4 pt-6">
                  <PodiumCard entry={top3[1]} place={2} />
                  <PodiumCard entry={top3[0]} place={1} />
                  <PodiumCard entry={top3[2]} place={3} />
                </div>
              </div>
            )}

            <Card variant="glass" className="overflow-hidden p-0">
              <div className="hidden md:grid grid-cols-[56px_1fr_1.2fr_80px_72px_56px_72px] gap-2 border-b border-white/10 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span>র‍্যাঙ্ক</span>
                <span>নাম</span>
                <span>কলেজ</span>
                <span>স্কোর</span>
                <span>Accuracy</span>
                <span>টেস্ট</span>
                <span>ব্যাজ</span>
              </div>
              <div className="space-y-2 p-2 sm:p-3">
                {(top3.length < 3 ? filtered : visibleRest).map((entry) => (
                  <LeaderboardTableRow
                    key={entry.userId || entry.rank}
                    entry={entry}
                    isCurrentUser={user?.id === entry.userId}
                  />
                ))}
              </div>
              {rest.length > INITIAL_ROWS && !showAll && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="w-full border-t border-white/10 py-3 text-sm font-semibold text-cyan-400 hover:bg-white/5"
                >
                  আরও দেখুন ({formatBnNumber(rest.length - INITIAL_ROWS)} জন)
                </button>
              )}
            </Card>
          </div>

          <aside className="space-y-4">
            {myEntry ? (
              <Card variant="glass" className="border-purple-500/20 p-4 shadow-glow-purple">
                <h2 className="mb-3 flex items-center gap-2 text-base font-black text-white">
                  <Target className="h-4 w-4 text-purple-400" />
                  আপনার অবস্থান
                </h2>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white/5 p-2">
                    <p className="text-xs text-slate-500">র‍্যাঙ্ক</p>
                    <p className="text-lg font-black text-cyan-400">
                      #{formatBnNumber(myEntry.rank)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-2">
                    <p className="text-xs text-slate-500">স্কোর</p>
                    <p className="text-lg font-black text-white">
                      {formatBnNumber(myEntry.points || 0)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-2">
                    <p className="text-xs text-slate-500">সঠিকতা</p>
                    <p className="text-lg font-black text-white">
                      {formatAccuracy(myEntry.accuracy)}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-400">{top100.message}</p>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[10px] text-slate-500">
                    <span>Top 100 Progress</span>
                    <span>{formatBnNumber(top100.progress)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all"
                      style={{ width: `${top100.progress}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="rounded-lg bg-white/[0.03] p-2">
                    <p className="text-slate-500">টেস্ট</p>
                    <p className="font-bold text-white">
                      {myEntry.examsTaken != null
                        ? formatBnNumber(myEntry.examsTaken)
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] p-2">
                    <p className="text-slate-500">Best</p>
                    <p className="font-bold text-white">—</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] p-2">
                    <p className="text-slate-500">Streak</p>
                    <p className="flex items-center justify-center gap-0.5 font-bold text-orange-400">
                      {(myEntry.streak ?? user?.streak) ? (
                        <>
                          <Flame className="h-3 w-3" />
                          {formatBnNumber(myEntry.streak ?? user?.streak ?? 0)}
                        </>
                      ) : (
                        "—"
                      )}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-cyan-300/80">
                  💡 আজ ২টি টেস্ট দিলে উন্নতি হতে পারে
                </p>
              </Card>
            ) : (
              <Card variant="glass" className="p-4 text-center text-sm text-slate-400">
                প্রোফাইল সম্পূর্ণ করলে আপনার র‍্যাঙ্ক এখানে দেখা যাবে।
              </Card>
            )}

            <Card variant="glass" className="p-4">
              <h2 className="mb-3 text-base font-black text-white">
                সেরা কলেজ ({levelTab === "ssc" ? "SSC" : "HSC"})
              </h2>
              {collegeWars.length > 0 ? (
                <ul className="space-y-2">
                  {collegeWars.map((c, i) => (
                    <li
                      key={c.name}
                      className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-300">
                        {formatBnNumber(i + 1)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-200">
                        {c.name}
                      </span>
                      <span className="text-xs font-bold text-cyan-400">
                        {formatBnNumber(c.score)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                  <p className="text-sm font-semibold text-slate-300">College Wars শীঘ্রই আসছে</p>
                  <p className="mt-1 text-xs text-slate-500">
                    কলেজ যুক্ত হলে এখানে সেরা কলেজ দেখা যাবে
                  </p>
                </div>
              )}
            </Card>

            <Card variant="glass" className="p-4">
              <h2 className="mb-3 flex items-center gap-2 text-base font-black text-white">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                আপনার পারফরম্যান্স
              </h2>
              {hasPerformance ? (
                <>
                  {myEntry?.accuracy != null && myEntry.accuracy > 0 && (
                    <div className="rounded-xl bg-white/[0.03] p-3">
                      <div className="mb-1 flex justify-between text-[10px] text-slate-500">
                        <span>Accuracy</span>
                        <span>{formatAccuracy(myEntry.accuracy)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
                          style={{ width: `${Math.min(100, Math.round(myEntry.accuracy))}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex justify-between text-xs">
                    <span className="text-slate-400">
                      Best:{" "}
                      <strong className="text-white">
                        {formatBnNumber(myEntry?.points ?? 0)}
                      </strong>
                    </span>
                    <span className="text-slate-400">
                      Avg accuracy:{" "}
                      <strong className="text-white">
                        {myEntry?.accuracy ? formatAccuracy(myEntry.accuracy) : "—"}
                      </strong>
                    </span>
                  </div>
                </>
              ) : (
                <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">
                  টেস্ট দিলে এখানে পারফরম্যান্স দেখা যাবে।
                </p>
              )}
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
