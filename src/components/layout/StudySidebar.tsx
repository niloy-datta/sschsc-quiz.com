"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { normalizeLevel } from "@/lib/profile-utils";
import {
  Atom,
  BookOpen,
  Brain,
  ClipboardList,
  LayoutGrid,
  Radio,
  Target,
  Trophy,
  Bookmark,
  AlertCircle,
  Shuffle,
  Book,
  BarChart3,
  FlaskConical,
  Leaf,
  FunctionSquare,
  Pi,
  Zap,
  Menu,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  detectStudyLevel,
  HSC_SIDEBAR_PAPERS,
  levelHubPath,
  resolveActiveSubjectBasePath,
  resolveSscSidebarSubjectGroups,
  type RouteLevel,
} from "@/lib/quiz/unified-routes";

type StudyLevel = RouteLevel;

function subjectIcon(label: string): React.ElementType {
  if (label.includes("রসায়ন") || label.includes("রসায়ন")) return FlaskConical;
  if (label.includes("জীব")) return Leaf;
  if (label.includes("উচ্চতর") && label.includes("২")) return Pi;
  if (label.includes("উচ্চতর") || label.includes("গণিত")) return FunctionSquare;
  return Atom;
}

function getSidebarItems(level: StudyLevel, subjectBase: string | null) {
  const hub = levelHubPath(level);
  const chapterHref = subjectBase ? `${subjectBase}?tab=chapter` : hub;
  const modelHref = subjectBase
    ? `${subjectBase}?tab=model&model=paper`
    : `${hub}/model-tests`;

  return [
    {
      label: "অধ্যায়ভিত্তিক কুইজ",
      href: chapterHref,
      icon: BookOpen,
      match: (p: string, tab: string | null) => {
        if (subjectBase && p.startsWith(subjectBase)) {
          return tab === "chapter" || tab === null;
        }
        return (
          p === hub ||
          (p.startsWith(`${hub}/`) &&
            !p.includes("/model-tests") &&
            !p.includes("/full-book-test") &&
            !p.includes("/wrong-answers") &&
            !p.includes("/saved-questions") &&
            !p.includes("/final-focus"))
        );
      },
    },
    {
      label: "মডেল টেস্ট",
      href: modelHref,
      icon: Target,
      match: (p: string, tab: string | null) =>
        p.includes("/model-tests") ||
        (subjectBase != null && p.startsWith(subjectBase) && tab === "model"),
    },
    { label: "লাইভ টেস্ট 🔴", href: "/live-test", icon: Radio, match: (p: string) => p.startsWith("/live-test") },
    { label: "দুর্বল অধ্যায়", href: "/dashboard#weak-chapters", icon: Brain, match: (p: string) => p === "/dashboard" },
    { label: "সাম্প্রতিক পরীক্ষা", href: "/dashboard#recent-exams", icon: ClipboardList, match: (p: string) => p === "/dashboard" },
    { label: "লিডারবোর্ড", href: "/leaderboard", icon: Trophy, match: (p: string) => p.startsWith("/leaderboard") },
    { label: "আমার ড্যাশবোর্ড", href: "/dashboard", icon: LayoutGrid, match: (p: string) => p === "/dashboard" },
  ];
}

function getQuickAccessItems(level: StudyLevel) {
  return [
    { label: "সেভ করা প্রশ্ন", href: `/${level}/saved-questions`, icon: Bookmark },
    { label: "ভুল উত্তর", href: `/${level}/wrong-answers`, icon: AlertCircle },
    { label: "র‍্যান্ডম টেস্ট", href: `/${level}/final-focus`, icon: Shuffle },
    { label: "পূর্ণ বই টেস্ট", href: `/${level}/full-book-test`, icon: Book },
    { label: "পারফরম্যান্স অ্যানালাইসিস", href: "/dashboard", icon: BarChart3 },
  ];
}

