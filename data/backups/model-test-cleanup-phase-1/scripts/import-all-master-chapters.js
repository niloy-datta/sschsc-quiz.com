/**
 * Import all missing chapter-wise high-priority sets from master files into the active database.
 * Run: node scripts/import-all-master-chapters.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const BACKEND_ANSWERS = path.join(ROOT, "backend", "data", "answers");

const LABEL_TO_LETTER = { ক: "A", খ: "B", গ: "C", ঘ: "D" };
const LETTER_INDEX = { A: 0, B: 1, C: 2, D: 3 };

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function convertQuestion(q, setId, subjectSlug) {
  const opts = Array.isArray(q.options) ? q.options : [];
  const optionA = String(opts[0]?.text ?? "").trim();
  const optionB = String(opts[1]?.text ?? "").trim();
  const optionC = String(opts[2]?.text ?? "").trim();
  const optionD = String(opts[3]?.text ?? "").trim();
  
  let correctOption = String(q.correctOption ?? "").trim();
  if (LABEL_TO_LETTER[correctOption]) {
    correctOption = LABEL_TO_LETTER[correctOption];
  } else if (!["A", "B", "C", "D"].includes(correctOption)) {
    if (typeof q.answerIndex === "number" && q.answerIndex >= 0 && q.answerIndex <= 3) {
      correctOption = ["A", "B", "C", "D"][q.answerIndex];
    } else {
      correctOption = "A";
    }
  }

  const questionText = String(q.question ?? q.questionText ?? "").trim();
  const explanation = String(q.shortSolution ?? q.explanation ?? "").trim();
  const id = String(q.id ?? "").trim() || `${setId}-q${String(q.questionNo ?? 0).padStart(2, "0")}`;

  return {
    mega: {
      id,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      explanation,
      chapter: String(q.chapter ?? "").padStart(2, "0"),
      topic: String(q.topic ?? q.chapterName ?? "").trim(),
      difficulty: String(q.difficulty ?? "Board Standard").trim(),
    },
    public: {
      id,
      subject: subjectSlug,
      chapter: setId,
      text: questionText,
      options: [optionA, optionB, optionC, optionD],
      image: null,
      timeLimit: 45,
    },
    answer: {
      answer: [optionA, optionB, optionC, optionD][LETTER_INDEX[correctOption]] ?? optionA,
      correctOption: [optionA, optionB, optionC, optionD][LETTER_INDEX[correctOption]] ?? optionA,
      answerIndex: LETTER_INDEX[correctOption] ?? 0,
      difficulty: 1200,
      explanation,
      topic: String(q.topic ?? q.chapterName ?? "").trim() || "General",
    },
  };
}

function importSubjectSets(level, subjectSlug, chaptersList) {
  console.log(`\n📚 Importing sets for ${level}/${subjectSlug}...`);
  
  const megaPath = path.join(PUBLIC, "quiz-data", level, `${subjectSlug}.json`);
  if (!fs.existsSync(megaPath)) {
    console.error(`   ❌ Mega JSON not found: ${megaPath}`);
    return;
  }
  const mega = JSON.parse(fs.readFileSync(megaPath, "utf8"));
  if (!mega.modelTests) mega.modelTests = {};
  if (!mega.modelTestsMeta) mega.modelTestsMeta = {};

  const modelIndexPath = path.join(PUBLIC, "quiz-data", level, `${subjectSlug}.model-tests.index.json`);
  let modelIndex = null;
  if (fs.existsSync(modelIndexPath)) {
    modelIndex = JSON.parse(fs.readFileSync(modelIndexPath, "utf8"));
    if (!modelIndex.modelTests) modelIndex.modelTests = {};
  }

  const subjectIndexPath = path.join(PUBLIC, "questions", subjectSlug, "index.json");
  let subjectIndex = null;
  if (fs.existsSync(subjectIndexPath)) {
    subjectIndex = JSON.parse(fs.readFileSync(subjectIndexPath, "utf8"));
    if (!subjectIndex.modelTests) subjectIndex.modelTests = [];
  }

  let importedSetsCount = 0;
  let importedQuestionsCount = 0;

  for (const ch of chaptersList) {
    const chapterNo = String(ch.chapterNo ?? ch.chapter ?? ch.chapterSlug ?? "")
      .replace("chapter-", "")
      .padStart(2, "0");
    const chapterName = String(ch.chapterName ?? "").trim();

    for (const set of ch.sets ?? []) {
      const slug = String(set.id ?? "").trim();
      if (!slug || !Array.isArray(set.questions) || !set.questions.length) {
        continue;
      }

      const converted = set.questions.map((q) => convertQuestion(q, slug, subjectSlug));
      const megaQuestions = converted.map((c) => c.mega);
      const publicQuestions = converted.map((c) => c.public);
      const answers = converted.map((c) => c.answer);

      // 1. Write sidecar files
      const pubPath = path.join(PUBLIC, "questions", subjectSlug, `${slug}.json`);
      const priPath = path.join(BACKEND_ANSWERS, subjectSlug, `${slug}.answers.json`);
      ensureDir(path.dirname(pubPath));
      ensureDir(path.dirname(priPath));
      
      fs.writeFileSync(pubPath, `${JSON.stringify(publicQuestions, null, 2)}\n`, "utf8");

      const answerMap = {};
      for (let i = 0; i < megaQuestions.length; i++) {
        answerMap[megaQuestions[i].id] = answers[i];
      }
      fs.writeFileSync(priPath, `${JSON.stringify(answerMap, null, 2)}\n`, "utf8");

      // 2. Update memory structures
      const meta = {
        displayTitle: String(set.title ?? set.displayTitle ?? `Chapter ${chapterNo} Model Test`).trim(),
        tags: ["chapter-wise", "high-priority"],
        chaptersCovered: [{ chapter: chapterNo, chapterName }],
        durationMinutes: 25,
        questionCount: megaQuestions.length,
      };

      mega.modelTests[slug] = megaQuestions;
      mega.modelTestsMeta[slug] = {
        displayTitle: meta.displayTitle,
        name: meta.displayTitle,
        scope: "chapter",
        tags: meta.tags,
        chaptersCovered: meta.chaptersCovered,
        durationMinutes: meta.durationMinutes,
        questionCount: megaQuestions.length,
        importance: "high",
      };

      if (modelIndex) {
        if (!Array.isArray(modelIndex.modelTests)) {
          modelIndex.modelTests[slug] = {
            questionCount: meta.questionCount,
            scope: "chapter",
            displayTitle: meta.displayTitle,
            durationMinutes: meta.durationMinutes,
            importance: "high",
            tags: meta.tags,
            chaptersCovered: meta.chaptersCovered,
          };
        } else {
          const entry = {
            id: slug,
            questionCount: meta.questionCount,
            scope: "chapter",
            displayTitle: meta.displayTitle,
            durationMinutes: meta.durationMinutes,
            importance: "high",
            tags: meta.tags,
            chaptersCovered: meta.chaptersCovered,
          };
          const existing = modelIndex.modelTests.find(m => m.id === slug);
          if (existing) Object.assign(existing, entry);
          else modelIndex.modelTests.push(entry);
        }
      }

      if (subjectIndex) {
        const entry = {
          id: slug,
          title: meta.displayTitle,
          questionCount: meta.questionCount,
          scope: "chapter",
          importance: "high",
          tags: meta.tags,
          chaptersCovered: meta.chaptersCovered,
        };
        const existing = subjectIndex.modelTests.find((m) => m.id === slug);
        if (existing) {
          Object.assign(existing, entry);
        } else {
          subjectIndex.modelTests.push(entry);
        }
      }

      importedSetsCount++;
      importedQuestionsCount += megaQuestions.length;
    }
  }

  // 3. Write files back once
  fs.writeFileSync(megaPath, `${JSON.stringify(mega, null, 2)}\n`, "utf8");
  if (modelIndex) {
    fs.writeFileSync(modelIndexPath, `${JSON.stringify(modelIndex, null, 2)}\n`, "utf8");
  }
  if (subjectIndex) {
    fs.writeFileSync(subjectIndexPath, `${JSON.stringify(subjectIndex, null, 2)}\n`, "utf8");
  }

  console.log(`   ✓ Done: Imported ${importedSetsCount} sets (${importedQuestionsCount} questions)`);
}

function main() {
  console.log("=== STARTING GLOBAL CHAPTERWISE IMPORT ===");

  // 1. Process SSC Master
  const sscMasterPath = path.join(ROOT, "ssc_science_group_master_chapterwise_10_tier_a_sets.json");
  if (fs.existsSync(sscMasterPath)) {
    console.log(`\nParsing SSC Master: ${path.basename(sscMasterPath)}`);
    const master = JSON.parse(fs.readFileSync(sscMasterPath, "utf8"));
    const subjects = master.subjects || {};
    for (const [sname, sdata] of Object.entries(subjects)) {
      if (sdata.chapterWise) {
        importSubjectSets("ssc", sname, sdata.chapterWise);
      }
    }
  } else {
    console.warn("⚠️ SSC Master not found!");
  }

  // 2. Process HSC Master
  const hscMasterPath = path.join(ROOT, "hsc_selected_subjects_chapterwise_10_high_priority_sets_master.json");
  if (fs.existsSync(hscMasterPath)) {
    console.log(`\nParsing HSC Master: ${path.basename(hscMasterPath)}`);
    const master = JSON.parse(fs.readFileSync(hscMasterPath, "utf8"));
    const subjects = master.subjects || {};
    for (const [sname, sdata] of Object.entries(subjects)) {
      if (sdata.chapters) {
        importSubjectSets("hsc", sname, sdata.chapters);
      }
    }
  } else {
    console.warn("⚠️ HSC Master not found!");
  }

  // 3. Process Standalone HSC files
  const standaloneFiles = [
    {
      files: ["hsc_biology_1st_paper_chapterwise_5_high_priority_sets.json", "hsc_biology_1st_paper_chapterwise_more_5_sets_06_10.json"],
      subject: "biology-1st-paper"
    },
    {
      files: ["hsc_biology_2nd_paper_chapterwise_5_high_priority_sets.json"],
      subject: "biology-2nd-paper"
    },
    {
      files: ["hsc_chemistry_1st_paper_chapterwise_5_high_priority_sets.json"],
      subject: "chemistry-1st-paper"
    }
  ];

  for (const group of standaloneFiles) {
    const combinedChapters = [];
    for (const fname of group.files) {
      const fpath = path.join(ROOT, fname);
      if (fs.existsSync(fpath)) {
        console.log(`Reading standalone: ${fname}`);
        const data = JSON.parse(fs.readFileSync(fpath, "utf8"));
        if (data.chapterWise) {
          combinedChapters.push(...data.chapterWise);
        }
      }
    }
    if (combinedChapters.length > 0) {
      importSubjectSets("hsc", group.subject, combinedChapters);
    }
  }

  console.log("\n🎉 Global Chapter-wise import complete!");
}

main();
