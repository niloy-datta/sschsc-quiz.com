/** Board question shape (served from public/questions/*.json). */
export interface HscQuestion {
  id: number;
  question: string;
  options: string[];
  answerIndex: number;
  chapter: string;
  score: number;
}

export interface ApiChapter {
  id: string;
  title: string;
  slug: string;
}

export interface ApiSubject {
  id: string;
  name: string;
  slug: string;
  category: string;
  chapters?: ApiChapter[];
}

export interface ApiQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  subject?: string;
  chapter?: string;
  category?: string;
  explanation?: string;
  image?: string | null;
  optionImages?: string[] | null;
  is_live?: boolean;
}
