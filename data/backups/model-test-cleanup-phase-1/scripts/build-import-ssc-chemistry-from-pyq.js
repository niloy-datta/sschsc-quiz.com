/**
 * Build chapter model-test payloads from PYQ analysis and import (max 5 sets × 25).
 * Skips chapter 01 (curated content). Skips chapters that already have 5+ real sets.
 *
 * Usage: node scripts/build-import-ssc-chemistry-from-pyq.js [--dry-run]
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const PYQ_JSON = path.join(ROOT, "data", "ssc-chemistry-pyq-by-chapter.json");
const DATA_DIR = path.join(__dirname, "data");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions", "chemistry");
const TEXT_DIR = path.join(ROOT, "data", "quiz-text", "ssc-chemistry");
const IMPORTER = path.join(__dirname, "import-ssc-chemistry-chapter-model-tests.js");

const SKIP_CHAPTERS = new Set([1]);
const MAX_SETS = 5;
const Q_PER_SET = 25;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function isPlaceholderFile(setId) {
  const fp = path.join(QUESTIONS_DIR, `${setId}.json`);
  if (!fs.existsSync(fp)) return false;
  const qs = JSON.parse(fs.readFileSync(fp, "utf8"));
  const first = qs[0]?.text ?? "";
  return /^Chemistry Q\d/i.test(first) || / Q\d+$/.test(first.trim());
}

function countRealSets(chapterNo) {
  const ch = pad2(chapterNo);
  const prefix = `ssc-chemistry-chapter-${ch}-model-test-`;
  if (!fs.existsSync(QUESTIONS_DIR)) return 0;
  return fs
    .readdirSync(QUESTIONS_DIR)
    .filter((f) => f.startsWith(prefix) && f.endsWith(".json"))
    .filter((f) => !isPlaceholderFile(f.replace(/\.json$/, "")))
    .length;
}

function buildPayload(chapterNo, chapterName, questions) {
  const sets = [];
  const maxSets = Math.min(MAX_SETS, Math.floor(questions.length / Q_PER_SET));
  for (let s = 1; s <= maxSets; s++) {
    const slice = questions.slice((s - 1) * Q_PER_SET, s * Q_PER_SET);
    sets.push({
      set_no: s,
      title: `অধ্যায় ${chapterNo} · ${chapterName} · PYQ মডেল টেস্ট ${pad2(s)}`,
      questions: slice.map((q, i) => ({
        id: i + 1,
        q: q.text,
        o: { ক: q.options[0], খ: q.options[1], গ: q.options[2], ঘ: q.options[3] },
        a: q.answer,
        t: q.topic ?? "pyq",
      })),
    });
  }
  return {
    app: "বিজ্ঞান র‍্যাঙ্কার",
    level: "SSC",
    subject: "রসায়ন",
    chapter_no: chapterNo,
    chapter_name: chapterName,
    sets_per_chapter: maxSets,
    questions_per_set: Q_PER_SET,
    source: "board-pyq-analysis",
    prediction_note:
      "বোর্ড প্রশ্ন বিশ্লেষণ থেকে তৈরি PYQ-ভিত্তিক সেট; মূল বোর্ড প্রশ্নের পুনরাবৃত্তি/রূপান্তর হতে পারে।",
    sets,
  };
}

function exportQuizText(chapterNo, chapterName, payload) {
  fs.mkdirSync(TEXT_DIR, { recursive: true });
  for (const set of payload.sets) {
    const setId = `ssc-chemistry-chapter-${pad2(chapterNo)}-model-test-${pad2(set.set_no)}`;
    const lines = [
      `# ${set.title}`,
      `# Set ID: ${setId}`,
      `# Source: previous year board PYQ analysis`,
      "",
    ];
    for (const q of set.questions) {
      lines.push(`Q${q.id}. ${q.q}`);
      lines.push(`  ক) ${q.o["ক"]}`);
      lines.push(`  খ) ${q.o["খ"]}`);
      lines.push(`  গ) ${q.o["গ"]}`);
      lines.push(`  ঘ) ${q.o["ঘ"]}`);
      lines.push(`  ✓ ${q.a}  [${q.t}]`);
      lines.push("");
    }
    const out = path.join(TEXT_DIR, `${setId}.txt`);
    fs.writeFileSync(out, `${lines.join("\n")}\n`, "utf8");
  }
}

function exportExistingCh01Text() {
  const ch = 1;
  for (let s = 1; s <= 5; s++) {
    const setId = `ssc-chemistry-chapter-01-model-test-${pad2(s)}`;
    const fp = path.join(QUESTIONS_DIR, `${setId}.json`);
    if (!fs.existsSync(fp)) continue;
    const ansPath = path.join(
      ROOT,
      "backend/data/answers/chemistry",
      `${setId}.answers.json`,
    );
    const answers = fs.existsSync(ansPath)
      ? JSON.parse(fs.readFileSync(ansPath, "utf8"))
      : {};
    const qs = JSON.parse(fs.readFileSync(fp, "utf8"));
    const lines = [`# ${setId} (curated board-pattern)`, ""];
    qs.forEach((q, i) => {
      const labels = ["ক", "খ", "গ", "ঘ"];
      const ans = answers[q.id];
      const ansLabel = ans
        ? labels[ans.answerIndex ?? 0]
        : "?";
      lines.push(`Q${i + 1}. ${q.text}`);
      q.options.forEach((o, j) => lines.push(`  ${labels[j]}) ${o}`));
      lines.push(`  ✓ ${ansLabel}`);
      lines.push("");
    });
    fs.mkdirSync(TEXT_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(TEXT_DIR, `${setId}.txt`),
      `${lines.join("\n")}\n`,
      "utf8",
    );
  }
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (!fs.existsSync(PYQ_JSON)) {
    execSync("node scripts/analyze-ssc-chemistry-pyq.js", {
      cwd: ROOT,
      stdio: "inherit",
    });
  }

  const data = JSON.parse(fs.readFileSync(PYQ_JSON, "utf8"));
  exportExistingCh01Text();

  let imported = 0;
  for (const ch of data.chapters) {
    const chapterNo = Number(ch.chapter_no);
    if (SKIP_CHAPTERS.has(chapterNo)) {
      console.log(`SKIP ch${pad2(chapterNo)} (curated content exists)`);
      continue;
    }

    const existing = countRealSets(chapterNo);
    if (existing >= MAX_SETS) {
      console.log(`SKIP ch${pad2(chapterNo)} — already ${existing} real sets`);
      continue;
    }

    const questions = ch.questions ?? [];
    const payload = buildPayload(chapterNo, ch.chapter_name, questions);
    if (!payload.sets.length) {
      console.log(
        `SKIP ch${pad2(chapterNo)} ${ch.chapter_name} — only ${questions.length} PYQ (<25)`,
      );
      continue;
    }

    const outPath = path.join(
      DATA_DIR,
      `ssc-chemistry-ch${pad2(chapterNo)}-from-pyq.json`,
    );
    fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    exportQuizText(chapterNo, ch.chapter_name, payload);
    console.log(
      `BUILD ch${pad2(chapterNo)} ${ch.chapter_name}: ${payload.sets.length} sets (${payload.sets.length * Q_PER_SET} Q)`,
    );

    if (!dryRun) {
      execSync(`node "${IMPORTER}" "${outPath}"`, { cwd: ROOT, stdio: "inherit" });
      imported += payload.sets.length;
    }
  }

  console.log(`Done. Imported ${imported} PYQ-derived set(s). Text files: ${TEXT_DIR}`);
}

main();
