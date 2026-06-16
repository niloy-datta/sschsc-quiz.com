"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type SavedQuestion,
  getSavedQuestions,
  isQuestionSaved,
  saveQuestion,
  removeSavedQuestion,
  toggleSavedQuestion,
  clearAllSavedQuestions,
  getSavedCount,
} from "@/lib/saved-questions";

/**
 * React hook for managing saved/bookmarked quiz questions.
 *
 * Backed by localStorage — no backend required.  Re-renders are
 * batched so toggling multiple questions in rapid succession is safe.
 */
export function useSavedQuestions() {
  const [saved, setSaved] = useState<SavedQuestion[]>([]);
  const [mounted, setMounted] = useState(false);

  // Hydrate on mount (avoids SSR mismatch)
  useEffect(() => {
    setSaved(getSavedQuestions());
    setMounted(true);
  }, []);

  const refresh = useCallback(() => {
    setSaved(getSavedQuestions());
  }, []);

  const isSaved = useCallback(
    (questionId: string) => {
      if (!mounted) return false;
      return isQuestionSaved(questionId);
    },
    [mounted],
  );

  const toggle = useCallback(
    (question: Omit<SavedQuestion, "savedAt">) => {
      const newState = toggleSavedQuestion(question);
      refresh();
      return newState;
    },
    [refresh],
  );

  const add = useCallback(
    (question: Omit<SavedQuestion, "savedAt">) => {
      const ok = saveQuestion(question);
      if (ok) refresh();
      return ok;
    },
    [refresh],
  );

  const remove = useCallback(
    (questionId: string) => {
      const ok = removeSavedQuestion(questionId);
      if (ok) refresh();
      return ok;
    },
    [refresh],
  );

  const clearAll = useCallback(() => {
    clearAllSavedQuestions();
    refresh();
  }, [refresh]);

  const count = mounted ? saved.length : 0;

  return {
    saved,
    count,
    mounted,
    isSaved,
    toggle,
    add,
    remove,
    clearAll,
    refresh,
  };
}
