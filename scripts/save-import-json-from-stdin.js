/**
 * Reads JSON from a file or stdin and writes normalized JSON to target path.
 * Usage:
 *   node scripts/save-import-json-from-stdin.js <output-path> [input-path]
 *   type raw.json | node scripts/save-import-json-from-stdin.js out.json
 */
const fs = require("fs");

const outPath = process.argv[2];
const inPath = process.argv[3];

if (!outPath) {
  console.error("Usage: node scripts/save-import-json-from-stdin.js <output-path> [input-path]");
  process.exit(1);
}

function fixAndParse(raw) {
  const fixed = raw.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
  return JSON.parse(fixed);
}

function finish(raw) {
  try {
    const parsed = fixAndParse(raw);
    fs.writeFileSync(outPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
    const sets = parsed.sets ?? (Array.isArray(parsed) ? parsed : []);
    const count = Array.isArray(sets)
      ? sets.reduce((s, x) => s + (x.questions?.length ?? 0), 0)
      : 0;
    console.log(
      `Saved ${Array.isArray(sets) ? sets.length : parsed.sets?.length ?? 0} sets, ${count} questions → ${outPath}`,
    );
  } catch (err) {
    console.error("JSON parse failed:", err.message);
    process.exit(1);
  }
}

if (inPath) {
  finish(fs.readFileSync(inPath, "utf8"));
} else {
  const chunks = [];
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (c) => chunks.push(c));
  process.stdin.on("end", () => finish(chunks.join("")));
}
