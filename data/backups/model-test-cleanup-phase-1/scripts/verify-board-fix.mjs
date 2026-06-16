import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const Q = path.join(ROOT, "public/questions/chemistry-1st-paper");
const A = path.join(ROOT, "backend/data/answers/chemistry-1st-paper");

const boards = ["barishal","chattogram","cumilla","dhaka","dinajpur","jashore","mymensingh","rajshahi","sylhet"];
let ok = 0, err = 0;

for (const b of boards) {
  const q = JSON.parse(fs.readFileSync(path.join(Q, b + "-2025.json"), "utf8"));
  const a = JSON.parse(fs.readFileSync(path.join(A, b + "-2025.answers.json"), "utf8"));
  const aKeys = Object.keys(a);
  const qIds = q.map(x => x.id);
  const match = aKeys.filter(k => qIds.includes(k)).length;
  const rmatch = qIds.filter(id => aKeys.includes(id)).length;

  if (q.length === 25 && match === 25 && rmatch === 25) {
    console.log("OK  " + b + "  25q answers=25 match=25/25");
    ok++;
  } else {
    console.log("ERR " + b + "  q=" + q.length + " ans=" + aKeys.length + " match=" + match + " rmatch=" + rmatch);
    for (const id of aKeys) { if (!qIds.includes(id)) console.log("  EXTRA answer: " + id.slice(-30)); }
    for (const id of qIds) { if (!aKeys.includes(id)) console.log("  MISS Q: " + id.slice(-30)); }
    err++;
  }
}
console.log("\nOK: " + ok + " boards, ERR: " + err + " boards");
