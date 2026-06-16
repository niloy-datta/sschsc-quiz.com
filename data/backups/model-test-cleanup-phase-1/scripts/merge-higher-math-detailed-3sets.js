/**
 * Merge higher-math-detailed set files into one import JSON.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "data", "imports", "higher-math-detailed");
const OUT = path.join(ROOT, "data", "imports", "hsc-higher-math-1st-detailed-3sets.json");

const metadata = JSON.parse(fs.readFileSync(path.join(DIR, "metadata.json"), "utf8"));
const model_tests = [1, 2, 3].map((n) =>
  JSON.parse(fs.readFileSync(path.join(DIR, `set-0${n}.json`), "utf8")),
);

const payload = { metadata, model_tests };
fs.writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`✅ Merged → ${OUT}`);
console.log(`   Sets: ${model_tests.length}, Q/set: ${model_tests[0].questions.length}`);
