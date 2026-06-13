import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "premium" | "dark" | "leaderboard";
  hoverable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "glass", hoverable = false, ...props }, ref) => {
    return (
      <div
        className={cn(
          "rounded-2xl transition-all duration-300 font-bangla",
          // Variants
          variant === "glass" && [
            "bg-navy-card backdrop-blur-xl border border-purple-glow/10",
            hoverable && "hover:border-purple-glow/30 hover:shadow-glow-purple"
          ],
          variant === "premium" && [
            "bg-gradient-to-br from-[#0c0d1e] to-[#1d1607] border border-gold-rank/25 shadow-glow-gold",
            hoverable && "hover:border-gold-rank/50 hover:shadow-glow-gold"
          ],
          variant === "dark" && [
            "bg-navy-light/60 border border-slate-900",
            hoverable && "hover:border-slate-800 hover:bg-navy-light/80"
          ],
          variant === "leaderboard" && [
            "bg-navy-light/35 border border-purple-glow/5 backdrop-blur-md",
            hoverable && "hover:border-purple-glow/20 hover:bg-navy-light/50"
          ],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export { Card };
