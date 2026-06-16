/**
 * Import Hyper Mega Hot model test sets (exam + sets[]) into
 * public/quiz-data/hsc/physics-2nd-paper.json and public/questions/.
 *
 * Usage:
 *   node scripts/import-hyper-mega-model-tests.js data/imports/hsc-physics-2nd-hyper-mega-hot.json
 *   node scripts/import-hyper-mega-model-tests.js data/imports/hsc-physics-2nd-hyper-mega-hot.json physics-2nd-paper
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const BACKEND_ANSWERS = path.join(ROOT, "backend", "data", "answers");

const OPTION_KEYS = ["ক", "খ", "গ", "ঘ"];
const BN_ANSWER = { ক: "A", খ: "B", গ: "C", ঘ: "D" };
const LETTER_INDEX = { A: 0, B: 1, C: 2, D: 3 };

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function slugForSet(subjectSlug, setId) {
  return `hsc-${subjectSlug}-tier-a-hot-model-test-${pad2(setId)}`;
}

function questionIdFor(subjectSlug, setId, questionNumber) {
  return `hsc-${subjectSlug}-tier-a-set-${pad2(setId)}-q${pad2(questionNumber)}`;
}

const BN_STIMULUS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

function stimulusLabel(n) {
  const num = Number(n);
  if (!num || num < 1) return "";
  const digit = num <= 9 ? BN_STIMULUS[num] : String(num);
  return `উদ্দীপক ${digit}`;
}

function typePrefix(type, stimulusNo) {
  if (stimulusNo) return `[${stimulusLabel(stimulusNo)}] `;
  const t = String(type ?? "").trim();
  if (t === "stimulus_based") return "";
  if (t === "i_ii_iii_analytical" || t === "analytical_i_ii_iii") return "[i,ii,iii] ";
  if (t === "final_trap" || t === "final_trap_questions") return "[Final Trap] ";
  if (t === "normal_board_standard_mcq") return "";
  if (t === "standard_mcq") return "";
  if (t && t !== "standard_mcq") return `[${t}] `;
  return "";
}

function parseStringOption(opt) {
  const raw = String(opt ?? "").trim();
  const m = raw.match(/^([কখগঘ])\)\s*(.*)$/u);
  if (m) return { key: m[1], text: m[2].trim() };
  return null;
}

function normalizeOptions(options) {
  if (Array.isArray(options)) {
    const out = {};
    for (const opt of options) {
      if (typeof opt === "string") {
        const parsed = parseStringOption(opt);
        if (parsed?.key) {
          out[parsed.key] = parsed.text;
          continue;
        }
      }
      if (!opt || opt.key == null) continue;
      out[String(opt.key).trim()] = String(opt.text ?? "").trim();
    }
    return out;
  }
  if (options && typeof options === "object") return options;
  return {};
}

function normalizeAnswer(raw) {
  const s = String(raw ?? "").trim();
  const m = s.match(/^([কখগঘ])/u);
  return m ? m[1] : s;
}

function isPassageReference(text) {
  const t = String(text ?? "").trim();
  return (
    /^উপরের\s/i.test(t) ||
    /^উদ্দীপকের\s/i.test(t) ||
    /^উপরের\s+উদ্দীপক/i.test(t) ||
    /^উপরের\s+টাইট্রেশন/i.test(t) ||
    /^উপরের\s+পানি/i.test(t)
  );
}

function buildQuestionText(q) {
  const prefix = typePrefix(q.type, q.stimulusNo);
  const question = String(q.question ?? "").trim();
  const passage = String(q.passage ?? "").trim();

  if (passage && !isPassageReference(passage)) {
    const label = q.stimulusNo ? stimulusLabel(q.stimulusNo) : "";
    const passageBody = /^উদ্দীপক/i.test(passage) ? passage : `উদ্দীপক: ${passage}`;
    const header = label ? `[${label}]\n${passageBody}` : passageBody;
    return `${header}\n\n${question}`;
  }

  return `${prefix}${question}`;
}

function assignPassageNumbers(questions) {
  const passageMap = new Map();
  let n = 0;
  let lastStimulusNo = null;
  return questions.map((q) => {
    const passage = q.passage ?? q.stimulus ?? null;
    if (!passage || String(passage).trim() === "" || passage === "null") {
      return { ...q, stimulusNo: q.stimulusNo ?? null };
    }
    const key = String(passage).trim();
    if (isPassageReference(key)) {
      return { ...q, stimulusNo: lastStimulusNo };
    }
    if (!passageMap.has(key)) {
      n += 1;
      passageMap.set(key, n);
    }
    lastStimulusNo = passageMap.get(key);
    return { ...q, stimulusNo: lastStimulusNo };
  });
}

function buildStimulusMap(set) {
  const map = {};
  for (const st of set.stimuli ?? []) {
    const no = Number(st.stimulus_no ?? st.stimulusNo);
    const text = String(st.text ?? st.stimulus ?? st.passage ?? "").trim();
    if (no > 0 && text) map[no] = text;
  }
  return map;
}

function inferQuestionType(q) {
  const explicit = q.type ?? q.section ?? null;
  if (explicit) return explicit;
  const text = String(q.question ?? q.questionText ?? "");
  if (/\bi\.\s/u.test(text) && /\bii\.\s/u.test(text) && /\biii\.\s/u.test(text)) {
    return "analytical_i_ii_iii";
  }
  return null;
}

function normalizeQuestion(q, stimulusMap = {}) {
  const answerRaw =
    q.answer ?? q.correct_option ?? q.correctOption ?? q.correct_answer;
  const stimulusNo = Number(q.stimulus_no ?? q.stimulusNo ?? 0) || null;
  let passage = q.passage ?? q.stimulus ?? q.stem ?? null;
  if ((!passage || String(passage).trim() === "") && stimulusNo && stimulusMap[stimulusNo]) {
    passage = stimulusMap[stimulusNo];
  }
  if (passage === "null" || passage === null) passage = null;
  return {
    number: Number(q.number ?? q.question_no ?? q.questionNumber),
    question: String(q.question ?? q.questionText ?? "").trim(),
    options: normalizeOptions(q.options),
    answer: normalizeAnswer(answerRaw),
    explanation: String(q.explanation ?? "").trim(),
    topic: String(q.topic ?? "").trim(),
    probability: String(q.probability ?? q.probability_tag ?? "Mega Hot").trim(),
    type: inferQuestionType(q),
    stimulusNo,
    passage,
  };
}

function parseNumericMeta(value, fallback = 25) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const m = String(value ?? "").match(/(\d+)/);
  return m ? Number(m[1]) : fallback;
}

function normalizeExam(payload) {
  const exam = payload.exam ?? payload.metadata;
  const firstMeta = payload.sets?.[0]?.metadata ?? {};
  if (typeof exam === "string") {
    return {
      title: exam,
      full_marks: Number(firstMeta.full_marks ?? 25),
      subject_code: payload.subject_code ?? firstMeta.subject_code ?? 175,
      time_minutes: Number(firstMeta.time_minutes ?? 25),
    };
  }
  return {
    title: exam?.title ?? payload.title ?? "Hyper Mega Hot Model Test",
    full_marks: Number(
      exam?.full_marks ??
        exam?.full_marks_per_set ??
        exam?.marks ??
        firstMeta.full_marks ??
        25,
    ),
    subject_code: exam?.subject_code ?? payload.subject_code ?? firstMeta.subject_code ?? 175,
    time_minutes: Number(exam?.time_minutes ?? exam?.time ?? firstMeta.time_minutes ?? 25),
  };
}

function normalizeSet(set) {
  const setId = Number(set.set_id ?? set.set_no ?? set.setNumber ?? set.set_number);
  const rawLabel = set.label ?? set.title ?? `SET ${setId}`;
  const setNumMatch = String(rawLabel).match(/^set\s*0*(\d+)/i);
  const label = setNumMatch ? `SET ${setNumMatch[1]}` : rawLabel;
  const stimulusMap = buildStimulusMap(set);
  const normalized = (set.questions ?? set.mcqs ?? [])
    .map((q) => normalizeQuestion(q, stimulusMap))
    .filter((q) => q.number > 0);
  const questions = assignPassageNumbers(normalized);
  return { set_id: setId, label, setTitle: set.title ?? rawLabel, questions };
}

function normalizePayload(raw, subjectSlug = "physics-2nd-paper") {
  let payload = raw;
  if (Array.isArray(raw)) {
    payload = {
      exam: {
        title: `HSC ${subjectSlug} - Hyper Mega Hot Exclusive Model Test`,
        full_marks: 25,
        time_minutes: 25,
      },
      sets: raw,
    };
  } else if (Array.isArray(raw.model_tests)) {
    const meta = raw.metadata ?? {};
    payload = {
      exam: {
        title: meta.title ?? "Hyper Mega Hot Model Test",
        subject_code: meta.subject_code,
        full_marks: parseNumericMeta(meta.full_marks, 25),
        time_minutes: parseNumericMeta(meta.time, 25),
      },
      sets: raw.model_tests.map((set) => ({
        set_id: set.set_id ?? set.set_number ?? set.setNumber,
        label: set.label ?? `SET ${set.set_number ?? set.set_id}`,
        questions: set.questions ?? [],
      })),
    };
  }

  return {
    exam: normalizeExam(payload),
    sets: (payload.sets ?? []).map(normalizeSet).filter((s) => s.set_id > 0 && s.questions.length),
  };
}

function convertQuestion(q, setId, slug, subjectSlug) {
  const opts = normalizeOptions(q.options);
  const optionA = String(opts["ক"] ?? "").trim();
  const optionB = String(opts["খ"] ?? "").trim();
  const optionC = String(opts["গ"] ?? "").trim();
  const optionD = String(opts["ঘ"] ?? "").trim();
  const correctOption = BN_ANSWER[String(q.answer ?? "").trim()] ?? "A";
  const questionText = buildQuestionText(q);

  const id = questionIdFor(subjectSlug, setId, q.number);

  return {
    mega: {
      id,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      explanation: String(q.explanation ?? "").trim(),
      chapter: pad2(setId),
      topic: String(q.topic ?? "").trim(),
      difficulty: String(q.probability ?? "Mega Hot").trim(),
    },
    public: {
      id,
      subject: subjectSlug,
      chapter: slug,
      text: questionText,
      options: [optionA, optionB, optionC, optionD],
      image: null,
      timeLimit: 45,
    },
    answer: {
      correctOption: [optionA, optionB, optionC, optionD][LETTER_INDEX[correctOption]] ?? optionA,
      explanation: String(q.explanation ?? "").trim(),
    },
  };
}

function writeSetFiles(subjectSlug, slug, megaQuestions, publicQuestions, answers) {
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
}

function updateMegaJson(subjectSlug, level, slug, megaQuestions, meta, exam) {
  const megaPath = path.join(PUBLIC, "quiz-data", level, `${subjectSlug}.json`);
  const mega = JSON.parse(fs.readFileSync(megaPath, "utf8"));
  if (!mega.modelTests) mega.modelTests = {};
  if (!mega.modelTestsMeta) mega.modelTestsMeta = {};

  mega.modelTests[slug] = megaQuestions;
  mega.modelTestsMeta[slug] = {
    displayTitle: meta.displayTitle,
    name: meta.name,
    tags: meta.tags,
    durationMinutes: meta.durationMinutes,
    questionCount: megaQuestions.length,
    confidenceLabel: meta.confidenceLabel,
    scope: "paper",
    examTitle: exam?.title,
    fullMarks: exam?.full_marks,
    subjectCode: exam?.subject_code,
  };

  fs.writeFileSync(megaPath, `${JSON.stringify(mega, null, 2)}\n`, "utf8");
}

function updateModelTestsIndex(subjectSlug, level, slug, meta) {
  const indexPath = path.join(
    PUBLIC,
    "quiz-data",
    level,
    `${subjectSlug}.model-tests.index.json`,
  );
  if (!fs.existsSync(indexPath)) return;
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  if (!index.modelTests) index.modelTests = {};
  index.modelTests[slug] = {
    questionCount: meta.questionCount,
    scope: "paper",
    displayTitle: meta.displayTitle,
    durationMinutes: meta.durationMinutes,
    importance: "high",
    tags: meta.tags,
  };
  fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
}

function updateSubjectIndex(subjectSlug, slug, title, count) {
  const indexPath = path.join(PUBLIC, "questions", subjectSlug, "index.json");
  if (!fs.existsSync(indexPath)) return;
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  if (!index.modelTests) index.modelTests = [];

  const entry = {
    id: slug,
    title,
    questionCount: count,
    scope: "paper",
    importance: "high",
    tags: ["hot", "high-priority", "mega-hot", "paper-wise", "hyper-exclusive"],
  };
  const existing = index.modelTests.find((m) => m.id === slug);
  if (existing) {
    Object.assign(existing, entry);
  } else {
    index.modelTests.push(entry);
  }

  fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
}

function importHyperMega(sourcePath, subjectSlug = "physics-2nd-paper", level = "hsc") {
  const abs = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.join(ROOT, sourcePath);
  if (!fs.existsSync(abs)) {
    console.error(`❌ Source not found: ${abs}`);
    process.exit(1);
  }

  const payload = normalizePayload(JSON.parse(fs.readFileSync(abs, "utf8")), subjectSlug);
  const exam = payload.exam ?? {};
  const sets = payload.sets ?? [];
  if (!sets.length) {
    console.error("❌ No sets[] in source JSON");
    process.exit(1);
  }

  console.log(`\n🔥 Importing Hyper Mega Hot → ${subjectSlug}`);
  console.log(`   Exam: ${exam.title ?? "(untitled)"}`);
  console.log(`   Sets: ${sets.length}`);

  for (const set of sets) {
    const setId = Number(set.set_id);
    if (!setId || !Array.isArray(set.questions) || !set.questions.length) {
      console.warn(`   ⚠️  Skip invalid set: ${JSON.stringify(set.set_id)}`);
      continue;
    }

    const slug = slugForSet(subjectSlug, setId);
    const label = set.label ?? `SET ${setId}`;
    const rawShort = set.setTitle ? String(set.setTitle).replace(/^Set\s*0*\d+\s*-\s*/i, "").trim() : "";
    const shortTitle =
      rawShort && rawShort !== label && !/^SET\s*0*\d+$/i.test(rawShort) ? rawShort : "";
    const converted = set.questions.map((q) => convertQuestion(q, setId, slug, subjectSlug));
    const megaQuestions = converted.map((c) => c.mega);
    const publicQuestions = converted.map((c) => c.public);
    const answers = converted.map((c) => c.answer);

    const meta = {
      displayTitle: shortTitle
        ? `Hyper Mega Hot ${label} · ${shortTitle}`
        : `Hyper Mega Hot ${label}`,
      name: `Hyper Mega Hot ${label}`,
      tags: ["hot", "high-priority", "mega-hot", "paper-wise", "hyper-exclusive"],
      durationMinutes: exam.time_minutes ?? 25,
      questionCount: megaQuestions.length,
      confidenceLabel: "Hyper Mega Hot Board Standard Exclusive",
    };

    writeSetFiles(subjectSlug, slug, megaQuestions, publicQuestions, answers);
    updateMegaJson(subjectSlug, level, slug, megaQuestions, meta, exam);
    updateModelTestsIndex(subjectSlug, level, slug, meta);
    updateSubjectIndex(subjectSlug, slug, meta.displayTitle, megaQuestions.length);

    console.log(`   ✅ ${slug} — ${megaQuestions.length} questions (${label})`);
  }

  console.log("\n✅ Hyper Mega Hot import complete.\n");
}

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error(
    "Usage: node scripts/import-hyper-mega-model-tests.js <path-to-json> [subject-slug]",
  );
  process.exit(1);
}

importHyperMega(sourcePath, process.argv[3] ?? "physics-2nd-paper");
 megaQuestions.length);

    console.log(`   ✅ ${slug} — ${megaQuestions.length} questions (${label})`);
  }

  console.log("\n✅ Hyper Mega Hot import complete.\n");
}

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error(
    "Usage: node scripts/import-hyper-mega-model-tests.js <path-to-json> [subject-slug]",
  );
  process.exit(1);
}

importHyperMega(sourcePath, process.argv[3] ?? "physics-2nd-paper");
cs-2nd-paper");
 megaQuestions.length);

    console.log(`   ✅ ${slug} — ${megaQuestions.length} questions (${label})`);
  }

  console.log("\n✅ Hyper Mega Hot import complete.\n");
}

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error(
    "Usage: node scripts/import-hyper-mega-model-tests.js <path-to-json> [subject-slug]",
  );
  process.exit(1);
}

importHyperMega(sourcePath, process.argv[3] ?? "physics-2nd-paper");
