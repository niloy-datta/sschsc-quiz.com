const fs = require("fs").promises;
const path = require("path");

const SOURCE_JSON = path.join(
  __dirname,
  "lekhaporabd-hsc-science-ocr-all.json",
);
const OUTPUT_DIR = path.resolve(__dirname, "../data/hsc-board-questions");

function parseUrl(pageUrl) {
  try {
    const url = new URL(pageUrl);
    const pathParts = url.pathname.split("/").filter((p) => p); // e.g., ['hsc-physics-1st-paper-question-2024']
    if (pathParts.length === 0) return null;

    const slug = pathParts[pathParts.length - 1];
    const parts = slug.split("-");

    // Find the year (should be a 4-digit number)
    const yearMatch = slug.match(/(\d{4})/);
    const year = yearMatch ? yearMatch[1] : null;
    if (!year) return null;

    // Extract subject and paper
    let subject = null;
    let paper = null;

    if (slug.includes("physics")) subject = "physics";
    else if (slug.includes("chemistry")) subject = "chemistry";
    else if (slug.includes("higher-math")) subject = "higher-math";
    else if (slug.includes("biology")) subject = "biology";

    if (slug.includes("1st-paper")) paper = "1st-paper";
    else if (slug.includes("2nd-paper")) paper = "2nd-paper";

    if (subject && paper && year) {
      return { subject, paper, year };
    }
    return null;
  } catch (e) {
    console.error(`Error parsing URL ${pageUrl}:`, e);
    return null;
  }
}

async function main() {
  try {
    const data = await fs.readFile(SOURCE_JSON, "utf8");
    const allResults = JSON.parse(data);

    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    for (const pageData of allResults) {
      const info = parseUrl(pageData.page_url);
      if (!info) {
        console.warn(`Could not parse info from URL: ${pageData.page_url}`);
        continue;
      }

      const { subject, paper, year } = info;
      const content = pageData.results.map((res) => ({
        image_url: res.image_url,
        text: res.text,
      }));

      const subjectDir = path.join(OUTPUT_DIR, subject);
      const paperDir = path.join(subjectDir, paper);
      await fs.mkdir(paperDir, { recursive: true });

      const outputPath = path.join(paperDir, `${year}.json`);
      await fs.writeFile(outputPath, JSON.stringify(content, null, 2), "utf8");
      console.log(
        `Successfully created: ${path.relative(process.cwd(), outputPath)}`,
      );
    }

    console.log(
      "\nData processing complete. Files are organized in data/hsc-board-questions/",
    );
    console.log(
      "This structure is ideal for static site generation (SSG) with frameworks like Next.js, Astro, or Eleventy.",
    );
  } catch (error) {
    console.error("An error occurred during data processing:", error);
    process.exit(1);
  }
}

main();
