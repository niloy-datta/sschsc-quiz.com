const fs = require("fs").promises;
const path = require("path");
const { createWorker } = require("tesseract.js");

const ROOT = path.resolve(__dirname, "..");
const SCANNED_ROOT = path.join(ROOT, "public/images/board-scanned");
const SUPPORTED_EXTS = [".png", ".jpg", ".jpeg", ".webp"];

async function walkDir(dir) {
  let files = [];
  const list = await fs.readdir(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      files = files.concat(await walkDir(filePath));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (SUPPORTED_EXTS.includes(ext)) {
        files.push(filePath);
      }
    }
  }
  return files;
}

async function main() {
  console.log("=".repeat(70));
  console.log("BOARD SCAN IMAGE OCR PIPELINE (ALL YEARS & SUBJECTS)");
  console.log("=".repeat(70));

  let imageFiles = [];
  try {
    imageFiles = await walkDir(SCANNED_ROOT);
  } catch (err) {
    console.error("Scanned root directory not found:", SCANNED_ROOT);
    process.exit(1);
  }

  const toProcess = [];
  for (const imgPath of imageFiles) {
    const ext = path.extname(imgPath);
    const txtPath = imgPath.slice(0, -ext.length) + ".txt";

    try {
      await fs.access(txtPath);
      // Already exists, skip
    } catch {
      toProcess.push({ imgPath, txtPath });
    }
  }

  console.log(`Total image files found: ${imageFiles.length}`);
  console.log(`Images needing OCR:      ${toProcess.length}`);

  if (toProcess.length === 0) {
    console.log("All images already processed. Done!");
    return;
  }

  console.log("\nInitializing Tesseract worker (loading ben+eng)...");
  const worker = await createWorker("ben+eng");
  console.log("Tesseract worker ready.\n");

  for (let i = 0; i < toProcess.length; i++) {
    const item = toProcess[i];
    const relPath = path.relative(SCANNED_ROOT, item.imgPath);
    console.log(`[${i + 1}/${toProcess.length}] Processing ${relPath}...`);
    try {
      const { data } = await worker.recognize(item.imgPath);
      const text = data.text.trim();
      await fs.writeFile(item.txtPath, text, "utf8");
      console.log(`  ✓ Done. Character count: ${text.length}`);
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
      await fs.writeFile(item.txtPath, `[OCR ERROR: ${err.message}]`, "utf8");
    }
  }

  await worker.terminate();
  console.log("\nOCR pipeline run finished!");
}

main().catch(err => {
  console.error("Fatal Error:", err);
});
