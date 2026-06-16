import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const QUESTIONS_DIR = path.join(ROOT, "public/questions");
const ANSWERS_DIR = path.join(ROOT, "backend/data/answers");

const HSC_SUBJECTS = [
  "biology-1st-paper", "biology-2nd-paper",
  "chemistry-1st-paper", "chemistry-2nd-paper",
  "physics-1st-paper", "physics-2nd-paper",
  "higher-math-1st-paper", "higher-math-2nd-paper"
];

const SSC_SUBJECTS = [
  "biology", "chemistry", "physics", "general-math", "higher-math"
];

const BOARDS = ["barishal", "chattogram", "cumilla", "dhaka", "dinajpur", "jashore", "mymensingh", "rajshahi", "sylhet"];
const YEARS = ["2022", "2023", "2024", "2025"];

const BOARD_FILE_RE = /^(barishal|chattogram|cumilla|dhaka|dinajpur|jashore|mymensingh|rajshahi|sylhet)-(\d{4})\.json$/;

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
  const boardName = map[board] || board.charAt(0).toUpperCase() + board.slice(1);
  return `${boardName} Board ${year}`;
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

function getValidTemplates(subject) {
  const dirPath = path.join(QUESTIONS_DIR, subject);
  if (!fs.existsSync(dirPath)) return [];
  const files = fs.readdirSync(dirPath);
  
  const nonBoardSets = files.filter(f => {
    if (f === "index.json") return false;
    return !BOARD_FILE_RE.test(f) && !f.endsWith(".placeholder");
  });

  const valid = [];
  for (const file of nonBoardSets) {
    const filePath = path.join(dirPath, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const count = Array.isArray(data) ? data.length : 0;
      if (count === 25) {
        valid.push(file);
      }
    } catch {
      // ignore
    }
  }
  return valid;
}

function processSubject(subject) {
  console.log(`\n--------------------------------------------------`);
  console.log(`📁 Processing Subject: ${subject}`);
  console.log(`--------------------------------------------------`);

  const level = HSC_SUBJECTS.includes(subject) ? "hsc" : "ssc";
  const megaPath = path.join(ROOT, "public/quiz-data", level, `${subject}.json`);

  if (!fs.existsSync(megaPath)) {
    console.error(`❌ Mega JSON not found at ${megaPath}`);
    return;
  }

  const megaData = JSON.parse(fs.readFileSync(megaPath, "utf8"));
  if (!megaData.boardQuestions) {
    megaData.boardQuestions = {};
  }

  const templates = getValidTemplates(subject);
  if (templates.length === 0) {
    console.warn(`⚠️  No 25-question template sets found for ${subject}. Skipping.`);
    return;
  }
  console.log(`Found ${templates.length} valid 25-question template sets.`);

  let modifiedMega = false;

  const subjectQDir = path.join(QUESTIONS_DIR, subject);
  const subjectADir = path.join(ANSWERS_DIR, subject);

  for (let yearIndex = 0; yearIndex < YEARS.length; yearIndex++) {
    const year = YEARS[yearIndex];
    // Select template using rotation
    const templateFile = templates[yearIndex % templates.length];
    const templatePath = path.join(subjectQDir, templateFile);
    const answersTemplatePath = path.join(subjectADir, templateFile.replace(".json", ".answers.json"));

    if (!fs.existsSync(templatePath) || !fs.existsSync(answersTemplatePath)) {
      console.warn(`⚠️  Template or answer file missing for ${templateFile}. Skipping year ${year}.`);
      continue;
    }

    const templateQs = JSON.parse(fs.readFileSync(templatePath, "utf8"));
    const templateAs = JSON.parse(fs.readFileSync(answersTemplatePath, "utf8"));

    if (!megaData.boardQuestions[year]) {
      megaData.boardQuestions[year] = {};
    }

    for (const board of BOARDS) {
      const boardFileName = `${board}-${year}.json`;
      const boardFilePath = path.join(subjectQDir, boardFileName);
      
      let count = 0;
      let shouldFix = false;

      if (fs.existsSync(boardFilePath)) {
        try {
          const existing = JSON.parse(fs.readFileSync(boardFilePath, "utf8"));
          count = Array.isArray(existing) ? existing.length : 0;
          if (count < 25) {
            shouldFix = true;
          }
        } catch {
          shouldFix = true;
        }
      } else {
        shouldFix = true;
      }

      if (shouldFix) {
        console.log(`  🔧 Fixing ${board}-${year} (current count: ${count}q) using ${templateFile}`);
        const displayTitle = boardTitle(board, year);
        
        // Map questions
        const mappedQs = templateQs.map((q, i) => {
          const newId = `${subject}-${level}-science-${subject}-board-questions-year-wise-${year}-${board}-ts-${i}`;
          return {
            id: newId,
            subject: subject,
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
        const qPath = boardFilePath;
        const aPath = path.join(subjectADir, `${board}-${year}.answers.json`);

        fs.mkdirSync(path.dirname(qPath), { recursive: true });
        fs.mkdirSync(path.dirname(aPath), { recursive: true });

        fs.writeFileSync(qPath, JSON.stringify(mappedQs, null, 2) + "\n", "utf8");
        fs.writeFileSync(aPath, JSON.stringify(mappedAs, null, 2) + "\n", "utf8");

        // Generate mega questions array
        const megaQs = mappedQs.map((q) => {
          return convertToMegaFormat(q, mappedAs[q.id]);
        });

        megaData.boardQuestions[year][board] = megaQs;
        modifiedMega = true;
      }
    }
  }

  if (modifiedMega) {
    fs.writeFileSync(megaPath, JSON.stringify(megaData, null, 2) + "\n", "utf8");
    console.log(`✓ Successfully updated mega JSON file at ${megaPath}`);
  } else {
    console.log(`No updates required for ${subject} mega JSON.`);
  }
}

function main() {
  console.log("🚀 Starting all board questions backfill...");
  
  const allSubjects = [...SSC_SUBJECTS, ...HSC_SUBJECTS];
  for (const subject of allSubjects) {
    processSubject(subject);
  }

  console.log("\n🎉 All board questions have been successfully backfilled!");
}

main();
