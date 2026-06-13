"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, Plus, Search, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { BATCH_OPTIONS } from "@/lib/profile-utils";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type CollegeResult = { eiin: string; name: string };

export function OnboardingModal() {
  const { user, syncProfile } = useAuth();
  const router = useRouter();
  const [batch, setBatch] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CollegeResult[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<CollegeResult | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [openList, setOpenList] = useState(false);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!customMode && debouncedQuery.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    if (customMode) return;

    let cancelled = false;
    (async () => {
      setSearching(true);
      try {
        const data = await api.get<CollegeResult[]>(
          `/api/colleges?search=${encodeURIComponent(debouncedQuery.trim())}`,
        );
        if (!cancelled) {
          setResults(data);
          setOpenList(true);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, customMode]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        setOpenList(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const collegeValue = customMode ? customName.trim() : selectedCollege?.name || query.trim();
  const canSubmit = Boolean(batch && collegeValue);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await syncProfile({
        batch,
        collegeName: collegeValue,
        schoolName: collegeValue,
        collegeEiin: customMode ? undefined : selectedCollege?.eiin,
      });
      router.replace("/dashboard");
    } catch {
      setError("প্রোফাইল সেভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-bangla">
      <div className="absolute inset-0 bg-[#030712]/85 backdrop-blur-md" aria-hidden />
      <div
        className={cn(
          "relative w-full max-w-lg rounded-3xl border border-cyan-400/20",
          "bg-gradient-to-br from-[#0a1628]/95 via-[#0d1025]/95 to-[#120a1f]/95",
          "shadow-[0_0_60px_rgba(34,211,238,0.12),0_0_120px_rgba(168,85,247,0.08)]",
          "p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-300",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

        <div className="flex items-start gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center shrink-0">
            <Sparkles className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h2 id="onboarding-title" className="text-xl sm:text-2xl font-extrabold text-white">
              স্বাগতম, {user.name?.split(" ")[0] || "যোদ্ধা"}!
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              কুইজ ব্যাটল শুরু করতে তোমার স্কুল/কলেজ ও টার্গেট পরীক্ষা সেট করো।
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300/80 mb-2">
              টার্গেট পরীক্ষা
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-glow/70 pointer-events-none" />
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                required
                className={cn(
                  "w-full min-h-[48px] pl-10 pr-4 rounded-xl appearance-none",
                  "bg-white/5 border border-white/10 text-white",
                  "focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30",
                )}
              >
                <option value="" disabled className="bg-[#0a1628]">
                  SSC / HSC ব্যাচ নির্বাচন করুন
                </option>
                {BATCH_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#0a1628]">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div ref={listRef}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-cyan-300/80 mb-2">
              স্কুল / কলেজ
            </label>

            {customMode ? (
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="তোমার স্কুল/কলেজের নাম লিখুন"
                required
                className={cn(
                  "w-full min-h-[48px] px-4 rounded-xl",
                  "bg-white/5 border border-white/10 text-white placeholder:text-slate-500",
                  "focus:outline-none focus:border-purple-glow/50 focus:ring-1 focus:ring-purple-glow/30",
                )}
              />
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={selectedCollege ? selectedCollege.name : query}
                  onChange={(e) => {
                    setSelectedCollege(null);
                    setQuery(e.target.value);
                    setOpenList(true);
                  }}
                  onFocus={() => setOpenList(true)}
                  placeholder="কলেজের নাম সার্চ করুন (২+ অক্ষর)"
                  required
                  className={cn(
                    "w-full min-h-[48px] pl-10 pr-10 rounded-xl",
                    "bg-white/5 border border-white/10 text-white placeholder:text-slate-500",
                    "focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30",
                  )}
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400 animate-spin" />
                )}

                {openList && debouncedQuery.length >= 2 && !selectedCollege && (
                  <div className="absolute z-20 mt-2 w-full max-h-52 overflow-y-auto rounded-xl border border-white/10 bg-[#0a1628]/98 backdrop-blur-xl shadow-2xl">
                    {results.length === 0 && !searching ? (
                      <div className="p-4 text-center">
                        <p className="text-sm text-slate-400 mb-3">কোনো ফলাফল পাওয়া যায়নি</p>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomMode(true);
                            setCustomName(query);
                            setOpenList(false);
                          }}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
                        >
                          <Plus className="h-4 w-4" />
                          Add Custom School/College
                        </button>
                      </div>
                    ) : (
                      results.map((college) => (
                        <button
                          key={college.eiin}
                          type="button"
                          onClick={() => {
                            setSelectedCollege(college);
                            setQuery(college.name);
                            setOpenList(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-cyan-500/10 border-b border-white/5 last:border-0 transition-colors"
                        >
                          {college.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {customMode && (
              <button
                type="button"
                onClick={() => {
                  setCustomMode(false);
                  setCustomName("");
                }}
                className="mt-2 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
              >
                ← সার্চ মোডে ফিরে যান
              </button>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit || submitting}
            className="w-full min-h-[48px] text-base font-bold shadow-[0_0_24px_rgba(34,211,238,0.25)]"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                সেভ হচ্ছে...
              </>
            ) : (
              "ড্যাশবোর্ডে যান"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
