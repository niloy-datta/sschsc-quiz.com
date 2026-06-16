/**
 * Remove all quiz diagram SVG assets and clear image references from question JSON.
 * Source pack in professional_svg_all_questions_pack/ is NOT touched.
 *
 * Usage: node scripts/delete-all-quiz-svg.js [--keep-json]
 *   --keep-json  Delete SVG files only; leave question image fields unchanged.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUIZ_IMG_DIR = path.join(ROOT, "public", "images", "quiz");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");

const keepJson = process.argv.includes("--keep-json");

function deleteAllSvgs(dir, stats) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      deleteAllSvgs(p, stats);
      // Remove empty dirs except the root quiz folder
      if (p !== QUIZ_IMG_DIR) {
        try {
          if (fs.readdirSync(p).length === 0) fs.rmdirSync(p);
        } catch {
          /* non-empty */
        }
      }
    } else if (ent.name.endsWith(".svg")) {
      fs.unlinkSync(p);
      stats.deleted++;
    }
  }
}

function collectQuestions(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.questions)) return data.questions;
  return null;
}

function clearQuestionImages(stats) {
  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    const subjectDir = path.join(QUESTIONS_DIR, subject);
    if (!fs.statSync(subjectDir).isDirectory()) continue;

    const walk = (dir) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          walk(p);
          continue;
        }
        if (!ent.name.endsWith(".json") || ent.name === "index.json") continue;

        const data = JSON.parse(fs.readFileSync(p, "utf8"));
        const list = collectQuestions(data);
        if (!list) continue;

        let changed = false;
        for (const q of list) {
          if (q.image != null) {
            q.image = null;
            stats.imagesCleared++;
            changed = true;
          }
          if (q.svg != null) {
            delete q.svg;
            changed = true;
          }
          if (Array.isArray(q.optionImages) && q.optionImages.length) {
            delete q.optionImages;
            stats.optionImagesCleared++;
            changed = true;
          }
        }

        if (changed) {
          fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, "utf8");
          stats.filesUpdated++;
        }
      }
    };

    walk(subjectDir);
  }
}

function main() {
  const stats = { deleted: 0, imagesCleared: 0, optionImagesCleared: 0, filesUpdated: 0 };

  console.log("Deleting all SVG files under public/images/quiz/ ...");
  deleteAllSvgs(QUIZ_IMG_DIR, stats);
  console.log(`Deleted ${stats.deleted} SVG files.`);

  if (!keepJson) {
    console.log("Clearing image / optionImages from question JSON ...");
    clearQuestionImages(stats);
    console.log(`Cleared image on ${stats.imagesCleared} questions.`);
    console.log(`Cleared optionImages on ${stats.optionImagesCleared} questions.`);
    console.log(`Updated ${stats.filesUpdated} JSON files.`);
  } else {
    console.log("Skipped JSON cleanup (--keep-json).");
  }

  console.log("Done. Add new SVGs to public/images/quiz/ and set question image fields.");
}

main();
