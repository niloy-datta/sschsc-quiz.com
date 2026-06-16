/**
 * Remove placeholder model tests (e.g. "ক্রম ও ধারা Q1" with junk options)
 * from public/questions/{subject}/index.json and quarantine the JSON files.
 *
 * Usage: node scripts/prune-placeholder-model-tests.js [subject|all]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const QUARANTINE_DIR = path.join(ROOT, "data", "quarantine");

const JUNK_OPTIONS = new Set([
  "360", "180", "0", "1", "-1", "2", "3", "4", "5", "7", "8", "10", "11",
  "15", "22", "25", "a+b", "x", "y", "b", "?", "ক", "খ", "গ", "ঘ",
]);

function loadJson(fp) {
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

function writeJson(fp, data) {
  fs.writeFileSync(fp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function collectQuestions(data) {
  return Array.isArray(data) ? data : data.questions ?? [];
}

function optionTexts(q) {
  if (Array.isArray(q?.options)) {
    return q.options.map((o) =>
      typeof o === "string" ? o.trim() : String(o?.text ?? "").trim(),
    );
  }
  return [
    q?.optionA, q?.optionB, q?.optionC, q?.optionD,
  ].map((o) => String(o ?? "").trim());
}

function isPlaceholderSet(questions) {
  if (!questions.length) return true;
  const sample = questions.slice(0, 3);
  const placeholderHits = sample.filter((q) => {
    const text = String(q?.text ?? q?.questionText ?? q?.question ?? "").trim();
    if (/ Q\d+$/i.test(text) && text.split(/\s+/).length <= 4) return true;
    const opts = optionTexts(q).filter(Boolean);
    if (opts.length >= 4 && opts.every((o) => JUNK_OPTIONS.has(o))) return true;
    return false;
  });
  return placeholderHits.length >= 2;
}

function pruneSubject(subject) {
  const subjectDir = path.join(QUESTIONS_DIR, subject);
  const indexPath = path.join(subjectDir, "index.json");
  if (!fs.existsSync(indexPath)) {
    console.warn("Skip", subject, "no index");
    return { pruned: 0, quarantined: 0 };
  }

  const idx = loadJson(indexPath);
  const keep = [];
  let pruned = 0;
  let quarantined = 0;

  for (const entry of idx.modelTests ?? []) {
    const setId = entry.id;
    const fp = path.join(subjectDir, `${setId}.json`);
    if (!fs.existsSync(fp)) {
      keep.push(entry);
      continue;
    }

    const questions = collectQuestions(loadJson(fp));
    if (!isPlaceholderSet(questions)) {
      keep.push(entry);
      continue;
    }

    const qDir = path.join(QUARANTINE_DIR, subject);
    fs.mkdirSync(qDir, { recursive: true });
    const dest = path.join(qDir, `${setId}.json`);
    if (!fs.existsSync(dest)) {
      fs.renameSync(fp, dest);
      quarantined++;
    } else {
      fs.unlinkSync(fp);
    }

    const answersSrc = path.join(
      ROOT,
      "backend",
      "data",
      "answers",
      subject,
      `${setId}.answers.json`,
    );
    if (fs.existsSync(answersSrc)) {
      const answersDest = path.join(qDir, `${setId}.answers.json`);
      if (!fs.existsSync(answersDest)) fs.renameSync(answersSrc, answersDest);
      else fs.unlinkSync(answersSrc);
    }

    pruned++;
    console.log("PRUNED placeholder", subject, setId);
  }

  idx.modelTests = keep;
  writeJson(indexPath, idx);
  return { pruned, quarantined };
}

const arg = (process.argv[2] ?? "all").toLowerCase();
const subjects =
  arg === "all"
    ? fs
        .readdirSync(QUESTIONS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .filter((s) => fs.existsSync(path.join(QUESTIONS_DIR, s, "index.json")))
        .sort()
    : [arg.replace(/[^a-z0-9-]/g, "")];

let totalPruned = 0;
let totalQuarantined = 0;
for (const subject of subjects) {
  const { pruned, quarantined } = pruneSubject(subject);
  totalPruned += pruned;
  totalQuarantined += quarantined;
  if (pruned) console.log(`${subject}: pruned ${pruned}, quarantined ${quarantined}`);
}

console.log(`Done: ${totalPruned} placeholder sets removed, ${totalQuarantined} files quarantined`);
