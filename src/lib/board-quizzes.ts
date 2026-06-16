import fs from "fs/promises";
import path from "path";
import type { ApiQuestion } from "@/types/quiz";

export interface BoardQuizMetadata {
  level: "HSC" | "SSC";
  subject: string;
  paper?: string;
  year: string;
  board: string;
}

const QUESTIONS_DIR = path.resolve(process.cwd(), "public/questions");

function hscSubjectFileSlug(subject: string, paper?: string): string {
  if (paper) return `${subject}-${paper}`;
  return subject;
}

async function loadBoardQuestionsFromStatic(
  level: "HSC" | "SSC",
  subject: string,
  paper: string | undefined,
  year: string,
): Promise<Record<string, ApiQuestion[]>> {
  let fileSlug = level === "HSC" ? hscSubjectFileSlug(subject, paper) : subject;
  if (fileSlug === "math") fileSlug = "general-math";

  const indexFilePath = path.join(QUESTIONS_DIR, fileSlug, "index.json");

  try {
    const rawIndex = await fs.readFile(indexFilePath, "utf8");
    const indexData = JSON.parse(rawIndex) as {
      boards?: Array<{ id: string; title: string; questionCount: number }>;
    };

    const boardsList = indexData.boards || [];
    // Filter boards for the requested year, matching e.g., "dhaka-2023" or similar
    const yearBoards = boardsList.filter((b) => b.id.endsWith(`-${year}`));
    if (yearBoards.length === 0) return {};

    const results: Record<string, ApiQuestion[]> = {};

    for (const boardInfo of yearBoards) {
      // Find the board name from the ID (e.g. "dhaka-2023" -> board is "dhaka")
      const boardName = boardInfo.id.substring(0, boardInfo.id.lastIndexOf(`-${year}`));
      const boardQuestionsPath = path.join(QUESTIONS_DIR, fileSlug, `${boardInfo.id}.json`);

      try {
        const rawQs = await fs.readFile(boardQuestionsPath, "utf8");
        const questionsList = JSON.parse(rawQs) as Array<{
          id: string;
          subject: string;
          chapter: string;
          text: string;
          options: string[];
          image?: string | null;
          timeLimit?: number;
          optionImages?: string[] | null;
        }>;

        if (Array.isArray(questionsList)) {
          results[boardName] = questionsList.map((pq) => ({
            id: pq.id,
            questionText: pq.text,
            optionA: pq.options[0] || "",
            optionB: pq.options[1] || "",
            optionC: pq.options[2] || "",
            optionD: pq.options[3] || "",
            correctOption: "", // Never exposed to frontend
            subject: pq.subject,
            chapter: pq.chapter,
            explanation: "", // Never exposed to frontend
            image: pq.image || null,
            optionImages: pq.optionImages || null,
          }));
        }
      } catch (err) {
        console.warn(`Failed to read board questions from ${boardQuestionsPath}:`, err);
      }
    }

    return results;
  } catch (err) {
    console.warn(`Failed to load board quizzes from index:`, err);
    return {};
  }
}

/**
 * Returns available boards and their questions for the given criteria.
 */
export async function getAvailableBoardQuizzes(
  level: "HSC" | "SSC",
  subject: string,
  paper: string | undefined,
  year: string,
): Promise<Record<string, ApiQuestion[]>> {
  const targetSubject = subject.toLowerCase();
  const targetPaper = paper?.toLowerCase();

  return loadBoardQuestionsFromStatic(
    level,
    targetSubject,
    targetPaper,
    year,
  );
}

/** @deprecated Used by legacy tooling; keys in scratch/parsed_quizzes.json */
export function parseBoardQuestionKey(key: string): BoardQuizMetadata | null {
  const p = key.toLowerCase().replace(/\\/g, "/");
  if (!p.includes("/board-questions/")) return null;

  const parts = p.split("/");
  const level = p.startsWith("ssc") ? "SSC" : "HSC";
  const boardQuestionsIndex = parts.indexOf("board-questions");
  const preParts = parts.slice(0, boardQuestionsIndex);

  let subject = "";
  let paper: string | undefined = undefined;

  if (level === "HSC") {
    subject = preParts[2] || "";
    if (
      preParts[3] &&
      (preParts[3].includes("1st") ||
        preParts[3].includes("2nd") ||
        preParts[3].includes("paper"))
    ) {
      paper = preParts[3];
    }
  } else {
    subject = preParts[2] || "";
  }

  const postParts = parts.slice(boardQuestionsIndex + 1);
  const yearWiseIndex = postParts.indexOf("year-wise");
  let year = "";
  let boardFile = "";

  if (yearWiseIndex !== -1 && yearWiseIndex + 2 < postParts.length) {
    year = postParts[yearWiseIndex + 1];
    boardFile = postParts[yearWiseIndex + 2];
  } else {
    const yearMatch = p.match(/\/(\d{4})\//);
    if (yearMatch) year = yearMatch[1];
    boardFile = parts[parts.length - 1];
  }

  const boardNameRaw = boardFile.replace(".ts", "").replace(".js", "");
  let cleanBoard = boardNameRaw;
  if (boardNameRaw.includes("-board-")) {
    const boardParts = boardNameRaw.split("-");
    const boardIdx = boardParts.indexOf("board");
    if (boardIdx > 0) cleanBoard = boardParts[boardIdx - 1];
  }
  if (cleanBoard === "barisal") cleanBoard = "barishal";
  if (cleanBoard === "comilla") cleanBoard = "cumilla";

  return { level, subject, paper, year, board: cleanBoard };
}