export function StudySidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const isBoardQuestionsRoute =
    pathname.startsWith("/ssc-board-questions") ||
    pathname.startsWith("/hsc-board-questions");

  const leaderboardLevel =
    pathname.startsWith("/leaderboard") && searchParams.get("level") === "hsc"
      ? "hsc"
      : pathname.startsWith("/leaderboard")
        ? "ssc"
        : null;

  if (isBoardQuestionsRoute) {
    const isSsc = pathname.startsWith("/ssc-board-questions");
    const base = levelHubPath(isSsc ? "ssc" : "hsc");
    const compactItems = [
      { label: "অধ্যায়ভিত্তিক কুইজ", href: base, icon: BookOpen },
      { label: "মডেল টেস্ট", href: `${base}/model-tests`, icon: Target },
      { label: "লাইভ টেস্ট 🔴", href: "/live-test", icon: Radio },
      { label: "লিডারবোর্ড", href: "/leaderboard", icon: Trophy },
      { label: "আমার ড্যাশবোর্ড", href: "/dashboard", icon: LayoutGrid },
    ];

    return (
      <aside className="w-full shrink-0 pb-4 lg:w-[280px] lg:pb-8 lg:pt-4" aria-label="প্রস্তুতি মেনু">
        <section className="sticky top-20 rounded-2xl border border-slate-700/80 bg-slate-950/80 p-3 shadow-[0_0_40px_rgba(15,23,42,0.8)]">
          <nav className="flex flex-col gap-1 font-bangla">
            {compactItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition",
                    active
                      ? "border border-cyan-300/50 bg-gradient-to-r from-violet-700 to-cyan-500/20 text-white"
                      : "text-slate-200 hover:bg-white/5 hover:text-cyan-300",
                  )}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </section>
      </aside>
    );
  }

  const level =
    leaderboardLevel ||
    detectStudyLevel(pathname) ||
    normalizeLevel(user?.className, user?.level) ||
    "ssc";
  const levelLabel = level === "ssc" ? "SSC" : "HSC";
  const menuTitle =
    leaderboardLevel === "hsc"
      ? "প্রধান মেনু (HSC)"
      : leaderboardLevel === "ssc"
        ? "প্রধান মেনু"
        : `প্রধান মেনু (${levelLabel})`;
  const sscGroups =
    level === "ssc" ? resolveSscSidebarSubjectGroups(pathname) : null;
  const subjectBase = resolveActiveSubjectBasePath(pathname);
  const activeTab = searchParams.get("tab");
  const items = getSidebarItems(level, subjectBase);
  const quickLinks = getQuickAccessItems(level);
  const compactMenuItems = items.slice(0, 3);

  const renderSubjectLink = (sub: { label: string; href: string }) => {
    const Icon = subjectIcon(sub.label);
    const active = pathname === sub.href || pathname.startsWith(`${sub.href}/`);
    const isModelTests = pathname.includes("/model-tests") && active;
    return (
      <Link
        key={sub.label}
        href={`${sub.href}?tab=chapter`}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition min-h-[44px]",
          active
            ? isModelTests
              ? "border border-violet-400/50 bg-gradient-to-r from-violet-700/90 to-cyan-500/25 text-white shadow-[0_0_28px_rgba(139,92,246,0.35)]"
              : "border border-cyan-300/50 bg-gradient-to-r from-violet-700 to-cyan-500/20 text-white shadow-[0_0_25px_rgba(34,211,238,0.3)]"
            : "text-slate-200 hover:bg-white/5 hover:text-cyan-300",
        )}
      >
        <Icon size={22} className={active ? "text-white" : "text-cyan-400"} />
        <span className="leading-snug truncate">{sub.label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-full shrink-0 pb-4 lg:w-[280px] lg:pb-8 lg:pt-4" aria-label={`${levelLabel} প্রস্তুতি মেনু`}>
      <div className="space-y-3 lg:sticky lg:top-20">
        {!mobileExpanded && (
          <section className="rounded-2xl border border-slate-700/80 bg-slate-950/80 p-3 shadow-[0_0_40px_rgba(15,23,42,0.8)] lg:hidden">
            <button
              type="button"
              onClick={() => setMobileExpanded(true)}
              className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-200 transition active:scale-[0.98]"
            >
              <Menu className="h-5 w-5" />
              প্রস্তুতি মেনু খুলুন
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {compactMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-center text-[11px] font-bold text-slate-200 transition active:scale-95 hover:border-cyan-400/30"
                  >
                    <Icon className="h-4 w-4 text-cyan-400" />
                    <span className="leading-tight">{item.label.split(" ")[0]}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <div className={cn("space-y-3", !mobileExpanded && "hidden lg:block")}>
          <section className="rounded-2xl border border-slate-700/80 bg-slate-950/80 p-3 shadow-[0_0_40px_rgba(15,23,42,0.8)]">
            <div className="mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-base font-bold text-slate-200">
              <Atom size={22} className="text-cyan-400" />
              বিষয়সমূহ
              <button
                type="button"
                onClick={() => setMobileExpanded(false)}
                className="ml-auto lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white"
                aria-label="মেনু বন্ধ করুন"
              >
                <ChevronUp className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              {level === "ssc" && sscGroups ? (
                <>
                  {sscGroups.showScience && (
                    <>
                      {sscGroups.showMath && (
                        <p className="px-4 pb-1 text-xs font-bold uppercase tracking-wider text-cyan-500/80">
                          বিজ্ঞান
                        </p>
                      )}
                      {sscGroups.science.map(renderSubjectLink)}
                    </>
                  )}
                  {sscGroups.showMath && (
                    <>
                      {sscGroups.showScience && (
                        <p className="px-4 pt-2 pb-1 text-xs font-bold uppercase tracking-wider text-amber-500/80">
                          গণিত
                        </p>
                      )}
                      {sscGroups.math.map(renderSubjectLink)}
                    </>
                  )}
                </>
              ) : (
                HSC_SIDEBAR_PAPERS.map(renderSubjectLink)
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-700/80 bg-slate-950/80 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-base font-black text-cyan-300">
              <Zap size={20} fill="currentColor" />
              কুইক অ্যাক্সেস
            </h2>
            <div className="space-y-1">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex w-full min-h-[44px] items-center gap-3 rounded-xl px-2 py-3 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/5 hover:text-cyan-300"
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-700/80 bg-slate-950/80 p-3">
            <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              {menuTitle}
            </p>
            <nav className="flex flex-col gap-0.5 font-bangla">
              {items.map((item) => {
                const Icon = item.icon;
                const active = item.match
                  ? item.match(pathname, activeTab)
                  : pathname === item.href || pathname.startsWith(item.href + "/");
                const isLeaderboard = item.href === "/leaderboard";
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-colors",
                      active && isLeaderboard
                        ? "border border-purple-400/40 bg-gradient-to-r from-violet-700/80 to-cyan-500/20 font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                        : active
                          ? "bg-cyan-500/15 text-cyan-300 font-medium"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="leading-snug">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </section>
        </div>
      </div>
    </aside>
  );
}
