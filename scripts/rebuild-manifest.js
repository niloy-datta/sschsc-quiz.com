/**
 * Rebuild public/quiz-data/manifest.json by compiling chapters, model tests, and board questions counts.
 * Run: node scripts/rebuild-manifest.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");

function rebuildManifest() {
  const manifest = { ssc: {}, hsc: {} };
  const sscDir = path.join(PUBLIC, "quiz-data", "ssc");
  const hscDir = path.join(PUBLIC, "quiz-data", "hsc");

  function processDir(dir, level) {
    if (!fs.existsSync(dir)) return;
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith(".json") && !file.endsWith(".model-tests.index.json") && file !== "manifest.json") {
        const subject = file.replace(".json", "");
        const filePath = path.join(dir, file);
        
        let data;
        try {
          data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        } catch (err) {
          console.error(`Error parsing ${filePath}:`, err.message);
          continue;
        }
        
        manifest[level][subject] = {
          chapters: {},
          modelTests: {},
          boardQuestions: {}
        };
        
        // Chapters
        if (data.chapters) {
          for (const [ch, qs] of Object.entries(data.chapters)) {
            manifest[level][subject].chapters[ch] = { questionCount: Array.isArray(qs) ? qs.length : 0 };
          }
        }
        
        // Model Tests
        if (data.modelTests) {
          for (const [mt, qs] of Object.entries(data.modelTests)) {
            manifest[level][subject].modelTests[mt] = { questionCount: Array.isArray(qs) ? qs.length : 0 };
          }
        }
        
        // Board Questions
        if (data.boardQuestions) {
          for (const [year, boards] of Object.entries(data.boardQuestions)) {
            manifest[level][subject].boardQuestions[year] = {};
            for (const [board, qs] of Object.entries(boards)) {
              manifest[level][subject].boardQuestions[year][board] = { questionCount: Array.isArray(qs) ? qs.length : 0 };
            }
          }
        }
      }
    }
  }

  processDir(sscDir, "ssc");
  processDir(hscDir, "hsc");

  fs.writeFileSync(
    path.join(PUBLIC, "quiz-data", "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );
  console.log("✓ Successfully rebuilt public/quiz-data/manifest.json");
}

rebuildManifest();
