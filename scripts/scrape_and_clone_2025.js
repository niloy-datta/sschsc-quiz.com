const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const WORKING_URLS_FILE = path.join(ROOT, "scripts", "working-lekhaporabd-urls.json");
const DEST_JSON_DIR = path.join(ROOT, "data", "hsc-board-questions");
const DEST_IMG_DIR = path.join(ROOT, "public", "images", "board-scanned");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

const IMAGE_FILTER = (src) => {
  if (!src) return false;
  const normalized = src.toLowerCase();
  
  // Exclude common ad / sponsor logos
  const adPatterns = ["lekhapora-bd", "lekhaporabd.net/wp-content/uploads/2022", "logo", "icon", "ads", "work-permit-visa", "visa-promotion", "visa-guide", "opportunity-card"];
  for (const p of adPatterns) {
    if (normalized.includes(p)) return false;
  }

  if (normalized.includes("postimg.cc/") && normalized.match(/\.(jpe?g|png|webp)(\?|$)/)) return true;
  if (normalized.includes("/wp-content/uploads/") && normalized.match(/\.(jpe?g|png|webp)(\?|$)/)) return true;
  return false;
};

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

function findImageUrls(html, pageUrl) {
  const srcs = new Set();
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html))) {
    const src = match[1].trim();
    const cleanSrc = src
      .replace(/&amp;/g, "&")
      .replace(/&#038;/g, "&");

    if (IMAGE_FILTER(cleanSrc)) {
      srcs.add(cleanSrc.startsWith("http") ? cleanSrc : new URL(cleanSrc, pageUrl).href);
    }
  }
  return Array.from(srcs);
}

async function downloadImage(url, destPath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: AbortSignal.timeout(15000),
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

// Map working subjects to files
const SUBJECT_MAP = {
  "physics-1st-paper": { subject: "physics", paper: "1st-paper" },
  "physics-2nd-paper": { subject: "physics", paper: "2nd-paper" },
  "chemistry-1st-paper": { subject: "chemistry", paper: "1st-paper" },
  "chemistry-2nd-paper": { subject: "chemistry", paper: "2nd-paper" },
  "biology-1st-paper": { subject: "biology", paper: "1st-paper" },
  "biology-2nd-paper": { subject: "biology", paper: "2nd-paper" },
  "higher-math-1st-paper": { subject: "higher-math", paper: "1st-paper" },
  "higher-math-2nd-paper": { subject: "higher-math", paper: "2nd-paper" },
};

async function processUrlEntry(entry) {
  const mapping = SUBJECT_MAP[entry.subject];
  if (!mapping) return; // skip SSC or unmapped subjects

  const { subject, paper } = mapping;
  const year = entry.year;

  console.log(`\nFetching ${entry.level}/${entry.subject} (${year}) from: ${entry.url}`);

  let html;
  try {
    html = await fetchHtml(entry.url);
  } catch (err) {
    console.error(`❌ Failed to fetch page HTML: ${err.message}`);
    return;
  }

  const imageUrls = findImageUrls(html, entry.url);
  if (imageUrls.length === 0) {
    console.log("ℹ️ No relevant question images found on this page.");
    return;
  }

  console.log(`Found ${imageUrls.length} candidate images. Downloading...`);

  const fileDestJsonPath = path.join(DEST_JSON_DIR, subject, paper, `${year}.json`);
  const fileDestImgDir = path.join(DEST_IMG_DIR, subject, paper);
  ensureDir(path.dirname(fileDestJsonPath));
  ensureDir(fileDestImgDir);

  const scannedList = [];

  for (let idx = 0; idx < imageUrls.length; idx++) {
    const url = imageUrls[idx];
    let ext = ".jpg";
    const cleanUrl = url.split("?")[0].toLowerCase();
    if (cleanUrl.endsWith(".png")) ext = ".png";
    else if (cleanUrl.endsWith(".webp")) ext = ".webp";

    const filename = `${year}-${String(idx + 1).padStart(2, "0")}${ext}`;
    const destPath = path.join(fileDestImgDir, filename);

    console.log(`  - Downloading image ${idx + 1}/${imageUrls.length} to ${filename}`);
    const success = await downloadImage(url, destPath);

    if (success) {
      scannedList.push({
        image_url: `/images/board-scanned/${subject}/${paper}/${filename}`,
        text: "" // OCR placeholder
      });
    }
  }

  if (scannedList.length > 0) {
    fs.writeFileSync(fileDestJsonPath, `${JSON.stringify(scannedList, null, 2)}\n`, "utf8");
    console.log(`✅ Successfully generated ${subject}/${paper}/${year}.json with ${scannedList.length} pages.`);
  }
}

async function main() {
  if (!fs.existsSync(WORKING_URLS_FILE)) {
    console.error("working-lekhaporabd-urls.json not found!");
    process.exit(1);
  }

  const { urls } = JSON.parse(fs.readFileSync(WORKING_URLS_FILE, "utf8"));
  const entries2025 = urls.filter(u => u.year === "2025" && u.level === "hsc");

  if (entries2025.length === 0) {
    console.log("No 2025 HSC entries found to scrape.");
    return;
  }

  console.log(`Starting scraper for ${entries2025.length} HSC 2025 board question pages...`);

  for (const entry of entries2025) {
    await processUrlEntry(entry);
  }

  console.log("\n2025 Board Scraper Complete!");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
