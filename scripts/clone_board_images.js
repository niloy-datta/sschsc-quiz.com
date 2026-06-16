const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "data", "hsc-board-questions");
const DEST_DIR = path.join(ROOT, "public", "images", "board-scanned");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function downloadImage(url, destPath, retries = 3) {
  const cleanUrl = url
    .replace(/&amp;/g, "&")
    .replace(/&#038;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(cleanUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: AbortSignal.timeout(15000), // 15 seconds timeout
      });
      if (res.status === 429) {
        console.warn(`  ⚠️ Rate limited (HTTP 429) on attempt ${attempt}. Retrying in 4 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 4000));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      await fs.promises.writeFile(destPath, buffer);
      return true;
    } catch (err) {
      if (attempt === retries) {
        console.error(`  ❌ Failed to download ${url}: ${err.message}`);
        return false;
      }
      console.warn(`  ⚠️ Attempt ${attempt} failed: ${err.message}. Retrying in 2 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  return false;
}

async function processFile(filePath) {
  const relative = path.relative(SRC_DIR, filePath);
  console.log(`Processing file: ${relative}`);

  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(`  ❌ Failed to parse JSON: ${err.message}`);
    return;
  }

  if (!Array.isArray(data)) {
    console.error("  ❌ JSON root is not an array");
    return;
  }

  // Parse path info: e.g. physics/2nd-paper/2023.json
  const parts = relative.split(path.sep);
  if (parts.length < 3) {
    console.error("  ❌ Unexpected file path structure");
    return;
  }
  const [subject, paper, yearFile] = parts;
  const year = yearFile.replace(".json", "");

  const fileDestDir = path.join(DEST_DIR, subject, paper);
  ensureDir(fileDestDir);

  let updated = false;

  for (let idx = 0; idx < data.length; idx++) {
    const item = data[idx];
    const url = item.image_url;

    if (!url) continue;

    // Only download if it's an external URL (starts with http)
    if (url.startsWith("http")) {
      // Determine file extension
      let ext = ".jpg";
      const cleanUrl = url.split("?")[0].toLowerCase();
      if (cleanUrl.endsWith(".png")) ext = ".png";
      else if (cleanUrl.endsWith(".webp")) ext = ".webp";

      const filename = `${year}-${String(idx + 1).padStart(2, "0")}${ext}`;
      const destPath = path.join(fileDestDir, filename);

      console.log(`  - Cloned: ${filename} from ${url}`);
      const success = await downloadImage(url, destPath);

      if (success) {
        // Update URL to local public path (using forward slashes for web)
        const localUrl = `/images/board-scanned/${subject}/${paper}/${filename}`;
        item.image_url = localUrl;
        updated = true;
      }
    }
  }

  if (updated) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    console.log(`  ✅ Successfully updated ${relative} with local cloned image URLs.`);
  } else {
    console.log(`  ℹ️ No external URLs to update in ${relative}.`);
  }
}

async function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      await traverse(full);
    } else if (file.endsWith(".json")) {
      await processFile(full);
    }
  }
}

async function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`Source directory does not exist: ${SRC_DIR}`);
    process.exit(1);
  }

  ensureDir(DEST_DIR);
  console.log("Starting board questions scanned image cloning pipeline...");
  await traverse(SRC_DIR);
  console.log("Scanned images cloning completed!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
