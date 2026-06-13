"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import { StudySidebar } from "@/components/layout/StudySidebar";
import { cn } from "@/lib/utils";
import { isStudyLevelPath, isActiveQuizPath } from "@/lib/quiz/unified-routes";

function SidebarFallback() {
  return <aside className="hidden w-[280px] shrink-0 lg:block" aria-hidden />;
}

function isStudyPath(pathname: string): boolean {
  if (isStudyLevelPath(pathname)) return true;

  const allowed = [
    "/live-test",
    "/leaderboard",
    "/dashboard",
    "/profile",
    "/ssc-board-questions",
    "/hsc-board-questions",
  ];
  return allowed.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = isStudyPath(pathname);
  const hideBottomPadding = isActiveQuizPath(pathname);
  const bottomPadding = hideBottomPadding ? "" : "pb-20 lg:pb-0";

  if (!showSidebar) {
    return (
      <div className={cn("relative min-h-screen", bottomPadding)}>{children}</div>
    );
  }

  return (
    <div className={cn("relative min-h-screen bg-[#030712]", bottomPadding)}>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_35%),radial-gradient(circle_at_top_left,rgba(147,51,234,0.12),transparent_30%),linear-gradient(180deg,#020617,#020617)]" />
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[280px_1fr] lg:gap-6 lg:px-8">
        <Suspense fallback={<SidebarFallback />}>
          <StudySidebar />
        </Suspense>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
