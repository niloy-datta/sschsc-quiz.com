/**
 * Ensure every SSC Chemistry chapter (01–12) has exactly 5 model-test sets × 25 MCQs.
 * Sources: curated ch01/ch06/ch10 (keep), premium-full.json (sets 1–10 split across chapters).
 *
 * Usage: node scripts/ensure-ssc-chemistry-five-sets.js [--force]
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const PREMIUM_PATH = path.join(ROOT, "data", "imports", "ssc-chemistry-premium-full.json");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions", "chemistry");
const DATA_DIR = path.join(__dirname, "data");
const IMPORTER = path.join(__dirname, "import-ssc-chemistry-chapter-model-tests.js");

const LABELS = ["ক", "খ", "গ", "ঘ"];
const FORCE = process.argv.includes("--force");

const CHAPTER_NAMES = {
  "01": "রসায়নের ধারণা",
  "02": "পদার্থের অবস্থা",
  "03": "মৌলের পর্যায়বৃত্ত ধর্ম",
  "04": "রাসায়নিক বন্ধন",
  "05": "মোল ধারণা ও গণনা",
  "06": "অম্ল-ক্ষার",
  "07": "জারণ-বিজারণ",
  "08": "তাপ রসায়ন",
  "09": "জৈব রসায়ন",
  "10": "হাইড্রোকার্বন",
  "11": "ধাতু ও অধাতু",
  "12": "পরিবেশ রসায়ন",
};

/** Keep if already 5 non-placeholder sets (unless --force). */
const KEEP_IF_FIVE = new Set(["01", "02", "05", "06", "10"]);

/**
 * Map app chapter → premium chapter + which premium set numbers (1–10) to use as model tests 1–5.
 * DISABLED: premium-full.json contains template spam (e.g. "Metal সাধারণত..." repeated).
 * Use curated JSON imports + fix-ssc-chemistry-junk-sets.js instead.
 */
const PREMIUM_MAP = [];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function isPlaceholder(text) {
  const t = String(text ?? "").trim();
  return !t || /^Chemistry Q\d/i.test(t) || / Q\d+$/.test(t);
}

function countGoodSets(chapterNo) {
  const ch = pad2(chapterNo);
  const prefix = `ssc-chemistry-chapter-${ch}-model-test-`;
  if (!fs.existsSync(QUESTIONS_DIR)) return 0;
  return fs
    .readdirSync(QUESTIONS_DIR)
    .filter((f) => f.startsWith(prefix) && f.endsWith(".json"))
    .filter((f) => {
      const qs = JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, f), "utf8"));
      return qs.length >= 25 && !isPlaceholder(qs[0]?.text);
    }).length;
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return null;
  if (options[0]?.label != null || options[0]?.key != null) {
    const byLabel = {};
    for (const opt of options) {
      byLabel[String(opt.label ?? opt.key ?? "").trim()] = String(opt.text ?? "").trim();
    }
    return LABELS.map((l) => byLabel[l] ?? "");
  }
  return options.map((o) => String(o?.text ?? o ?? "").trim()).slice(0, 4);
}

function premiumChapterMap() {
  const raw = JSON.parse(fs.readFileSync(PREMIUM_PATH, "utf8"));
  const map = new Map();
  for (const ch of raw.chapters ?? []) {
    map.set(String(ch.chapter).padStart(2, "0"), ch);
  }
  return map;
}

