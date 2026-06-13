const { writeFile } = require("node:fs/promises");
const { JSDOM } = require("jsdom");

const BASE_SITEMAP = "https://en.lekhaporabd.net/sitemap.xml";
const HSC_URL_PATTERN =
  /https:\/\/en\.lekhaporabd\.net\/hsc-[^\s\/]+-(?:questions-and-answers|question-answer|question-solution|mcq-question-answer|mcq-questions-and-answers)-2024\/?/i;
const HSC_PAGE_PATTERN = /https:\/\/en\.lekhaporabd\.net\/hsc-[^\s]+/i;

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

async function fetchTitles(urls) {
  const results = [];
  for (const url of urls) {
    try {
      const html = await fetchText(url);
      const dom = new JSDOM(html);
      const title =
        dom.window.document.querySelector("title")?.textContent?.trim() || "";
      const heading =
        dom.window.document.querySelector("h1")?.textContent?.trim() || "";
      results.push({ url, title, heading });
      console.log(`Fetched ${url}`);
    } catch (error) {
      console.warn(`Could not fetch ${url}: ${error.message}`);
      results.push({ url, title: "", heading: "", error: error.message });
    }
  }
  return results;
}

async function main() {
  const indexXml = await fetchText(BASE_SITEMAP);
  const sitemapUrls = extractLocs(indexXml).filter((loc) =>
    loc.includes("/post-sitemap"),
  );
  const matchingUrls = new Set();

  for (const sitemapUrl of sitemapUrls) {
    try {
      const xml = await fetchText(sitemapUrl);
      const locs = extractLocs(xml);
      for (const loc of locs) {
        if (
          HSC_URL_PATTERN.test(loc) ||
          (HSC_PAGE_PATTERN.test(loc) && /2024/.test(loc))
        ) {
          matchingUrls.add(loc);
        }
      }
    } catch (error) {
      console.warn(`Failed to read sitemap ${sitemapUrl}: ${error.message}`);
    }
  }

  const urls = Array.from(matchingUrls).sort();
  const metadata = await fetchTitles(urls.slice(0, 100));
  const payload = { urls, metadata, timestamp: new Date().toISOString() };
  await writeFile(
    "scripts/lekhaporabd-hsc-2024-links.json",
    JSON.stringify(payload, null, 2),
    "utf8",
  );
  console.log(
    `Saved ${urls.length} candidate URL(s) to scripts/lekhaporabd-hsc-2024-links.json`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
