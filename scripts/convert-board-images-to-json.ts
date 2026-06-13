/**
 * Simple OCR helper to convert board-question images into text JSON.
 *
 * Usage (install deps first):
 *   npm install tesseract.js@^4.0.0 node-fetch canvas
 *   npx tsx scripts/convert-board-images-to-json.ts ./path/to/images output/2024
 *
 * Notes:
 * - Tesseract OCR for Bengali may require language data; adjust `lang` option as needed.
 * - Output is a simple JSON file per image with raw text; you'll need to parse lines into question objects.
 */

import fs from "fs";
import path from "path";
import { createWorker } from "tesseract.js";

async function ocrImage(inputPath: string) {
  const worker = await createWorker({
    // logger: m => console.log(m),
  });
  try {
    await worker.load();
    await worker.loadLanguage("eng+ben");
    await worker.initialize("eng+ben");
    const { data } = await worker.recognize(inputPath);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(
      "Usage: tsx scripts/convert-board-images-to-json.ts <images-dir> <out-dir>",
    );
    process.exit(1);
  }
  const imagesDir = path.resolve(args[0]);
  const outDir = path.resolve(args[1]);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const files = fs
    .readdirSync(imagesDir)
    .filter((f) => /\.jpe?g$|\.png$|\.webp$/i.test(f));
  for (const file of files) {
    const p = path.join(imagesDir, file);
    console.log("OCR:", p);
    try {
      const text = await ocrImage(p);
      const outPath = path.join(outDir, file + ".json");
      fs.writeFileSync(
        outPath,
        JSON.stringify({ file, text }, null, 2),
        "utf8",
      );
      console.log("Wrote:", outPath);
    } catch (err) {
      console.error("Failed OCR for", file, err);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
