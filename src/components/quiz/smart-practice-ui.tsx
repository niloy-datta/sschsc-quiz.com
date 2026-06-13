"use client";

import type React from "react";
import {
  BookOpen,
  ClipboardList,
  HelpCircle,
  TrendingUp,
  Trophy,
  TrendingDown,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Atom orbital graphic — pixel-match to mockup reference */
export function AtomHeroGraphic() {
  return (
    <div className="pointer-events-none absolute right-4 top-4 hidden h-44 w-80 overflow-hidden sm:block lg:right-8 lg:top-6 lg:h-48 lg:w-96 xl:block">
      <div className="absolute right-16 top-6 h-28 w-28 rounded-full border border-cyan-300/25 bg-cyan-400/5 blur-sm" />
      <div className="absolute right-20 top-10 grid h-24 w-24 place-items-center rounded-full bg-fuchsia-500/10 shadow-[0_0_60px_rgba(217,70,239,0.6)]">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-300 via-fuchsia-400 to-pink-600 shadow-[0_0_35px_rgba(236,72,153,0.8)]" />
      </div>
      <div className="absolute right-4 top-14 h-1 w-64 rotate-[25deg] rounded-full bg-cyan-400/35" />
      <div className="absolute right-4 top-14 h-1 w-64 -rotate-[25deg] rounded-full bg-blue-400/35" />
      <div className="absolute right-16 top-6 h-36 w-36 rotate-[25deg] rounded-[50%] border border-blue-300/50" />
      <div className="absolute right-16 top-6 h-36 w-36 -rotate-[25deg] rounded-[50%] border border-cyan-300/50" />
      <div className="absolute right-16 top-6 h-36 w-36 rotate-90 rounded-[50%] border border-indigo-300/50" />
      <div className="absolute right-[220px] top-16 h-3.5 w-3.5 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.9)]" />
      <div className="absolute right-10 top-10 h-3.5 w-3.5 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.9)]" />
      <div className="absolute right-20 top-28 h-3.5 w-3.5 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.9)]" />
      <p className="absolute left-2 top-2 text-base italic text-blue-200/45 lg:text-lg">E = mc²</p>
      <p className="absolute right-0 bottom-2 text-base italic text-blue-200/35 lg:text-lg">F = ma</p>
    </div>
  );
}

export const DASHBOARD_STAT_CONFIG = [
  { key: "chapters", label: "মোট অধ্যায়", icon: BookOpen, color: "text-sky-400", glow: "shadow-[0_0_12px_rgba(56,189,248,0.2)]" },
  { key: "tests", label: "মোট টেস্ট", icon: ClipboardList, color: "text-fuchsia-400", glow: "shadow-[0_0_12px_rgba(232,121,249,0.2)]" },
  { key: "mcq", label: "মোট MCQ", icon: HelpCircle, color: "text-cyan-400", glow: "shadow-[0_0_12px_rgba(34,211,238,0.2)]" },
  { key: "attempted", label: "চেষ্টা করেছেন", icon: Users, color: "text-blue-400", glow: "shadow-[0_0_12px_rgba(96,165,250,0.2)]" },
  { key: "avg", label: "Average Score", icon: TrendingUp, color: "text-cyan-300", glow: "shadow-[0_0_12px_rgba(103,232,249,0.2)]" },
  { key: "high", label: "Highest Score", icon: Trophy, color: "text-green-400", glow: "shadow-[0_0_12px_rgba(74,222,128,0.2)]" },
  { key: "low", label: "Lowest Score", icon: TrendingDown, color: "text-rose-400", glow: "shadow-[0_0_12px_rgba(251,113,133,0.2)]" },
] as const;

export function DashboardStatCard({
  label,
  value,
  icon: Icon,
  color,
  glow,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  glow?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-700/70 bg-slate-950/60 px-3 py-2.5 backdrop-blur-sm",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
        glow,
      )}
    >
      <div className="flex items-center gap-2.5">
        <Icon className={cn("h-7 w-7 shrink-0", color)} />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold leading-tight text-slate-400 sm:text-xs">
            {label}
          </p>
          <p className={cn("truncate text-lg font-black leading-tight sm:text-xl", color)}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
