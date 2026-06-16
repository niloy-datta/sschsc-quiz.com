import fs from "fs/promises";
import path from "path";
import BoardYearClient from "./BoardYearClient";
import { getAvailableBoardQuizzes } from "@/lib/board-quizzes";


// Scanned original question paper images — loads from public/images/board-scanned/
async function getQuestionData(
  subject: string,
  paper: string,
  year: string,
): Promise<{ image_url: string; text?: string }[]> {
  const results: { image_url: string; text?: string }[] = [];
  const SCANNED_DIR = path.resolve(
    process.cwd(),
    "public/images/board-scanned",
    subject,
    paper,
  );

  try {
    await fs.access(SCANNED_DIR);
    const files = (await fs.readdir(SCANNED_DIR))
      .filter((f) => f.startsWith(year) && (f.endsWith(".webp") || f.endsWith(".png") || f.endsWith(".jpg")))
      .sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ""), 10);
        const numB = parseInt(b.replace(/\D/g, ""), 10);
        return numA - numB;
      });

    for (const file of files) {
      const image_url = `/images/board-scanned/${subject}/${paper}/${file}`;
      // Check if a corresponding .txt OCR file exists
      const txtFile = file.replace(/\.(webp|png|jpg)$/, ".txt");
      let text: string | undefined;
      try {
        const txtPath = path.join(SCANNED_DIR, txtFile);
        text = await fs.readFile(txtPath, "utf8");
      } catch {
        text = undefined;
      }
      results.push({ image_url, text });
    }
  } catch {
    // No scanned images for this subject/year — return empty
  }

  return results;
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
  // Derive params from public/questions index.json files (canonical source)
  const QUESTIONS_DIR = path.resolve(process.cwd(), "public/questions");
  const HSC_SUBJECTS = [
    { slug: "physics-1st-paper",    subject: "physics",      paper: "1st-paper" },
    { slug: "physics-2nd-paper",    subject: "physics",      paper: "2nd-paper" },
    { slug: "chemistry-1st-paper",  subject: "chemistry",    paper: "1st-paper" },
    { slug: "chemistry-2nd-paper",  subject: "chemistry",    paper: "2nd-paper" },
    { slug: "biology-1st-paper",    subject: "biology",      paper: "1st-paper" },
    { slug: "biology-2nd-paper",    subject: "biology",      paper: "2nd-paper" },
    { slug: "higher-math-1st-paper",subject: "higher-math",  paper: "1st-paper" },
    { slug: "higher-math-2nd-paper",subject: "higher-math",  paper: "2nd-paper" },
  ];

  const params: { subject: string; paper: string; year: string }[] = [];

  for (const { slug, subject, paper } of HSC_SUBJECTS) {
    try {
      const indexPath = path.join(QUESTIONS_DIR, slug, "index.json");
      const raw = await fs.readFile(indexPath, "utf8");
      const idx = JSON.parse(raw) as { boards?: { id: string }[] };
      const years = Array.from(
        new Set((idx.boards || []).map((b) => b.id.split("-").pop()!)),
      );
      for (const year of years) {
        params.push({ subject, paper, year });
      }
    } catch {
      // subject not found — skip
    }
  }

  return params;
}
