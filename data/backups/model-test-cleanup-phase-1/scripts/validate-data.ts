/**
 * validate-data.ts — delegates to MCQ QA validator.
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(__dirname, "validate-mcq-quality.js");
const strict = process.argv.includes("--strict");

execSync(`node "${script}"${strict ? " --strict" : ""}`, { stdio: "inherit" });
