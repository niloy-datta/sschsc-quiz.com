/**
 * Client-only localStorage utility for tracking incorrect quiz submissions.
 * 
 * Each wrong question is stored in localStorage under the key
 * `wrong-questions` as a JSON array. All operations are safe to call
 * on the server (they no-op).
 */

const STORAGE_KEY = "wrong-questions";
const MAX_WRONG = 500;

export interface WrongQuestion {
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
  /** The option letter the student selected, e.g. "A", "B", "C", "D" */
  studentOption?: string | null;
  /** Correct option letter, e.g. "A", "B", "C", "D" */
  correctOption?: string;
  /** Explanation for the correct option */
  explanation?: string;
  /** ISO timestamp when saved */
  savedAt: string;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readAll(): WrongQuestion[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WrongQuestion[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: WrongQuestion[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota exceeded — silently drop */
  }
}

/** Get all wrong questions, newest first. */
export function getWrongQuestions(): WrongQuestion[] {
  return readAll().sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );
}

/** Check whether a question is in the wrong questions store by its id. */
export function isQuestionWrong(questionId: string): boolean {
  return readAll().some((q) => q.id === questionId);
}

/** Save a wrong question. Returns true on success. */
export function saveWrongQuestion(question: Omit<WrongQuestion, "savedAt">): boolean {
  const all = readAll();

  // If already exists, update the studentOption and savedAt, but do not duplicate
  const existingIdx = all.findIndex((q) => q.id === question.id);
  if (existingIdx !== -1) {
    all[existingIdx] = {
      ...all[existingIdx],
      studentOption: question.studentOption ?? all[existingIdx].studentOption,
      correctOption: question.correctOption ?? all[existingIdx].correctOption,
      explanation: question.explanation ?? all[existingIdx].explanation,
      savedAt: new Date().toISOString(),
    };
    writeAll(all);
    return true;
  }

  // Enforce cap — drop oldest entries if over limit
  if (all.length >= MAX_WRONG) {
    all.sort(
      (a, b) =>
        new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime(),
    );
    all.splice(0, all.length - MAX_WRONG + 1);
  }

  all.push({ ...question, savedAt: new Date().toISOString() });
  writeAll(all);
  return true;
}

/** Remove a wrong question by id. Returns true if it existed. */
export function removeWrongQuestion(questionId: string): boolean {
  const all = readAll();
  const idx = all.findIndex((q) => q.id === questionId);
  if (idx === -1) return false;
  all.splice(idx, 1);
  writeAll(all);
  return true;
}

/** Clear all wrong questions. */
export function clearAllWrongQuestions(): void {
  writeAll([]);
}

/** Return the count of wrong questions. */
export function getWrongCount(): number {
  return readAll().length;
}
