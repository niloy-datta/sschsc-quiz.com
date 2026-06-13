import React from "react";
import BoardYearClientSSC from "./BoardYearClientSSC";
import { getAvailableBoardQuizzes } from "@/lib/board-quizzes";

type Props = {
  params: {
    subject: string;
    year: string;
  };
};

export default async function SSCBoardYearPage({ params }: Props) {
  const { subject, year } = params;
  
  // Normalize "math" slug to "general-math" for data extraction
  const apiSubject = subject === "math" ? "general-math" : subject;
  
  // Fetch available board quizzes
  const cleanQuizzesByBoard = await getAvailableBoardQuizzes("SSC", apiSubject, undefined, year);

  return (
    <BoardYearClientSSC
      subject={subject}
      year={year}
      cleanQuizzesByBoard={cleanQuizzesByBoard}
    />
  );
}

export async function generateStaticParams() {
  const subjects = ["physics", "chemistry", "biology", "higher-math", "math"];
  const years = ["2022", "2023", "2024", "2025", "2026"];
  const params = [];
  
  for (const subject of subjects) {
    for (const year of years) {
      params.push({ subject, year });
    }
  }
  
  return params;
}
