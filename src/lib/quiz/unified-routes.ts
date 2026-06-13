import { parseHscSubjectPaper } from "@/lib/quiz-api";
import {
  SSC_CATALOG,
  SSC_MATH_CATALOG,
  SSC_SCIENCE_CATALOG,
  isSscMathSlug,
  isSscScienceSlug,
  HSC_SCIENCE_PAPERS,
  hscSubjectSlug,
  type QuizLevel,
} from "@/lib/quiz-catalog";
import { extractChapterFromSourceKey } from "@/lib/quiz/normalize-quiz-data";

export type RouteLevel = "ssc" | "hsc";

export function normalizeRouteLevel(level: string): RouteLevel | null {
  const l = level.toLowerCase();
  if (l === "ssc" || l === "hsc") return l;
  return null;
}

export function toQuizLevel(level: RouteLevel): QuizLevel {
  return level === "ssc" ? "SSC" : "HSC";
}

export function levelHubPath(level: RouteLevel): string {
  return `/${level}`;
}

export function levelModelTestsPath(level: RouteLevel, query?: string): string {
  const base = `/${level}/model-tests`;
  return query ? `${base}?${query}` : base;
}

/** HSC subject slug in unified routes uses `physics-1st-paper` form. */
export function parseUnifiedSubjectSlug(
  level: RouteLevel,
  subjectSlug: string,
): {
  registrySubject: string;
  paper?: string;
  apiSubjectSlug: string;
  routeSubject: string;
  routePaper?: string;
} {
  if (level === "ssc") {
    return {
      registrySubject: subjectSlug === "math" ? "math" : subjectSlug,
      apiSubjectSlug: subjectSlug,
      routeSubject: subjectSlug,
    };
  }

  const parsed = parseHscSubjectPaper(subjectSlug);
  return {
    registrySubject: parsed.subject,
    paper: parsed.paper,
    apiSubjectSlug: subjectSlug,
    routeSubject: parsed.subject,
    routePaper: parsed.paper,
  };
}

export function unifiedSubjectBasePath(level: RouteLevel, subjectSlug: string): string {
  return `/${level}/${subjectSlug}`;
}

export function unifiedChapterPathPrefix(level: RouteLevel, subjectSlug: string): string {
  return `${unifiedSubjectBasePath(level, subjectSlug)}/chapter`;
}

export function unifiedChaptersPath(level: RouteLevel, subjectSlug: string): string {
  return `${unifiedSubjectBasePath(level, subjectSlug)}/chapters`;
}

export function unifiedModelTestPathPrefix(level: RouteLevel, subjectSlug: string): string {
  return `${unifiedSubjectBasePath(level, subjectSlug)}/model-tests`;
}

export function unifiedChapterHubPath(
  level: RouteLevel,
  subjectSlug: string,
  chapterSlug: string,
): string {
  return `${unifiedChapterPathPrefix(level, subjectSlug)}/${chapterSlug}`;
}

export function unifiedChapterSetPath(
  level: RouteLevel,
  subjectSlug: string,
  chapterSlug: string,
  setId: string,
): string {
  return `${unifiedChapterHubPath(level, subjectSlug, chapterSlug)}/set/${encodeURIComponent(setId)}`;
}

export function unifiedModelTestQuizPath(
  level: RouteLevel,
  subjectSlug: string,
  testId: string,
): string {
  return `${unifiedModelTestPathPrefix(level, subjectSlug)}/${encodeURIComponent(testId)}`;
}

export function subjectHrefForCatalog(level: QuizLevel, slug: string): string {
  const routeLevel = level.toLowerCase() as RouteLevel;
  return unifiedSubjectBasePath(routeLevel, slug);
}

export function inferChapterSlugFromSetId(setId: string): string {
  const fromKey = extractChapterFromSourceKey(setId);
  if (fromKey.chapter) return fromKey.chapter;
  const match = setId.match(/chapter-\d{2}/i);
  if (match) return match[0].toLowerCase();
  return setId;
}

export function resolveSubjectTitle(level: RouteLevel, subjectSlug: string): string {
  if (level === "ssc") {
    const meta = SSC_CATALOG.find((s) => s.slug === subjectSlug);
    return meta?.name ?? subjectSlug;
  }

  const parsed = parseHscSubjectPaper(subjectSlug);
  const meta = HSC_SCIENCE_PAPERS.find(
    (p) => p.subject === parsed.subject && p.paper === parsed.paper,
  );
  return meta?.name ?? subjectSlug;
}

export function boardQuestionsHubPath(
  level: RouteLevel,
  subjectSlug: string,
): string {
  const parsed = parseUnifiedSubjectSlug(level, subjectSlug);
  if (level === "hsc" && parsed.routePaper) {
    return `/hsc-board-questions/${parsed.routeSubject}/${parsed.routePaper}`;
  }
  return `/ssc-board-questions/${parsed.registrySubject}`;
}

export function boardQuestionsYearPath(
  level: RouteLevel,
  subjectSlug: string,
  year: string,
): string {
  return `${boardQuestionsHubPath(level, subjectSlug)}/${year}`;
}

/** Board year chips — oldest first (matches index.json board order). */
export const BOARD_QUESTION_YEARS = [
  { value: "2022", label: "২০২২" },
  { value: "2023", label: "২০২৩" },
  { value: "2024", label: "২০২৪" },
  { value: "2025", label: "২০২৫" },
  { value: "2026", label: "২০২৬" },
] as const;

export function hscUnifiedSubjectSlug(subject: string, paper: string): string {
  return hscSubjectSlug(subject, paper);
}

