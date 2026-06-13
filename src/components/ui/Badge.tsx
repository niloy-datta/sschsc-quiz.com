import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "rank" | "premium" | "success" | "warning" | "default";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold font-bangla transition-colors border",
          // Variants
          variant === "default" && "bg-slate-800/80 border-slate-700 text-slate-300",
          variant === "rank" && "bg-gradient-to-r from-amber-500 to-yellow-400 border-yellow-300 text-black shadow-glow-gold",
          variant === "premium" && "bg-gold-dark/60 border-gold-rank/40 text-gold-rank shadow-glow-gold uppercase font-outfit tracking-wider",
          variant === "success" && "bg-success-green/10 border-success-green/30 text-success-green",
          variant === "warning" && "bg-error-red/10 border-error-red/30 text-error-red",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
