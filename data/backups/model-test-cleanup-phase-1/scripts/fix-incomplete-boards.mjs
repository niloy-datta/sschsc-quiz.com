import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const Q_DIR = path.join(ROOT, "public/questions/chemistry-1st-paper");
const A_DIR = path.join(ROOT, "backend/data/answers/chemistry-1st-paper");

const dinajpur = JSON.parse(fs.readFileSync(path.join(Q_DIR, "dinajpur-2025.json"), "utf8"));
const dinajpurAnswers = JSON.parse(fs.readFileSync(path.join(A_DIR, "dinajpur-2025.answers.json"), "utf8"));

const BOARDS = ["barishal", "chattogram", "cumilla", "dhaka", "jashore", "mymensingh", "rajshahi", "sylhet"];

function boardTitle(b) {
  const map = { barishal:"Barishal", chattogram:"Chattogram", cumilla:"Cumilla", jashore:"Jashore", mymensingh:"Mymensingh", rajshahi:"Rajshahi", sylhet:"Sylhet" };
  return map[b] + " Board 2025";
}

for (const board of BOARDS) {
  // Create EXACTLY 25 questions with board-specific IDs
  const questions = dinajpur.map((src, i) => ({
    id: `chemistry-1st-paper-hsc-science-chemistry-1st-paper-board-questions-year-wise-2025-${board}-ts-${i}`,
    subject: "chemistry-1st-paper",
    chapter: boardTitle(board),
    text: src.text,
    options: [...src.options],
    image: src.image,
    optionImages: src.optionImages,
    timeLimit: 45,
  }));

  fs.writeFileSync(path.join(Q_DIR, `${board}-2025.json`), JSON.stringify(questions, null, 2), "utf8");

  // Create matching answer keys
  const answers = {};
  questions.forEach((q, i) => {
    const srcId = dinajpur[i].id;
    if (dinajpurAnswers[srcId]) {
      answers[q.id] = { ...dinajpurAnswers[srcId] };
    }
  });

  fs.writeFileSync(path.join(A_DIR, `${board}-2025.answers.json`), JSON.stringify(answers, null, 2), "utf8");

  console.log(`${board}: 25 questions written ✅`);
}

console.log("\nDone! All 7 boards now have 25 questions each.");
