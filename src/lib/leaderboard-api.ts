import { api } from "@/lib/api";
import {
  normalizeLevel,
  type StudentLevel,
  examYearBanglaLabel,
} from "@/lib/profile-utils";

export interface LeaderboardEntry {
  rank: number;
  userId?: string;
  name: string;
  picture?: string;
  points: number;
  examsTaken?: number;
  className?: string;
  level?: string;
  examYear?: number | string;
  accuracy?: number;
  streak?: number;
  badge?: string;
  lastExamSlug?: string;
  lastAttemptAt?: string;
  collegeName?: string;
  schoolName?: string;
}

export function formatBnNumber(n: number): string {
  return n.toString().replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]);
}

export function getInitials(name?: string): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "—";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts
      .slice(0, 2)
      .map((p) => p[0])
      .join("");
  }
  return trimmed.slice(0, 2);
}

export function getCollegeLabel(entry: LeaderboardEntry): string {
  const college = (entry.collegeName || entry.schoolName || "").trim();
  return college || "কলেজ যুক্ত হয়নি";
}

export function formatAccuracy(acc?: number): string {
  if (acc == null || Number.isNaN(acc) || acc <= 0) return "—";
  return `${Math.round(acc)}%`;
}

export function aggregateColleges(
  entries: LeaderboardEntry[],
): { name: string; score: number }[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    const college = (e.collegeName || e.schoolName || "").trim();
    if (!college) continue;
    map.set(college, (map.get(college) || 0) + (e.points || 0));
  }
  if (map.size < 2) return [];
  return Array.from(map.entries())
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export const BADGE_LABELS: Record<string, string> = {
  physics_master: "পদার্থবিজ্ঞান মাস্টার",
  chemistry_king: "রসায়ন কিং",
  biology_boss: "জীববিজ্ঞান বস",
  live_champion: "লাইভ চ্যাম্পিয়ন",
  streak_7: "৭ দিনের স্ট্রিক",
  premium_topper: "প্রিমিয়াম টপার",
};

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const data = await api.get<LeaderboardEntry[]>("/api/leaderboard");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function getEntryLevel(entry: LeaderboardEntry): StudentLevel | null {
  return normalizeLevel(entry.className, entry.level);
}

export function filterLeaderboard(
  entries: LeaderboardEntry[],
  level: StudentLevel,
  yearFilter: "all" | number,
): LeaderboardEntry[] {
  let list = entries.filter((e) => getEntryLevel(e) === level);

  if (yearFilter !== "all") {
    list = list.filter((e) => Number(e.examYear) === yearFilter);
  }

  list.sort((a, b) => b.points - a.points);
  return list.map((e, i) => ({ ...e, rank: i + 1 }));
}

export function formatExamYear(year?: number | string): string {
  if (!year) return "—";
  return examYearBanglaLabel(year);
}
