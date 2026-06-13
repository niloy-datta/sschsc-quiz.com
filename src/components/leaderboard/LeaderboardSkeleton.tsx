import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-white/[0.06] ring-1 ring-white/5",
        className,
      )}
    />
  );
}

function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-6 font-bangla animate-fadeIn">
      <div className="space-y-3 text-center">
        <Bone className="mx-auto h-7 w-36 rounded-full" />
        <Bone className="mx-auto h-10 w-48" />
        <Bone className="mx-auto h-4 w-72 max-w-full" />
      </div>

      <div className="flex justify-center gap-2">
        <Bone className="h-11 w-32 rounded-full" />
        <Bone className="h-11 w-32 rounded-full" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} className="h-9 w-20 shrink-0 rounded-full" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div className="grid grid-cols-3 items-end gap-3 pt-4">
            <GlassCard className="h-36">
              <Bone className="mx-auto mb-3 h-12 w-12 rounded-full" />
              <Bone className="mx-auto h-4 w-20" />
              <Bone className="mx-auto mt-2 h-6 w-14" />
            </GlassCard>
            <GlassCard className="h-44 border-cyan-500/10">
              <Bone className="mx-auto mb-3 h-16 w-16 rounded-full" />
              <Bone className="mx-auto h-4 w-24" />
              <Bone className="mx-auto mt-2 h-7 w-16" />
            </GlassCard>
            <GlassCard className="h-32">
              <Bone className="mx-auto mb-3 h-10 w-10 rounded-full" />
              <Bone className="mx-auto h-4 w-20" />
              <Bone className="mx-auto mt-2 h-6 w-14" />
            </GlassCard>
          </div>

          <GlassCard className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Bone className="h-8 w-8 shrink-0 rounded-full" />
                <Bone className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Bone className="h-4 w-32" />
                  <Bone className="h-3 w-24" />
                </div>
                <Bone className="h-6 w-12" />
              </div>
            ))}
          </GlassCard>
        </div>

        <div className="space-y-4">
          <GlassCard className="space-y-4 border-purple-500/10">
            <Bone className="h-5 w-28" />
            <Bone className="h-10 w-full" />
            <Bone className="h-3 w-full" />
            <Bone className="h-2 w-full rounded-full" />
            <div className="grid grid-cols-3 gap-2">
              <Bone className="h-14" />
              <Bone className="h-14" />
              <Bone className="h-14" />
            </div>
          </GlassCard>
          <GlassCard className="space-y-3">
            <Bone className="h-5 w-36" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Bone key={i} className="h-10 w-full" />
            ))}
          </GlassCard>
          <GlassCard className="space-y-3">
            <Bone className="h-5 w-40" />
            <Bone className="h-24 w-full rounded-xl" />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
