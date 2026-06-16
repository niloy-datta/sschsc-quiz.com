import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const QUESTIONS = path.join(ROOT, "public", "questions");
const dirs = fs.readdirSync(QUESTIONS).filter((d) => {
  const p = path.join(QUESTIONS, d);
  return fs.statSync(p).isDirectory() && !d.startsWith(".");
});

let totalFiles = 0;
let totalQ = 0;
const issues = [];

for (const dir of dirs) {
  const p = path.join(QUESTIONS, dir);
  const files = fs
    .readdirSync(p)
    .filter(
      (f) =>
        f.endsWith(".json") &&
        f !== "index.json" &&
        !f.endsWith(".placeholder"),
    );
  totalFiles += files.length;

  for (const f of files) {
    const raw = fs.readFileSync(path.join(p, f), "utf8");
    try {
      const data = JSON.parse(raw);
      const questions = Array.isArray(data) ? data : data.questions ?? [];
      totalQ += questions.length;

      for (const q of questions) {
        const text = (q.text || q.questionText || q.question || "").trim();

        // Empty question text
        if (!text) {
          issues.push({ file: `${dir}/${f}`, id: q.id || "?", issue: "EMPTY_TEXT" });
          continue;
        }

        // Placeholder patterns
        const placeholderPatterns = [
          /replace with bengali/i,
          /\[image/i,
          /\[diagram/i,
          /image-based/i,
          /চিত্র\s*প্রয়োজন/i,
          /চিত্র\s*প্রয়োজন/i,
        ];
        for (const pat of placeholderPatterns) {
          if (pat.test(text)) {
            issues.push({ file: `${dir}/${f}`, id: q.id || "?", issue: "PLACEHOLDER", detail: text.slice(0, 60) });
            break;
          }
        }

        // Question text suspiciously short (single word/number)
        if (text.length < 5 && text !== "চিত্র/ডায়াগ্রাম প্রয়োজন") {
          issues.push({ file: `${dir}/${f}`, id: q.id || "?", issue: "TOO_SHORT", detail: text });
        }

        // Check options
        const opts = q.options ?? [];
        for (let oi = 0; oi < opts.length; oi++) {
          const ot = (opts[oi] || "").trim();
          if (!ot) {
            issues.push({ file: `${dir}/${f}`, id: q.id || "?", issue: "EMPTY_OPTION", detail: `option ${oi}` });
          }
          // Option is just a label (e.g. "A." or "ক.") with no real content
          if (/^[A-Da-dক-ঘ]\s*[\.)\)-]\s*$/.test(ot)) {
            issues.push({ file: `${dir}/${f}`, id: q.id || "?", issue: "LABEL_ONLY_OPTION", detail: JSON.stringify(ot) });
          }
        }
      }
    } catch {
      // skip parse errors
    }
  }
}

console.log(`\nScanned: ${totalFiles} files, ${totalQ} questions across ${dirs.length} subjects\n`);

if (issues.length === 0) {
  console.log("✅ No fake, placeholder, or suspicious questions found!");
} else {
  console.log(`⚠️  Found ${issues.length} issues:\n`);
  for (const iss of issues) {
    console.log(`  [${iss.issue}] ${iss.file} — ${iss.id} ${iss.detail ? "→ " + iss.detail : ""}`);
  }
}