function buildPayloadFromPremium(appChapter, premiumChapter, setNos) {
  const premium = premiumChapterMap().get(String(premiumChapter).padStart(2, "0"));
  if (!premium) throw new Error(`Premium chapter ${premiumChapter} not found`);

  const chapterNo = Number(appChapter);
  const chapterName = CHAPTER_NAMES[pad2(chapterNo)];
  const sets = [];

  setNos.forEach((premiumSetNo, idx) => {
    const premiumSet = (premium.sets ?? []).find(
      (s) => Number(s.set ?? s.setNo) === premiumSetNo,
    );
    if (!premiumSet?.questions?.length) {
      throw new Error(`Missing premium ch${premiumChapter} set ${premiumSetNo}`);
    }

    const modelSetNo = idx + 1;
    const questions = premiumSet.questions.map((q, i) => {
      const opts = normalizeOptions(q.options);
      if (!opts || opts.some((o) => !o)) {
        throw new Error(`Bad options premium ${premiumChapter} set ${premiumSetNo} q${i + 1}`);
      }
      const text = String(q.question ?? "").trim();
      if (isPlaceholder(text)) {
        throw new Error(`Placeholder premium ${premiumChapter} set ${premiumSetNo} q${i + 1}`);
      }
      return {
        id: i + 1,
        q: text,
        o: { ক: opts[0], খ: opts[1], গ: opts[2], ঘ: opts[3] },
        a: String(q.correctOption ?? "ক").trim(),
        t: String(q.topic ?? chapterName).trim(),
      };
    });

    sets.push({
      set_no: modelSetNo,
      title: `অধ্যায় ${chapterNo} · ${chapterName} · মডেল টেস্ট ${pad2(modelSetNo)}`,
      questions,
    });
  });

  return {
    app: "বিজ্ঞান র‍্যাঙ্কার",
    level: "SSC",
    subject: "রসায়ন",
    chapter_no: chapterNo,
    chapter_name: chapterName,
    sets_per_chapter: 5,
    questions_per_set: 25,
    source: `premium-ch${premiumChapter}`,
    sets,
  };
}

function pruneExtraSets(chapterNo, keepMax = 5) {
  const ch = pad2(chapterNo);
  const prefix = `ssc-chemistry-chapter-${ch}-model-test-`;
  const files = fs
    .readdirSync(QUESTIONS_DIR)
    .filter((f) => f.startsWith(prefix) && f.endsWith(".json"))
    .sort();

  for (const f of files) {
    const num = Number(f.match(/model-test-(\d+)/)?.[1] ?? 0);
    if (num > keepMax) {
      fs.unlinkSync(path.join(QUESTIONS_DIR, f));
      const ans = path.join(
        ROOT,
        "backend/data/answers/chemistry",
        f.replace(".json", ".answers.json"),
      );
      if (fs.existsSync(ans)) fs.unlinkSync(ans);
      console.log("REMOVED extra", f.replace(".json", ""));
    }
  }

  const indexPath = path.join(QUESTIONS_DIR, "index.json");
  const idx = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  idx.modelTests = (idx.modelTests ?? []).filter((m) => {
    if (!m.id.startsWith(prefix)) return true;
    const num = Number(m.id.match(/model-test-(\d+)/)?.[1] ?? 0);
    return num <= keepMax;
  });
  fs.writeFileSync(indexPath, `${JSON.stringify(idx, null, 2)}\n`, "utf8");
}

function main() {
  if (!fs.existsSync(PREMIUM_PATH)) {
    console.error("Missing", PREMIUM_PATH);
    process.exit(1);
  }

  for (const ch of Object.keys(CHAPTER_NAMES)) {
    pruneExtraSets(Number(ch), 5);
  }

  let imported = 0;
  for (const row of PREMIUM_MAP) {
    const good = countGoodSets(row.app);
    if (KEEP_IF_FIVE.has(row.app) && good >= 5 && !FORCE) {
      console.log(`KEEP ch${row.app} (${good} sets)`);
      continue;
    }
    if (good >= 5 && !FORCE) {
      console.log(`SKIP ch${row.app} already has ${good} sets`);
      continue;
    }

    const payload = buildPayloadFromPremium(row.app, row.premium, row.setNos);
    const out = path.join(DATA_DIR, `ssc-chemistry-ch${pad2(row.app)}-five-sets.json`);
    fs.writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    execSync(`node "${IMPORTER}" "${out}"`, { cwd: ROOT, stdio: "inherit" });
    imported++;
    console.log(`IMPORTED ch${row.app} from premium ${row.premium} sets ${row.setNos.join(",")}`);
  }

  console.log("\n=== Final audit ===");
  for (let ch = 1; ch <= 12; ch++) {
    const n = countGoodSets(ch);
    const ok = n >= 5 ? "OK" : "NEED";
    console.log(`Ch${pad2(ch)} ${CHAPTER_NAMES[pad2(ch)]}: ${n}/5 ${ok}`);
  }

  execSync("node scripts/export-ssc-chemistry-quiz-text.js", { cwd: ROOT, stdio: "inherit" });
  console.log(`\nDone. Premium imports: ${imported}`);
}

main();
