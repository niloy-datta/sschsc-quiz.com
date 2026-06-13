"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Trophy, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  fetchLeaderboard,
  type LeaderboardEntry,
} from "@/lib/leaderboard-api";

function PreviewSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <Card key={i} variant="glass" className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-slate-700/50" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-slate-700/50" />
            <div className="h-3 w-24 rounded bg-slate-800/50" />
          </div>
          <div className="h-6 w-16 rounded bg-slate-700/50" />
        </Card>
      ))}
    </div>
  );
}

function rankBadge(rank: number): string {
  if (rank === 1) return "🏆";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "⭐";
}

function rankCardClass(rank: number): string {
  if (rank === 1) return "border-yellow-500/30 bg-yellow-500/5";
  if (rank === 2) return "border-slate-400/30 bg-slate-400/5";
  if (rank === 3) return "border-orange-600/30 bg-orange-600/5";
  return "border-white/10 bg-white/5";
}

export function LeaderboardPreviewSection() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard().then((data) => {
      setEntries(data.slice(0, 5));
      setLoading(false);
    });
  }, []);

  if (!loading && entries.length === 0) {
    return null;
  }

  return (
    <section id="leaderboard" className="py-10 md:py-14 font-bangla bg-gradient-to-b from-transparent via-purple-900/5 to-transparent scroll-mt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            আজকের <span className="text-gradient-gold">শীর্ষ শিক্ষার্থী</span>
          </h2>
          <p className="text-slate-400 mt-2">
            লিডারবোর্ডে তোমার স্থান দেখো
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          {loading ? (
            <PreviewSkeleton />
          ) : (
            entries.map((student) => (
              <Card
                key={student.userId || student.rank}
                variant="glass"
                className={`p-4 flex items-center gap-4 ${rankCardClass(student.rank)}`}
              >
                <div className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl bg-slate-800/50">
                  {rankBadge(student.rank)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white truncate">{student.name}</h3>
                    <Badge
                      variant={student.rank === 1 ? "premium" : "default"}
                      className="text-[10px]"
                    >
                      #{student.rank}
                    </Badge>
                  </div>
                  {student.accuracy != null && (
                    <p className="text-xs text-slate-400">
                      সঠিকতা: {Math.round(student.accuracy)}%
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-white">
                    {student.points.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">ELO</p>
                </div>
              </Card>
            ))
          )}

          <Link href="/leaderboard">
            <Button
              variant="secondary"
              fullWidth
              className="flex items-center justify-center gap-2 group"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trophy className="h-4 w-4" />
              )}
              তোমার Rank দেখো
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
