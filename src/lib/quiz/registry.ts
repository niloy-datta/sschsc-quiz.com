/**
 * Single source of truth for quiz catalog paths and display names.
 */

export type RegistryLevel = "ssc" | "hsc";

export interface RegistrySubject {
  level: RegistryLevel;
  subjectSlug: string;
  paperSlug?: string;
  nameBangla: string;
  /** File under public/quiz-data/{level}/ */
  mainJsonPath: string;
  /** Optional separate chapterwise tier-a file (may not exist) */
  chapterwiseJsonPath?: string;
  /** URL slug for routes (e.g. math → general-math file) */
  routeSlug: string;
  expectedMcqPerSet: number;
}

const SSC_SUBJECTS: Omit<RegistrySubject, "level">[] = [
  {
    subjectSlug: "physics",
    nameBangla: "পদার্থবিজ্ঞান",
    mainJsonPath: "ssc/physics.json",
    chapterwiseJsonPath: "ssc/ssc_physics_chapterwise_10_tier_a_sets.json",
    routeSlug: "physics",
    expectedMcqPerSet: 25,
  },
  {
    subjectSlug: "chemistry",
    nameBangla: "রসায়ন",
    mainJsonPath: "ssc/chemistry.json",
    chapterwiseJsonPath: "ssc/ssc_chemistry_chapterwise_10_tier_a_sets.json",
    routeSlug: "chemistry",
    expectedMcqPerSet: 25,
  },
  {
    subjectSlug: "biology",
    nameBangla: "জীববিজ্ঞান",
    mainJsonPath: "ssc/biology.json",
    chapterwiseJsonPath: "ssc/ssc_biology_chapterwise_10_tier_a_sets.json",
    routeSlug: "biology",
    expectedMcqPerSet: 25,
  },
  {
    subjectSlug: "higher-math",
    nameBangla: "উচ্চতর গণিত",
    mainJsonPath: "ssc/higher-math.json",
    chapterwiseJsonPath: "ssc/ssc_higher_math_chapterwise_10_tier_a_sets.json",
    routeSlug: "higher-math",
    expectedMcqPerSet: 25,
  },
  {
    subjectSlug: "general-math",
    nameBangla: "সাধারণ গণিত",
    mainJsonPath: "ssc/general-math.json",
    chapterwiseJsonPath: "ssc/ssc_general_math_chapterwise_10_tier_a_sets.json",
    routeSlug: "math",
    expectedMcqPerSet: 30,
  },
];

const HSC_PAPERS: Array<{
  subject: string;
  paper: string;
  nameBangla: string;
  fileSlug: string;
}> = [
  { subject: "physics", paper: "1st-paper", nameBangla: "পদার্থবিজ্ঞান ১ম পত্র", fileSlug: "physics-1st-paper" },
  { subject: "physics", paper: "2nd-paper", nameBangla: "পদার্থবিজ্ঞান ২য় পত্র", fileSlug: "physics-2nd-paper" },
  { subject: "chemistry", paper: "1st-paper", nameBangla: "রসায়ন ১ম পত্র", fileSlug: "chemistry-1st-paper" },
  { subject: "chemistry", paper: "2nd-paper", nameBangla: "রসায়ন ২য় পত্র", fileSlug: "chemistry-2nd-paper" },
  { subject: "biology", paper: "1st-paper", nameBangla: "জীববিজ্ঞান ১ম পত্র", fileSlug: "biology-1st-paper" },
  { subject: "biology", paper: "2nd-paper", nameBangla: "জীববিজ্ঞান ২য় পত্র", fileSlug: "biology-2nd-paper" },
  { subject: "higher-math", paper: "1st-paper", nameBangla: "উচ্চতর গণিত ১ম পত্র", fileSlug: "higher-math-1st-paper" },
  { subject: "higher-math", paper: "2nd-paper", nameBangla: "উচ্চতর গণিত ২য় পত্র", fileSlug: "higher-math-2nd-paper" },
];

export const QUIZ_REGISTRY: RegistrySubject[] = [
  ...SSC_SUBJECTS.map((s) => ({ ...s, level: "ssc" as RegistryLevel })),
  ...HSC_PAPERS.map((p) => ({
    level: "hsc" as RegistryLevel,
    subjectSlug: p.subject,
    paperSlug: p.paper,
    nameBangla: p.nameBangla,
    mainJsonPath: `hsc/${p.fileSlug}.json`,
    routeSlug: `${p.subject}/${p.paper}`,
    expectedMcqPerSet: 25,
  })),
];

/** Resolve API/file slug from route segments */
export function resolveFileSubjectSlug(
  level: RegistryLevel,
  subject: string,
  paper?: string,
): string {
  if (subject === "math") return "general-math";
  if (level === "hsc") {
    if (subject.endsWith("-1st-paper") || subject.endsWith("-2nd-paper")) {
      return subject;
    }
    if (paper) return `${subject}-${paper}`;
  }
  return subject;
}

export function findRegistryEntry(
  level: RegistryLevel,
  subject: string,
  paper?: string,
): RegistrySubject | undefined {
  const fileSlug = resolveFileSubjectSlug(level, subject, paper);
  return QUIZ_REGISTRY.find((e) => {
    if (e.level !== level) return false;
    const mainFile = e.mainJsonPath.split("/").pop()?.replace(".json", "");
    return mainFile === fileSlug || e.routeSlug === subject || e.subjectSlug === subject;
  });
}

export function expectedMcqForSubject(fileSlug: string): number {
  if (fileSlug === "general-math" || fileSlug === "math") return 30;
  const entry = QUIZ_REGISTRY.find(
    (e) => e.mainJsonPath.endsWith(`/${fileSlug}.json`),
  );
  return entry?.expectedMcqPerSet ?? 25;
}

export function manifestPublicPath(registryPath: string): string {
  return `/quiz-data/${registryPath}`;
}
