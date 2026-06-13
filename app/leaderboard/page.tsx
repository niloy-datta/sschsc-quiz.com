"use client";

import { Suspense } from "react";
import { LeaderboardHub } from "@/components/leaderboard/LeaderboardHub";
import { LeaderboardSkeleton } from "@/components/leaderboard/LeaderboardSkeleton";

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<LeaderboardSkeleton />}>
      <LeaderboardHub />
    </Suspense>
  );
}
