import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const D = JSON.parse(fs.readFileSync(path.join(ROOT, "public/questions/chemistry-1st-paper/dinajpur-2025.json"), "utf8"));
const D2 = JSON.parse(fs.readFileSync(path.join(ROOT, "public/questions/chemistry-1st-paper/dhaka-2025.json"), "utf8"));

const dTexts = D.map(q => q.text.trim());
const dhaTexts = new Set(D2.map(q => q.text.trim()));

console.log("Dinajpur: " + D.length);
console.log("Dhaka: " + D2.length);

let missingCount = 0;
for (let i = 0; i < dTexts.length; i++) {
  if (!dhaTexts.has(dTexts[i])) {
    console.log("MISSING Q" + i + ": " + dTexts[i].slice(0, 60));
    missingCount++;
  }
}
if (missingCount === 0) {
  console.log("No missing questions - Dhaka already has all 25 unique questions!");
  // Check duplicate text instead
  console.log("\nChecking for duplicates or different versions...");
  for (let i = 0; i < D.length; i++) {
    console.log("D" + i + " = DHAKA includes: " + dhaTexts.has(dTexts[i]));
  }
}