export function subjectPracticeHref(
  subjectKey: string,
  level: RouteLevel = "ssc",
): string {
  const map: Record<string, { ssc: string; hsc: string }> = {
    physics: {
      ssc: unifiedSubjectBasePath("ssc", "physics"),
      hsc: unifiedSubjectBasePath("hsc", "physics-1st-paper"),
    },
    chemistry: {
      ssc: unifiedSubjectBasePath("ssc", "chemistry"),
      hsc: unifiedSubjectBasePath("hsc", "chemistry-1st-paper"),
    },
    biology: {
      ssc: unifiedSubjectBasePath("ssc", "biology"),
      hsc: unifiedSubjectBasePath("hsc", "biology-1st-paper"),
    },
    math: {
      ssc: unifiedSubjectBasePath("ssc", "math"),
      hsc: unifiedSubjectBasePath("hsc", "higher-math-1st-paper"),
    },
  };
  return map[subjectKey]?.[level] ?? levelHubPath(level);
}

export const SSC_SIDEBAR_SUBJECTS = SSC_CATALOG.map((s) => ({
  label: s.name,
  href: unifiedSubjectBasePath("ssc", s.slug),
}));

export const SSC_SCIENCE_SIDEBAR_SUBJECTS = SSC_SCIENCE_CATALOG.map((s) => ({
  label: s.name,
  href: unifiedSubjectBasePath("ssc", s.slug),
}));

export const SSC_MATH_SIDEBAR_SUBJECTS = SSC_MATH_CATALOG.map((s) => ({
  label: s.name,
  href: unifiedSubjectBasePath("ssc", s.slug),
}));

/** Science vs math sidebar on SSC subject pages — never mix tracks. */
export function resolveSscSidebarSubjectGroups(pathname: string): {
  science: typeof SSC_SCIENCE_SIDEBAR_SUBJECTS;
  math: typeof SSC_MATH_SIDEBAR_SUBJECTS;
  showScience: boolean;
  showMath: boolean;
} {
  const base = resolveActiveSubjectBasePath(pathname);
  const slug = base?.split("/").pop() ?? "";

  if (isSscScienceSlug(slug)) {
    return {
      science: SSC_SCIENCE_SIDEBAR_SUBJECTS,
      math: [],
      showScience: true,
      showMath: false,
    };
  }
  if (isSscMathSlug(slug)) {
    return {
      science: [],
      math: SSC_MATH_SIDEBAR_SUBJECTS,
      showScience: false,
      showMath: true,
    };
  }
  return {
    science: SSC_SCIENCE_SIDEBAR_SUBJECTS,
    math: SSC_MATH_SIDEBAR_SUBJECTS,
    showScience: true,
    showMath: true,
  };
}

export const HSC_SIDEBAR_PAPERS = HSC_SCIENCE_PAPERS.map((p) => ({
  label: p.name,
  href: unifiedSubjectBasePath("hsc", hscSubjectSlug(p.subject, p.paper)),
}));

/** Map legacy `/hsc/{subject}/{paper}/…` URLs to unified `/hsc/{subject}-{paper}/…`. */
export function resolveLegacyHscStudyRedirect(pathname: string): string | null {
  const match = pathname.match(
    /^\/hsc\/([^/]+)\/(1st-paper|2nd-paper)(\/.*)?$/,
  );
  if (!match) return null;
  const [, subject, paper, rest = ""] = match;
  return `/hsc/${hscSubjectSlug(subject, paper)}${rest}`;
}

export function isStudyLevelPath(pathname: string): boolean {
  return (
    pathname === "/ssc" ||
    pathname === "/hsc" ||
    pathname.startsWith("/ssc/") ||
    pathname.startsWith("/hsc/")
  );
}

export function detectStudyLevel(pathname: string): RouteLevel | null {
  if (
    pathname === "/ssc" ||
    pathname.startsWith("/ssc/") ||
    pathname.startsWith("/ssc-board-questions")
  ) {
    return "ssc";
  }
  if (
    pathname === "/hsc" ||
    pathname.startsWith("/hsc/") ||
    pathname.startsWith("/hsc-board-questions")
  ) {
    return "hsc";
  }
  return null;
}

const LEVEL_UTILITY_SEGMENTS = new Set([
  "model-tests",
  "saved-questions",
  "wrong-answers",
  "full-book-test",
  "final-focus",
  "tier-a-hot",
]);

/** e.g. `/ssc/physics/chapter/01` → `/ssc/physics` */
export function resolveActiveSubjectBasePath(pathname: string): string | null {
  const level = detectStudyLevel(pathname);
  if (!level) return null;

  const modelMatch = pathname.match(new RegExp(`^/${level}/([^/]+)/model-tests`));
  if (modelMatch && !LEVEL_UTILITY_SEGMENTS.has(modelMatch[1]!)) {
    return `/${level}/${modelMatch[1]}`;
  }

  const nestedMatch = pathname.match(
    new RegExp(`^/${level}/([^/]+)/(?:chapter|chapters|set)(?:/|$)`),
  );
  if (nestedMatch && !LEVEL_UTILITY_SEGMENTS.has(nestedMatch[1]!)) {
    return `/${level}/${nestedMatch[1]}`;
  }

  const directMatch = pathname.match(new RegExp(`^/${level}/([^/]+)(?:/|$)`));
  if (directMatch && !LEVEL_UTILITY_SEGMENTS.has(directMatch[1]!)) {
    return `/${level}/${directMatch[1]}`;
  }

  return null;
}

/** True when user is on an active quiz-taking page (chapter set or model test). */
export function isActiveQuizPath(pathname: string): boolean {
  return /\/set\/[^/]+$/.test(pathname) || /\/model-tests\/[^/]+$/.test(pathname);
}
