const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const dir = path.join(ROOT, "data/imports/higher-math-1st-sets");
const outPath = path.join(ROOT, "data/imports/hsc-higher-math-1st-hyper-mega-hot.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const exam = readJson(path.join(dir, "exam.json"));
const sets = [];
for (let i = 1; i <= 10; i += 1) {
  const file = path.join(dir, `set-${String(i).padStart(2, "0")}.json`);
  if (!fs.existsSync(file)) {
    console.error(`Missing ${file}`);
    process.exit(1);
  }
  sets.push(readJson(file));
}

const payload = { exam, sets };
fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
const qCount = sets.reduce((s, x) => s + x.questions.length, 0);
console.log(`Merged ${sets.length} sets (${qCount} questions) → ${outPath}`);
