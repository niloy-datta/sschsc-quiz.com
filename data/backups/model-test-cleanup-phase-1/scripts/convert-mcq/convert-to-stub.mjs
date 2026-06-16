#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";

const targetArg =
  process.argv[2] ||
  "src/data/ssc/science/biology/board-questions/year-wise/2022";
const targetDir = path.resolve(process.cwd(), targetArg);

const bengaliDigitRegex = /[০১২৩৪৫৬৭৮৯]/;

async function convertFolder(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      await convertFolder(full);
      continue;
    }
    if (!ent.name.endsWith(".ts")) continue;
    const content = await fs.readFile(full, "utf8");
    // Skip if file already exports JS/TS
    if (/export\s+(const|default|type|interface)/.test(content)) continue;
    if (!bengaliDigitRegex.test(content) && content.length < 300) continue;

    const rel = path.relative(process.cwd(), full);
    const rawDest = path.join("docs", "raw-questions", rel + ".md");
    await fs.mkdir(path.dirname(rawDest), { recursive: true });
    await fs.writeFile(rawDest, content, "utf8");

    const escaped = content.replace(/`/g, "\\`");
    const stub =
      `export type Question = { id?: number; questionText: string; options: string[]; correctOptionIndex?: number | null; explanation?: string | null };

export const raw = ` +
      "`" +
      `${escaped}` +
      "`" +
      `;

export const questions: Question[] = [];

export default questions;
`;

    await fs.writeFile(full, stub, "utf8");
    console.log("Stubbed", rel, "-> moved original to", rawDest);
  }
}

convertFolder(targetDir).catch((err) => {
  console.error(err);
  process.exit(1);
});
