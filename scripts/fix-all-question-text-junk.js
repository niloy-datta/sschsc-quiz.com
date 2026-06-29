/**
 * Fix question-text junk across the whole corpus:
 * - "— MCQ 14 (সেট 5)?" suffixes
 * - "[12]" bracket suffixes
 * - Bijoy/ANSI garbled board sets (quarantine)
 * - Orphan mega-only junk sets (remove)
 * - SSC chemistry chapter sets (rebuild via fix-chemistry-mcq-stems)
 * - SSC physics/higher-math/chemistry junk chapter sets
 *
 * Usage: node scripts/fix-all-question-text-junk.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const {
  isGarbledBijoyText,
  isJunkQuestionText,
  isLowQualitySet,
  extractText,
} = require("./lib/ssc-set-quality");
const { isLowQualitySet: isLowQualityChemistrySet } = require("./lib/ssc-chemistry-quality");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_ROOT = path.join(ROOT, "public", "questions");
const QUIZ_DATA = path.join(ROOT, "public", "quiz-data");
const QUARANTINE_ROOT = path.join(ROOT, "data", "quarantine");
const ANSWERS_ROOT = path.join(ROOT, "backend", "data", "answers");

function cleanStem(text) {
  return String(text ?? "")
    .replace(/\s*—\s*MCQ\s+\d+\s*\(সেট\s+\d+\)\??/g, "")
    .replace(/\s*\[\d+\]\s*$/g, "")
    .replace(/\?+$/g, "?")
    .trim();
}

function listQuestionFiles() {
  const out = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const fp = path.join(dir, name);
      if (fs.statSync(fp).isDirectory()) walk(fp);
      else if (name.endsWith(".json") && name !== "index.json") out.push(fp);
    }
  }
  walk(QUESTIONS_ROOT);
  return out;
}

function subjectFromPath(fp) {
  const rel = path.relative(QUESTIONS_ROOT, fp);
  return rel.split(path.sep)[0] ?? "";
}

function setIdFromPath(fp) {
  return path.basename(fp, ".json");
}

function quarantineFile(fp) {
  const rel = path.relative(QUESTIONS_ROOT, fp);
  const dest = path.join(QUARANTINE_ROOT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (!fs.existsSync(dest)) fs.renameSync(fp, dest);
  else fs.unlinkSync(fp);

  const setId = setIdFromPath(fp);
  const subject = subjectFromPath(fp);
  const ans = path.join(ANSWERS_ROOT, subject, `${setId}.answers.json`);
  if (fs.existsSync(ans)) {
    const ansDest = path.join(QUARANTINE_ROOT, subject, `${setId}.answers.json`);
    fs.mkdirSync(path.dirname(ansDest), { recursive: true });
    if (!fs.existsSync(ansDest)) fs.renameSync(ans, ansDest);
    else fs.unlinkSync(ans);
  }
}

function removeFromMega(setId, subjectSlug) {
  for (const level of ["ssc", "hsc"]) {
    const megaPath = path.join(QUIZ_DATA, level, `${subjectSlug}.json`);
    if (!fs.existsSync(megaPath)) continue;
    const mega = JSON.parse(fs.readFileSync(megaPath, "utf8"));
    let changed = false;
    if (mega.modelTests?.[setId]) {
      delete mega.modelTests[setId];
      changed = true;
    }
    if (mega.modelTestsMeta?.[setId]) {
      delete mega.modelTestsMeta[setId];
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(megaPath, `${JSON.stringify(mega, null, 2)}\n`, "utf8");
      console.log(`  MEGA removed ${level}/${subjectSlug}: ${setId}`);
    }

    const idxPath = path.join(QUIZ_DATA, level, `${subjectSlug}.model-tests.index.json`);
    if (fs.existsSync(idxPath)) {
      const idx = JSON.parse(fs.readFileSync(idxPath, "utf8"));
      if (idx.modelTests?.[setId]) {
        delete idx.modelTests[setId];
        fs.writeFileSync(idxPath, `${JSON.stringify(idx, null, 2)}\n`, "utf8");
      }
    }
  }

  const indexPath = path.join(QUESTIONS_ROOT, subjectSlug, "index.json");
  if (fs.existsSync(indexPath)) {
    const idx = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    if (Array.isArray(idx.modelTests)) {
      const next = idx.modelTests.filter((m) => m.id !== setId);
      if (next.length !== idx.modelTests.length) {
        idx.modelTests = next;
        fs.writeFileSync(indexPath, `${JSON.stringify(idx, null, 2)}\n`, "utf8");
      }
    }
  }
}

function replaceEnglishMetalPlaceholder(text) {
  if (/^Metal \+ Nonmetal bond commonly is\?$/i.test(String(text ?? "").trim())) {
    return "ধাতু ও অধাতুর মধ্যে সাধারণত কোন বন্ধন?";
  }
  if (/^Metal সাধারণত/i.test(String(text ?? "").trim())) {
    return null;
  }
  return text;
}

function isLowQualityFile(questions, subject) {
  if (subject === "chemistry") return isLowQualityChemistrySet(questions);
  const ch = null;
  return isLowQualitySet(questions, subject, ch);
}

function cleanAllSidecars() {
  console.log("\n=== Pass 1: clean sidecar question text ===");
  let cleanedFields = 0;
  let quarantined = 0;
  let placeholderFixed = 0;

  for (const fp of listQuestionFiles()) {
    let questions;
    try {
      questions = JSON.parse(fs.readFileSync(fp, "utf8"));
    } catch {
      continue;
    }
    if (!Array.isArray(questions) || !questions.length) continue;

    const subject = subjectFromPath(fp);
    const setId = setIdFromPath(fp);
    const texts = questions.map((q) => extractText(q));
    const garbledHits = texts.filter(isGarbledBijoyText).length;

    if (garbledHits >= Math.ceil(questions.length * 0.4)) {
      console.log(`QUARANTINE garbled ${path.relative(ROOT, fp)} (${garbledHits}/${questions.length})`);
      quarantineFile(fp);
      removeFromMega(setId, subject);
      quarantined++;
      continue;
    }

    let changed = false;
    for (const q of questions) {
      const raw = String(q.text ?? "").trim();
      let next = cleanStem(raw);
      const replaced = replaceEnglishMetalPlaceholder(next);
      if (replaced && replaced !== next) {
        next = replaced;
        placeholderFixed++;
      }
      if (next !== raw) {
        q.text = next;
        cleanedFields++;
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(fp, `${JSON.stringify(questions, null, 2)}\n`, "utf8");
    }
  }

  console.log(`cleaned ${cleanedFields} fields, fixed ${placeholderFixed} placeholders, quarantined ${quarantined} garbled sets`);
}

function purgeOrphanMegaSets() {
  console.log("\n=== Pass 2: purge orphan / junk mega-only sets ===");
  let removed = 0;

  function scanMega(megaPath, subjectSlug) {
    if (!fs.existsSync(megaPath)) return;
    const mega = JSON.parse(fs.readFileSync(megaPath, "utf8"));
    let changed = false;
    const sidecarDir = path.join(QUESTIONS_ROOT, subjectSlug);

    for (const setId of Object.keys(mega.modelTests ?? {})) {
      const sidecar = path.join(sidecarDir, `${setId}.json`);
      const qs = mega.modelTests[setId];
      const texts = (qs ?? []).map((q) => String(q.questionText ?? q.text ?? ""));
      const orphan = !fs.existsSync(sidecar);
      const placeholder =
        texts.length >= 10 &&
        texts.filter((t) => /^Chemistry Q\d/i.test(t) || /^Metal /i.test(t)).length >=
          Math.ceil(texts.length * 0.5);

      if (orphan || placeholder) {
        delete mega.modelTests[setId];
        delete mega.modelTestsMeta?.[setId];
        changed = true;
        removed++;
        console.log(`  REMOVE mega ${path.basename(megaPath)}: ${setId}${orphan ? " (orphan)" : " (placeholder)"}`);
      }
    }

    if (changed) {
      fs.writeFileSync(megaPath, `${JSON.stringify(mega, null, 2)}\n`, "utf8");
    }
  }

  for (const level of ["ssc", "hsc"]) {
    const levelDir = path.join(QUIZ_DATA, level);
    if (!fs.existsSync(levelDir)) continue;
    for (const file of fs.readdirSync(levelDir)) {
      if (!file.endsWith(".json") || file.includes(".model-tests.")) continue;
      scanMega(path.join(levelDir, file), file.replace(".json", ""));
    }
  }

  console.log(`removed ${removed} mega-only junk set(s)`);
}

function auditRemaining() {
  console.log("\n=== Final audit ===");
  const mcqRe = / — MCQ \d+ \(সেট \d+\)/;
  let mcq = 0;
  let garbled = 0;
  let junk = 0;

  for (const fp of listQuestionFiles()) {
    const questions = JSON.parse(fs.readFileSync(fp, "utf8"));
    if (!Array.isArray(questions)) continue;
    for (const q of questions) {
      const t = extractText(q);
      if (mcqRe.test(t)) mcq++;
      if (isGarbledBijoyText(t)) garbled++;
      if (isJunkQuestionText(t, subjectFromPath(fp))) junk++;
    }
  }

  console.log(`Remaining MCQ suffix questions: ${mcq}`);
  console.log(`Remaining garbled Bijoy questions: ${garbled}`);
  console.log(`Remaining junk-tagged questions: ${junk}`);
  console.log(garbled || mcq || junk ? "⚠️  Some issues remain" : "✅ Corpus clean");
}

function main() {
  console.log("=== Fix ALL question text junk ===");
  cleanAllSidecars();
  purgeOrphanMegaSets();

  console.log("\n=== Pass 3: rebuild SSC chemistry chapter sets ===");
  execSync("node scripts/fix-chemistry-mcq-stems.js", { cwd: ROOT, stdio: "inherit" });

  console.log("\n=== Pass 4: rebuild SSC physics chapter sets ===");
  execSync("node scripts/ensure-ssc-physics-higher-math-five-sets.js physics", {
    cwd: ROOT,
    stdio: "inherit",
  });

  console.log("\n=== Pass 5: fix remaining SSC junk chapter sets ===");
  execSync("node scripts/fix-all-ssc-junk-chapter-sets.js", { cwd: ROOT, stdio: "inherit" });

  console.log("\n=== Pass 6: sync sidecars → mega JSON ===");
  execSync("node scripts/sync-fixes-to-mega.js", { cwd: ROOT, stdio: "inherit" });

  auditRemaining();
  console.log("\nDone. Hard refresh browser (Ctrl+Shift+R).");
}

main();
