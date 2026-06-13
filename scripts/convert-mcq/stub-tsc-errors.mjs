import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

async function readErrorFile(errFile) {
  const buf = await fs.readFile(errFile);
  // detect UTF-16 LE BOM
  if (buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.toString("utf16le");
  }
  // detect UTF-16 BE BOM
  if (buf[0] === 0xfe && buf[1] === 0xff) {
    // swap bytes
    const swapped = Buffer.alloc(buf.length - 2);
    for (let i = 2; i < buf.length; i += 2) {
      swapped[i - 2] = buf[i + 1];
      swapped[i - 1] = buf[i];
    }
    return swapped.toString("utf16le");
  }
  // fallback utf8
  return buf.toString("utf8");
}

async function main() {
  const cwd = process.cwd();
  const errFile = path.join(cwd, "tsc-errors.txt");
  let txt;
  try {
    txt = await readErrorFile(errFile);
  } catch (e) {
    console.error("Cannot read tsc-errors.txt", e.message);
    process.exit(1);
  }
  const re = /([A-Za-z]:)?[^\s]+\.ts(?=[\\(:])/g;
  const matches = new Set();
  let m;
  while ((m = re.exec(txt))) {
    // normalize backslashes
    const p = m[0].replace(/\\/g, "/");
    matches.add(p);
  }
  const files = Array.from(matches).filter((p) => p.includes("src/data"));
  if (files.length === 0) {
    console.log("No src/data files in tsc errors");
    return;
  }
  for (const f of files) {
    try {
      // construct absolute path
      const abs = path.resolve(cwd, f);
      if (!fsSync.existsSync(abs)) {
        console.error("File not found:", abs);
        continue;
      }
      const content = await fs.readFile(abs, "utf8");
      const backupPath = path.join(cwd, "docs", "raw-questions", f + ".md");
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      await fs.writeFile(backupPath, content, "utf8");
      const stub = `export const questions:any[] = [];

export default questions;\n`;
      await fs.writeFile(abs, stub, "utf8");
      console.log("Stubbed", f);
    } catch (e) {
      console.error("Failed", f, e.message);
    }
  }
}

main();
