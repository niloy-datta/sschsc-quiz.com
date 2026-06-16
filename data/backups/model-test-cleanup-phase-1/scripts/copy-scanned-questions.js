const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "../data/hsc-board-questions");
const destDir = path.join(
  __dirname,
  "../apps/web-student/src/data/hsc-scanned-board-questions",
);

// Known noise / ad / logo patterns in image URLs
const noisePatterns = [
  "lekhapora-bd",
  "lekhaporabd.net/wp-content/uploads/202", // but not actual papers if they are postimg, let's be careful
  "work-permit-visa",
  "visa-promotion",
  "visa-guide",
  "opportunity-card",
  "translate-alternative",
  "png", // logos are usually png, papers are usually jpg/webp
];

function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExists(dirname);
  fs.mkdirSync(dirname);
}

function processJsonFile(srcPath, destPath) {
  try {
    const rawData = fs.readFileSync(srcPath, "utf8");
    const items = JSON.parse(rawData);

    // Filter out ads and empty pages
    const filteredItems = items.filter((item) => {
      const url = item.image_url.toLowerCase();
      const text = (item.text || "").trim();

      // If text is extremely short or empty, exclude it
      if (text.length < 10) return false;

      // Exclude known ad/logo patterns
      for (const pattern of noisePatterns) {
        if (url.includes(pattern)) {
          // Double check if it's a real board sheet that somehow matches - but highly unlikely
          return false;
        }
      }

      return true;
    });

    if (filteredItems.length === 0) {
      console.log(`Skipping ${srcPath} (no items left after filtering)`);
      return;
    }

    ensureDirectoryExists(destPath);
    fs.writeFileSync(destPath, JSON.stringify(filteredItems, null, 2), "utf8");
    console.log(
      `Successfully migrated ${filteredItems.length} pages of board sheet data from ${srcPath} to ${destPath}`,
    );
  } catch (err) {
    console.error(`Error processing ${srcPath}:`, err);
  }
}

function traverseDirectory(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      traverseDirectory(fullPath);
    } else if (file.endsWith(".json")) {
      const relativePath = path.relative(srcDir, fullPath);
      const destPath = path.join(destDir, relativePath);
      processJsonFile(fullPath, destPath);
    }
  }
}

if (!fs.existsSync(srcDir)) {
  console.error(`Source directory does not exist: ${srcDir}`);
  process.exit(1);
}

console.log("Starting migration and filtering of scanned board questions...");
traverseDirectory(srcDir);
console.log("Migration completed successfully!");
