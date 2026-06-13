export interface RecentExamAttempt {
  id: string;
  examName: string;
  examSlug: string;
  questionsPath?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  createdAt: string;
  userAnswers?: string;
  elo?: number | null;
  eloDelta?: number | null;
}

export interface ChapterStat {
  slug: string;
  label: string;
  avgPct: number;
  attempts: number;
}

export interface EloPoint {
  label: string;
  elo: number;
}

export function slugLabel(slug: string): string {
  return slug.replace("/", " · ").replace(/-/g, " ");
}

export function parseSubjectKey(examSlug: string): string {
  const base = (examSlug.split("/")[0] || "general").toLowerCase();
  if (base.includes("physics")) return "physics";
  if (base.includes("chemistry")) return "chemistry";
  if (base.includes("biology")) return "biology";
  if (base.includes("math") || base.includes("higher")) return "math";
  return base;
}

export function computeChapterStats(exams: RecentExamAttempt[]): ChapterStat[] {
  const groups = new Map<string, { totalPct: number; count: number }>();
  for (const exam of exams) {
    const key = exam.examSlug || exam.examName;
    if (!key) continue;
    const entry = groups.get(key) || { totalPct: 0, count: 0 };
    entry.totalPct += exam.percentage;
    entry.count += 1;
    groups.set(key, entry);
  }
  return Array.from(groups.entries())
    .map(([slug, { totalPct, count }]) => ({
      slug,
      label: slugLabel(slug),
      avgPct: Math.round((totalPct / count) * 10) / 10,
      attempts: count,
    }))
    .sort((a, b) => a.avgPct - b.avgPct);
}

export function computeOverallAccuracy(exams: RecentExamAttempt[]): number {
  if (exams.length === 0) return 0;
  const sum = exams.reduce((acc, e) => acc + e.percentage, 0);
  return Math.round((sum / exams.length) * 10) / 10;
}

export function computeEloTrend(
  exams: RecentExamAttempt[],
  currentElo: number,
  limit = 10,
): EloPoint[] {
  const slice = exams.slice(0, limit).reverse();
  if (slice.length === 0) {
    return [{ label: "Now", elo: currentElo }];
  }

  const hasStoredElo = slice.some((e) => e.elo != null && e.elo > 0);
  if (hasStoredElo) {
    return slice.map((e, i) => ({
      label: `T${i + 1}`,
      elo: e.elo ?? currentElo,
    }));
  }

  let running = currentElo;
  const points: EloPoint[] = [];
  for (let i = slice.length - 1; i >= 0; i--) {
    points.unshift({ label: `T${i + 1}`, elo: running });
    const exam = slice[i];
    const delta =
      exam.eloDelta ?? Math.round((exam.percentage - 50) / 5);
    running = Math.max(100, running - delta);
  }
  return points;
}

export function topSubjectKeys(
  exams: RecentExamAttempt[],
  limit = 3,
): string[] {
  const counts = new Map<string, number>();
  for (const exam of exams) {
    const key = parseSubjectKey(exam.examSlug || exam.examName);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  if (sorted.length >= limit) return sorted.slice(0, limit).map(([k]) => k);

  const defaults = ["physics", "chemistry", "biology"];
  const result = sorted.map(([k]) => k);
  for (const d of defaults) {
    if (result.length >= limit) break;
    if (!result.includes(d)) result.push(d);
  }
  return result.slice(0, limit);
}

export { subjectPracticeHref } from "@/lib/quiz/unified-routes";

export function quizWithinLast24Hours(exams: RecentExamAttempt[]): boolean {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return exams.some((e) => {
    if (!e.createdAt) return false;
    const ts = new Date(e.createdAt).getTime();
    return !Number.isNaN(ts) && ts >= cutoff;
  });
}
