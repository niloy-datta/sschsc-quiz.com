import { SscModelQuestion } from "../../../ssc/science/physics/model-tests/set-1";

export const questions: SscModelQuestion[] = [
  {
    question: "A ম্যাট্রিক্সের মাত্রা 3×4 এবং B ম্যাট্রিক্সের মাত্রা 4×5 হলে, AB ম্যাট্রিক্সের মাত্রা কত?",
    options: ["4×4", "3×5", "5×3", "4×3"],
    answerIndex: 1,
    chapter: "ম্যাট্রিক্স ও নির্ণায়ক",
    type: "mcq",
    score: 1
  },
  {
    question: "A = [1 2; 3 4] হলে |A| বা নির্ণায়কের মান কত?",
    options: ["-2", "2", "10", "-10"],
    answerIndex: 0,
    chapter: "ম্যাট্রিক্স ও নির্ণায়ক",
    type: "mcq",
    score: 1
  },
  {
    question: "i·(j×k) এর মান নিচের কোনটি?",
    options: ["0", "1", "-1", "i"],
    answerIndex: 1,
    chapter: "ভেক্টর",
    type: "mcq",
    score: 1
  },
  {
    question: "3x - 4y + 10 = 0 সরলরেখার ঢাল (slope) কত?",
    options: ["3/4", "-3/4", "4/3", "-4/3"],
    answerIndex: 0,
    chapter: "সরলরেখা",
    type: "mcq",
    score: 1
  },
  {
    question: "x² + y² - 4x + 6y - 12 = 0 বৃত্তের কেন্দ্র কোনটি?",
    options: ["(4, -6)", "(-2, 3)", "(2, -3)", "(-4, 6)"],
    answerIndex: 2,
    chapter: "বৃত্ত",
    type: "mcq",
    score: 1
  },
  {
    question: "'MATHEMATICS' শব্দটির বর্ণগুলো ব্যবহার করে কত প্রকারে সাজানো যায়?",
    options: ["11!", "11! / (2! 2! 2!)", "11! / 2!", "11! / 6!"],
    answerIndex: 1,
    chapter: "বিন্যাস ও সমাবেশ",
    type: "mcq",
    score: 1
  },
  {
    question: "sin(π/2 - θ) এর মান কোনটি?",
    options: ["sinθ", "cosθ", "-sinθ", "-cosθ"],
    answerIndex: 1,
    chapter: "ত্রিকোণমিতি",
    type: "mcq",
    score: 1
  },
  {
    question: "lim(x→0) (sin 3x / x) এর মান কত?",
    options: ["0", "1", "3", "1/3"],
    answerIndex: 2,
    chapter: "অন্তরীকরণ",
    type: "mcq",
    score: 1
  },
  {
    question: "d/dx(ln(sin x)) = ?",
    options: ["tan x", "cot x", "-cot x", "sec x"],
    answerIndex: 1,
    chapter: "অন্তরীকরণ",
    type: "mcq",
    score: 1
  },
  {
    question: "∫(0 থেকে π/2) cos x dx = ?",
    options: ["0", "1", "-1", "π/2"],
    answerIndex: 1,
    chapter: "যৌগজীকরণ",
    type: "mcq",
    score: 1
  }
];

export default questions;