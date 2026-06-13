/**
 * seed-physics-2nd.js — import Hyper Mega Hot Physics 2nd Paper model tests.
 *
 * Usage:
 *   node scripts/seed-physics-2nd.js
 *   pnpm data:import-hyper-mega
 */
const { execSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "data/imports/hsc-physics-2nd-hyper-mega-hot.json");
const script = path.join(root, "scripts/import-hyper-mega-model-tests.js");

execSync(`node "${script}" "${source}" physics-2nd-paper`, {
  stdio: "inherit",
  cwd: root,
});

console.log("[seed-physics-2nd] Hyper Mega Hot model tests imported.");
