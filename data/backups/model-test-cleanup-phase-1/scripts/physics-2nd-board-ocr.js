/**
 * Physics 2nd Paper Board Scanned Image OCR Script
 * 
 * Reads all scanned board question images from
 *   public/images/board-scanned/physics/2nd-paper/
 * Runs OCR on each image, saves extracted text as companion .txt files
 * (e.g., 2023-01.png → 2023-01.txt)
 *
 * Usage: node scripts/physics-2nd-board-ocr.js
 * Requires: tesseract.js (installed via pnpm)
 */

const fs = require("fs").promises;
const path = require("path");
const { createWorker } = require("tesseract.js");

const SCANNED_DIR = path.resolve(
  process.cwd(),
  "public/images/board-scanned/physics/2nd-paper"
);

const SUPPORTED_EXTS = [".png", ".jpg", ".jpeg", ".webp"];

async function main() {
  console.log("=".repeat(70));
  console.log("PHYSICS 2ND PAPER BOARD SCANNED IMAGE OCR");
  console.log("=".repeat(70));

  // Ensure directory exists
  try {
    await fs.access(SCANNED_DIR);
  } catch {
    console.error(`ERROR: Directory not found: ${SCANNED_DIR}`);
    process.exit(1);
  }

  // List all files
  const allFiles = await fs.readdir(SCANNED_DIR);
  console.log(`\nFound ${allFiles.length} total files in scanned directory.\n`);

  // Filter to image files (png, jpg, webp)
  const imageFiles = allFiles
    .filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return SUPPORTED_EXTS.includes(ext);
    })
    .sort((a, b) => {
      // Sort by numeric prefix
      const numA = parseInt(a.replace(/\D/g, ""), 10);
      const numB = parseInt(b.replace(/\D/g, ""), 10);
      return numA - numB;
    });

  console.log(`Image files to OCR: ${imageFiles.length}`);
  console.log("");

  // Group by year
  const byYear = {};
  for (const f of imageFiles) {
    const year = f.split("-")[0];
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(f);
  }
  for (const [year, files] of Object.entries(byYear)) {
    console.log(`  ${year}: ${files.length} images`);
  }
  console.log("");

  // Check for existing .txt files to skip
  let skipCount = 0;
  const toProcess = [];
  for (const imgFile of imageFiles) {
    const txtFile = imgFile.replace(/\.(png|jpg|jpeg|webp)$/i, ".txt");
    const txtPath = path.join(SCANNED_DIR, txtFile);
    try {
      await fs.access(txtPath);
      // .txt exists, skip this image
      skipCount++;
    } catch {
      toProcess.push(imgFile);
    }
  }

  console.log(`Skipping ${skipCount} images (OCR .txt already exists).`);
  console.log(`Images to OCR: ${toProcess.length}\n`);

  if (toProcess.length === 0) {
    console.log("All images already have OCR text. Done!");
    process.exit(0);
  }

  // Initialize tesseract.js worker with Bengali + English
  console.log("Initializing tesseract.js worker (loading OCR engine)...");
  const worker = await createWorker("ben+eng");
  console.log("Worker ready.\n");

  // Process each image
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const imgFile = toProcess[i];
    const imgPath = path.join(SCANNED_DIR, imgFile);
    const txtFile = imgFile.replace(/\.(png|jpg|jpeg|webp)$/i, ".txt");
    const txtPath = path.join(SCANNED_DIR, txtFile);

    // Get file size
    const stat = await fs.stat(imgPath);
    const sizeKB = (stat.size / 1024).toFixed(1);

    process.stdout.write(
      `[${i + 1}/${toProcess.length}] ${imgFile} (${sizeKB} KB) ... `
    );

    try {
      const { data } = await worker.recognize(imgPath);
      const text = data.text.trim();
      await fs.writeFile(txtPath, text, "utf8");
      console.log(`✓ ${text.length} chars`);
      successCount++;
    } catch (err) {
      console.log(`✗ ERROR: ${err.message}`);
      failCount++;
      // Write empty file to mark as processed
      try {
        await fs.writeFile(txtPath, `[OCR ERROR: ${err.message}]`, "utf8");
      } catch {}
    }
  }

  // Clean up
  await worker.terminate();

  console.log("\n" + "=".repeat(70));
  console.log("OCR COMPLETE");
  console.log("=".repeat(70));
  console.log(`  Total processed: ${toProcess.length}`);
  console.log(`  Successful:      ${successCount}`);
  console.log(`  Failed:          ${failCount}`);
  console.log(`\nOutput .txt files saved in:\n  ${SCANNED_DIR}`);
  console.log("=".repeat(70));
}

main().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
