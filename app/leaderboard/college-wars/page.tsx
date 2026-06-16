"use client";

import { Suspense } from "react";
import { CollegeWarsPage } from "@/components/leaderboard/CollegeWarsPage";
import { LeaderboardSkeleton } from "@/components/leaderboard/LeaderboardSkeleton";

export default function CollegeWarsRoute() {
  return (
    <Suspense fallback={<LeaderboardSkeleton />}>
      <CollegeWarsPage />
    </Suspense>
  );
}
