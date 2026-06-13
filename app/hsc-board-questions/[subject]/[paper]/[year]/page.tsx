import fs from "fs/promises";
import path from "path";
import BoardYearClient from "./BoardYearClient";
import { getAvailableBoardQuizzes } from "@/lib/board-quizzes";

const DATA_DIR = path.resolve(process.cwd(), "data/hsc-board-questions");

async function getQuestionData(subject: string, paper: string, year: string) {
  const filePath = path.join(DATA_DIR, subject, paper, `${year}.json`);
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data) as { image_url: string; text?: string }[];
  } catch (error) {
    return [];
  }
}

type Props = {
  params: {
    subject: string;
    paper: string;
    year: string;
  };
};

export default async function QuestionPage({ params }: Props) {
  const { subject, paper, year } = params;
  
  // Load scanned images/OCR questions
  const scannedQuestions = await getQuestionData(subject, paper, year);
  
  // Load clean interactive quizzes
  const cleanQuizzesByBoard = await getAvailableBoardQuizzes("HSC", subject, paper, year);

  return (
    <BoardYearClient
      subject={subject}
      paper={paper}
      year={year}
      scannedQuestions={scannedQuestions}
      cleanQuizzesByBoard={cleanQuizzesByBoard}
    />
  );
}

export async function generateStaticParams() {
  const subjects = await fs.readdir(DATA_DIR);
  const params = [];
  for (const subject of subjects) {
    const subjectDir = path.join(DATA_DIR, subject);
    try {
      const papers = await fs.readdir(subjectDir);
      for (const paper of papers) {
        const paperDir = path.join(subjectDir, paper);
        try {
          const yearFiles = await fs.readdir(paperDir);
          for (const yearFile of yearFiles) {
            params.push({
              subject,
              paper,
              year: yearFile.replace(".json", ""),
            });
          }
        } catch (e) {}
      }
    } catch (e) {}
  }
  return params;
}
