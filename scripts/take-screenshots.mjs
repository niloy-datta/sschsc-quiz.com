import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, "..", "public", "screenshots");

mkdirSync(outputDir, { recursive: true });

const BASE_URL = "http://localhost:3001";

const pages = [
  { path: "/", name: "01-home" },
  { path: "/ssc", name: "02-ssc-subjects" },
  { path: "/hsc", name: "03-hsc-hub" },
  { path: "/login", name: "04-login" },
  { path: "/subjects", name: "05-subjects" },
  { path: "/leaderboard", name: "06-leaderboard" },
  { path: "/premium", name: "07-premium" },
  { path: "/hsc-board-questions", name: "08-hsc-board-questions" },
  { path: "/ssc-board-questions", name: "09-ssc-board-questions" },
  { path: "/live-test", name: "10-live-test" },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

const page = await context.newPage();

for (const { path, name } of pages) {
  try {
    const url = `${BASE_URL}${path}`;
    console.log(`📸 Navigating to ${url}...`);
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    // Wait a bit for animations to settle
    await page.waitForTimeout(2000);
    const filePath = join(outputDir, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`✅ Saved: ${filePath}`);
  } catch (err) {
    console.error(`❌ Failed to capture ${path}: ${err.message}`);
  }
}

await browser.close();
console.log("\n🎉 All screenshots captured successfully!");
