"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type WrongQuestion,
  getWrongQuestions,
  isQuestionWrong,
  saveWrongQuestion,
  removeWrongQuestion,
  clearAllWrongQuestions,
} from "@/lib/wrong-answers";

/**
 * React hook for managing wrong/incorrectly answered quiz questions.
 * 
 * Backed by localStorage — no backend required.
 */
export function useWrongAnswers() {
  const [wrong, setWrong] = useState<WrongQuestion[]>([]);
  const [mounted, setMounted] = useState(false);

  // Hydrate on mount (avoids SSR mismatch)
  useEffect(() => {
    setWrong(getWrongQuestions());
    setMounted(true);
  }, []);

  const refresh = useCallback(() => {
    setWrong(getWrongQuestions());
  }, []);

  const isWrong = useCallback(
    (questionId: string) => {
      if (!mounted) return false;
      return isQuestionWrong(questionId);
    },
    [mounted],
  );

  const add = useCallback(
    (question: Omit<WrongQuestion, "savedAt">) => {
      const ok = saveWrongQuestion(question);
      if (ok) refresh();
      return ok;
    },
    [refresh],
  );

  const remove = useCallback(
    (questionId: string) => {
      const ok = removeWrongQuestion(questionId);
      if (ok) refresh();
      return ok;
    },
    [refresh],
  );

  const clearAll = useCallback(() => {
    clearAllWrongQuestions();
    refresh();
  }, [refresh]);

  const count = mounted ? wrong.length : 0;

  return {
    wrong,
    count,
    mounted,
    isWrong,
    add,
    remove,
    clearAll,
    refresh,
  };
}
