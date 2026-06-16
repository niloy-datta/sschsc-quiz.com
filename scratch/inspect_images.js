const fs = require("fs").promises;
const path = require("path");
const { createWorker } = require("tesseract.js");

const DIR = "c:\\Users\\Niloy Chandra\\Documents\\drive-download-20260420T170121Z-3-001";

async function main() {
  const worker = await createWorker();
  
  // Inspect first 5 images
  for (let i = 1; i <= 5; i++) {
    const filename = `Image (${i}).jpg`;
    const filepath = path.join(DIR, filename);
    
    try {
      console.log(`Inspecting ${filename}...`);
      const { data } = await worker.recognize(filepath);
      console.log(`=== TEXT FOR ${filename} ===`);
      // Print first 500 characters of the text
      console.log(data.text.slice(0, 500));
      console.log("====================================\n");
    } catch (err) {
      console.error(`Error processing ${filename}:`, err.message);
    }
  }
  
  await worker.terminate();
}

main().catch(console.error);
