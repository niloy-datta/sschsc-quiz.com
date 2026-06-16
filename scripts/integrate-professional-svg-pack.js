/**
 * Integrate professional_svg_all_questions_pack into the app.
 *
 * 1. Copy SVG assets → public/images/quiz/premium/
 * 2. Update question JSON image fields via svg_update_map.json
 * 3. Attach optionImages for graph-option MCQs
 *
 * Usage: node scripts/integrate-professional-svg-pack.js [--dry-run]
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PACK_ROOT = path.join(ROOT, "professional_svg_all_questions_pack", "svg_professional_all_questions");
const PACK_IMAGES = path.join(PACK_ROOT, "images", "quiz", "premium");
const UPDATE_MAP = path.join(PACK_ROOT, "svg_update_map.json");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const DEST_PREMIUM = path.join(ROOT, "public", "images", "quiz", "premium");

/** Keep manually verified accurate diagrams. */
const PROTECTED_QUESTION_IMAGES = new Map([
  ["ssc-physics-chapter-12-model-test-06-q23", "/images/quiz/ssc-wave-standing.svg"],
  ["ssc-physics-chapter-12-model-test-06-q24", "/images/quiz/ssc-wave-standing.svg"],
]);

function isProtected(questionId, currentImage) {
  const expected = PROTECTED_QUESTION_IMAGES.get(questionId);
  return expected != null && currentImage === expected;
}

function toWebPath(p) {
  if (!p) return null;
  const normalized = p.replace(/\\/g, "/").replace(/^\/+/, "");
  return normalized.startsWith("images/") ? `/${normalized}` : `/${normalized}`;
}

function collectQuestions(data) {
  if (Array.isArray(data)) return { list: data, root: data, isArray: true };
  if (Array.isArray(data.questions)) {
    return { list: data.questions, root: data, isArray: false, key: "questions" };
  }
  return null;
}

function walkCopy(srcDir, destDir, stats) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const ent of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, ent.name);
    const dest = path.join(destDir, ent.name);
    if (ent.isDirectory()) {
      walkCopy(src, dest, stats);
    } else if (ent.name.endsWith(".svg")) {
      if (!fs.existsSync(dest) || fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs) {
        fs.copyFileSync(src, dest);
        stats.copied++;
      } else {
        stats.skippedCopy++;
      }
    }
  }
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const updateMap = JSON.parse(fs.readFileSync(UPDATE_MAP, "utf8"));
  const byId = new Map(updateMap.map((e) => [e.questionId, e]));

  const copyStats = { copied: 0, skippedCopy: 0 };
  if (!dryRun) {
    console.log("Copying SVG assets...");
    walkCopy(PACK_IMAGES, DEST_PREMIUM, copyStats);
    console.log(`Copied ${copyStats.copied} SVG files (${copyStats.skippedCopy} unchanged).`);
  }

  const stats = {
    filesUpdated: 0,
    questionsUpdated: 0,
    optionImagesSet: 0,
    protected: 0,
    notFound: 0,
  };

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
        const wrapped = collectQuestions(data);
        if (!wrapped) continue;

        let fileChanged = false;
        for (const q of wrapped.list) {
          const id = String(q.id ?? "");
          const entry = byId.get(id);
          if (!entry) continue;

          const newImage = toWebPath(entry.replaceImageWith);
          const current = q.image ?? q.svg ?? null;

          if (isProtected(id, current)) {
            stats.protected++;
            continue;
          }

          if (newImage && current !== newImage) {
            if (!dryRun) q.image = newImage;
            stats.questionsUpdated++;
            fileChanged = true;
          }

          if (Array.isArray(entry.optionImages) && entry.optionImages.length === 4) {
            const paths = entry.optionImages.map(toWebPath);
            const same =
              Array.isArray(q.optionImages) &&
              q.optionImages.length === 4 &&
              q.optionImages.every((v, i) => v === paths[i]);
            if (!same) {
              if (!dryRun) q.optionImages = paths;
              stats.optionImagesSet++;
              fileChanged = true;
            }
          }
        }

        if (fileChanged && !dryRun) {
          fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, "utf8");
          stats.filesUpdated++;
        }
      }
    };

    walk(subjectDir);
  }

  // Questions in map but never found in JSON
  const foundIds = new Set();
  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    const subjectDir = path.join(QUESTIONS_DIR, subject);
    if (!fs.statSync(subjectDir).isDirectory()) continue;
    const scan = (dir) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) scan(p);
        else if (ent.name.endsWith(".json") && ent.name !== "index.json") {
          const wrapped = collectQuestions(JSON.parse(fs.readFileSync(p, "utf8")));
          if (!wrapped) continue;
          for (const q of wrapped.list) foundIds.add(String(q.id ?? ""));
        }
      }
    };
    scan(subjectDir);
  }
  stats.notFound = [...byId.keys()].filter((id) => !foundIds.has(id)).length;

  console.log(dryRun ? "DRY RUN — no files written." : "Integration complete.");
  console.log(JSON.stringify(stats, null, 2));
  console.log(`Update map entries: ${updateMap.length}`);
}

main();
