import { describe, expect, it, vi } from "vitest";
import { useQuizStore } from "@/store/quizStore";
import { api } from "@/lib/api";

// Mock the API so we don't actually hit the backend
vi.mock("@/lib/api", () => ({
  api: {
    post: vi.fn(),
  },
}));

describe("Quiz Store Logic", () => {
  it("initializes and correctly processes answer selection", () => {
    const store = useQuizStore.getState();
    store.startQuiz(
      "test-quiz",
      "physics",
      "chapter-1",
      [
        { id: "q1", question: "Test Q1", options: ["A", "B", "C", "D"] } as any,
        { id: "q2", question: "Test Q2", options: ["1", "2", "3", "4"] } as any,
      ],
      600,
      "Test Exam",
    );

    const stateAfterStart = useQuizStore.getState();
    expect(stateAfterStart.quizStarted).toBe(true);
    expect(stateAfterStart.questions.length).toBe(2);

    // Select answers
    stateAfterStart.selectAnswer("q1", "B");
    stateAfterStart.skipQuestion("q2");

    const stateAfterSelect = useQuizStore.getState();
    expect(stateAfterSelect.selectedAnswers["q1"]).toBe("B");
    expect(stateAfterSelect.skippedQuestions["q2"]).toBe(true);
  });

  it("prevents submit without submissionId", async () => {
    const store = useQuizStore.getState();
    store.resetQuiz();
    store.startQuiz(
      "test",
      "test",
      "test",
      [{ id: "q1", question: "Test Q", options: ["A"] } as any],
      60,
      "test",
    );

    // Attempt submit without ID
    useQuizStore.setState({ submissionId: null });
    await expect(
      store.submitQuiz("user123", "practice", "token"),
    ).rejects.toThrow("Missing submissionId");
  });

  it("assembles correct payload for API", async () => {
    const store = useQuizStore.getState();
    store.resetQuiz();

    // Inject state
    useQuizStore.setState({
      quizId: "test-quiz",
      subject: "physics",
      submissionId: "sub_123",
      questions: [
        {
          id: "q1",
          subject: "physics",
          chapter: "vectors",
          text: "Q1",
          options: ["A", "B", "C", "D"],
          image: null,
          timeLimit: 60,
        },
        {
          id: "q2",
          subject: "physics",
          chapter: "vectors",
          text: "Q2",
          options: ["A", "B", "C", "D"],
          image: null,
          timeLimit: 60,
        },
      ],
      selectedAnswers: { q1: "C" },
      skippedQuestions: { q2: true },
      timeTaken: 45,
    });

    const mockPost = vi.mocked(api.post);
    mockPost.mockResolvedValueOnce({
      totalQuestions: 2,
      correct: 1,
      wrong: 0,
      skipped: 1,
      score: 1,
    });

    const results = await useQuizStore
      .getState()
      .submitQuiz("user123", "exam", "fake-token");

    expect(mockPost).toHaveBeenCalledWith(
      "/api/quiz/submit",
      expect.objectContaining({
        userId: "user123",
        submissionId: "sub_123",
        quizId: "test-quiz",
        subject: "physics",
        answers: [
          { id: "q1", ans: "C" },
          { id: "q2", ans: null },
        ],
        answerIndexes: [2, -1],
        mode: "exam",
      }),
      expect.any(Object),
    );

    expect(results.correctCount).toBe(1);
    expect(useQuizStore.getState().quizSubmitted).toBe(true);
  });
});
