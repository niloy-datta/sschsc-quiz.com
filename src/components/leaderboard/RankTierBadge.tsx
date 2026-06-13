import { cn } from "@/lib/utils";

export type RankTier = "legend" | "gold" | "silver" | "bronze";

export function getRankTier(rank: number): RankTier {
  if (rank === 1) return "legend";
  if (rank <= 10) return "gold";
  if (rank <= 50) return "silver";
  return "bronze";
}

const TIER_STYLES: Record<RankTier, { label: string; className: string }> = {
  legend: {
    label: "Legend",
    className: "border-purple-400/40 bg-purple-500/15 text-purple-200",
  },
  gold: {
    label: "Gold",
    className: "border-gold-rank/40 bg-gold-rank/10 text-gold-rank",
  },
  silver: {
    label: "Silver",
    className: "border-slate-300/30 bg-slate-400/10 text-slate-200",
  },
  bronze: {
    label: "Bronze",
    className: "border-amber-600/30 bg-amber-700/10 text-amber-400",
  },
};

export function RankTierBadge({
  rank,
  className,
}: {
  rank: number;
  className?: string;
}) {
  const tier = getRankTier(rank);
  const { label, className: tierClass } = TIER_STYLES[tier];
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        tierClass,
        className,
      )}
    >
      {label}
    </span>
  );
}
