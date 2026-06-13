import type { UserProfile } from "@/context/AuthContext";

export type StudentLevel = "ssc" | "hsc";

export const SSC_EXAM_YEARS = [2027, 2028, 2029, 2030, 2031] as const;
export const HSC_EXAM_YEARS = [2026, 2027, 2028, 2029, 2030] as const;

export const SSC_EXAM_YEAR_LABELS = ["২০২৭", "২০২৮", "২০২৯", "২০৩০", "২০৩১"];
export const HSC_EXAM_YEAR_LABELS = ["২০২৬", "২০২৭", "২০২৮", "২০২৯", "২০৩০"];

export function normalizeLevel(
  className?: string,
  level?: string,
): StudentLevel | null {
  const raw = (level || className || "").toString().trim().toLowerCase();
  if (raw === "ssc" || raw.includes("ssc") || raw === "এসএসসি") return "ssc";
  if (raw === "hsc" || raw.includes("hsc") || raw === "এইচএসসি") return "hsc";
  const upper = (className || "").toUpperCase();
  if (upper.includes("SSC")) return "ssc";
  if (upper.includes("HSC")) return "hsc";
  return null;
}

export function levelLabel(level: StudentLevel | null): string {
  if (level === "ssc") return "SSC";
  if (level === "hsc") return "HSC";
  return "—";
}

export function examYearsForLevel(level: StudentLevel | null): number[] {
  if (level === "ssc") return [...SSC_EXAM_YEARS];
  if (level === "hsc") return [...HSC_EXAM_YEARS];
  return [];
}

export function isProfileComplete(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  const level = normalizeLevel(user.className, user.level);
  const year = user.examYear ?? user.targetExamYear;
  if (!level) return false;
  if (year === undefined || year === null || year === "") return false;
  const yearNum = typeof year === "number" ? year : parseInt(String(year), 10);
  if (!yearNum || Number.isNaN(yearNum)) return false;
  const allowed = examYearsForLevel(level);
  return allowed.includes(yearNum);
}

export function needsOnboarding(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  const college = (user.collegeName || user.schoolName || "").trim();
  const hasBatch =
    (user.batch || "").trim() ||
    (user.className && (user.examYear ?? user.targetExamYear));
  return !college || !hasBatch;
}

export const BATCH_OPTIONS = [
  "SSC 2026",
  "SSC 2027",
  "SSC 2028",
  "SSC 2029",
  "HSC 2025",
  "HSC 2026",
  "HSC 2027",
  "HSC 2028",
  "HSC 2029",
] as const;

export const PROFILE_INCOMPLETE_SAVE_MSG =
  "র‍্যাঙ্কিং ও স্কোর সেভ করতে আগে প্রোফাইল সম্পূর্ণ করুন।";

export const PROFILE_INCOMPLETE_HINT =
  "প্রোফাইল সম্পূর্ণ করুন: SSC/HSC এবং পরীক্ষার বছর নির্বাচন করুন।";

export function examYearBanglaLabel(year: number | string): string {
  const bn = "০১২৩৪৫৬৭৮৯";
  return String(year).replace(/\d/g, (d) => bn[parseInt(d, 10)]);
}
