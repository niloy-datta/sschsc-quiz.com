/**
 * Extract Chemistry 2nd Paper Hyper Mega Hot sets from parent transcript
 * and write data/imports/chemistry-2nd-sets/set-01.json … set-05.json
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TRANSCRIPT =
  process.env.TRANSCRIPT ||
  "C:/Users/Niloy Chandra/.cursor/projects/c-Users-Niloy-Chandra-Documents-dev-quiz-dashboard/agent-transcripts/6018f294-d3c8-4bb3-86b0-706e3d77561d/6018f294-d3c8-4bb3-86b0-706e3d77561d.jsonl";
const OUT_DIR = path.join(ROOT, "data/imports/chemistry-2nd-sets");

function getUserTexts(lines) {
  const texts = [];
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj.role !== "user") continue;
      const text = (obj.message?.content ?? [])
        .filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("\n");
      texts.push(text);
    } catch {
      /* skip */
    }
  }
  return texts;
}

function tryParseArray(text) {
  const markers = ["Chemistry 2nd Paper", "রসায়ন ২", "subject_code\": 176"];
  const hasChem = markers.some((m) => text.includes(m));
  const idx = text.indexOf("[");
  if (idx < 0) return null;

  const slice = text.slice(idx);
  try {
    const arr = JSON.parse(slice);
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const first = arr[0];
    if (!first.questions?.length) return null;
    if (!hasChem && !text.includes("Chemistry")) {
      const topic = first.questions[0]?.topic || "";
      const chemTopics = /organic|polymer|aldehyde|carboxyl|amine|alcohol|benzene|জৈব|অ্যাল|কার্ব|পলিমার|ইথ|বেনজিন/i;
      if (!chemTopics.test(topic)) return null;
    }
    return arr;
  } catch {
    return null;
  }
}

function tryParseExamObject(text) {
  const idx = text.indexOf('{"exam"');
  if (idx < 0) return null;
  try {
    const obj = JSON.parse(text.slice(idx));
    if (!obj.sets?.length) return null;
    if (!text.includes("Chemistry") && !text.includes("রসায়ন")) return null;
    return obj.sets.map((s, i) => ({
      setNumber: s.set_id ?? s.setNumber ?? i + 1,
      subject: "Chemistry 2nd Paper",
      questions: s.questions,
    }));
  } catch {
    return null;
  }
}

function extractSets(lines) {
  for (const text of getUserTexts(lines)) {
    const fromArray = tryParseArray(text);
    if (fromArray?.length) return fromArray;
    const fromExam = tryParseExamObject(text);
    if (fromExam?.length) return fromExam;
  }
  return null;
}

function writeSets(sets) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const results = [];
  for (let i = 0; i < Math.min(5, sets.length); i += 1) {
    const s = sets[i];
    const n = s.setNumber ?? s.set_id ?? i + 1;
    const out = {
      setNumber: n,
      subject: s.subject ?? "Chemistry 2nd Paper",
      questions: s.questions,
    };
    const file = path.join(OUT_DIR, `set-${String(n).padStart(2, "0")}.json`);
    fs.writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`, "utf8");
    results.push({ file, count: out.questions.length });
  }
  return results;
}

function main() {
  const lines = fs.readFileSync(TRANSCRIPT, "utf8").split("\n").filter(Boolean);
  const sets = extractSets(lines);
  if (!sets) {
    console.error("No Chemistry 2nd Paper set data found in transcript.");
    process.exit(1);
  }
  console.log(`Found ${sets.length} sets in transcript`);
  const results = writeSets(sets);
  for (const r of results) {
    JSON.parse(fs.readFileSync(r.file, "utf8"));
    console.log(`${path.basename(r.file)}: ${r.count} questions`);
  }
}

main();
