const fs = require("fs").promises;
const path = require("path");
const { createWorker } = require("tesseract.js");

const LINKS_FILE = path.join(__dirname, "lekhaporabd-hsc-science-links.json");
const TMP_DIR = path.join(__dirname, "tmp-lekhaporabd-ocr-all");
const IMAGE_FILTER = (src) => {
  if (!src) return false;
  const normalized = src.toLowerCase();
  if (
    normalized.includes("postimg.cc/") &&
    normalized.match(/\.(jpe?g|png|webp)(\?|$)/)
  )
    return true;
  if (
    normalized.includes("/wp-content/uploads/") &&
    normalized.match(/\.(jpe?g|png|webp)(\?|$)/)
  )
    return true;
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

function findImageUrls(html, pageUrl) {
  const srcs = new Set();
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html))) {
    const src = match[1].trim();
    if (IMAGE_FILTER(src)) {
      srcs.add(src.startsWith("http") ? src : new URL(src, pageUrl).href);
    }
  }
  return Array.from(srcs);
}

async function main() {
  const linksJson = await fs.readFile(LINKS_FILE, "utf8");
  const { urls: pageUrls } = JSON.parse(linksJson);

  await fs.mkdir(TMP_DIR, { recursive: true });

  const worker = await createWorker();

  const allResults = [];

  for (const pageUrl of pageUrls) {
    console.log(`\nProcessing page: ${pageUrl}`);
    try {
      const html = await fetchHtml(pageUrl);
      const imageUrls = findImageUrls(html, pageUrl);
      if (imageUrls.length === 0) {
        console.log("-> No relevant question images found.");
        continue;
      }

      console.log(`-> Found ${imageUrls.length} relevant images.`);
      const pageResults = [];

      for (const [index, imageUrl] of imageUrls.entries()) {
        const subject = pageUrl.split("/")[3].replace("hsc-", "").split("-")[0];
        const filename = `${subject}-${path.basename(pageUrl)}-${String(index + 1).padStart(2, "0")}.png`;
        const localPath = path.join(TMP_DIR, filename);

        try {
          console.log(`  - Downloading ${imageUrl}`);
          await fetchImage(imageUrl, localPath);

          console.log(`  - Recognizing ${filename}`);
          const { data } = await worker.recognize(localPath);
          pageResults.push({
            image_url: imageUrl,
            local_path: localPath,
            text: data.text.trim(),
          });
        } catch (imgError) {
          console.error(
            `  - Failed to process image ${imageUrl}:`,
            imgError.message,
          );
        }
      }
      allResults.push({ page_url: pageUrl, results: pageResults });
    } catch (pageError) {
      console.error(`-> Failed to process page ${pageUrl}:`, pageError.message);
    }
  }

  await worker.terminate();

  const outputPath = path.join(
    __dirname,
    "lekhaporabd-hsc-science-ocr-all.json",
  );
  await fs.writeFile(outputPath, JSON.stringify(allResults, null, 2), "utf8");
  console.log(`\nOCR results for all pages saved to ${outputPath}`);

  // Create a consolidated text file
  const txtOutputPath = path.join(
    __dirname,
    "lekhaporabd-hsc-science-ocr-all.txt",
  );
  const lines = [];
  allResults.forEach((pageData) => {
    lines.push(`\n\n==================================================`);
    lines.push(`Page: ${pageData.page_url}`);
    lines.push(`==================================================\n`);
    pageData.results.forEach((item, index) => {
      lines.push(
        `Image ${String(index + 1).padStart(2, "0")}: ${item.image_url}`,
      );
      lines.push("---");
      lines.push(item.text || "[no text extracted]");
      lines.push("");
    });
  });
  await fs.writeFile(txtOutputPath, lines.join("\n"), "utf8");
  console.log(`Consolidated OCR text saved to ${txtOutputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
