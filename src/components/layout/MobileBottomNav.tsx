"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, GraduationCap, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { isActiveQuizPath, levelHubPath } from "@/lib/quiz/unified-routes";

const navItems = [
  { href: "/", label: "হোম", icon: Home },
  { href: levelHubPath("ssc"), label: "SSC", icon: BookOpen },
  { href: levelHubPath("hsc"), label: "HSC", icon: GraduationCap },
  { href: "/leaderboard", label: "র‍্যাঙ্ক", icon: Trophy },
  { href: "/profile", label: "প্রোফাইল", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  if (isActiveQuizPath(pathname)) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#07111F]/95 backdrop-blur-xl pb-safe lg:hidden"
      aria-label="মোবাইল নেভিগেশন"
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center px-2">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/profile"
                ? pathname === "/profile" || pathname === "/dashboard"
                : item.href === "/leaderboard"
                  ? pathname.startsWith("/leaderboard")
                  : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 font-bangla transition-colors active:scale-95",
                active ? "text-cyan-400" : "text-slate-400 hover:text-slate-200",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-bold leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
