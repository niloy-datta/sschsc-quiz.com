"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LeaderboardSkeleton } from "@/components/leaderboard/LeaderboardSkeleton";
import { RankTierBadge } from "@/components/leaderboard/RankTierBadge";
import {
  aggregateColleges,
  fetchLeaderboard,
  filterLeaderboard,
  formatAccuracy,
  formatBnNumber,
  getCollegeRanking,
  getInitials,
  type CollegeWarEntry,
  type LeaderboardEntry,
} from "@/lib/leaderboard-api";
import { normalizeLevel, type StudentLevel } from "@/lib/profile-utils";
import { CollegeMindGame } from "@/components/leaderboard/CollegeMindGame";
import {
  ArrowLeft,
  Brain,
  Building2,
  Crown,
  Medal,
  Search,
  Shield,
  ShieldCheck,
  Swords,
  Target,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type ViewMode = "list" | "battle" | "mindgame";

interface BattlePair {
  collegeA: CollegeWarEntry | null;
  collegeB: CollegeWarEntry | null;
}

// ─────────────────────────────────────────────
// Reusable sub-components
// ─────────────────────────────────────────────

function Avatar({
  entry,
  size = "md",
}: {
  entry: LeaderboardEntry;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
  };
  if (entry.picture) {
    return (
      <img
        src={entry.picture}
        alt=""
        className={cn(
          "rounded-full object-cover border border-white/10 shrink-0",
          sizes[size],
        )}
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

function TopPerformerRow({
  entry,
  isGold = false,
}: {
  entry: LeaderboardEntry;
  isGold?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2 transition hover:bg-white/[0.06]">
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          isGold
            ? "bg-gold-rank/20 text-gold-rank"
            : "bg-slate-700/50 text-slate-400",
        )}
      >
        {formatBnNumber(entry.rank)}
      </span>
      <Avatar entry={entry} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-200">
          {entry.name || "নাম নেই"}
          {isGold && (
            <Crown className="ml-1 inline h-3 w-3 text-gold-rank" />
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-cyan-400">
          {formatBnNumber(entry.points || 0)}
        </span>
        <RankTierBadge rank={entry.rank} />
      </div>
    </div>
  );
}

function CollegeStatCard({
  label,
  value,
  icon,
  accent = "cyan",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: "cyan" | "purple" | "emerald" | "orange";
}) {
  const accentColors = {
    cyan: "text-cyan-400 border-cyan-400/20 bg-cyan-500/5",
    purple: "text-purple-400 border-purple-400/20 bg-purple-500/5",
    emerald: "text-emerald-400 border-emerald-400/20 bg-emerald-500/5",
    orange: "text-orange-400 border-orange-400/20 bg-orange-500/5",
  };
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl border p-3",
        accentColors[accent],
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider opacity-70">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-lg font-black">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// College Battle Card (head-to-head comparison)
// ─────────────────────────────────────────────

function CollegeBattleCard({
  college,
  entries,
  side,
  onRemove,
}: {
  college: CollegeWarEntry;
  entries: LeaderboardEntry[];
  side: "left" | "right";
  onRemove?: () => void;
}) {
  const collegeEntries = useMemo(
    () => getCollegeRanking(entries, college.name),
    [entries, college.name],
  );

  const top3 = collegeEntries.slice(0, 3);

  return (
    <Card
      variant="glass"
      className={cn(
        "relative flex-1 overflow-hidden p-5",
        side === "left" && "border-purple-500/30",
        side === "right" && "border-cyan-500/30",
      )}
    >
      {/* Side badge */}
      <div
        className={cn(
          "absolute right-0 top-0 rounded-bl-xl px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
          side === "left"
            ? "bg-purple-500/20 text-purple-300"
            : "bg-cyan-500/20 text-cyan-300",
        )}
      >
        {side === "left" ? "Team A" : "Team B"}
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-2 top-8 flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* College name & rank */}
      <div className="mb-4 mt-2">
        <div className="flex items-center gap-2">
          <Building2
            className={cn(
              "h-5 w-5",
              side === "left" ? "text-purple-400" : "text-cyan-400",
            )}
          />
          <h3 className="truncate text-lg font-black text-white">
            {college.name}
          </h3>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <CollegeStatCard
            label="মোট স্কোর"
            value={formatBnNumber(college.score)}
            icon={<Trophy className="h-3 w-3" />}
            accent={side === "left" ? "purple" : "cyan"}
          />
          <CollegeStatCard
            label="শিক্ষার্থী"
            value={formatBnNumber(college.studentCount)}
            icon={<Users className="h-3 w-3" />}
            accent="emerald"
          />
          <CollegeStatCard
            label="গড় স্কোর"
            value={formatBnNumber(college.avgScore)}
            icon={<Target className="h-3 w-3" />}
            accent="orange"
          />
          <CollegeStatCard
            label="সর্বোচ্চ"
            value={formatBnNumber(college.topScore)}
            icon={<Crown className="h-3 w-3" />}
            accent={side === "left" ? "purple" : "cyan"}
          />
        </div>
      </div>

      {/* Top performers */}
      <div>
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Medal className="h-3.5 w-3.5" />
          শীর্ষ পারফর্মার
        </h4>
        <div className="space-y-1">
          {top3.length > 0 ? (
            top3.map((e, i) => (
              <TopPerformerRow key={e.userId || i} entry={e} isGold={i === 0} />
            ))
          ) : (
            <p className="py-3 text-center text-xs text-slate-600">
              এখনো কেউ র‍্যাঙ্কিংয়ে নেই
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// College Drill-Down
// ─────────────────────────────────────────────

function CollegeDrillDownView({
  collegeName,
  entries,
  level = "ssc",
  onBack,
  onBattle,
}: {
  collegeName: string;
  entries: LeaderboardEntry[];
  level?: StudentLevel;
  onBack: () => void;
  onBattle: () => void;
}) {
  const isSchool = level === "ssc";
  const collegeEntries = useMemo(
    () => getCollegeRanking(entries, collegeName),
    [entries, collegeName],
  );

  const college = useMemo((): CollegeWarEntry | null => {
    const all = aggregateColleges(entries);
    return all.find((c) => c.name === collegeName) || null;
  }, [entries, collegeName]);

  return (
    <div className="space-y-4">
      {/* Header with back & battle buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="পিছনে"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-black text-white">
            <Building2 className="mr-2 inline h-5 w-5 text-purple-400" />
            {collegeName}
          </h2>
        </div>
        <button
          type="button"
          onClick={onBattle}
          className="flex items-center gap-1.5 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20"
        >
          <Swords className="h-3.5 w-3.5" />
          Battle
        </button>
      </div>

      {/* Stats grid */}
      {college && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CollegeStatCard
            label="মোট স্কোর"
            value={formatBnNumber(college.score)}
            icon={<Trophy className="h-3 w-3" />}
            accent="purple"
          />
          <CollegeStatCard
            label="শিক্ষার্থী"
            value={formatBnNumber(college.studentCount)}
            icon={<Users className="h-3 w-3" />}
            accent="emerald"
          />
          <CollegeStatCard
            label="গড় স্কোর"
            value={formatBnNumber(college.avgScore)}
            icon={<Target className="h-3 w-3" />}
            accent="orange"
          />
          <CollegeStatCard
            label="সর্বোচ্চ"
            value={formatBnNumber(college.topScore)}
            icon={<Crown className="h-3 w-3" />}
            accent="cyan"
          />
        </div>
      )}

      {/* Student rankings */}
      <Card variant="glass" className="overflow-hidden p-0">
        <div className="border-b border-white/10 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <Users className="h-4 w-4 text-cyan-400" />
            শিক্ষার্থী র‍্যাঙ্কিং ({formatBnNumber(collegeEntries.length)} জন)
          </h3>
        </div>
        <div className="space-y-1 p-3">
          {collegeEntries.length > 0 ? (
            collegeEntries.map((entry) => (
              <div
                key={entry.userId || entry.rank}
                className="flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2.5 transition hover:bg-white/[0.05]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700/50 text-[11px] font-bold text-slate-400">
                  {formatBnNumber(entry.rank)}
                </span>
                <Avatar entry={entry} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-200">
                    {entry.name || "নাম নেই"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Accuracy: {formatAccuracy(entry.accuracy)}
                    {entry.examsTaken != null &&
                      ` · ${formatBnNumber(entry.examsTaken)} টেস্ট`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-sm font-bold text-cyan-400">
                    {formatBnNumber(entry.points || 0)}
                  </span>
                  <RankTierBadge rank={entry.rank} />
                </div>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-xs text-slate-500">
              এই {isSchool ? "স্কুলের" : "কলেজের"} কেউ এখনো র‍্যাঙ্কিংয়ে নেই। প্রথম কুইজ দিয়ে শুরু করুন!
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// College Ranking Table
// ─────────────────────────────────────────────

function CollegeRankingTable({
  colleges,
  level = "ssc",
  onSelect,
  onBattle,
}: {
  colleges: CollegeWarEntry[];
  level?: StudentLevel;
  onSelect: (name: string) => void;
  onBattle: (name: string) => void;
}) {
  const isSchool = level === "ssc";
  return (
    <Card variant="glass" className="overflow-hidden p-0">
      {/* Table header */}
      <div className="hidden md:grid grid-cols-[48px_1fr_100px_120px_100px_100px_80px] items-center gap-3 border-b border-white/10 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <span>#</span>
        <span>{isSchool ? "স্কুলের নাম" : "কলেজের নাম"}</span>
        <span>শিক্ষার্থী</span>
        <span>মোট স্কোর</span>
        <span>গড় স্কোর</span>
        <span>সর্বোচ্চ</span>
        <span>Battle</span>
      </div>

      <div className="divide-y divide-white/[0.03]">
        {colleges.map((c, i) => (
          <div key={c.name}>
            {/* Desktop row */}
            <div className="hidden md:grid grid-cols-[48px_1fr_100px_120px_100px_100px_80px] items-center gap-3 px-4 py-3 text-sm transition hover:bg-white/[0.04]">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  i === 0
                    ? "bg-gold-rank/20 text-gold-rank"
                    : i === 1
                      ? "bg-slate-300/20 text-slate-300"
                      : i === 2
                        ? "bg-amber-600/20 text-amber-500"
                        : "bg-slate-700/30 text-slate-500",
                )}
              >
                {formatBnNumber(i + 1)}
              </span>
              <button
                type="button"
                onClick={() => onSelect(c.name)}
                className="truncate text-left font-semibold text-slate-200 underline-offset-2 hover:text-white hover:underline"
              >
                <Building2 className="mr-1.5 inline h-3.5 w-3.5 text-purple-400/70" />
                {c.name}
              </button>
              <span className="font-medium text-slate-300">
                <Users className="mr-1 inline h-3.5 w-3.5 text-emerald-400/70" />
                {formatBnNumber(c.studentCount)}
              </span>
              <span className="font-bold text-cyan-400">
                {formatBnNumber(c.score)}
              </span>
              <span className="text-slate-400">
                {formatBnNumber(c.avgScore)}
              </span>
              <span className="font-medium text-orange-300">
                {formatBnNumber(c.topScore)}
              </span>
              <button
                type="button"
                onClick={() => onBattle(c.name)}
                className="flex items-center gap-1 rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold text-cyan-300 transition hover:bg-cyan-500/20"
              >
                <Swords className="h-3 w-3" />
                Battle
              </button>
            </div>

            {/* Mobile row */}
            <div className="md:hidden space-y-1 px-4 py-3 transition hover:bg-white/[0.04]">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    i === 0
                      ? "bg-gold-rank/20 text-gold-rank"
                      : i === 1
                        ? "bg-slate-300/20 text-slate-300"
                        : i === 2
                          ? "bg-amber-600/20 text-amber-500"
                          : "bg-slate-700/30 text-slate-500",
                  )}
                >
                  {formatBnNumber(i + 1)}
                </span>
                <button
                  type="button"
                  onClick={() => onSelect(c.name)}
                  className="min-w-0 flex-1 truncate text-left font-semibold text-slate-200"
                >
                  {c.name}
                </button>
                <button
                  type="button"
                  onClick={() => onBattle(c.name)}
                  className="flex items-center gap-1 rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold text-cyan-300"
                >
                  <Swords className="h-3 w-3" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                <span>
                  <Users className="mr-0.5 inline h-3 w-3 text-emerald-400/70" />
                  {formatBnNumber(c.studentCount)} জন
                </span>
                <span className="text-white/20">·</span>
                <span>
                  স্কোর:{" "}
                  <strong className="text-cyan-400">
                    {formatBnNumber(c.score)}
                  </strong>
                </span>
                <span className="text-white/20">·</span>
                <span>
                  গড়: {formatBnNumber(c.avgScore)}
                </span>
                <span className="text-white/20">·</span>
                <span>
                  সর্বোচ্চ:{" "}
                  <strong className="text-orange-300">
                    {formatBnNumber(c.topScore)}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
// College Battle Arena (side-by-side comparison)
// ─────────────────────────────────────────────

function CollegeBattleArena({
  colleges,
  entries,
  battlePair,
  level = "ssc",
  onAddCollege,
  onRemoveCollege,
  onExitBattle,
}: {
  colleges: CollegeWarEntry[];
  entries: LeaderboardEntry[];
  battlePair: BattlePair;
  level?: StudentLevel;
  onAddCollege: (name: string) => void;
  onRemoveCollege: (slot: "collegeA" | "collegeB") => void;
  onExitBattle: () => void;
}) {
  const isSchool = level === "ssc";
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");

  const filteredColleges = useMemo(() => {
    if (!searchA && !searchB) return colleges;
    const q = (searchA || searchB).toLowerCase();
    if (!q) return colleges;
    return colleges.filter(
      (c) =>
        c.name.toLowerCase().includes(q) &&
        c.name !== battlePair.collegeA?.name &&
        c.name !== battlePair.collegeB?.name,
    );
  }, [colleges, searchA, searchB, battlePair]);

  const selectedCount = [battlePair.collegeA, battlePair.collegeB].filter(
    Boolean,
  ).length;
  const diffScore =
    (battlePair.collegeA?.score || 0) - (battlePair.collegeB?.score || 0);
  const diffStudents =
    (battlePair.collegeA?.studentCount || 0) -
    (battlePair.collegeB?.studentCount || 0);

  return (
    <div className="space-y-4">
      {/* Battle header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onExitBattle}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Battle মোড বন্ধ করুন"
        >
          <X className="h-4 w-4" />
        </button>
        <Badge
          variant="default"
          className="inline-flex gap-2 border-orange-400/30 bg-orange-500/10"
        >
          <Swords className="h-4 w-4 text-orange-400" />
          Battle Arena
        </Badge>
        <span className="text-xs text-slate-500">
          ২টি {isSchool ? "স্কুল" : "কলেজ"} সিলেক্ট করে তুলনা করুন
        </span>
      </div>

      {/* VS Display */}
      {selectedCount === 2 && (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-purple-900/20 via-cyan-900/20 to-purple-900/20 px-4 py-3">
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 font-bold text-purple-300">
              <Shield className="h-4 w-4" />
              {battlePair.collegeA?.name}
            </span>
            <span className="flex items-center gap-1 text-2xl font-black text-white">
              {formatBnNumber(battlePair.collegeA?.score || 0)}
            </span>
            <span className="text-2xl font-black text-orange-400">VS</span>
            <span className="flex items-center gap-1 text-2xl font-black text-white">
              {formatBnNumber(battlePair.collegeB?.score || 0)}
            </span>
            <span className="flex items-center gap-1.5 font-bold text-cyan-300">
              <ShieldCheck className="h-4 w-4" />
              {battlePair.collegeB?.name}
            </span>
          </div>
          {diffScore !== 0 && (
            <p className="mt-2 text-center text-xs text-slate-400">
              <strong className="text-white">
                {diffScore > 0
                  ? battlePair.collegeA?.name
                  : battlePair.collegeB?.name}
              </strong>{" "}
              এগিয়ে আছে {formatBnNumber(Math.abs(diffScore))} পয়েন্টে —
              {diffStudents > 0
                ? ` ${formatBnNumber(Math.abs(diffStudents))} জন বেশি শিক্ষার্থী`
                : diffStudents < 0
                  ? ` ${formatBnNumber(Math.abs(diffStudents))} জন কম শিক্ষার্থী`
                  : " সমান সংখ্যক শিক্ষার্থী"}
            </p>
          )}
        </div>
      )}

      {/* College selection + cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* College A slot */}
        {battlePair.collegeA ? (
          <CollegeBattleCard
            college={battlePair.collegeA}
            entries={entries}
            side="left"
            onRemove={() => onRemoveCollege("collegeA")}
          />
        ) : (
          <Card variant="glass" className="flex flex-col items-center justify-center p-6">
            <p className="mb-3 text-sm font-semibold text-slate-400">
              দল A সিলেক্ট করুন
            </p>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchA}
                onChange={(e) => setSearchA(e.target.value)}
                placeholder={`${isSchool ? "স্কুলের" : "কলেজের"} নাম লিখুন...`}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
              />
            </div>
            {searchA && (
              <ul className="mt-3 w-full max-w-xs space-y-1">
                {filteredColleges.slice(0, 5).map((c) => (
                  <li key={c.name}>
                    <button
                      type="button"
                      onClick={() => {
                        onAddCollege(c.name);
                        setSearchA("");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                      <span className="truncate">{c.name}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-slate-600">
                        {formatBnNumber(c.score)} pts
                      </span>
                    </button>
                  </li>
                ))}
                {filteredColleges.length === 0 && (
                  <p className="py-2 text-center text-xs text-slate-600">
                    কোনো {isSchool ? "স্কুল" : "কলেজ"} পাওয়া যায়নি
                  </p>
                )}
              </ul>
            )}
          </Card>
        )}

        {/* College B slot */}
        {battlePair.collegeB ? (
          <CollegeBattleCard
            college={battlePair.collegeB}
            entries={entries}
            side="right"
            onRemove={() => onRemoveCollege("collegeB")}
          />
        ) : (
          <Card variant="glass" className="flex flex-col items-center justify-center p-6">
            <p className="mb-3 text-sm font-semibold text-slate-400">
              দল B সিলেক্ট করুন
            </p>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchB}
                onChange={(e) => setSearchB(e.target.value)}
                placeholder={`${isSchool ? "স্কুলের" : "কলেজের"} নাম লিখুন...`}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
              />
            </div>
            {searchB && (
              <ul className="mt-3 w-full max-w-xs space-y-1">
                {filteredColleges.slice(0, 5).map((c) => (
                  <li key={c.name}>
                    <button
                      type="button"
                      onClick={() => {
                        onAddCollege(c.name);
                        setSearchB("");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                      <span className="truncate">{c.name}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-slate-600">
                        {formatBnNumber(c.score)} pts
                      </span>
                    </button>
                  </li>
                ))}
                {filteredColleges.length === 0 && (
                  <p className="py-2 text-center text-xs text-slate-600">
                    কোনো {isSchool ? "স্কুল" : "কলেজ"} পাওয়া যায়নি
                  </p>
                )}
              </ul>
            )}
          </Card>
        )}
      </div>

      {/* Results section when both colleges are selected */}
      {battlePair.collegeA && battlePair.collegeB && (
        <Card variant="glass" className="p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
            <Zap className="h-4 w-4 text-orange-400" />
            Battle ফলাফল
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/[0.03] p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                বিজয়ী
              </p>
              <p className="mt-1 text-base font-black text-cyan-400">
                {diffScore > 0
                  ? battlePair.collegeA.name
                  : diffScore < 0
                    ? battlePair.collegeB.name
                    : "সমতা ⚖️"}
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                পয়েন্টের পার্থক্য
              </p>
              <p className="mt-1 text-base font-black text-white">
                {formatBnNumber(Math.abs(diffScore))}
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                মোট শিক্ষার্থী
              </p>
              <p className="mt-1 text-base font-black text-white">
                {formatBnNumber(
                  (battlePair.collegeA.studentCount || 0) +
                    (battlePair.collegeB.studentCount || 0),
                )}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function CollegeWarsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [battlePair, setBattlePair] = useState<BattlePair>({
    collegeA: null,
    collegeB: null,
  });

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
    router.replace(`/leaderboard/college-wars?level=${level}`, {
      scroll: false,
    });
  };

  const filtered = useMemo(
    () => filterLeaderboard(entries, levelTab, "all"),
    [entries, levelTab],
  );

  const colleges = useMemo(() => aggregateColleges(filtered), [filtered]);

  const searchedColleges = useMemo(() => {
    if (!searchQuery.trim()) return colleges;
    const q = searchQuery.toLowerCase();
    return colleges.filter((c) => c.name.toLowerCase().includes(q));
  }, [colleges, searchQuery]);

  const handleSelectCollege = (name: string) => {
    setSelectedCollege(name);
    setViewMode("list");
  };

  const handleBattle = (name?: string) => {
    const college = colleges.find((c) => c.name === (name || ""));
    if (!college) {
      setBattlePair({ collegeA: null, collegeB: null });
      setViewMode("battle");
      return;
    }
    if (!battlePair.collegeA) {
      setBattlePair((prev) => ({ ...prev, collegeA: college }));
    } else if (!battlePair.collegeB && college.name !== battlePair.collegeA.name) {
      setBattlePair((prev) => ({ ...prev, collegeB: college }));
    }
    setViewMode("battle");
    setSelectedCollege(null);
  };

  const handleAddCollege = (name: string) => {
    const college = colleges.find((c) => c.name === name);
    if (!college) return;
    if (!battlePair.collegeA) {
      setBattlePair((prev) => ({ ...prev, collegeA: college }));
    } else if (!battlePair.collegeB) {
      setBattlePair((prev) => ({ ...prev, collegeB: college }));
    }
  };

  const handleRemoveCollege = (slot: "collegeA" | "collegeB") => {
    setBattlePair((prev) => ({ ...prev, [slot]: null }));
  };

  const handleExitBattle = () => {
    setBattlePair({ collegeA: null, collegeB: null });
    setViewMode("list");
  };

  if (loading) return <LeaderboardSkeleton />;

  return (
    <div className="pb-10 font-bangla animate-fadeIn">
      {/* Header */}
      <header className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <Link
            href="/leaderboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Badge
            variant="default"
            className="inline-flex gap-2 border-purple-500/30 bg-purple-500/10"
          >
            <Swords className="h-4 w-4 text-purple-400" />
            🏆 College Wars
          </Badge>
        </div>
        <h1 className="text-3xl font-black text-white sm:text-4xl">
          কলেজ যুদ্ধ
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          SSC স্কুল ও HSC কলেজগুলোর মধ্যে র‍্যাঙ্কিং যুদ্ধ — কোন প্রতিষ্ঠান সেরা, দেখুন
          বিস্তারিত পরিসংখ্যান।
        </p>
      </header>

      {/* Level tabs */}
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
            {tab === "ssc" ? "SSC স্কুল" : "HSC কলেজ"}
          </button>
        ))}
      </div>

      {/* View mode toggle + search */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              setViewMode("list");
              setSelectedCollege(null);
            }}
            className={cn(
              "rounded-xl border px-4 py-2 text-xs font-bold transition",
              viewMode === "list" && !selectedCollege
                ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-300"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white",
            )}
          >
            <Building2 className="mr-1.5 inline h-3.5 w-3.5" />
            র‍্যাঙ্কিং
          </button>
          <button
            type="button"
            onClick={() => handleBattle()}
            className={cn(
              "rounded-xl border px-4 py-2 text-xs font-bold transition",
              viewMode === "battle"
                ? "border-orange-400/40 bg-orange-500/15 text-orange-300"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white",
            )}
          >
            <Swords className="mr-1.5 inline h-3.5 w-3.5" />
            Battle Arena
          </button>
          <button
            type="button"
            onClick={() => setViewMode("mindgame")}
            className={cn(
              "rounded-xl border px-4 py-2 text-xs font-bold transition",
              viewMode === "mindgame"
                ? "border-purple-400/40 bg-purple-500/15 text-purple-300"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white",
            )}
          >
            <Brain className="mr-1.5 inline h-3.5 w-3.5" />
            মাইন্ড গেম
          </button>
        </div>

        {viewMode === "list" && !selectedCollege && (
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={levelTab === "ssc" ? "স্কুল খুঁজুন..." : "কলেজ খুঁজুন..."}
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Main content */}
      {filtered.length === 0 ? (
        <Card variant="glass" className="p-10 text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-slate-600" />
          <p className="mb-2 font-bold text-white">
            এখনো কোনো র‍্যাঙ্কিং নেই। প্রথম কুইজ দিয়ে শুরু করুন!
          </p>
          <Link href={`/${levelTab}`}>
            <Button className="mt-4">কুইজ শুরু করো</Button>
          </Link>
        </Card>
      ) : viewMode === "mindgame" ? (
        <CollegeMindGame
          colleges={colleges}
          entries={filtered}
          level={levelTab}
          onExit={() => setViewMode("list")}
        />
      ) : viewMode === "battle" ? (
        <CollegeBattleArena
          colleges={colleges}
          entries={filtered}
          battlePair={battlePair}
          level={levelTab}
          onAddCollege={handleAddCollege}
          onRemoveCollege={handleRemoveCollege}
          onExitBattle={handleExitBattle}
        />
      ) : selectedCollege ? (
        <CollegeDrillDownView
          collegeName={selectedCollege}
          entries={filtered}
          level={levelTab}
          onBack={() => setSelectedCollege(null)}
          onBattle={() => handleBattle(selectedCollege)}
        />
      ) : (
        <CollegeRankingTable
          colleges={searchedColleges}
          level={levelTab}
          onSelect={handleSelectCollege}
          onBattle={(name) =>
            handleBattle(name)
          }
        />
      )}
    </div>
  );
}
