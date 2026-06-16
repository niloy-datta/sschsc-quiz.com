import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DIR = path.join(ROOT, "public/questions/chemistry-1st-paper");

// Load the full 25-question Dinajpur set as reference
const dinajpur = JSON.parse(fs.readFileSync(path.join(DIR, "dinajpur-2025.json"), "utf8"));
const dMap = new Map();
for (const q of dinajpur) {
  const key = q.text.replace(/\s+/g, " ").trim();
  dMap.set(key, q);
}

console.log("Dinajpur reference: " + dinajpur.length + " questions\n");

// Check each incomplete board
const boards = ["barishal", "chattogram", "cumilla", "jashore", "mymensingh", "rajshahi", "sylhet"];

for (const board of boards) {
  const filePath = path.join(DIR, board + "-2025.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const existing = Array.isArray(data) ? data : [];

  console.log(board + ": " + existing.length + " existing questions");

  // Check which ones match
  let matchCount = 0;
  const unmatchedExisting = [];
  for (const q of existing) {
    const key = q.text.replace(/\s+/g, " ").trim();
    if (dMap.has(key)) matchCount++;
    else unmatchedExisting.push(q.text.slice(0, 60));
  }

  // Find the missing ones
  const existingKeys = new Set();
  for (const q of existing) {
    existingKeys.add(q.text.replace(/\s+/g, " ").trim());
  }

  const missing = [];
  for (const q of dinajpur) {
    const key = q.text.replace(/\s+/g, " ").trim();
    if (!existingKeys.has(key)) {
      missing.push(q);
    }
  }

  console.log("  Matching dinajpur: " + matchCount + "/" + existing.length);
  console.log("  Missing questions to add: " + missing.length);
  if (missing.length > 0) {
    console.log("  First missing: " + missing[0].text.slice(0, 60));
    console.log("  Last missing:  " + missing[missing.length - 1].text.slice(0, 60));
  }
  console.log("");
}
