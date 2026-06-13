const fs = require("fs").promises;
const path = require("path");
const { createWorker } = require("tesseract.js");

const PAGE_URL =
  "https://en.lekhaporabd.net/hsc-physics-2nd-paper-mcq-questions-and-answers-2024/";
const TMP_DIR = path.join(__dirname, "tmp-lekhaporabd-ocr");
const IMAGE_FILTER = (src) => {
  if (!src) return false;
  const normalized = src.toLowerCase();
  if (
    normalized.includes("postimg.cc/") &&
    normalized.match(/\.(jpe?g|png|webp)(\?|$)/)
  )
    return true;
  if (normalized.includes("hsc-physics-2nd-mcq.png")) return true;
  return false;
};

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://google.com/",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch page: ${res.status}`);
  return await res.text();
}

async function fetchImage(url, destPath) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
  });
  if (!res.ok) throw new Error(`Failed to fetch image ${url}: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, buffer);
}

function findImageUrls(html) {
  const srcs = [];
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html))) {
    const src = match[1].trim();
    srcs.push(src);
  }
  return srcs.filter(IMAGE_FILTER);
}

async function main() {
  console.log("Fetching page HTML...");
  const html = await fetchHtml(PAGE_URL);
  const imageUrls = findImageUrls(html);
  if (imageUrls.length === 0) {
    console.log("No relevant question images found.");
    return;
  }

  console.log(`Found ${imageUrls.length} relevant images.`);
  await fs.mkdir(TMP_DIR, { recursive: true });

  const images = [];
  for (const [index, src] of imageUrls.entries()) {
    const url = src.startsWith("http") ? src : new URL(src, PAGE_URL).href;
    const filename = `${String(index + 1).padStart(2, "0")}-${path.basename(url.split("?")[0])}`;
    const localPath = path.join(TMP_DIR, filename);
    console.log(`Downloading ${url}`);
    await fetchImage(url, localPath);
    images.push({ url, path: localPath });
  }

  const worker = await createWorker();
  await worker.load();

  const results = [];
  for (const item of images) {
    console.log(`Recognizing ${item.path}`);
    const { data } = await worker.recognize(item.path);
    results.push({ url: item.url, path: item.path, text: data.text.trim() });
  }

  await worker.terminate();
  const outputPath = path.join(__dirname, "lekhaporabd-hsc-2024-ocr.json");
  await fs.writeFile(
    outputPath,
    JSON.stringify({ page: PAGE_URL, results }, null, 2),
    "utf8",
  );
  console.log(`OCR results saved to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
