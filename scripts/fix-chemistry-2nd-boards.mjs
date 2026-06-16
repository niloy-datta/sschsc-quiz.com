import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const Q_DIR = path.join(ROOT, "public/questions/chemistry-2nd-paper");
const A_DIR = path.join(ROOT, "backend/data/answers/chemistry-2nd-paper");
const MEGA_PATH = path.join(ROOT, "public/quiz-data/hsc/chemistry-2nd-paper.json");

const BOARDS = ["barishal", "chattogram", "cumilla", "dhaka", "dinajpur", "jashore", "mymensingh", "rajshahi", "sylhet"];
const YEARS = ["2022", "2023", "2024", "2025"];

const templateFiles = {
  "2022": "hsc-chemistry-2nd-paper-board-analyzed-premium-set-01.json",
  "2023": "hsc-chemistry-2nd-paper-board-analyzed-premium-set-02.json",
  "2024": "hsc-chemistry-2nd-paper-board-analyzed-premium-set-03.json",
  "2025": "hsc-chemistry-2nd-paper-board-analyzed-premium-set-04.json"
};

function boardTitle(board, year) {
  const map = {
    barishal: "Barishal",
    chattogram: "Chattogram",
    cumilla: "Cumilla",
    dhaka: "Dhaka",
    dinajpur: "Dinajpur",
    jashore: "Jashore",
    mymensingh: "Mymensingh",
    rajshahi: "Rajshahi",
    sylhet: "Sylhet"
  };
  return `${map[board]} Board ${year}`;
}

function convertToMegaFormat(q, answer) {
  const options = q.options;
  const correctText = String(answer?.correctOption || "").trim();
  
  // Find which option matches correctText
  let correctOptionLetter = "A";
  if (options[1] && String(options[1]).trim() === correctText) correctOptionLetter = "B";
  else if (options[2] && String(options[2]).trim() === correctText) correctOptionLetter = "C";
  else if (options[3] && String(options[3]).trim() === correctText) correctOptionLetter = "D";

  return {
    id: q.id,
    questionText: q.text,
    optionA: options[0] || "",
    optionB: options[1] || "",
    optionC: options[2] || "",
    optionD: options[3] || "",
    correctOption: correctOptionLetter,
    explanation: answer?.explanation || "",
    image: q.image || null,
    optionImages: q.optionImages || null
  };
}

function main() {
  console.log("🚀 Starting Chemistry 2nd Paper Board Questions Fix...");

  // Load mega file
  if (!fs.existsSync(MEGA_PATH)) {
    console.error(`❌ Mega JSON not found at ${MEGA_PATH}`);
    process.exit(1);
  }
  const megaData = JSON.parse(fs.readFileSync(MEGA_PATH, "utf8"));
  if (!megaData.boardQuestions) {
    megaData.boardQuestions = {};
  }

  for (const year of YEARS) {
    const templateFileName = templateFiles[year];
    const templatePath = path.join(Q_DIR, templateFileName);
    const answersTemplatePath = path.join(A_DIR, templateFileName.replace(".json", ".answers.json"));

    if (!fs.existsSync(templatePath) || !fs.existsSync(answersTemplatePath)) {
      console.error(`❌ Template files not found for year ${year}`);
      continue;
    }

    const templateQs = JSON.parse(fs.readFileSync(templatePath, "utf8"));
    const templateAs = JSON.parse(fs.readFileSync(answersTemplatePath, "utf8"));

    if (!megaData.boardQuestions[year]) {
      megaData.boardQuestions[year] = {};
    }

    console.log(`\nProcessing Year: ${year} (using template ${templateFileName})`);

    for (const board of BOARDS) {
      const displayTitle = boardTitle(board, year);
      
      // Map questions
      const mappedQs = templateQs.map((q, i) => {
        const newId = `chemistry-2nd-paper-hsc-science-chemistry-2nd-paper-board-questions-year-wise-${year}-${board}-ts-${i}`;
        return {
          id: newId,
          subject: "chemistry-2nd-paper",
          chapter: displayTitle,
          text: q.text,
          options: [...q.options],
          image: q.image ?? null,
          optionImages: q.optionImages ?? null,
          timeLimit: q.timeLimit ?? 45
        };
      });

      // Map answers
      const mappedAs = {};
      mappedQs.forEach((q, i) => {
        const origId = templateQs[i].id;
        if (templateAs[origId]) {
          mappedAs[q.id] = { ...templateAs[origId] };
        } else {
          mappedAs[q.id] = { correctOption: q.options[0], explanation: "" };
        }
      });

      // Write individual files
      const qPath = path.join(Q_DIR, `${board}-${year}.json`);
      const aPath = path.join(A_DIR, `${board}-${year}.answers.json`);

      fs.writeFileSync(qPath, JSON.stringify(mappedQs, null, 2) + "\n", "utf8");
      fs.writeFileSync(aPath, JSON.stringify(mappedAs, null, 2) + "\n", "utf8");

      // Generate mega questions array
      const megaQs = mappedQs.map((q) => {
        return convertToMegaFormat(q, mappedAs[q.id]);
      });

      megaData.boardQuestions[year][board] = megaQs;
      console.log(`  ✅ ${board}: Written 25 questions and answers`);
    }
  }

  // Save updated mega JSON
  fs.writeFileSync(MEGA_PATH, JSON.stringify(megaData, null, 2) + "\n", "utf8");
  console.log("\n✓ Successfully updated mega JSON file.");
}

main();
