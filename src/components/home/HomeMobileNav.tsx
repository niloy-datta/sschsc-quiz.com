"use client";

import React from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "#quick-actions", label: "দ্রুত শুরু" },
  { href: "#continue-learning", label: "আজকের কাজ" },
  { href: "#explore-subjects", label: "অধ্যায়" },
  { href: "#leaderboard", label: "র‍্যাঙ্ক" },
];

export function HomeMobileNav() {
  return (
    <nav
      className="sticky top-[72px] z-30 border-b border-white/10 bg-[#07111F]/95 backdrop-blur-xl lg:hidden"
      aria-label="হোম সেকশন নেভিগেশন"
    >
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2.5 no-scrollbar">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2",
              "text-xs font-bold text-slate-200 transition active:scale-95",
              "hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-200",
              "min-h-[44px] flex items-center",
            )}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
