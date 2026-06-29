#!/usr/bin/env node
/**
 * Audit SVG files for suspicious text content.
 *
 * This script helps enforce SVG integrity (Phase 4 of MASTER_PLAN.md) by detecting:
 * - English developer-facing keywords (e.g., "variant", "placeholder").
 * - Known answer-revealing Bengali phrases.
 * - Duplicate text elements within a single SVG.
 *
 * Usage:
 *   node scripts/audit-svg-text.js
 *   node scripts/audit-svg-text.js /path/to/specific/dir
 */

const fs = require("fs");
const path = require("path");

// --- Configuration ---

const DEFAULT_SEARCH_DIR = path.join(__dirname, "..", "public", "images", "quiz");

// Keywords that are likely developer notes and shouldn't be in final SVGs.
const DEV_KEYWORDS_RE = /\b(variant|placeholder|stimulus|template|debug|fixme|todo|sample)\b/i;

// Phrases that might reveal the answer or describe the diagram too explicitly.
const REVEALING_PHRASES_RE = /ধ্রুব রেখা/i; // "Constant line"

const TEXT_CONTENT_RE = /<text[^>]*>([^<]+)<\/text>/g;

// --- Implementation ---

function walkDir(dir, allFiles = []) {
    if (!fs.existsSync(dir)) return allFiles;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkDir(fullPath, allFiles);
        } else if (entry.isFile() && entry.name.endsWith(".svg")) {
            allFiles.push(fullPath);
        }
    }
    return allFiles;
}

function main() {
    const searchDir = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_SEARCH_DIR;
    console.log(`🔍 Auditing SVGs for suspicious text in: ${searchDir}\n`);

    const svgFiles = walkDir(searchDir);
    const violations = [];

    for (const file of svgFiles) {
        try {
            const content = fs.readFileSync(file, "utf8");
            const relativePath = path.relative(process.cwd(), file);

            if (DEV_KEYWORDS_RE.test(content)) {
                violations.push({ file: relativePath, reason: "Contains developer keyword(s)." });
            }

            if (REVEALING_PHRASES_RE.test(content)) {
                violations.push({ file: relativePath, reason: "Contains potentially answer-revealing text." });
            }

            const textElements = Array.from(content.matchAll(TEXT_CONTENT_RE), m => m[1].trim());
            const uniqueElements = new Set(textElements);
            if (textElements.length > uniqueElements.size) {
                violations.push({ file: relativePath, reason: "Contains duplicate text elements." });
            }
        } catch (error) {
            console.error(`Could not process file: ${file}`, error);
        }
    }

    console.log(`📊 Scanned ${svgFiles.length} SVG files.`);

    if (violations.length > 0) {
        console.log(`\n⚠️  Found ${violations.length} potential violation(s):`);
        violations.forEach(v => console.log(`  - ${v.file}: ${v.reason}`));
        console.log("\n💡 Review these files and remove the unnecessary text elements.");
    } else {
        console.log("\n✅ All clean! No SVGs with suspicious text found.");
    }
}

main();