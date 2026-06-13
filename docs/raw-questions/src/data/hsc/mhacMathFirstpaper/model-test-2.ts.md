import { SscModelQuestion } from "../../../ssc/science/physics/model-tests/set-1";

export const questions: SscModelQuestion[] = [
  {
    question: "কোনো ম্যাট্রিক্সের নির্ণায়কের মান শূন্য হলে তাকে কী বলে?",
    options: ["অভেদক ম্যাট্রিক্স", "ব্যতিক্রমী (Singular) ম্যাট্রিক্স", "অব্যতিক্রমী ম্যাট্রিক্স", "প্রতিসম ম্যাট্রিক্স"],
    answerIndex: 1,
    chapter: "ম্যাট্রিক্স ও নির্ণায়ক",
    type: "mcq",
    score: 1
  },
  {
    question: "a = 2i + j - k এবং b = i - 2j - k হলে, a ও b এর মধ্যবর্তী কোণ কত?",
    options: ["0°", "30°", "60°", "90°"],
    answerIndex: 3,
    chapter: "ভেক্টর",
    type: "mcq",
    score: 1
  },
  {
    question: "x/a + y/b = 1 রেখাটি অক্ষদ্বয়ের সাথে যে ত্রিভুজ গঠন করে তার ক্ষেত্রফল কত?",
    options: ["ab", "1/2 ab", "2ab", "a+b"],
    answerIndex: 1,
    chapter: "সরলরেখা",
    type: "mcq",
    score: 1
  },
  {
    question: "(x - 2)² + (y + 3)² = 16 বৃত্তের ব্যাসার্ধ কত?",
    options: ["16", "4", "2", "-3"],
    answerIndex: 1,
    chapter: "বৃত্ত",
    type: "mcq",
    score: 1
  },
  {
    question: "10C8 এর মান নিচের কোনটির সমান?",
    options: ["10C2", "8C2", "10P8", "10C3"],
    answerIndex: 0,
    chapter: "বিন্যাস ও সমাবেশ",
    type: "mcq",
    score: 1
  },
  {
    question: "sin 15° এর মান কত?",
    options: ["(√3+1)/2√2", "(√3-1)/2√2", "1/2", "1/√2"],
    answerIndex: 1,
    chapter: "ত্রিকোণমিতি",
    type: "mcq",
    score: 1
  },
  {
    question: "f(x) = e^x হলে, f''(x) এর মান কত?",
    options: ["e^x", "xe^(x-1)", "0", "1"],
    answerIndex: 0,
    chapter: "অন্তরীকরণ",
    type: "mcq",
    score: 1
  },
  {
    question: "d/dx (x^x) = ?",
    options: ["x^x", "x^x(1 - ln x)", "x^x(1 + ln x)", "x^(x-1)"],
    answerIndex: 2,
    chapter: "অন্তরীকরণ",
    type: "mcq",
    score: 1
  },
  {
    question: "∫ e^x (sin x + cos x) dx = ?",
    options: ["e^x cos x + C", "e^x sin x + C", "-e^x sin x + C", "e^x tan x + C"],
    answerIndex: 1,
    chapter: "যৌগজীকরণ",
    type: "mcq",
    score: 1
  },
  {
    question: "দুটি ভেক্টর পরস্পর সমান্তরাল হওয়ার শর্ত কী?",
    options: ["A·B = 0", "A×B = 0", "A·B = 1", "|A×B| = 1"],
    answerIndex: 1,
    chapter: "ভেক্টর",
    type: "mcq",
    score: 1
  }
];

export default questions;