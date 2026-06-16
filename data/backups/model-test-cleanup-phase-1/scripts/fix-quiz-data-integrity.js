/**
 * Full quiz data integrity fix pipeline.
 * Run: node scripts/fix-quiz-data-integrity.js
 * Dry run: node scripts/fix-quiz-data-integrity.js --dry-run
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const QUIZ_DATA = path.join(PUBLIC, "quiz-data");
const QUESTIONS = path.join(PUBLIC, "questions");
const BACKEND_ANSWERS = path.join(ROOT, "backend", "data", "answers");
const QUARANTINE_DIR = path.join(ROOT, "data", "quarantine");
const BACKUP_DIR = path.join(ROOT, "data", "backups", `quiz-fix-${new Date().toISOString().slice(0, 10)}`);
const REPORT_PATH = path.join(ROOT, "scripts", "quiz-integrity-fix-report.json");
const REGEN_PATH = path.join(ROOT, "data", "needs-regeneration.json");

const DRY_RUN = process.argv.includes("--dry-run");

const SUBJECTS = [
  ...["physics", "chemistry", "biology", "higher-math", "general-math"].map((slug) => ({
    level: "ssc",
    slug,
    label: `SSC ${slug.replace("general-math", "General Math").replace("higher-math", "Higher Math")}`,
  })),
  ...[
    ["physics-1st-paper", "HSC Physics 1st Paper"],
    ["physics-2nd-paper", "HSC Physics 2nd Paper"],
    ["chemistry-1st-paper", "HSC Chemistry 1st Paper"],
    ["chemistry-2nd-paper", "HSC Chemistry 2nd Paper"],
    ["biology-1st-paper", "HSC Biology 1st Paper"],
    ["biology-2nd-paper", "HSC Biology 2nd Paper"],
    ["higher-math-1st-paper", "HSC Higher Math 1st Paper"],
    ["higher-math-2nd-paper", "HSC Higher Math 2nd Paper"],
  ].map(([slug, label]) => ({ level: "hsc", slug, label })),
];

function isProtectedSet(setId) {
  const s = setId.toLowerCase();
  return (
    s.includes("tier-a-hot") ||
    s.includes("hyper-mega-hot") ||
    s.includes("high-priority") ||
    /chapter-\d{2}-model-test-0[67]$/.test(s)
  );
}

function isHiddenKey(key) {
  const s = key.toLowerCase();
  return (
    s.endsWith("_questions") ||
    s.endsWith("-questions") ||
    s.includes("prediction") ||
    s.includes("hscictprediction") ||
    s === "killer-set" ||
    s.includes("killer-set") ||
    s.includes("ai-prediction")
  );
}

function isLegacyBulkKey(key) {
  const s = key.toLowerCase();
  return (
    /^physicsfirstpaper/.test(s) ||
    /^chemistryset\d/.test(s) ||
    s === "ssc-biology-high-common-sets-2-6" ||
    /^chapter-\d{1,2}$/.test(s)
  );
}

function expectedMcq(slug) {
  return slug === "general-math" ? 30 : 25;
}

function extractSetChapter(setId) {
  const m = String(setId).match(/chapter[-_]?(\d{1,2})/i);
  return m ? m[1].padStart(2, "0") : null;
}

function qText(q) {
  return String(q.questionText ?? q.question ?? q.text ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasValidOptions(q) {
  const opts = [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean);
  if (opts.length >= 4) return true;
  return Array.isArray(q.options) && q.options.filter((o) => String(o?.text ?? o ?? "").trim()).length >= 4;
}

function hasCorrectAnswer(q) {
  return q.correctOption != null || q.answerIndex != null || q.correctAnswer != null;
}

function setFingerprint(qs) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(qs.map((q) => qText(q)).sort()))
    .digest("hex");
}

function scoreKeeper(setId, qs, slug) {
  if (isProtectedSet(setId)) return 10000 + qs.length;

  const expected = expectedMcq(slug);
  const setChapter = extractSetChapter(setId);
  let score = 0;
  if (qs.length === expected) score += 100;
  else if (qs.length >= expected - 2) score += 40;
  score += Math.min(qs.length, expected);

  if (setChapter) {
    const matches = qs.filter((q) => {
      const ch = String(q.chapter ?? "").padStart(2, "0");
      return !q.chapter || ch === setChapter;
    }).length;
    score += matches * 3;
  }

  if (/model-test-\d{2}$/.test(setId) && setId.startsWith("hsc-")) score += 50;
  if (/model-test-\d{2}$/.test(setId) && setId.startsWith("ssc-")) score += 30;

  const serial = setId.match(/(?:model-test|set)-(\d{2})$/i);
  if (serial) score -= parseInt(serial[1], 10);

  return score;
}

function dedupeWithinSet(qs) {
  const seen = new Set();
  const removed = [];
  const out = [];
  for (const q of qs) {
    const fp = qText(q);
    if (fp.length < 8) {
      removed.push({ reason: "BOILERPLATE_REPEAT", text: fp.slice(0, 60) });
      continue;
    }
    if (seen.has(fp)) {
      removed.push({ reason: "BOILERPLATE_REPEAT", text: fp.slice(0, 60) });
      continue;
    }
    seen.add(fp);
    out.push(q);
  }
  return { questions: out, removed };
}

function filterCrossChapter(qs, setChapter) {
  if (!setChapter) return { questions: qs, removed: [] };
  const removed = [];
  const out = qs.filter((q) => {
    if (!q.chapter) return true;
    const ch = String(q.chapter).padStart(2, "0");
    const ok = ch === setChapter || ch === String(parseInt(setChapter, 10));
    if (!ok) {
      removed.push({
        reason: "CROSS_CHAPTER_MIX",
        text: qText(q).slice(0, 60),
        questionChapter: q.chapter,
        setChapter,
      });
    }
    return ok;
  });
  return { questions: out, removed };
}

function renumberQuestions(qs, setId) {
  return qs.map((q, i) => {
    const no = i + 1;
    return { ...q, questionNo: no, id: `${setId}-q${String(no).padStart(2, "0")}` };
  });
}

function splitLegacyBucket(setId, qs, expected) {
  const chunks = [];
  for (let i = 0; i < qs.length; i += expected) chunks.push(qs.slice(i, i + expected));
  return chunks.map((chunk, idx) => {
    const splitId = `${setId}-split-${String(idx + 1).padStart(2, "0")}`;
    return {
      setId: splitId,
      questions: renumberQuestions(chunk, splitId),
      complete: chunk.length === expected,
    };
  });
}

function deleteSidecar(subjectSlug, setId) {
  for (const p of [
    path.join(QUESTIONS, subjectSlug, `${setId}.json`),
    path.join(BACKEND_ANSWERS, subjectSlug, `${setId}.answers.json`),
  ]) {
    if (fs.existsSync(p) && !DRY_RUN) fs.unlinkSync(p);
  }
}

function writeSidecar(subjectSlug, setId, qs) {
  if (DRY_RUN) return;
  const pubPath = path.join(QUESTIONS, subjectSlug, `${setId}.json`);
  const ansPath = path.join(BACKEND_ANSWERS, subjectSlug, `${setId}.answers.json`);
  const publicQs = qs.map((q) => ({
    id: q.id,
    subject: subjectSlug,
    chapter: setId,
    text: qText(q),
    options: [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean),
    image: q.image || null,
    optionImages: q.optionImages || null,
    timeLimit: 45,
  }));
  const answerMap = {};
  for (const q of qs) {
    const opts = [q.optionA, q.optionB, q.optionC, q.optionD];
    const idx = { A: 0, B: 1, C: 2, D: 3 }[String(q.correctOption ?? "A").toUpperCase()] ?? 0;
    answerMap[q.id] = {
      correctOption: opts[idx] ?? opts[0],
      explanation: q.explanation ?? q.shortSolution ?? "",
    };
  }
  fs.mkdirSync(path.dirname(pubPath), { recursive: true });
  fs.mkdirSync(path.dirname(ansPath), { recursive: true });
  fs.writeFileSync(pubPath, `${JSON.stringify(publicQs, null, 2)}\n`, "utf8");
  fs.writeFileSync(ansPath, `${JSON.stringify(answerMap, null, 2)}\n`, "utf8");
}

function quarantineSet(subjectSlug, setId, qs, reason) {
  const dest = path.join(QUARANTINE_DIR, subjectSlug, `${setId}.json`);
  if (DRY_RUN) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(
    dest,
    `${JSON.stringify({ setId, reason, quarantinedAt: new Date().toISOString(), questions: qs }, null, 2)}\n`,
    "utf8",
  );
}

function updateModelIndex(level, slug, deletedIds, updatedMeta) {
  const indexPath = path.join(QUIZ_DATA, level, `${slug}.model-tests.index.json`);
  if (!fs.existsSync(indexPath) || DRY_RUN) return;
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const filterOut = (id) => !deletedIds.includes(id);

  if (Array.isArray(index.modelTests)) {
    index.modelTests = index.modelTests.filter((m) => filterOut(m.id || m.slug));
    for (const [id, meta] of Object.entries(updatedMeta)) {
      const existing = index.modelTests.find((m) => (m.id || m.slug) === id);
      if (existing) {
        existing.questionCount = meta.questionCount;
        existing.title = meta.displayTitle ?? existing.title;
      }
    }
  } else if (index.modelTests && typeof index.modelTests === "object") {
    // Delete explicitly deleted IDs
    for (const id of deletedIds) delete index.modelTests[id];
    
    // Sync with updatedMeta: update existing, insert new ones
    for (const [id, meta] of Object.entries(updatedMeta)) {
      if (index.modelTests[id]) {
        index.modelTests[id].questionCount = meta.questionCount;
        index.modelTests[id].displayTitle = meta.displayTitle ?? index.modelTests[id].displayTitle;
      } else {
        const baseId = id.replace(/-split-\d+$/, "");
        const baseMeta = index.modelTests[baseId] || {};
        index.modelTests[id] = {
          questionCount: meta.questionCount,
          scope: meta.scope || baseMeta.scope || "paper",
          displayTitle: meta.displayTitle,
          durationMinutes: baseMeta.durationMinutes ?? 25,
          importance: baseMeta.importance ?? "medium",
          tags: baseMeta.tags ?? ["paper-wise"]
        };
      }
    }
    
    // Remove any keys that are no longer in updatedMeta
    for (const id of Object.keys(index.modelTests)) {
      if (!updatedMeta[id]) {
        delete index.modelTests[id];
      }
    }
  }

  if (Array.isArray(index.tests)) {
    index.tests = index.tests.filter((m) => filterOut(m.id));
  }

  fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
}

function backupFile(filePath) {
  const rel = path.relative(ROOT, filePath);
  const dest = path.join(BACKUP_DIR, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(filePath, dest);
}

function processSubject(sub) {
  const filePath = path.join(QUIZ_DATA, sub.level, `${sub.slug}.json`);
  if (!fs.existsSync(filePath)) {
    return {
      paper: sub.label,
      status: "NEEDS REGENERATION",
      issuesFixed: [],
      remainingIssues: ["Subject JSON file missing"],
      actionsTaken: {},
      riskLevel: "HIGH",
    };
  }

  if (!DRY_RUN) backupFile(filePath);

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const expected = expectedMcq(sub.slug);
  const report = {
    deletedDuplicates: 0,
    deletedHidden: 0,
    deletedIncomplete: 0,
    boilerplateRemoved: 0,
    crossChapterRemoved: 0,
    legacySplit: 0,
    fixes: [],
    remaining: [],
  };

  const regenEntries = [];
  const processedEntries = [];

  function processSet(setId, rawQs, source) {
    if (isHiddenKey(setId)) {
      quarantineSet(sub.slug, setId, rawQs, "HIDDEN_LEGACY_KEY");
      report.deletedHidden++;
      report.fixes.push(`MISPLACED_CONTENT: Quarantined hidden key "${setId}" (${rawQs.length} Q)`);
      regenEntries.push({ paper: sub.label, setId, reason: "HIDDEN_LEGACY_KEY", questionCount: rawQs.length });
      return;
    }

    let qs = Array.isArray(rawQs) ? rawQs.filter((q) => q && hasValidOptions(q) && hasCorrectAnswer(q)) : [];
    if (!qs.length) {
      report.deletedIncomplete++;
      report.fixes.push(`MISSING_DATA: Removed empty/invalid set "${setId}"`);
      regenEntries.push({ paper: sub.label, setId, reason: "EMPTY_SET", questionCount: 0 });
      return;
    }

    const setChapter = extractSetChapter(setId);

    if (isLegacyBulkKey(setId) || qs.length > expected + 10) {
      const baseTitle = data.modelTestsMeta?.[setId]?.displayTitle ?? data.modelTestsMeta?.[setId]?.name ?? setId;
      const splits = splitLegacyBucket(setId, qs, expected);
      report.legacySplit += splits.length;
      report.fixes.push(`LEGACY_FORMAT: Split "${setId}" (${qs.length} Q) into ${splits.length} chunk(s)`);
      for (const split of splits) {
        if (split.complete) {
          const match = split.setId.match(/-split-(\d+)/);
          const partNum = match ? parseInt(match[1], 10) : 1;
          const displayTitle = `${baseTitle} - Part ${partNum}`;
          
          if (!data.modelTestsMeta) data.modelTestsMeta = {};
          data.modelTestsMeta[split.setId] = {
            displayTitle: displayTitle,
            name: displayTitle,
            scope: "paper",
            questionCount: split.questions.length,
            durationMinutes: 25,
            tags: ["paper-wise"]
          };

          processedEntries.push({ setId: split.setId, questions: split.questions, source: `${source}:split` });
        } else {
          report.deletedIncomplete++;
          regenEntries.push({
            paper: sub.label,
            setId: split.setId,
            reason: "LEGACY_PARTIAL_CHUNK",
            questionCount: split.questions.length,
          });
        }
      }
      deleteSidecar(sub.slug, setId);
      return;
    }

    const cross = filterCrossChapter(qs, setChapter);
    qs = cross.questions;
    report.crossChapterRemoved += cross.removed.length;
    if (cross.removed.length) {
      report.fixes.push(`CROSS_CHAPTER_MIX: Removed ${cross.removed.length} Q from "${setId}"`);
    }

    const deduped = dedupeWithinSet(qs);
    qs = deduped.questions;
    report.boilerplateRemoved += deduped.removed.length;
    if (deduped.removed.length) {
      report.fixes.push(`BOILERPLATE_REPEAT: Removed ${deduped.removed.length} duplicate Q in "${setId}"`);
    }

    qs = renumberQuestions(qs, setId);
    processedEntries.push({ setId, questions: qs, source });
  }

  for (const [setId, qs] of Object.entries(data.modelTests || {})) {
    processSet(setId, qs, "modelTests");
  }

  for (const [setId, qs] of Object.entries(data.chapters || {})) {
    if (isLegacyBulkKey(setId) || (Array.isArray(qs) && qs.length > expected + 10)) {
      processSet(setId, qs, "chapters");
    }
  }

  const fpGroups = new Map();
  for (const entry of processedEntries) {
    const fp = setFingerprint(entry.questions);
    if (!fpGroups.has(fp)) fpGroups.set(fp, []);
    fpGroups.get(fp).push(entry);
  }

  const deletedIds = [];
  const kept = [];

  for (const group of fpGroups.values()) {
    if (group.length === 1) {
      kept.push(group[0]);
      continue;
    }

    group.sort((a, b) => scoreKeeper(b.setId, b.questions, sub.slug) - scoreKeeper(a.setId, a.questions, sub.slug));
    const winner = group[0];
    kept.push(winner);

    let removedCount = 0;
    for (const loser of group.slice(1)) {
      if (isProtectedSet(loser.setId) && !isProtectedSet(winner.setId)) {
        kept.push(loser);
        continue;
      }
      removedCount++;
      deletedIds.push(loser.setId);
      quarantineSet(sub.slug, loser.setId, loser.questions, `DUPLICATE_OF_${winner.setId}`);
      deleteSidecar(sub.slug, loser.setId);
      regenEntries.push({
        paper: sub.label,
        setId: loser.setId,
        reason: "DUPLICATE_OF",
        duplicateOf: winner.setId,
        questionCount: loser.questions.length,
      });
    }

    if (removedCount) {
      report.deletedDuplicates += removedCount;
      report.fixes.push(`DUPLICATE_SET: Kept "${winner.setId}", removed ${removedCount} duplicate copy/copies`);
    }
  }

  const newModelTests = {};
  const newMeta = {};

  for (const entry of kept) {
    const { setId, questions } = entry;

    if (questions.length < expected) {
      if (questions.length < Math.ceil(expected * 0.6)) {
        report.deletedIncomplete++;
        regenEntries.push({
          paper: sub.label,
          setId,
          reason: "INCOMPLETE_AFTER_CLEANUP",
          questionCount: questions.length,
          expected,
        });
        report.fixes.push(
          `MISSING_DATA: Removed incomplete set "${setId}" (${questions.length}/${expected} Q) — NEED_REGENERATION`,
        );
        deletedIds.push(setId);
        deleteSidecar(sub.slug, setId);
        continue;
      }
      regenEntries.push({
        paper: sub.label,
        setId,
        reason: "NEED_REGENERATION",
        questionCount: questions.length,
        expected,
      });
      report.remaining.push(`"${setId}" has ${questions.length}/${expected} questions after cleanup`);
    }

    const baseId = setId.replace(/-split-\d+$/, "");
    let displayTitle = data.modelTestsMeta?.[setId]?.displayTitle ?? data.modelTestsMeta?.[setId]?.name ?? setId;
    if (baseId !== setId && (displayTitle === setId || displayTitle.includes("-split-"))) {
      const baseTitle = data.modelTestsMeta?.[baseId]?.displayTitle ?? data.modelTestsMeta?.[baseId]?.name;
      if (baseTitle) {
        const match = setId.match(/-split-(\d+)/);
        const partNum = match ? parseInt(match[1], 10) : 1;
        displayTitle = `${baseTitle} - Part ${partNum}`;
      }
    }

    newModelTests[setId] = questions;
    newMeta[setId] = {
      displayTitle: displayTitle,
      questionCount: questions.length,
      scope: extractSetChapter(setId) ? "chapter" : "paper",
      needsRegeneration: questions.length < expected,
    };
    writeSidecar(sub.slug, setId, questions);
  }

  data.modelTests = newModelTests;
  const nextModelTestsMeta = {};
  for (const [id, meta] of Object.entries(newMeta)) {
    nextModelTestsMeta[id] = {
      ...(data.modelTestsMeta?.[id] || {}),
      displayTitle: meta.displayTitle,
      name: meta.displayTitle,
      scope: meta.scope,
      questionCount: meta.questionCount,
      needsRegeneration: meta.needsRegeneration || false,
    };
  }
  data.modelTestsMeta = nextModelTestsMeta;

  if (!DRY_RUN) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    updateModelIndex(sub.level, sub.slug, deletedIds, newMeta);
  }

  let status = "FIXED";
  if (report.remaining.length || regenEntries.length) status = "PARTIALLY FIXED";
  if (Object.keys(newModelTests).length === 0 && regenEntries.length) status = "NEEDS REGENERATION";

  let riskLevel = "LOW";
  if (report.deletedDuplicates > 20 || report.deletedIncomplete > 5) riskLevel = "MEDIUM";
  if (report.deletedDuplicates > 100 || Object.keys(newModelTests).length < 5) riskLevel = "HIGH";

  return {
    paper: sub.label,
    status,
    issuesFixed: report.fixes,
    remainingIssues: report.remaining,
    needsRegeneration: regenEntries,
    actionsTaken: {
      deletedDuplicates: report.deletedDuplicates,
      crossChapterRemoved: report.crossChapterRemoved,
      boilerplateRemoved: report.boilerplateRemoved,
      legacySplit: report.legacySplit,
      deletedIncomplete: report.deletedIncomplete,
      deletedHidden: report.deletedHidden,
      setsKept: Object.keys(newModelTests).length,
    },
    riskLevel,
  };
}

function main() {
  console.log(DRY_RUN ? "DRY RUN — no files will be written\n" : "LIVE RUN — backing up and fixing data\n");

  if (!DRY_RUN) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log("Backup dir:", BACKUP_DIR);
  }

  const allReports = [];
  const allRegen = [];

  for (const sub of SUBJECTS) {
    console.log(`Processing ${sub.label}...`);
    const r = processSubject(sub);
    allReports.push(r);
    allRegen.push(...(r.needsRegeneration || []));
    console.log(
      `  → ${r.status} | kept ${r.actionsTaken?.setsKept ?? 0} sets | dup deleted ${r.actionsTaken?.deletedDuplicates ?? 0}`,
    );
  }

  if (!DRY_RUN) {
    require("./rebuild-manifest.js");
    fs.mkdirSync(path.dirname(REGEN_PATH), { recursive: true });
    fs.writeFileSync(
      REGEN_PATH,
      `${JSON.stringify({ generatedAt: new Date().toISOString(), total: allRegen.length, entries: allRegen }, null, 2)}\n`,
      "utf8",
    );
  }

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(allReports, null, 2)}\n`, "utf8");
  console.log("\nReport:", REPORT_PATH);
  if (!DRY_RUN) console.log("Regeneration list:", REGEN_PATH);
  console.log("Done.");
}

main();
