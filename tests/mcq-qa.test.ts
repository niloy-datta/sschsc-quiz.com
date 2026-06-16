import { describe, expect, it } from "vitest";
import {
  findDuplicateQuestionIds,
  questionNeedsDiagram,
  toMcqQaRecord,
  validateMcqStructure,
} from "@/lib/validations/mcq-qa";

describe("mcq-qa validation", () => {
  const base = {
    id: "q1",
    question: "নিউটনের দ্বিতীয় সূত্র অনুযায়ী বল কিসের সমানুপাতিক?",
    optionA: "ত্বরণ",
    optionB: "ভর",
    optionC: "ত্বরণ × ভর",
    optionD: "ভর × বেগ",
    correctOption: "গ",
    shortSolution: "F = ma",
  };

  it("passes valid structural MCQ", () => {
    const issues = validateMcqStructure(base);
    expect(issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  it("flags missing correct as warn", () => {
    const { correctOption: _, ...noAnswer } = base;
    const issues = validateMcqStructure(noAnswer);
    expect(issues.some((i) => i.code === "missing_correct_option" && i.severity === "warn")).toBe(
      true,
    );
  });

  it("accepts answerIndex and option text match", () => {
    expect(
      validateMcqStructure({ ...base, correctOption: undefined, answerIndex: 2 }).some(
        (i) => i.code === "missing_correct_option",
      ),
    ).toBe(false);
    expect(
      validateMcqStructure({
        ...base,
        correctOption: undefined,
        correctOptionText: "ত্বরণ × ভর",
      }).some((i) => i.code === "missing_correct_option"),
    ).toBe(false);
  });

  it("flags empty option and invalid correct", () => {
    const issues = validateMcqStructure({
      ...base,
      optionC: "",
      correctOption: "ঙ",
    });
    expect(issues.some((i) => i.code === "empty_option")).toBe(true);
    expect(issues.some((i) => i.code === "invalid_correct_option")).toBe(true);
  });

  it("flags duplicate options", () => {
    const issues = validateMcqStructure({
      ...base,
      optionA: "১০",
      optionB: "১০",
    });
    expect(issues.some((i) => i.code === "duplicate_options")).toBe(true);
  });

  it("detects diagram need and missing image", () => {
    expect(questionNeedsDiagram("চিত্রে O কেন্দ্র হলে কোনটি সঠিক?")).toBe(true);
    const issues = validateMcqStructure({
      ...base,
      question: "চিত্রে O কেন্দ্র হলে কোনটি সঠিক?",
    });
    expect(issues.some((i) => i.code === "needs_diagram")).toBe(true);
  });

  it("converts to strict QA record shape", () => {
    const record = toMcqQaRecord(base);
    expect(record.options).toHaveLength(4);
    expect(record.options[2].label).toBe("গ");
    expect(record.correctOption).toBe("গ");
  });

  it("finds duplicate stems in set", () => {
    const dupes = findDuplicateQuestionIds([
      { id: "a", question: "Same text?" },
      { id: "b", question: "Same text?" },
    ]);
    expect(dupes).toContain("b");
  });
});
