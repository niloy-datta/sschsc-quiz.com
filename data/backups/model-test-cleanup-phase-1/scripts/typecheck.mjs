import fs from "node:fs";
import { execSync } from "node:child_process";

for (const file of ["tsconfig.tsbuildinfo", ".next/cache/tsconfig.tsbuildinfo"]) {
  try {
    fs.unlinkSync(file);
  } catch {
    /* no stale cache */
  }
}

execSync("tsc --noEmit -p tsconfig.typecheck.json", { stdio: "inherit" });
