export type BanglaOptionLabel = "ক" | "খ" | "গ" | "ঘ";
export type AnswerIndex = 0 | 1 | 2 | 3;

export type NormalizedQuestion = {
  id: string;
  questionNo: number;
  question: string;
  options: { label: BanglaOptionLabel; text: string }[];
  correctOption: BanglaOptionLabel;
  answerIndex: AnswerIndex;
  chapter?: string;
  chapterName?: string;
  topic?: string;
  difficulty?: string;
  shortSolution?: string;
  explanation?: string;
  whyImportant?: string;
  sourceType?: string;
  sourceYear?: string | null;
  sourceBoard?: string | null;
  stimulusId?: string | null;
  stimulus?: string | null;
};

export type QuizSetType =
  | "chapter-wise"
  | "model-test"
  | "whole-syllabus"
  | "board-wise";

export type NormalizedQuizSet = {
  id: string;
  title: string;
  displayTitle: string;
  level: "ssc" | "hsc";
  subject: string;
  paper?: string | null;
  type: QuizSetType;
  chapter?: string | null;
  chapterName?: string | null;
  questionCount: number;
  durationMinutes?: number;
  questions: NormalizedQuestion[];
  /** paper | chapter | board | whole-syllabus for model tests */
  scope?: "paper" | "chapter" | "board" | "whole-syllabus";
  importance?: "high" | "medium" | "low";
  difficulty?: "easy" | "medium" | "hard" | "advanced";
  sourceKey?: string;
};

export type NormalizationStats = {
  skippedEmpty: number;
  skippedInvalidOptions: number;
  skippedInvalidCorrect: number;
  skippedBrokenOcr: number;
  duplicateIdsFixed: number;
  totalInput: number;
  totalValid: number;
};

export type ParsedSubjectQuizData = {
  level: "ssc" | "hsc";
  subject: string;
  paper?: string | null;
  chapterSets: NormalizedQuizSet[];
  modelTestSets: NormalizedQuizSet[];
  boardSets: NormalizedQuizSet[];
  stats: NormalizationStats;
  rawFilePath: string;
  loadError?: string;
};
