const { JSDOM } = require("jsdom");

const url = "https://en.lekhaporabd.net/hsc-physics-2nd-paper-mcq-questions-and-answers-2023/";

async function main() {
  console.log(`Fetching ${url}...`);
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
  });
  const html = await res.text();
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  
  // Extract text from the main article/entry content
  const entryContent = doc.querySelector(".entry-content, article, #content, .post-content");
  if (entryContent) {
    console.log("Found entry content. Length:", entryContent.textContent.length);
    console.log("\n--- Full text breakdown ---");
    const paragraphs = entryContent.querySelectorAll("p, li, h3, h2, div");
    let count = 0;
    for (const p of paragraphs) {
      const txt = p.textContent.trim();
      if (txt.length > 5 && !txt.includes("adsbygoogle")) {
        console.log(`[${p.tagName}]: ${txt.substring(0, 150)}`);
        count++;
        if (count > 50) break;
      }
    }
  } else {
    console.log("No entry content container found. Body text snippet:");
    console.log(doc.body.textContent.substring(0, 1000).trim());
  }
}

main().catch(err => console.error(err));
