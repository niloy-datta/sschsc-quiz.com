/**
 * Export ALL SSC question sets to readable text files + zip archive.
 * Usage: npm run data:export-ssc-text
 *    or: node scripts/export-all-ssc-quiz-text.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_ROOT = path.join(ROOT, "public", "questions");
const ANSWERS_ROOT = path.join(ROOT, "backend", "data", "answers");
const OUT_ROOT = path.join(ROOT, "data", "quiz-text");
const ZIP_PATH = path.join(ROOT, "data", "ssc-all-questions-text.zip");
const MANIFEST_PATH = path.join(OUT_ROOT, "ssc-all-questions-manifest.txt");

const LABELS = ["ক", "খ", "গ", "ঘ"];

function exportSubject(subjectSlug) {
  const questionsDir = path.join(QUESTIONS_ROOT, subjectSlug);
  const answersDir = path.join(ANSWERS_ROOT, subjectSlug);
  const outDir = path.join(OUT_ROOT, `ssc-${subjectSlug}`);

  if (!fs.existsSync(questionsDir)) return { exported: [], pruned: 0 };

  const files = fs
    .readdirSync(questionsDir)
    .filter((f) => f.startsWith("ssc-") && f.endsWith(".json") && f !== "index.json")
    .sort();

  if (!files.length) return { exported: [], pruned: 0 };

  fs.mkdirSync(outDir, { recursive: true });
  const exported = [];

  for (const file of files) {
    const setId = file.replace(/\.json$/, "");
    const qs = JSON.parse(fs.readFileSync(path.join(questionsDir, file), "utf8"));
    if (!Array.isArray(qs) || !qs.length) continue;

    const ansPath = path.join(answersDir, `${setId}.answers.json`);
    const answers = fs.existsSync(ansPath)
      ? JSON.parse(fs.readFileSync(ansPath, "utf8"))
      : {};

    const lines = [`# ${setId}`, `# Subject: ${subjectSlug}`, `# Questions: ${qs.length}`, ""];

    qs.forEach((q, i) => {
      const text = String(q.text ?? q.questionText ?? q.question ?? "").trim();
      const options =
        q.options ??
        [q.optionA, q.optionB, q.optionC, q.optionD].filter((o) => o != null && String(o).trim());

      const ans = answers[q.id];
      let ansLabel = "?";
      if (ans && typeof ans.answerIndex === "number") {
        ansLabel = LABELS[ans.answerIndex] ?? String(ans.answer ?? "?");
      } else if (ans?.answer) {
        ansLabel = String(ans.answer);
      } else if (q.correctOption) {
        const map = { A: "ক", B: "খ", C: "গ", D: "ঘ" };
        ansLabel = map[q.correctOption] ?? q.correctOption;
      }

      lines.push(`Q${i + 1}. ${text}`);
      options.forEach((o, j) => {
        if (LABELS[j]) lines.push(`  ${LABELS[j]}) ${o}`);
      });
      lines.push(`  ✓ ${ansLabel}`);
      lines.push("");
    });

    const outFile = path.join(outDir, `${setId}.txt`);
    fs.writeFileSync(outFile, `${lines.join("\n")}\n`, "utf8");
    exported.push({
      subject: subjectSlug,
      setId,
      relativePath: path.relative(ROOT, outFile).replace(/\\/g, "/"),
      questionCount: qs.length,
    });
  }

  let pruned = 0;
  const keep = new Set(exported.map((e) => `${e.setId}.txt`));
  for (const f of fs.readdirSync(outDir)) {
    if (!f.endsWith(".txt") || keep.has(f)) continue;
    fs.unlinkSync(path.join(outDir, f));
    pruned++;
  }

  return { exported, pruned };
}

function writeManifest(allExports) {
  const lines = [
    "SSC All Questions — Text Export Manifest",
    `Generated: ${new Date().toISOString()}`,
    `Total sets: ${allExports.length}`,
    `Zip: ${path.relative(ROOT, ZIP_PATH).replace(/\\/g, "/")}`,
    "",
  ];

  let lastSubject = "";
  for (const row of allExports) {
    if (row.subject !== lastSubject) {
      lines.push(`\n## ${row.subject.toUpperCase()}`);
      lastSubject = row.subject;
    }
    lines.push(`${row.relativePath}\t(${row.questionCount} Q)`);
  }

  fs.mkdirSync(OUT_ROOT, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, `${lines.join("\n")}\n`, "utf8");
}

function createZip() {
  fs.mkdirSync(path.dirname(ZIP_PATH), { recursive: true });
  if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);

  const ps1Path = path.join(ROOT, "data", "_zip-ssc-export.ps1");
  const zipEsc = ZIP_PATH.replace(/'/g, "''");
  const outEsc = OUT_ROOT.replace(/'/g, "''");
  const manEsc = MANIFEST_PATH.replace(/'/g, "''");
  const ps1 = [
    "$ErrorActionPreference = 'Stop'",
    `if (Test-Path -LiteralPath '${zipEsc}') { Remove-Item -LiteralPath '${zipEsc}' -Force }`,
    `$folders = @(Get-ChildItem -LiteralPath '${outEsc}' -Directory | Where-Object { $_.Name -like 'ssc-*' } | ForEach-Object { $_.FullName })`,
    `$manifest = '${manEsc}'`,
    "if (-not $folders.Count) { throw 'No SSC text folders found' }",
    `Compress-Archive -Path ($folders + $manifest) -DestinationPath '${zipEsc}' -Force`,
  ].join("\n");

  fs.writeFileSync(ps1Path, ps1, "utf8");
  try {
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${ps1Path}"`, {
      stdio: "inherit",
    });
  } finally {
    if (fs.existsSync(ps1Path)) fs.unlinkSync(ps1Path);
  }
}

function main() {
  console.log("=== Export SSC questions → text + zip ===\n");

  const subjects = fs
    .readdirSync(QUESTIONS_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const allExports = [];
  let totalPruned = 0;

  for (const subject of subjects) {
    const { exported, pruned } = exportSubject(subject);
    if (!exported.length && !pruned) continue;
    const pruneNote = pruned ? `, pruned ${pruned} stale` : "";
    console.log(`${subject}: ${exported.length} text file(s)${pruneNote}`);
    allExports.push(...exported);
    totalPruned += pruned;
  }

  allExports.sort((a, b) =>
    a.subject === b.subject ? a.setId.localeCompare(b.setId) : a.subject.localeCompare(b.subject),
  );

  writeManifest(allExports);
  createZip();

  console.log("\n--- Done ---");
  console.log(`Sets exported : ${allExports.length}`);
  if (totalPruned) console.log(`Stale removed : ${totalPruned}`);
  console.log(`Manifest      : ${MANIFEST_PATH}`);
  console.log(`Zip           : ${ZIP_PATH}`);
}

main();
