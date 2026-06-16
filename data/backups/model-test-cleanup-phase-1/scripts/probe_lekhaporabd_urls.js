const fs = require("node:fs/promises");
const path = require("node:path");

const SUBJECTS_MAP = {
  ssc: ["physics", "chemistry", "biology", "higher-math", "math", "general-math"],
  hsc: [
    "physics-1st-paper", "physics-2nd-paper",
    "chemistry-1st-paper", "chemistry-2nd-paper",
    "biology-1st-paper", "biology-2nd-paper",
    "higher-math-1st-paper", "higher-math-2nd-paper"
  ]
};

const YEARS = ["2022", "2023", "2024", "2025"];

const DOMAINS = ["https://lekhaporabd.net", "https://en.lekhaporabd.net"];

// Common Lekhapora BD url slugs
function getCandidateUrls(level, subject, year, domain) {
  const candidates = [];
  const cleanSub = subject.toLowerCase();
  
  if (level === "ssc") {
    candidates.push(`${domain}/ssc-${cleanSub}-mcq-question-solution-${year}/`);
    candidates.push(`${domain}/ssc-${cleanSub}-mcq-question-and-answer-${year}/`);
    candidates.push(`${domain}/ssc-${cleanSub}-mcq-questions-and-answers-${year}/`);
    candidates.push(`${domain}/ssc-${cleanSub}-mcq-question-solution-and-answer-${year}/`);
    candidates.push(`${domain}/ssc-${cleanSub}-question-solution-${year}/`);
  } else {
    // hsc
    candidates.push(`${domain}/hsc-${cleanSub}-mcq-questions-and-answers-${year}/`);
    candidates.push(`${domain}/hsc-${cleanSub}-mcq-question-solution-${year}/`);
    candidates.push(`${domain}/hsc-${cleanSub}-mcq-question-answer-${year}/`);
    candidates.push(`${domain}/hsc-${cleanSub}-question-solution-${year}/`);
  }
  return candidates;
}

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(5000)
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

async function main() {
  console.log("Probing Lekhapora BD URLs for missing board questions...");
  const workingUrls = [];
  
  const allCandidates = [];
  
  // Build candidate list
  for (const year of YEARS) {
    // SSC
    for (const subject of SUBJECTS_MAP.ssc) {
      for (const domain of DOMAINS) {
        allCandidates.push(...getCandidateUrls("ssc", subject, year, domain).map(url => ({
          url, level: "ssc", subject, year
        })));
      }
    }
    // HSC
    for (const subject of SUBJECTS_MAP.hsc) {
      for (const domain of DOMAINS) {
        allCandidates.push(...getCandidateUrls("hsc", subject, year, domain).map(url => ({
          url, level: "hsc", subject, year
        })));
      }
    }
  }
  
  console.log(`Total URLs to probe: ${allCandidates.length}`);
  
  // Probe in batches to avoid rate limit or timeout
  const batchSize = 10;
  for (let i = 0; i < allCandidates.length; i += batchSize) {
    const batch = allCandidates.slice(i, i + batchSize);
    console.log(`Probing batch ${i / batchSize + 1}/${Math.ceil(allCandidates.length / batchSize)}...`);
    
    await Promise.all(batch.map(async (item) => {
      const ok = await checkUrl(item.url);
      if (ok) {
        console.log(`  [FOUND] ${item.url}`);
        workingUrls.push(item);
      }
    }));
  }
  
  const outPath = path.join(__dirname, "working-lekhaporabd-urls.json");
  await fs.writeFile(outPath, JSON.stringify({ urls: workingUrls, timestamp: new Date().toISOString() }, null, 2), "utf8");
  console.log(`\nProbe complete! Saved ${workingUrls.length} working URLs to ${outPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
