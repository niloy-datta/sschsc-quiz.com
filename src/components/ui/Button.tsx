import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "premium" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", fullWidth = false, ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-bangla transition-all duration-300 active:scale-95 focus:outline-none disabled:opacity-50 disabled:pointer-events-none shine-hover",
          // Variants
          variant === "primary" && [
            "bg-gradient-to-r from-purple-glow to-indigo-600 text-white rounded-xl",
            "hover:from-purple-500 hover:to-indigo-500 shadow-glow-purple border border-purple-glow/30"
          ],
          variant === "secondary" && [
            "bg-cyan-dark/40 border border-cyan-glow/40 text-cyan-glow rounded-xl",
            "hover:bg-cyan-glow/10 hover:border-cyan-glow shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          ],
          variant === "premium" && [
            "bg-gradient-to-r from-yellow-500 via-gold-rank to-amber-500 text-[#02030b] rounded-full font-bold",
            "hover:from-yellow-400 hover:to-amber-400 shadow-glow-gold border border-yellow-300/30"
          ],
          variant === "ghost" && [
            "text-slate-300 hover:text-white hover:bg-white/5 rounded-xl border border-transparent hover:border-slate-800"
          ],
          // Sizes
          size === "sm" && "px-3 py-1.5 text-xs md:text-sm",
          size === "md" && "px-5 py-2.5 text-sm md:text-base",
          size === "lg" && "px-8 py-3.5 text-base md:text-lg",
          // Layout
          fullWidth ? "w-full flex" : "",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
