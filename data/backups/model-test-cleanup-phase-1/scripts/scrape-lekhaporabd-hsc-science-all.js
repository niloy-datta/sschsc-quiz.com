const { writeFile } = require("node:fs/promises");
const { JSDOM } = require("jsdom");

const BASE_SITEMAP = "https://en.lekhaporabd.net/sitemap.xml";
const SUBJECTS = ["physics", "chemistry", "higher-math", "biology"];
const YEARS = ["2023", "2024", "2025"];

function getUrlPattern(subject, year) {
  return new RegExp(
    `https://en\\.lekhaporabd\\.net/hsc-${subject}-[\\w-]+-(?:questions-and-answers|question-answer|question-solution|mcq-question-answer|mcq-questions-and-answers)-${year}/?`,
    "i",
  );
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; script)" },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.text();
}

function extractLocs(xml) {
  const regex = /<loc>([^<]+)<\/loc>/g;
  const locs = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    locs.push(match[1].trim());
  }
  return locs;
}

async function main() {
  const indexXml = await fetchText(BASE_SITEMAP);
  const sitemapUrls = extractLocs(indexXml).filter((loc) =>
    loc.includes("/post-sitemap"),
  );
  const matchingUrls = new Set();
  const patterns = YEARS.flatMap((year) =>
    SUBJECTS.map((subject) => getUrlPattern(subject, year)),
  );

  for (const sitemapUrl of sitemapUrls) {
    try {
      const xml = await fetchText(sitemapUrl);
      const locs = extractLocs(xml);
      for (const loc of locs) {
        for (const pattern of patterns) {
          if (pattern.test(loc)) {
            matchingUrls.add(loc);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to read sitemap ${sitemapUrl}: ${error.message}`);
    }
  }

  const urls = Array.from(matchingUrls).sort();
  const payload = { urls, timestamp: new Date().toISOString() };
  await writeFile(
    "scripts/lekhaporabd-hsc-science-links.json",
    JSON.stringify(payload, null, 2),
    "utf8",
  );
  console.log(
    `Saved ${urls.length} candidate URL(s) to scripts/lekhaporabd-hsc-science-links.json`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
