import fs from "fs/promises";
import path from "path";
import { parseSubjectQuizJson } from "@/lib/quiz/normalize-quiz-data";
import { QUIZ_REGISTRY } from "@/lib/quiz/registry";
import type { NormalizationStats, ParsedSubjectQuizData } from "@/lib/quiz/types";

export interface SubjectAuditRow {
  registryPath: string;
  exists: boolean;
  loadError?: string;
  chapterSetCount: number;
  modelTestSetCount: number;
  boardSetCount: number;
  totalQuestions: number;
  stats: NormalizationStats;
}

export interface QuizDataAuditReport {
  subjects: SubjectAuditRow[];
  missingFiles: string[];
  invalidJsonFiles: string[];
  totalSubjects: number;
  totalChapters: number;
  totalSets: number;
  totalQuestions: number;
  skippedBadQuestions: number;
  duplicateIdsFixed: number;
  manifestExists: boolean;
}

const QUIZ_DATA_ROOT = path.resolve(process.cwd(), "public/quiz-data");

export async function auditQuizDataFiles(): Promise<QuizDataAuditReport> {
  const subjects: SubjectAuditRow[] = [];
  const missingFiles: string[] = [];
  const invalidJsonFiles: string[] = [];

  let totalChapters = 0;
  let totalSets = 0;
  let totalQuestions = 0;
  let skippedBad = 0;
  let duplicateFixed = 0;

  for (const entry of QUIZ_REGISTRY) {
    const relPath = entry.mainJsonPath;
    const filePath = path.join(QUIZ_DATA_ROOT, entry.level, path.basename(relPath));

    let exists = false;
    let parsed: ParsedSubjectQuizData | null = null;
    let loadError: string | undefined;

    try {
      await fs.access(filePath);
      exists = true;
      const raw = await fs.readFile(filePath, "utf8");
      try {
        const json = JSON.parse(raw);
        parsed = parseSubjectQuizJson(json, relPath);
      } catch {
        invalidJsonFiles.push(relPath);
        loadError = "Invalid JSON";
      }
    } catch {
      missingFiles.push(relPath);
    }

    const chapterSetCount = parsed?.chapterSets.length ?? 0;
    const modelTestSetCount = parsed?.modelTestSets.length ?? 0;
    const boardSetCount = parsed?.boardSets.length ?? 0;
    const stats = parsed?.stats ?? {
      skippedEmpty: 0,
      skippedInvalidOptions: 0,
      skippedInvalidCorrect: 0,
      skippedBrokenOcr: 0,
      duplicateIdsFixed: 0,
      totalInput: 0,
      totalValid: 0,
    };

    const subjectQuestions =
      (parsed?.chapterSets.reduce((s, x) => s + x.questionCount, 0) ?? 0) +
      (parsed?.modelTestSets.reduce((s, x) => s + x.questionCount, 0) ?? 0) +
      (parsed?.boardSets.reduce((s, x) => s + x.questionCount, 0) ?? 0);

    totalChapters += chapterSetCount;
    totalSets += chapterSetCount + modelTestSetCount + boardSetCount;
    totalQuestions += subjectQuestions;
    skippedBad +=
      stats.skippedEmpty +
      stats.skippedInvalidOptions +
      stats.skippedInvalidCorrect +
      stats.skippedBrokenOcr;
    duplicateFixed += stats.duplicateIdsFixed;

    subjects.push({
      registryPath: relPath,
      exists,
      loadError: parsed?.loadError ?? loadError,
      chapterSetCount,
      modelTestSetCount,
      boardSetCount,
      totalQuestions: subjectQuestions,
      stats,
    });
  }

  let manifestExists = false;
  try {
    await fs.access(path.join(QUIZ_DATA_ROOT, "manifest.json"));
    manifestExists = true;
  } catch {
    /* missing */
  }

  return {
    subjects,
    missingFiles,
    invalidJsonFiles,
    totalSubjects: subjects.filter((s) => s.exists).length,
    totalChapters,
    totalSets,
    totalQuestions,
    skippedBadQuestions: skippedBad,
    duplicateIdsFixed: duplicateFixed,
    manifestExists,
  };
}
