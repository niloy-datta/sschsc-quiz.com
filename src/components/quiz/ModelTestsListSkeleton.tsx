import { cn } from "@/lib/utils";

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

export function ModelTestsListSkeleton() {
  return (
    <div className="min-w-0 space-y-4 pb-24 font-bangla animate-fadeIn">
      <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/40 px-4 py-5 sm:px-6">
        <Bone className="mb-3 h-5 w-48" />
        <Bone className="mb-4 h-12 w-72 max-w-full sm:h-14" />
        <Bone className="mb-6 h-5 w-96 max-w-full" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <Bone key={i} className="h-[72px] rounded-2xl" />
          ))}
        </div>
      </div>

      <Bone className="h-24 rounded-2xl" />

      <div className="rounded-2xl border border-slate-800/60 bg-slate-950/40 p-3 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_180px]">
          <Bone className="h-11 rounded-xl sm:h-12" />
          <Bone className="h-11 rounded-xl sm:h-12" />
        </div>
        <Bone className="h-4 w-24" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Bone key={i} className="h-11 w-24 shrink-0 rounded-full" />
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-800/60 bg-slate-950/30 p-3">
        <div className="flex items-center gap-3 px-1">
          <Bone className="h-11 w-11 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Bone className="h-5 w-32" />
            <Bone className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-[110px] rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
