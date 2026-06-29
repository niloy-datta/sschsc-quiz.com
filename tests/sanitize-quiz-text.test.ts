import { describe, expect, it } from "vitest";
import {
  sanitizeQuizText,
  sanitizeQuestionText,
  sanitizeOptionText,
  sanitizeExplanationText,
  formatStimulusText,
  detectPlaceholderQuestion,
  normalizeStatementList,
  isPlaceholderQuestionText,
  normalizeLatex,
  normalizeBrokenLatex,
  wrapBareLatex,
} from "@/lib/sanitize-quiz-text";

describe("Quiz Sanitization Pipeline", () => {
  describe("Ohm symbol formatting", () => {
    it("handles 10\\Omega", () => {
      expect(sanitizeQuestionText("10\\Omega")).toContain("10Ω");
    });
    it("handles Omega on its own", () => {
      expect(sanitizeQuestionText("Omega")).toBe("Ω");
    });
    it("handles ১০ Omega in Bengali", () => {
      expect(sanitizeQuestionText("১০ Omega")).toContain("১০Ω");
    });
  });

  describe("Broken LaTeX and commands", () => {
    it("correctly fixes \\rac to \\frac", () => {
      expect(normalizeLatex("\\rac{x}{y}")).toBe("\\frac{x}{y}");
      expect(sanitizeQuestionText("মান \\rac{1}{2} হলে")).toContain("\\frac{1}{2}");
    });

    it("ensures subscripts and superscripts are properly wrapped in math delimiters", () => {
      const out = sanitizeQuestionText("H_{2}(g) + I_{2}(g) \\rightleftharpoons 2HI(g)");
      expect(out).toContain("$");
      expect(out).toContain("H_{2}");
    });

    it("ensures Celsius temperature degrees are fixed and wrapped", () => {
      const out = sanitizeQuestionText("তাপমাত্রা 40°C");
      expect(out).toContain("$40^{\\circ}\\text{C}$");
    });

    it("fixes double closing brace on various text units", () => {
      expect(normalizeBrokenLatex("\\text{cm}}")).toBe("\\text{cm}");
      expect(normalizeBrokenLatex("\\text{ms^{-1}}}")).toBe("\\text{ms^{-1}}");
      // The original fix should still work
      expect(normalizeBrokenLatex("\\text{kg}}")).toBe("\\text{kg}");
    });
  });

  describe("Double Backslash replacement", () => {
    it("replaces A\\\\B with A / B in plain text or simple expressions", () => {
      expect(sanitizeOptionText("A\\\\B")).toBe("A / B");
      expect(sanitizeQuestionText("x \\\\ y")).toBe("x / y");
    });

    it("preserves double backslash in a LaTeX matrix environment", () => {
      const matrix = "\\begin{pmatrix}1 & 2 \\\\ 3 & 4\\end{pmatrix}";
      expect(normalizeLatex(matrix)).toBe(matrix);
    });
  });

  describe("OCR and Corruption cleaning", () => {
    it("removes OCR currency symbols like ¤ and fixes corrupt words", () => {
      expect(sanitizeQuestionText("স¤কর্ক")).toBe("সংক্র");
      expect(sanitizeQuestionText("¤ক্স")).toBe("ং");
      expect(sanitizeQuestionText("একটি ¤ প্রতীক")).toBe("একটি প্রতীক");
      expect(sanitizeQuestionText("উদ্দীপকের ক্ষেত্রেÑ")).toContain("উদ্দীপকের ক্ষেত্রে-");
      expect(sanitizeQuestionText("বেগÑসময়")).toContain("বেগ-সময়");
    });

    it("removes ASCII circuit diagrams and visual separator noise", () => {
      const text = "A +----[ R ]----+ B\n====================\nকিছু টেক্সট";
      expect(sanitizeQuestionText(text)).toBe("কিছু টেক্সট");
    });
  });

  describe("Placeholder detection and handling", () => {
    it("detects various placeholders correctly", () => {
      expect(detectPlaceholderQuestion("[image question]")).toBe(true);
      expect(detectPlaceholderQuestion("[Chattogram image — Q1] - replace with Bengali question text")).toBe(true);
      expect(detectPlaceholderQuestion("চিত্র প্রয়োজন")).toBe(true);
      expect(detectPlaceholderQuestion("image-based question missing")).toBe(true);
      expect(detectPlaceholderQuestion("একটি সাধারণ প্রশ্ন")).toBe(false);
    });

    it("replaces placeholder question with Bengali fallback in the UI", () => {
      expect(sanitizeQuestionText("[diagram required]")).toBe("চিত্র/ডায়াগ্রাম প্রয়োজন");
      expect(sanitizeQuestionText("চিত্র প্রয়োজন")).toBe("চিত্র/ডায়াগ্রাম প্রয়োজন");
    });

    it("keeps backward-compatible alias of isPlaceholderQuestionText", () => {
      expect(isPlaceholderQuestionText("চিত্র প্রয়োজন")).toBe(true);
    });
  });

  describe("Statement list normalization (Biology-style)", () => {
    it("splits inline statement markers onto separate lines", () => {
      const input = "কোনটি সঠিক? i. A ii. B iii. C";
      const out = normalizeStatementList(input);
      expect(out).toContain("\ni. A");
      expect(out).toContain("\nii. B");
      expect(out).toContain("\niii. C");
    });

    it("merges split lines correctly", () => {
      const input = "Cycas উদ্ভিদের ক্ষেত্রে—\ni. আর্কিগোনিয়া\nউপস্থিত\nii. জাইলেমে ভেসেল থাকে\niii. শুক্রাণু বহুফ্ল্যাজেলাযুক্ত";
      const out = normalizeStatementList(input);
      const lines = out.split("\n");
      expect(lines).toContain("i. আর্কিগোনিয়া উপস্থিত");
      expect(lines).toContain("ii. জাইলেমে ভেসেল থাকে");
    });

    it("separates the tail question onto its own line", () => {
      const input = "i. A ii. B iii. C নিচের কোনটি সঠিক?";
      const out = normalizeStatementList(input);
      expect(out.endsWith("\nনিচের কোনটি সঠিক?")).toBe(true);
    });

    it("handles Bangla list statement markers (র., রর., ররর.)", () => {
      const input = "উদ্দীপকটির ক্ষেত্রে— র. A রর. B ররর. C কোনটি সঠিক?";
      const out = normalizeStatementList(input);
      expect(out).toContain("\nর. A");
      expect(out).toContain("\nরর. B");
      expect(out).toContain("\nররর. C");
    });
  });

  describe("Explanation metadata cleaning", () => {
    it("strips board exam names and metadata from explanations", () => {
      const text = "=== Board Exam: 2023 - Dhaka Board ===\nনিউক্লিয়াস কোষে গুরুত্বপূর্ণ।";
      expect(sanitizeExplanationText(text)).toBe("নিউক্লিয়াস কোষে গুরুত্বপূর্ণ।");
    });
  });

  describe("Stimulus cleaning and Scientific notation", () => {
    it("normalizes scientific notation in stimulus text", () => {
      const input = "আলোর বেগ 3 x 10^8 m/s এবং চার্জ 1.6 x 10^{-19} C";
      const out = formatStimulusText(input);
      expect(out).toContain("$3 \\times 10^{8}$");
      expect(out).toContain("$1.6 \\times 10^{-19}$");
    });

    it("normalizes scientific notation in Bangla digits in stimulus text", () => {
      const input = "বেগ ৩ x ১০^৮ m/s";
      const out = formatStimulusText(input);
      expect(out).toContain("$৩ \\times ১০^{৮}$");
    });
  });

  describe("MCQ option text", () => {
    it("preserves numeric-only options (Higher Math)", () => {
      expect(sanitizeOptionText("360")).toBe("360");
      expect(sanitizeOptionText("10")).toBe("10");
      expect(sanitizeOptionText("5")).toBe("5");
      expect(sanitizeOptionText("0")).toBe("0");
      expect(sanitizeOptionText("180")).toBe("180");
    });

    it("strips duplicate option labels without removing the value", () => {
      expect(sanitizeOptionText("ক. 360")).toBe("360");
      expect(sanitizeOptionText("A. A. log")).toBe("log");
    });
  });

  describe("normalizeBrokenLatex", () => {
    it("repairs broken \\t unit into \\text{}", () => {
      expect(normalizeBrokenLatex("$200\\t cm$")).toContain("\\text{ cm }");
    });

    it("preserves valid \\text{} without inserting extra \\t", () => {
      const input = "$12\\text{ ms}^{-1}$";
      expect(normalizeBrokenLatex(input)).toBe(input);
      expect(sanitizeQuestionText("বেগ $12\\text{ ms}^{-1}$")).toContain("\\text{ ms}");
      expect(sanitizeQuestionText("বেগ $12\\text{ ms}^{-1}$")).not.toContain("\\t\\text");
    });
  });

  describe("Ohm decoy options", () => {
    it("fixes duplicated ampere unit in options", () => {
      expect(sanitizeOptionText("35 A A")).toBe("35 A");
      expect(sanitizeOptionText("19 A A")).toBe("19 A");
    });
  });

  describe("Idempotency", () => {
    it("is safe to call repeatedly on the same text", () => {
      const text = "10\\Omega ও H_{2} এবং i. A ii. B নিচের কোনটি সঠিক?";
      const pass1 = sanitizeQuestionText(text);
      const pass2 = sanitizeQuestionText(pass1);
      expect(pass2).toBe(pass1);
    });
  });

  describe("Leaked solution stripping", () => {
    it("should not strip valid question statements that follow the prompt", () => {
      const question = "উদ্দীপকের আলোকে নিচের কোনটি সঠিক?\ni. Statement 1\nii. Statement 2";
      const sanitized = sanitizeQuestionText(question);
      expect(sanitized).toContain("Statement 1");
      expect(sanitized).toContain("Statement 2");
      expect(sanitized).toContain("নিচের কোনটি সঠিক?");
    });

    it("should strip a leaked solution starting with 'therefore' (তাই)", () => {
      const question = "নিচের কোনটি সঠিক? তাই উত্তরটি হলো...";
      const sanitized = sanitizeQuestionText(question);
      expect(sanitized).toBe("নিচের কোনটি সঠিক?");
    });
  });
});
