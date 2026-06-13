const { readFile, writeFile } = require("fs/promises");
const path = require("path");

async function main() {
  const inputPath = path.join(__dirname, "lekhaporabd-hsc-2024-ocr.json");
  const outputPath = path.join(__dirname, "lekhaporabd-hsc-2024-ocr.txt");
  const raw = await readFile(inputPath, "utf8");
  const data = JSON.parse(raw);
  const lines = [];
  lines.push(`Page: ${data.page}`);
  lines.push("");
  data.results.forEach((item, index) => {
    lines.push(`Image ${String(index + 1).padStart(2, "0")}: ${item.url}`);
    lines.push("---");
    lines.push(item.text || "[no text extracted]");
    lines.push("");
  });
  await writeFile(outputPath, lines.join("\n"), "utf8");
  console.log(`Saved consolidated OCR text to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
