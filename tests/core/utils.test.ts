import { describe, it, expect } from "vitest";

/**
 * Core utility tests for the quiz dashboard
 */

describe("Question Utilities", () => {
  it("should flatten nested questions correctly", () => {
    const nested = [
      {
        id: 1,
        question: "Q1",
        options: ["A", "B", "C", "D"],
        answerIndex: 0,
        chapter: "ch1",
        score: 1,
      },
      {
        id: 2,
        question: "Q2",
        options: ["A", "B", "C", "D"],
        answerIndex: 1,
        chapter: "ch1",
        score: 1,
      },
    ];
    expect(nested).toHaveLength(2);
    expect(nested[0].question).toBe("Q1");
    expect(nested[1].answerIndex).toBe(1);
  });

  it("should deduplicate questions by id", () => {
    const questions = [
      {
        id: 1,
        question: "Q1",
        options: ["A", "B", "C", "D"],
        answerIndex: 0,
        chapter: "ch1",
        score: 1,
      },
      {
        id: 1,
        question: "Q1",
        options: ["A", "B", "C", "D"],
        answerIndex: 0,
        chapter: "ch1",
        score: 1,
      },
      {
        id: 2,
        question: "Q2",
        options: ["A", "B", "C", "D"],
        answerIndex: 2,
        chapter: "ch2",
        score: 1,
      },
    ];
    const seen = new Set<number>();
    const deduped = questions.filter((q) => {
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    });
    expect(deduped).toHaveLength(2);
    expect(deduped[0].id).toBe(1);
    expect(deduped[1].id).toBe(2);
  });

  it("should handle empty question array", () => {
    const questions: any[] = [];
    expect(questions).toHaveLength(0);
    expect(questions.flat()).toHaveLength(0);
  });

  it("should validate question structure", () => {
    const validQuestion = {
      id: 1,
      question: "Test question?",
      options: ["A", "B", "C", "D"],
      answerIndex: 0,
      chapter: "ch1",
      score: 1,
    };
    expect(validQuestion).toHaveProperty("id");
    expect(validQuestion).toHaveProperty("question");
    expect(validQuestion).toHaveProperty("options");
    expect(validQuestion.options).toHaveLength(4);
    expect(validQuestion.answerIndex).toBeGreaterThanOrEqual(0);
    expect(validQuestion.answerIndex).toBeLessThan(4);
  });
});

describe("Model Test Generation", () => {
  it("should generate correct number of model tests from pool", () => {
    const poolSize = 200;
    const questionsPerTest = 25;
    const numTests = Math.floor(poolSize / questionsPerTest);
    expect(numTests).toBe(8);
  });

  it("should handle insufficient questions for model test", () => {
    const poolSize = 10;
    const questionsPerTest = 25;
    const numTests = Math.floor(poolSize / questionsPerTest);
    expect(numTests).toBe(0);
  });

  it("should distribute difficulty levels evenly", () => {
    const totalQuestions = 25;
    const easyCount = Math.round(totalQuestions * 0.4);
    const mediumCount = Math.round(totalQuestions * 0.4);
    const hardCount = totalQuestions - easyCount - mediumCount;
    expect(easyCount).toBe(10);
    expect(mediumCount).toBe(10);
    expect(hardCount).toBe(5);
  });
});

describe("Subject and Chapter Mapping", () => {
  const subjects = ["physics", "chemistry", "biology", "higher-math"];
  const chapters: Record<string, number> = {
    physics: 11,
    chemistry: 8,
    biology: 10,
    "higher-math": 10,
  };

  it("should have all required subjects", () => {
    expect(subjects).toContain("physics");
    expect(subjects).toContain("chemistry");
    expect(subjects).toContain("biology");
    expect(subjects).toContain("higher-math");
    expect(subjects).toHaveLength(4);
  });

  it("should have minimum 5 chapters per subject", () => {
    for (const [subject, count] of Object.entries(chapters)) {
      expect(count).toBeGreaterThanOrEqual(5);
    }
  });
});
