/** Static SSC/HSC catalog — fallback when API subjects are empty. */

export type QuizLevel = "SSC" | "HSC";

export interface CatalogSubject {
  slug: string;
  name: string;
  category: QuizLevel;
  /** HSC science: physics + 1st-paper */
  subject?: string;
  paper?: string;
}

export const SSC_CATALOG: CatalogSubject[] = [
  { slug: "physics", name: "পদার্থবিজ্ঞান", category: "SSC" },
  { slug: "chemistry", name: "রসায়ন", category: "SSC" },
  { slug: "biology", name: "জীববিজ্ঞান", category: "SSC" },
  { slug: "higher-math", name: "উচ্চতর গণিত", category: "SSC" },
  { slug: "math", name: "সাধারণ গণিত", category: "SSC" },
];

/** SSC science group — sidebar on physics/chemistry/biology pages. */
export const SSC_SCIENCE_CATALOG = SSC_CATALOG.filter((s) =>
  ["physics", "chemistry", "biology"].includes(s.slug),
);

/** SSC math group — sidebar on higher-math / general-math pages. */
export const SSC_MATH_CATALOG = SSC_CATALOG.filter((s) =>
  ["higher-math", "math"].includes(s.slug),
);

export function isSscScienceSlug(slug: string): boolean {
  return ["physics", "chemistry", "biology"].includes(slug);
}

export function isSscMathSlug(slug: string): boolean {
  return slug === "higher-math" || slug === "math";
}

export const HSC_SCIENCE_PAPERS: { subject: string; paper: string; name: string }[] = [
  { subject: "physics", paper: "1st-paper", name: "পদার্থবিজ্ঞান ১ম পত্র" },
  { subject: "physics", paper: "2nd-paper", name: "পদার্থবিজ্ঞান ২য় পত্র" },
  { subject: "chemistry", paper: "1st-paper", name: "রসায়ন ১ম পত্র" },
  { subject: "chemistry", paper: "2nd-paper", name: "রসায়ন ২য় পত্র" },
  { subject: "biology", paper: "1st-paper", name: "জীববিজ্ঞান ১ম পত্র" },
  { subject: "biology", paper: "2nd-paper", name: "জীববিজ্ঞান ২য় পত্র" },
  { subject: "higher-math", paper: "1st-paper", name: "উচ্চতর গণিত ১ম পত্র" },
  { subject: "higher-math", paper: "2nd-paper", name: "উচ্চতর গণিত ২য় পত্র" },
];

export function hscSubjectSlug(subject: string, paper: string): string {
  return `${subject}-${paper}`;
}

/** Map URL segments to subject slug used when loading static quiz JSON. */
export function toApiSubjectSlug(
  level: QuizLevel,
  subject: string,
  paper?: string,
): string {
  if (level === "HSC") {
    if (paper) return hscSubjectSlug(subject, paper);
  }
  return subject;
}

export const BOARD_YEARS = ["2026", "2025", "2024", "2023", "2022"] as const;

export const HSC_BOARD_SUBJECTS = [
  "biology",
  "chemistry",
  "higher-math",
  "physics",
] as const;
