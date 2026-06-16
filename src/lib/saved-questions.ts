/**
 * Client-only localStorage utility for saving/bookmarking quiz questions.
 *
 * Each saved question is stored in localStorage under the key
 * `saved-questions` as a JSON array. All operations are safe to call
 * on the server (they no-op).
 */

const STORAGE_KEY = "saved-questions";
const MAX_SAVED = 500;

export interface SavedQuestion {
  /** Unique question id (from the quiz JSON) */
  id: string;
  /** Question text / stem */
  questionText: string;
  /** Answer options (4 strings) */
  options: string[];
  /** Optional question diagram image path */
  image?: string | null;
  /** Optional per-option images */
  optionImages?: (string | null)[] | null;
  /** Subject slug, e.g. "physics", "chemistry-1st-paper" */
  subject?: string;
  /** Chapter slug or display name */
  chapter?: string;
  /** Source quiz id (set/model-test id) */
  sourceQuizId?: string;
  /** Level (ssc / hsc) */
  level?: string;
  /** Correct option letter, e.g. "A", "B", "C", "D" */
  correctOption?: string;
  /** Explanation for the correct option */
  explanation?: string;
  /** ISO timestamp when saved */
  savedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readAll(): SavedQuestion[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedQuestion[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: SavedQuestion[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota exceeded — silently drop */
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/** Get all saved questions, newest first. */
export function getSavedQuestions(): SavedQuestion[] {
  return readAll().sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );
}

/** Check whether a question is saved by its id. */
export function isQuestionSaved(questionId: string): boolean {
  return readAll().some((q) => q.id === questionId);
}

/** Save a question. Returns true on success. */
export function saveQuestion(question: Omit<SavedQuestion, "savedAt">): boolean {
  const all = readAll();

  // Prevent duplicates
  if (all.some((q) => q.id === question.id)) return false;

  // Enforce cap — drop oldest entries if over limit
  if (all.length >= MAX_SAVED) {
    all.sort(
      (a, b) =>
        new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime(),
    );
    all.splice(0, all.length - MAX_SAVED + 1);
  }

  all.push({ ...question, savedAt: new Date().toISOString() });
  writeAll(all);
  return true;
}

/** Remove a saved question by id. Returns true if it existed. */
export function removeSavedQuestion(questionId: string): boolean {
  const all = readAll();
  const idx = all.findIndex((q) => q.id === questionId);
  if (idx === -1) return false;
  all.splice(idx, 1);
  writeAll(all);
  return true;
}

/** Toggle save/unsave. Returns the new saved state. */
export function toggleSavedQuestion(
  question: Omit<SavedQuestion, "savedAt">,
): boolean {
  if (isQuestionSaved(question.id)) {
    removeSavedQuestion(question.id);
    return false;
  }
  saveQuestion(question);
  return true;
}

/** Clear all saved questions. */
export function clearAllSavedQuestions(): void {
  writeAll([]);
}

/** Return the count of saved questions. */
export function getSavedCount(): number {
  return readAll().length;
}

/** Backfill correct answers and explanations for already saved questions. */
export function backfillSavedQuestionsAnswers(
  correctAnswerIndexes: Record<string, number>,
  explanations: Record<string, string>,
): void {
  const all = readAll();
  let updated = false;
  const optionsLetters = ["A", "B", "C", "D"];

  for (const q of all) {
    const correctIdx = correctAnswerIndexes[q.id];
    const explanation = explanations[q.id];

    let qUpdated = false;
    if (correctIdx !== undefined && correctIdx >= 0) {
      const correctOption = optionsLetters[correctIdx];
      if (q.correctOption !== correctOption) {
        q.correctOption = correctOption;
        qUpdated = true;
      }
    }
    if (explanation !== undefined && q.explanation !== explanation) {
      q.explanation = explanation;
      qUpdated = true;
    }

    if (qUpdated) {
      updated = true;
    }
  }

  if (updated) {
    writeAll(all);
  }
}

