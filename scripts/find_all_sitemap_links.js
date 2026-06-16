const fs = require("node:fs/promises");
const path = require("node:path");

const SITEMAPS = [
  "https://en.lekhaporabd.net/sitemap.xml",
  "https://lekhaporabd.net/sitemap.xml",
  "https://lekhaporabd.net/sitemap_index.xml",
  "https://en.lekhaporabd.net/sitemap_index.xml"
];

const SUBJECTS = ["physics", "chemistry", "higher-math", "biology", "math", "general-math"];
const YEARS = ["2022", "2023", "2024", "2025"];

async function fetchText(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    return null;
  }
}

function extractLocs(xml) {
  if (!xml) return [];
  const regex = /<loc>([^<]+)<\/loc>/g;
  const locs = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    locs.push(match[1].trim());
  }
  return locs;
}

async function getSitemapLocsRecursive(sitemapUrl, visited = new Set()) {
  if (visited.has(sitemapUrl)) return [];
  visited.add(sitemapUrl);
  
  console.log(`Fetching sitemap: ${sitemapUrl}`);
  const xml = await fetchText(sitemapUrl);
  if (!xml) return [];
  
  const locs = extractLocs(xml);
  let allLocs = [];
  
  for (const loc of locs) {
    if (loc.endsWith(".xml") || loc.includes("/sitemap")) {
      const subLocs = await getSitemapLocsRecursive(loc, visited);
      allLocs = allLocs.concat(subLocs);
    } else {
      allLocs.push(loc);
    }
  }
  return allLocs;
}

async function main() {
  const allUrls = new Set();
  const visited = new Set();
  
  for (const sitemap of SITEMAPS) {
    try {
      const locs = await getSitemapLocsRecursive(sitemap, visited);
      for (const loc of locs) {
        allUrls.add(loc);
      }
    } catch (e) {
      console.error(`Failed sitemap ${sitemap}:`, e.message);
    }
  }
  
  console.log(`Total unique URLs extracted from sitemaps: ${allUrls.size}`);
  
  const matches = [];
  
  for (const url of allUrls) {
    const slug = url.toLowerCase();
    
    // Check if URL matches subjects and years
    const matchedSubject = SUBJECTS.find(sub => slug.includes(sub));
    const matchedYear = YEARS.find(yr => slug.includes(yr));
    const isBoardQuestion = slug.includes("board-question") || 
                            slug.includes("mcq") || 
                            slug.includes("question-solution") || 
                            slug.includes("question-answer") ||
                            slug.includes("questions-and-answers") ||
                            slug.includes("solution") ||
                            slug.includes("solving") ||
                            slug.includes("solve") ||
                            slug.includes("প্রশ্ন");
                            
    if (matchedSubject && matchedYear && (isBoardQuestion || slug.includes("hsc") || slug.includes("ssc"))) {
      matches.push({
        url,
        subject: matchedSubject,
        year: matchedYear
      });
    }
  }
  
  console.log(`Matched URLs: ${matches.length}`);
  
  const output = {
    matches,
    timestamp: new Date().toISOString()
  };
  
  await fs.writeFile(
    "scripts/all-lekhaporabd-matches.json",
    JSON.stringify(output, null, 2),
    "utf8"
  );
  
  console.log(`Saved matched URLs to scripts/all-lekhaporabd-matches.json`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
