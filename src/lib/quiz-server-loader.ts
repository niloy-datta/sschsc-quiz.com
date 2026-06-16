import fs from "fs/promises";
import path from "path";
import {
  buildQuestionFilenameCandidates,
  mapJsonPayloadToQuestions,
} from "@/lib/quiz/load-quiz-data";
import { resolveFileSubjectSlug, type RegistryLevel } from "@/lib/quiz/registry";
import type { ApiQuestion } from "@/types/quiz";

const QUESTIONS_DIR = path.resolve(process.cwd(), "public/questions");

// Simple in-memory cache mapping "level:subject:setId:paper" to ServerQuizLoadResult
const questionsCache = new Map<string, ServerQuizLoadResult>();

export type ServerQuizLoadResult = {
  questions: ApiQuestion[];
  path: string | null;
  attemptedPaths: string[];
};

async function tryReadQuestionFile(
  fileSlug: string,
  filename: string,
  subdir: "" | "model-tests",
): Promise<{ questions: ApiQuestion[]; path: string } | null> {
  const rel =
    subdir === ""
      ? path.join(fileSlug, `${filename}.json`)
      : path.join(fileSlug, subdir, `${filename}.json`);
  const fullPath = path.join(QUESTIONS_DIR, rel);
  const publicPath =
    subdir === ""
      ? `/questions/${fileSlug}/${filename}.json`
      : `/questions/${fileSlug}/model-tests/${filename}.json`;

  try {
    const raw = await fs.readFile(fullPath, "utf8");
    const data: unknown = JSON.parse(raw);
    const questions = mapJsonPayloadToQuestions(data);
    if (questions.length > 0) {
      return { questions, path: publicPath };
    }
  } catch {
    // file missing or invalid — try next candidate
  }
  return null;
}

/**
 * Load quiz questions from disk (server-side). Mirrors client fallback path strategy.
 * Cached in memory to avoid repeated disk reads.
 */
export async function loadQuizQuestionsFromDisk(
  level: RegistryLevel,
  subject: string,
  setId: string,
  paper?: string,
): Promise<ServerQuizLoadResult> {
  const cacheKey = `${level}:${subject}:${setId}:${paper ?? ""}`;
  const cached = questionsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await _loadQuizQuestionsFromDiskRaw(level, subject, setId, paper);
  questionsCache.set(cacheKey, result);
  return result;
}

async function _loadQuizQuestionsFromDiskRaw(
  level: RegistryLevel,
  subject: string,
  setId: string,
  paper?: string,
): Promise<ServerQuizLoadResult> {
  const fileSlug = resolveFileSubjectSlug(level, subject, paper);
  const filenames = buildQuestionFilenameCandidates(setId, fileSlug, level);
  const attemptedPaths: string[] = [];

  for (const filename of filenames) {
    for (const subdir of ["", "model-tests"] as const) {
      const publicPath =
        subdir === ""
          ? `/questions/${fileSlug}/${filename}.json`
          : `/questions/${fileSlug}/model-tests/${filename}.json`;
      attemptedPaths.push(publicPath);

      const result = await tryReadQuestionFile(fileSlug, filename, subdir);
      if (result) {
        return {
          questions: result.questions,
          path: result.path,
          attemptedPaths,
        };
      }
    }
  }

  for (const filename of filenames) {
    const megaPath = path.join(
      process.cwd(),
      "public",
      "quiz-data",
      level,
      `${fileSlug}.json`,
    );
    const publicMegaPath = `/quiz-data/${level}/${fileSlug}.json#${filename}`;
    attemptedPaths.push(publicMegaPath);
    try {
      const raw = await fs.readFile(megaPath, "utf8");
      const data = JSON.parse(raw) as { modelTests?: Record<string, unknown[]> };
      const list = data.modelTests?.[filename] ?? data.modelTests?.[setId];
      if (Array.isArray(list) && list.length > 0) {
        const questions = mapJsonPayloadToQuestions(list);
        if (questions.length > 0) {
          return { questions, path: publicMegaPath, attemptedPaths };
        }
      }
    } catch {
      /* mega missing */
    }
  }

  return { questions: [], path: null, attemptedPaths };
}
