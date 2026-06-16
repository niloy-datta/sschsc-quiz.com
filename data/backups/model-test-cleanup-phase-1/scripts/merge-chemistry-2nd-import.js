const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const dir = path.join(ROOT, "data/imports/chemistry-2nd-sets");
const outPath = path.join(ROOT, "data/imports/hsc-chemistry-2nd-hyper-mega-hot-10sets.json");

const files = fs
  .readdirSync(dir)
  .filter((f) => /^set-\d+\.json$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

if (!files.length) {
  console.error(`No set files in ${dir}`);
  process.exit(1);
}

const sets = files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));

const payload = [
  ...sets.map((s) => ({
    setNumber: s.setNumber ?? s.set_id,
    subject: s.subject ?? "Chemistry 2nd Paper",
    questions: s.questions,
  })),
];

fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
const qCount = sets.reduce((sum, s) => sum + s.questions.length, 0);
console.log(`Merged ${sets.length} sets (${qCount} questions) → ${outPath}`);
