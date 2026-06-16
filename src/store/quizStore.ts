import { create } from "zustand";
import { api } from "@/lib/api";

export interface Question {
  id: string;
  subject: string;
  chapter: string;
  text: string;
  options: string[];
  image: string | null;
  optionImages?: string[] | null;
  timeLimit: number;
}

export interface QuizAttemptPayload {
  userId: string;
  submissionId: string;
  quizId: string;
  subject: string;
  answers: { id: string; ans: string | null }[];
  answerIndexes: number[];
  examName?: string;
  questionsPath?: string;
  timeTaken: number;
  mode: string;
}

export interface QuizResults {
  totalScore: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  accuracy: number;
  timePerQuestion: number;
  chapterPerformance: Record<string, number>;
  difficultyPerformance: Record<string, number>;
  eloRatingChange: number;
  weakTopics: string[];
  strongTopics: string[];
  explanations: Record<string, string>;
  correctAnswerIndexes?: Record<string, number>;
}


function newSubmissionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

interface QuizState {
  currentQuestionIndex: number;
  selectedAnswers: Record<string, string>;
  markedQuestions: Record<string, boolean>;
  skippedQuestions: Record<string, boolean>;
  timer: number;
  timeTaken: number;
  quizStarted: boolean;
  quizSubmitted: boolean;
  submissionId: string | null;
  isSubmitting: boolean;
  attemptId: string | null;
  quizId: string | null;
  subject: string | null;
  chapter: string | null;
  examName: string | null;
  questions: Question[];
  isLoading: boolean;
  results: QuizResults | null;

  startQuiz: (
    quizId: string,
    subject: string,
    chapter: string,
    questions: Question[],
    timeLimitSec: number,
    examName?: string,
  ) => void;
  selectAnswer: (questionId: string, answer: string) => void;
  markQuestion: (questionId: string) => void;
  skipQuestion: (questionId: string) => void;
  tickTimer: () => void;
  setQuestionIndex: (index: number) => void;
  resetQuiz: () => void;
  submitQuiz: (userId: string, mode: string, token: string) => Promise<QuizResults>;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  currentQuestionIndex: 0,
  selectedAnswers: {},
  markedQuestions: {},
  skippedQuestions: {},
  timer: 600,
  timeTaken: 0,
  quizStarted: false,
  quizSubmitted: false,
  submissionId: null,
  isSubmitting: false,
  attemptId: null,
  quizId: null,
  subject: null,
  chapter: null,
  examName: null,
  questions: [],
  isLoading: false,
  results: null,

  startQuiz: (quizId, subject, chapter, questions, timeLimitSec, examName) => {
    set({
      quizId,
      subject,
      chapter,
      examName: examName || null,
      questions,
      submissionId: newSubmissionId(),
      timer: timeLimitSec,
      timeTaken: 0,
      currentQuestionIndex: 0,
      selectedAnswers: {},
      markedQuestions: {},
      skippedQuestions: {},
      quizStarted: true,
      quizSubmitted: false,
      isSubmitting: false,
      results: null,
    });
  },

  selectAnswer: (questionId, answer) => {
    set((state) => {
      const selectedAnswers = { ...state.selectedAnswers, [questionId]: answer };
      const skippedQuestions = { ...state.skippedQuestions };
      delete skippedQuestions[questionId];
      return { selectedAnswers, skippedQuestions };
    });
  },

  markQuestion: (questionId) => {
    set((state) => ({
      markedQuestions: {
        ...state.markedQuestions,
        [questionId]: !state.markedQuestions[questionId],
      },
    }));
  },

  skipQuestion: (questionId) => {
    set((state) => ({
      skippedQuestions: {
        ...state.skippedQuestions,
        [questionId]: true,
      },
    }));
  },

  tickTimer: () => {
    set((state) => {
      if (state.timer <= 1) {
        return { timer: 0, timeTaken: state.timeTaken + 1 };
      }
      return { timer: state.timer - 1, timeTaken: state.timeTaken + 1 };
    });
  },

  setQuestionIndex: (index) => {
    set({ currentQuestionIndex: index });
  },

  resetQuiz: () => {
    set({
      currentQuestionIndex: 0,
      selectedAnswers: {},
      markedQuestions: {},
      skippedQuestions: {},
      timer: 600,
      timeTaken: 0,
      quizStarted: false,
      quizSubmitted: false,
      submissionId: null,
      isSubmitting: false,
      results: null,
    });
  },

  submitQuiz: async (userId, mode, token) => {
    const {
      quizId,
      subject,
      questions,
      selectedAnswers,
      skippedQuestions,
      timeTaken,
      submissionId,
      isSubmitting,
      quizSubmitted,
      examName,
    } = get();

    if (isSubmitting || quizSubmitted) {
      const existing = get().results;
      if (existing) return existing;
      throw new Error("Submission already in progress");
    }

    if (!submissionId) {
      throw new Error("Missing submissionId — restart the quiz");
    }

    set({ isSubmitting: true, isLoading: true });

    const submissionAnswers = questions.map((q) => ({
      id: q.id,
      ans: selectedAnswers[q.id] || null,
    }));

    const answerIndexes = questions.map((q) => {
      if (skippedQuestions[q.id]) return -1;
      const sel = selectedAnswers[q.id];
      if (!sel) return -1;
      const idx = q.options.indexOf(sel);
      return idx >= 0 ? idx : -1;
    });

    const questionsPath =
      subject && quizId ? `${subject}/${quizId}` : undefined;

    const payload: QuizAttemptPayload = {
      userId,
      submissionId,
      quizId: quizId || "unknown",
      subject: subject || "unknown",
      answers: submissionAnswers,
      answerIndexes,
      examName: examName || undefined,
      questionsPath,
      timeTaken,
      mode,
    };

    try {
      const results = await api.post<QuizResults>("/api/quiz/submit", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      set({
        quizSubmitted: true,
        results,
        isLoading: false,
        isSubmitting: false,
      });

      return results;
    } catch (error) {
      set({ isLoading: false, isSubmitting: false });
      throw error;
    }
  },
}));
