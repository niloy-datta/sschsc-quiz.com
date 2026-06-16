#!/usr/bin/env node
/**
 * CI Check: Premium SVG validation.
 *
 * Fails when a question uses generated/premium placeholder SVG while the shared
 * diagram resolver can map the question text to a trusted library SVG.
 */
const fs = require("fs");
const path = require("path");
const { resolveDiagramTopic, imagePathForSlug } = require("./lib/diagram-topic-resolver");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const SVG_DIR = path.join(ROOT, "public", "images", "quiz");
const FIX_MODE = process.argv.includes("--fix");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".json") && entry.name !== "index.json") out.push(full);
  }
  return out;
}

function collectQuestions(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.questions)) return data.questions;
  const out = [];
  for (const value of Object.values(data || {})) {
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      if (item && Array.isArray(item.questions)) out.push(...item.questions);
      else out.push(item);
    }
  }
  return out;
}

function questionText(question) {
  return String(question?.question ?? question?.questionText ?? question?.text ?? "");
}

function isPlaceholderImage(image) {
  return typeof image === "string" && /\/images\/quiz\/(generated|premium)\//i.test(image);
}

function svgExists(slug) {
  return fs.existsSync(path.join(SVG_DIR, `${slug}.svg`));
}

const violations = [];
let changedFiles = 0;

for (const file of walk(QUESTIONS_DIR)) {
  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw);
  const questions = collectQuestions(data);
  let changed = false;

  for (const question of questions) {
    if (!question || typeof question !== "object") continue;
    if (!isPlaceholderImage(question.image)) continue;

    const resolved = resolveDiagramTopic(questionText(question), question.id);
    if (resolved.kind !== "library" || !svgExists(resolved.slug)) continue;

    const replacement = imagePathForSlug(resolved.slug);
    violations.push({
      file: path.relative(ROOT, file),
      id: question.id ?? null,
      current: question.image,
      replacement,
    });

    if (FIX_MODE) {
      question.image = replacement;
      changed = true;
    }
  }

  if (FIX_MODE && changed) {
    fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    changedFiles += 1;
  }
}

if (violations.length) {
  console.error(`Premium SVG CI: ${violations.length} replacement opportunity found.`);
  console.error(JSON.stringify(violations.slice(0, 50), null, 2));
  if (FIX_MODE) {
    console.error(`Updated files: ${changedFiles}`);
    process.exit(0);
  }
  process.exit(1);
}

console.log("Premium SVG CI: clean.");
