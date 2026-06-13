import { SscModelQuestion } from "../../../ssc/science/physics/model-tests/set-1";

export const questions: SscModelQuestion[] = [
  {
    question: "A = [a b; c d] ম্যাট্রিক্সের বিপরীত (Inverse) ম্যাট্রিক্স কোনটি?",
    options: ["1/(ad-bc) [a b; c d]", "1/(ad-bc) [d -b; -c a]", "1/(ad-bc) [d b; c a]", "1/(ab-cd) [d -b; -c a]"],
    answerIndex: 1,
    chapter: "ম্যাট্রিক্স ও নির্ণায়ক",
    type: "mcq",
    score: 1
  },
  {
    question: "(2, 3) বিন্দু হতে 4x - 3y + 2 = 0 রেখার লম্ব দূরত্ব কত?",
    options: ["1/5", "1", "3/5", "5"],
    answerIndex: 0,
    chapter: "সরলরেখা",
    type: "mcq",
    score: 1
  },
  {
    question: "x² + y² + 2gx + 2fy + c = 0 বৃত্তটি x-অক্ষকে স্পর্শ করার শর্ত কী?",
    options: ["f² = c", "g² = c", "g = f", "c = 0"],
    answerIndex: 1,
    chapter: "বৃত্ত",
    type: "mcq",
    score: 1
  },
  {
    question: "nPr = 60 এবং nCr = 10 হলে r এর মান কত?",
    options: ["2", "3", "4", "6"],
    answerIndex: 1,
    chapter: "বিন্যাস ও সমাবেশ",
    type: "mcq",
    score: 1
  },
  {
    question: "cos 2A এর সূত্র নিচের কোনটি?",
    options: ["cos²A + sin²A", "cos²A - sin²A", "1 + 2sin²A", "2sinAcosA"],
    answerIndex: 1,
    chapter: "ত্রিকোণমিতি",
    type: "mcq",
    score: 1
  },
  {
    question: "f(x) = sin(x²) হলে f'(x) = ?",
    options: ["cos(x²)", "2x cos(x²)", "-2x cos(x²)", "2x sin(x²)"],
    answerIndex: 1,
    chapter: "অন্তরীকরণ",
    type: "mcq",
    score: 1
  },
  {
    question: "∫ sec²x dx = ?",
    options: ["tan x + C", "-tan x + C", "cot x + C", "sec x tan x + C"],
    answerIndex: 0,
    chapter: "যৌগজীকরণ",
    type: "mcq",
    score: 1
  },
  {
    question: "মূলবিন্দুগামী সরলরেখার সমীকরণ কোনটি?",
    options: ["y = mx + c", "x/a + y/b = 1", "y = mx", "x = c"],
    answerIndex: 2,
    chapter: "সরলরেখা",
    type: "mcq",
    score: 1
  },
  {
    question: "A = [2 0; 0 3] হলে A² = ?",
    options: ["[4 0; 0 9]", "[4 0; 0 6]", "[2 0; 0 9]", "[4 0; 0 3]"],
    answerIndex: 0,
    chapter: "ম্যাট্রিক্স ও নির্ণায়ক",
    type: "mcq",
    score: 1
  },
  {
    question: "x = a cos θ এবং y = a sin θ পরামিতিক সমীকরণটি কোন কনিক নির্দেশ করে?",
    options: ["পরাবৃত্ত", "উপবৃত্ত", "অধিবৃত্ত", "বৃত্ত"],
    answerIndex: 3,
    chapter: "বৃত্ত",
    type: "mcq",
    score: 1
  }
];

export default questions;