"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Atom, Menu, X, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { levelHubPath } from "@/lib/quiz/unified-routes";

const mainNavLinks = [
  { href: "/", label: "হোম" },
  { href: levelHubPath("ssc"), label: "SSC" },
  { href: levelHubPath("hsc"), label: "HSC" },
  { href: "/live-test", label: "লাইভ টেস্ট", live: true },
  { href: "/ssc-board-questions", label: "SSC বোর্ড প্রশ্ন" },
  { href: "/hsc-board-questions", label: "HSC বোর্ড প্রশ্ন" },
  { href: "/leaderboard", label: "লিডারবোর্ড" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const profileActive =
    pathname === "/profile" || pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b border-blue-500/40 bg-slate-950/85 backdrop-blur-xl">
      <nav
        className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8"
        aria-label="প্রধান নেভিগেশন"
      >
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Atom className="h-9 w-9 sm:h-10 sm:w-10 text-violet-400" />
          <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-xl sm:text-2xl lg:text-3xl font-black text-transparent font-bangla">
            বিজ্ঞান র্যাঙ্কার
          </span>
        </Link>

        <div className="hidden h-full items-center lg:flex">
          {mainNavLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex h-full items-center px-4 xl:px-6 text-sm xl:text-lg font-bold text-slate-200 transition hover:text-cyan-300",
                  active && "text-white",
                )}
              >
                {link.label}
                {link.live && (
                  <span className="ml-2 h-3 w-3 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)]" />
                )}
                {active && (
                  <span className="absolute bottom-0 left-4 right-4 xl:left-5 xl:right-5 h-1 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,1)]" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className={cn(
              "hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-base lg:text-lg font-bold transition hover:bg-white/5",
              profileActive ? "text-cyan-300" : "text-slate-100",
            )}
          >
            <UserCircle size={24} />
            প্রোফাইল
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label="মেনু খুলুন"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-blue-500/30 bg-slate-950/95 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-1 p-4 font-bangla">
            {mainNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-3 font-bold",
                  link.live
                    ? "text-red-300 hover:bg-red-500/10"
                    : isActive(link.href)
                      ? "text-cyan-400 bg-cyan-500/10"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
                )}
              >
                {link.live && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]" />
                )}
                {link.label}
              </Link>
            ))}
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-3 font-bold",
                profileActive
                  ? "text-cyan-400 bg-cyan-500/10"
                  : "text-slate-300 hover:bg-white/5",
              )}
            >
              <UserCircle size={20} />
              প্রোফাইল
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
