import { api } from "@/lib/api";

import { fetchNormalizedQuestions } from "@/lib/quiz/load-quiz-data";

import { resolveFileSubjectSlug } from "@/lib/quiz/registry";

import type { ApiQuestion, ApiSubject } from "@/types/quiz";

import { HSC_SCIENCE_PAPERS, SSC_CATALOG, type QuizLevel } from "@/lib/quiz-catalog";



export async function fetchSubjects(

  category?: QuizLevel,

): Promise<ApiSubject[]> {

  try {

    const path = category

      ? `/api/subjects?category=${encodeURIComponent(category)}`

      : "/api/subjects";

    const all = await api.get<ApiSubject[]>(path);

    if (!all?.length) return fallbackSubjects(category);

    if (category) {

      return all.filter(

        (s) => String(s.category).toUpperCase() === category,

      );

    }

    return all;

  } catch {

    return fallbackSubjects(category);

  }

}



function fallbackSubjects(category?: QuizLevel): ApiSubject[] {

  if (category === "SSC") {

    return SSC_CATALOG.map((s) => ({

      id: s.slug,

      name: s.name,

      slug: s.slug,

      category: "SSC",

      chapters: [],

    }));

  }

  if (category === "HSC") {

    return HSC_SCIENCE_PAPERS.map((p) => ({

      id: hscSlug(p.subject, p.paper),

      name: p.name,

      slug: hscSlug(p.subject, p.paper),

      category: "HSC",

      chapters: [],

    }));

  }

  return [];

}



function hscSlug(subject: string, paper: string) {

  return `${subject}-${paper}`;

}



export function parseHscSubjectPaper(subjectSlug: string): {

  level: "ssc" | "hsc";

  subject: string;

  paper?: string;

} {

  if (subjectSlug.endsWith("-1st-paper")) {

    return {

      level: "hsc",

      subject: subjectSlug.replace(/-1st-paper$/, ""),

      paper: "1st-paper",

    };

  }

  if (subjectSlug.endsWith("-2nd-paper")) {

    return {

      level: "hsc",

      subject: subjectSlug.replace(/-2nd-paper$/, ""),

      paper: "2nd-paper",

    };

  }

  return { level: "ssc", subject: subjectSlug };

}



export async function fetchQuestions(

  subject: string,

  chapter?: string,

): Promise<ApiQuestion[]> {

  const { level, subject: subj, paper } = parseHscSubjectPaper(subject);

  const fileSubject = resolveFileSubjectSlug(level, subj, paper);



  if (chapter) {

    return fetchNormalizedQuestions(

      level,

      subj === "math" ? "math" : subj,

      chapter,

      paper,

    );

  }



  return fetchNormalizedQuestions(

    level,

    subj === "math" ? "math" : subj,

    "",

    paper,

  );

}



export function isModelTestChapter(slug: string): boolean {

  return (

    slug.includes("model-test") ||

    slug.startsWith("special-set") ||

    slug.includes("set-")

  );

}

