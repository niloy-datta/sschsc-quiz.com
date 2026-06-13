"use client";

import React, { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  Swords,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { subjectLabel } from "@/lib/profile-options";
import {
  computeChapterStats,
  computeEloTrend,
  computeOverallAccuracy,
  parseSubjectKey,
  type RecentExamAttempt,
} from "@/lib/dashboard-analytics";

type Props = {
  recentExams: RecentExamAttempt[];
  currentElo: number;
};

function EloSparkline({ points }: { points: { label: string; elo: number }[] }) {
  const width = 280;
  const height = 88;
  const padding = 8;

  const min = Math.min(...points.map((p) => p.elo)) - 20;
  const max = Math.max(...points.map((p) => p.elo)) + 20;
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x =
      padding +
      (i / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y =
      height -
      padding -
      ((p.elo - min) / range) * (height - padding * 2);
    return { x, y, ...p };
  });

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const area = `${padding},${height - padding} ${polyline} ${width - padding},${height - padding}`;
  const last = coords[coords.length - 1];
  const delta =
    points.length >= 2 ? points[points.length - 1].elo - points[0].elo : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Last {points.length} battles</span>
        <span
          className={cn(
            "font-bold font-outfit flex items-center gap-1",
            delta >= 0 ? "text-green-400" : "text-red-400",
          )}
        >
          {delta >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {delta >= 0 ? "+" : ""}
          {delta} ELO
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[88px] overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id="eloFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,211,238,0.35)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
          <linearGradient id="eloLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#eloFill)" />
        <polyline
          points={polyline}
          fill="none"
          stroke="url(#eloLine)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {last && (
          <circle
            cx={last.x}
            cy={last.y}
            r="4"
            fill="#22d3ee"
            className="animate-pulse"
          />
        )}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-600 font-outfit">
        <span>{points[0]?.elo}</span>
        <span className="text-cyan-400 font-bold">{last?.elo} ELO</span>
      </div>
    </div>
  );
}

function MasteryRing({ accuracy }: { accuracy: number }) {
  const pct = Math.min(100, Math.max(0, accuracy));
  return (
    <div className="relative mx-auto h-36 w-36">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 210deg, #22d3ee ${pct * 0.55}%, #a855f7 ${pct}%, rgba(255,255,255,0.06) ${pct}%)`,
          boxShadow: "0 0 40px rgba(34,211,238,0.15)",
        }}
      />
      <div className="absolute inset-[10px] rounded-full bg-[#07111F]/95 border border-white/5 flex flex-col items-center justify-center">
        <Activity className="h-5 w-5 text-cyan-400 mb-1" />
        <span className="text-3xl font-black text-white font-outfit">{pct}%</span>
        <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-0.5">
          Mastery
        </span>
      </div>
    </div>
  );
}

export function AnalyticsSection({ recentExams, currentElo }: Props) {
  const chapterStats = useMemo(
    () => computeChapterStats(recentExams),
    [recentExams],
  );
  const eloTrend = useMemo(
    () => computeEloTrend(recentExams, currentElo, 10),
    [recentExams, currentElo],
  );
  const mastery = useMemo(
    () => computeOverallAccuracy(recentExams),
    [recentExams],
  );

  const weakest = chapterStats[0];
  const strongest = chapterStats[chapterStats.length - 1];
  const meterRows = chapterStats.slice(0, 6);

  if (recentExams.length === 0) {
    return (
      <Card variant="glass" className="p-6 mb-6 border-cyan-500/10">
        <p className="text-center text-slate-400 text-sm py-6">
          Analytics unlock করতে কমপক্ষে ১টি কুইজ সম্পন্ন করো।
        </p>
      </Card>
    );
  }

  return (
    <Card
      variant="glass"
      className="p-5 md:p-6 mb-6 border-cyan-500/15 relative overflow-hidden"
      id="analytics"
    >
      <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-purple-glow/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 relative">
        <div>
          <Badge variant="default" className="mb-2 border-cyan-400/20 text-cyan-300">
            Zero-Cost Analytics
          </Badge>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Swords className="h-5 w-5 text-purple-glow" />
            Battle Intel
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Last {recentExams.length} exams · no extra DB reads
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Live ELO</p>
          <p className="text-2xl font-black text-cyan-400 font-outfit">{currentElo}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 relative">
        {/* Weakness / Strength */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-400" />
            Weakness / Strength Meter
          </h3>

          {weakest && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-[10px] uppercase text-red-300/80 mb-1">Critical Weakness</p>
              <p className="text-sm font-semibold text-white truncate">{weakest.label}</p>
              <p className="text-xs text-red-300 mt-1">{weakest.avgPct}% avg · {weakest.attempts}×</p>
            </div>
          )}

          {strongest && strongest.slug !== weakest?.slug && (
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3">
              <p className="text-[10px] uppercase text-green-300/80 mb-1 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Power Zone
              </p>
              <p className="text-sm font-semibold text-white truncate">{strongest.label}</p>
              <p className="text-xs text-green-300 mt-1">{strongest.avgPct}% avg</p>
            </div>
          )}

          <div className="space-y-2.5">
            {meterRows.map((row) => (
              <div key={row.slug}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400 truncate pr-2">{row.label}</span>
                  <span className="text-slate-300 font-outfit shrink-0">{row.avgPct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      row.avgPct >= 70
                        ? "bg-gradient-to-r from-green-500 to-cyan-400"
                        : row.avgPct >= 40
                          ? "bg-gradient-to-r from-amber-500 to-orange-400"
                          : "bg-gradient-to-r from-red-500 to-rose-400",
                    )}
                    style={{ width: `${Math.max(row.avgPct, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ELO Trend */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            ELO Trend
          </h3>
          <EloSparkline points={eloTrend} />
        </div>

        {/* Mastery Ring */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-col items-center justify-center text-center">
          <h3 className="text-sm font-bold text-white mb-4 self-start flex items-center gap-2">
            <Activity className="h-4 w-4 text-purple-glow" />
            Weekly Mastery
          </h3>
          <MasteryRing accuracy={mastery} />
          <p className="text-xs text-slate-400 mt-4 max-w-[200px]">
            Overall accuracy across your last {recentExams.length} battles
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
            {Array.from(new Set(recentExams.map((e) => parseSubjectKey(e.examSlug)))).slice(0, 3).map((k) => (
              <Badge key={k} variant="default" className="text-[10px]">
                {subjectLabel(k)}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
