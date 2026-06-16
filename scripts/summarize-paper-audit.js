/**
 * Summarize audit report for user-facing output.
 * Run: node scripts/summarize-paper-audit.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUIZ_DATA = path.join(ROOT, "public/quiz-data");
const issues = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/paper-model-audit-report.json"), "utf8"));

const SUBJECTS = [
  ...["physics", "chemistry", "biology", "higher-math", "general-math"].map((s) => ({
    level: "ssc",
    slug: s,
    label: `SSC ${s.replace("general-math", "General Math").replace("higher-math", "Higher Math")}`,
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
    ["ict", "HSC ICT"],
  ].map(([slug, label]) => ({ level: "hsc", slug, label })),
];

function loadSubject(sub) {
  const f = path.join(QUIZ_DATA, sub.level, `${sub.slug}.json`);
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, "utf8"));
}

const summary = [];

for (const sub of SUBJECTS) {
  const data = loadSubject(sub);
  if (!data) {
    summary.push({
      name: sub.label,
      status: "Problem Found",
      type: "Missing",
      details: "Subject JSON file missing",
      fix: "Restore data file",
    });
    continue;
  }

  const modelTests = data.modelTests || {};
  const setIds = Object.keys(modelTests).sort();
  const paperIssues = issues.filter(
    (i) => i.paper.startsWith(sub.label) && !i.paper.includes("(duplicate sets)"),
  );
  const dupSetIssues = issues.filter((i) => i.paper === `${sub.label} (duplicate sets)`);

  const types = {};
  for (const i of paperIssues) types[i.type] = (types[i.type] || 0) + 1;

  const mixed = paperIssues.filter((i) => i.type === "Mixed");
  const wrongSerial = paperIssues.filter((i) => i.type === "Wrong Serial");
  const wrongPlace = paperIssues.filter((i) => i.type === "Wrong Placement");
  const missing = paperIssues.filter((i) => i.type === "Missing");
  const duplicate = paperIssues.filter((i) => i.type === "Duplicate");
  const other = paperIssues.filter((i) => i.type === "Other");

  const hasProblems =
    mixed.length + wrongSerial.length + wrongPlace.length + missing.length + duplicate.length + other.length + dupSetIssues.length > 0;

  if (!hasProblems) {
    summary.push({
      name: sub.label,
      status: "Correct",
      type: "-",
      details: `${setIds.length} model test sets; no structural issues detected`,
      fix: "-",
    });
    continue;
  }

  const parts = [];
  if (dupSetIssues.length) {
    parts.push(`${dupSetIssues.length} duplicate-set group(s) — identical full sets repeated`);
    for (const d of dupSetIssues.slice(0, 3)) parts.push(`  • ${d.details}`);
  }
  if (mixed.length) {
    parts.push(`${mixed.length} index/sidecar sync or wrong-paper slug issue(s)`);
    for (const m of mixed.slice(0, 3)) parts.push(`  • ${m.paper.replace(sub.label + " / ", "")}: ${m.details}`);
  }
  if (duplicate.length) {
    parts.push(`${duplicate.length} within-set duplicate question(s) (same text repeated inside one set)`);
  }
  if (missing.length) {
    parts.push(`${missing.length} missing-data issue(s)`);
    for (const m of missing.slice(0, 3)) parts.push(`  • ${m.details}`);
  }
  if (wrongSerial.length) {
    parts.push(`${wrongSerial.length} wrong serial number(s)`);
  }
  if (wrongPlace.length) {
    parts.push(`${wrongPlace.length} wrong chapter/placement issue(s)`);
  }
  if (other.length) {
    parts.push(`${other.length} unusual question count(s)`);
  }

  let primaryType = "Other";
  const counts = [
    ["Duplicate", dupSetIssues.length + duplicate.length],
    ["Mixed", mixed.length],
    ["Missing", missing.length],
    ["Wrong Serial", wrongSerial.length],
    ["Wrong Placement", wrongPlace.length],
    ["Other", other.length],
  ].sort((a, b) => b[1] - a[1]);
  if (counts[0][1] > 0) primaryType = counts[0][0];

  summary.push({
    name: sub.label,
    status: "Problem Found",
    type: primaryType,
    details: parts.join("\n"),
    fix: dupSetIssues.length
      ? "Delete duplicate sets; keep one canonical copy per unique content"
      : duplicate.length
        ? "Regenerate or dedupe repeated questions within affected sets"
        : mixed.length
          ? "Sync index/sidecar files; fix wrong-paper slugs"
          : "Review flagged sets manually",
    setCount: setIds.length,
    issueCounts: { mixed: mixed.length, duplicate, missing: missing.length, wrongSerial: wrongSerial.length, wrongPlace: wrongPlace.length, other: other.length, dupSets: dupSetIssues.length },
  });
}

// Per-set duplicate groups detail
console.log("\n=== DUPLICATE SET GROUPS (identical full sets) ===\n");
for (const i of issues.filter((x) => x.paper.includes("(duplicate sets)"))) {
  console.log(i.paper);
  console.log(" ", i.details.slice(0, 200));
  console.log("");
}

console.log("\n=== MIXED / WRONG PAPER / INDEX SYNC ===\n");
for (const i of issues.filter((x) => x.type === "Mixed")) {
  console.log(i.paper);
  console.log(" ", i.details);
  console.log("");
}

console.log("\n=== SUBJECT SUMMARY ===\n");
for (const s of summary) {
  console.log(`Paper/Model Test: ${s.name}`);
  console.log(`Status: ${s.status}`);
  console.log(`Problem Type: ${s.type}`);
  console.log(`Details: ${(s.details || "").replace(/\n/g, " | ")}`);
  console.log(`Correction Needed: ${s.fix}`);
  console.log("---");
}

fs.writeFileSync(path.join(ROOT, "scripts/paper-model-audit-summary.json"), JSON.stringify(summary, null, 2));
