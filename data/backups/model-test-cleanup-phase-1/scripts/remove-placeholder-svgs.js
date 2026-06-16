/**
 * Remove all placeholder "Question-specific reference SVG" checkmark cards from the database.
 * Run: node scripts/remove-placeholder-svgs.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const QUIZ_DATA = path.join(PUBLIC, "quiz-data");

function getPlaceholderPaths() {
  const placeholders = new Set();
  
  function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) {
        walk(p);
      } else if (f.endsWith(".svg")) {
        try {
          const content = fs.readFileSync(p, "utf8");
          if (content.includes("Question-specific reference SVG")) {
            const rel = path.relative(PUBLIC, p).replace(/\\/g, "/");
            placeholders.add("/" + rel);
          }
        } catch (err) {
          // Skip unreadable files
        }
      }
    }
  }
  
  walk(PUBLIC);
  return placeholders;
}

function cleanMegaJson() {
  const placeholders = getPlaceholderPaths();
  console.log(`Found ${placeholders.size} placeholder SVG paths.`);

  for (const level of ["ssc", "hsc"]) {
    const dir = path.join(QUIZ_DATA, level);
    if (!fs.existsSync(dir)) continue;

    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".json") || file.endsWith(".model-tests.index.json") || file === "manifest.json") continue;

      const filePath = path.join(dir, file);
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      let modified = false;

      function cleanQs(qs) {
        if (!Array.isArray(qs)) return;
        for (const q of qs) {
          if (q.image && placeholders.has(q.image)) {
            q.image = null;
            modified = true;
          }
        }
      }

      if (data.chapters) {
        for (const ch of Object.keys(data.chapters)) {
          cleanQs(data.chapters[ch]);
        }
      }

      if (data.modelTests) {
        for (const mt of Object.keys(data.modelTests)) {
          cleanQs(data.modelTests[mt]);
        }
      }

      if (data.boardQuestions) {
        for (const year of Object.keys(data.boardQuestions)) {
          for (const board of Object.keys(data.boardQuestions[year])) {
            cleanQs(data.boardQuestions[year][board]);
          }
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
        console.log(`✓ Updated ${filePath}`);
      }
    }
  }
}

cleanMegaJson();
