/**
 * Fix broken Ohm's law options: {(v+r)} → plausible wrong V+R value.
 */
const fs = require("fs");
const path = require("path");

const QUESTIONS_DIR = path.join(__dirname, "..", "public", "questions");

function collectQuestions(data) {
  if (Array.isArray(data)) return { list: data, isRoot: true };
  if (Array.isArray(data.questions)) return { list: data.questions, isRoot: false, parent: data, key: "questions" };
  return null;
}

function extractVR(text) {
  const r = text.match(/রোধ\s*(\d+(?:\.\d+)?)\s*Ω/i);
  const v = text.match(/বিভব\s*পার্থক্য\s*(\d+(?:\.\d+)?)\s*V/i);
  if (!r || !v) return null;
  return { r: parseFloat(r[1]), v: parseFloat(v[1]) };
}

function fixOptions(q) {
  const opts = q.options;
  if (!Array.isArray(opts)) return false;
  const hasBroken = opts.some((o) => /\{\(v\+r\)\}/i.test(String(o)));
  if (!hasBroken) return false;

  const vr = extractVR(String(q.text || q.questionText || q.question || ""));
  const wrong = vr ? `${vr.v + vr.r} A` : "V+R A";

  q.options = opts.map((o) =>
    String(o).replace(/\{\(v\+r\)\}\s*(A\s*)?/gi, wrong),
  );
  return true;
}

function walkDir(dir, stats) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(p, stats);
    else if (ent.name.endsWith(".json") && ent.name !== "index.json") {
      const data = JSON.parse(fs.readFileSync(p, "utf8"));
      const wrapped = collectQuestions(data);
      if (!wrapped) continue;
      let changed = false;
      for (const q of wrapped.list) {
        if (fixOptions(q)) {
          stats.fixed++;
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, "utf8");
        stats.files++;
      }
    }
  }
}

function main() {
  const stats = { fixed: 0, files: 0 };
  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    const dir = path.join(QUESTIONS_DIR, subject);
    if (fs.statSync(dir).isDirectory()) walkDir(dir, stats);
  }
  console.log(`Fixed {(v+r)} in ${stats.fixed} questions across ${stats.files} files`);
}

main();
