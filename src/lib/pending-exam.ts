const PENDING_KEY = "pendingExamAttempt";



export interface PendingExamAttempt {

  examSlug: string;

  examName: string;

  mode: string;

  timeTaken: number;

  answers: Array<{ questionId: string; selectedOption: string | null }>;

}



/** @deprecated Legacy pre-login queue — grading now uses POST /api/quiz/submit only. */

export function storePendingExamAttempt(data: PendingExamAttempt): void {

  try {

    sessionStorage.setItem(PENDING_KEY, JSON.stringify(data));

  } catch {

    /* ignore */

  }

}



export function getPendingExamAttempt(): PendingExamAttempt | null {

  try {

    const raw = sessionStorage.getItem(PENDING_KEY);

    if (!raw) return null;

    return JSON.parse(raw) as PendingExamAttempt;

  } catch {

    return null;

  }

}



export function clearPendingExamAttempt(): void {

  try {

    sessionStorage.removeItem(PENDING_KEY);

  } catch {

    /* ignore */

  }

}



/** Clears stale legacy session data; no longer calls /api/student/exam-attempts. */

export async function flushPendingExamAttempt(): Promise<boolean> {

  if (!getPendingExamAttempt()) return false;

  clearPendingExamAttempt();

  return false;

}

