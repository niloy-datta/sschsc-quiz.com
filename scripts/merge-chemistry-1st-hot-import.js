/**
 * Merge chemistry-1st set files into import array JSON.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "data", "imports", "chemistry-1st-sets");
const { fixSet } = require("./fix-chemistry-1st-hot-answers");

const argSets = process.argv.slice(2).map(Number).filter((n) => n > 0);
const setNumbers = argSets.length ? argSets : [1, 2];
const outArg = process.argv.find((a) => a.startsWith("--out="));
const OUT = outArg
  ? path.join(ROOT, outArg.slice("--out=".length))
  : path.join(
      ROOT,
      "data",
      "imports",
      setNumbers.length === 1
        ? `hsc-chemistry-1st-paper-hot-set-${String(setNumbers[0]).padStart(2, "0")}.json`
        : `hsc-chemistry-1st-paper-hot-sets-${String(setNumbers[0]).padStart(2, "0")}-${String(setNumbers[setNumbers.length - 1]).padStart(2, "0")}.json`,
    );

const sets = setNumbers.map((n) => {
  const file = path.join(DIR, `set-${String(n).padStart(2, "0")}.json`);
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing set file: ${file}`);
    process.exit(1);
  }
  return fixSet(JSON.parse(fs.readFileSync(file, "utf8")));
});

fs.writeFileSync(OUT, `${JSON.stringify(sets, null, 2)}\n`, "utf8");
console.log(`✅ Merged ${sets.length} sets → ${OUT}`);
