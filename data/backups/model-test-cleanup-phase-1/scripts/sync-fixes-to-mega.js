/**
 * Sync sidecar corrections (stems, options, answers, images) back into mega JSON files.
 * Run: node scripts/sync-fixes-to-mega.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUIZ_DATA = path.join(ROOT, "public", "quiz-data");
const QUESTIONS = path.join(ROOT, "public", "questions");

function findMegaJson(subjectSlug) {
  for (const level of ["ssc", "hsc"]) {
    const p = path.join(QUIZ_DATA, level, `${subjectSlug}.json`);
    if (fs.existsSync(p)) return { path: p, level };
  }
  return null;
}

function syncBack() {
  const subjects = fs.readdirSync(QUESTIONS).filter(name => {
    return fs.statSync(path.join(QUESTIONS, name)).isDirectory();
  });

  for (const subject of subjects) {
    const mega = findMegaJson(subject);
    if (!mega) continue;

    console.log(`Syncing back ${subject} to mega JSON ${mega.path}...`);
    const megaData = JSON.parse(fs.readFileSync(mega.path, "utf8"));
    let modified = false;

    const subjectDir = path.join(QUESTIONS, subject);
    for (const file of fs.readdirSync(subjectDir)) {
      if (!file.endsWith(".json") || file === "index.json") continue;

      const setId = file.replace(".json", "");
      const sidecarPath = path.join(subjectDir, file);
      
      let sidecarQs;
      try {
        sidecarQs = JSON.parse(fs.readFileSync(sidecarPath, "utf8"));
      } catch (err) {
        continue;
      }

      if (!Array.isArray(sidecarQs)) continue;

      let megaQs = null;

      if (megaData.modelTests && megaData.modelTests[setId]) {
        megaQs = megaData.modelTests[setId];
      } else if (megaData.chapters && megaData.chapters[setId]) {
        megaQs = megaData.chapters[setId];
      }

      if (megaQs && Array.isArray(megaQs)) {
        for (const sq of sidecarQs) {
          const mq = megaQs.find(q => q.id === sq.id);
          if (mq) {
            // Check and sync corrections
            if (sq.text && mq.questionText !== sq.text) {
              mq.questionText = sq.text;
              modified = true;
            }
            if (sq.options && sq.options.length >= 4) {
              if (mq.optionA !== sq.options[0]) { mq.optionA = sq.options[0]; modified = true; }
              if (mq.optionB !== sq.options[1]) { mq.optionB = sq.options[1]; modified = true; }
              if (mq.optionC !== sq.options[2]) { mq.optionC = sq.options[2]; modified = true; }
              if (mq.optionD !== sq.options[3]) { mq.optionD = sq.options[3]; modified = true; }
            }
            if (sq.image !== undefined && mq.image !== sq.image) {
              mq.image = sq.image;
              modified = true;
            }
            if (sq.optionImages !== undefined && JSON.stringify(mq.optionImages) !== JSON.stringify(sq.optionImages)) {
              mq.optionImages = sq.optionImages;
              modified = true;
            }
            if (sq.explanation && mq.explanation !== sq.explanation) {
              mq.explanation = sq.explanation;
              modified = true;
            }
            if (sq.shortSolution && mq.shortSolution !== sq.shortSolution) {
              mq.shortSolution = sq.shortSolution;
              modified = true;
            }
          }
        }
      }
    }

    if (modified) {
      fs.writeFileSync(mega.path, JSON.stringify(megaData, null, 2) + "\n", "utf8");
      console.log(`✓ Successfully updated ${mega.path}`);
    } else {
      console.log(`No changes needed for ${mega.path}`);
    }
  }
}

syncBack();
