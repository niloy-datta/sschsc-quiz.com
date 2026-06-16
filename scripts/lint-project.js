#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const failures = [];
const passes = [];

function pass(message) { passes.push(message); }
function fail(message) { failures.push(message); }
function readText(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function readJson(rel) { return JSON.parse(readText(rel)); }
function exists(rel) { return fs.existsSync(path.join(root, rel)); }
function checkRequiredFile(rel) { exists(rel) ? pass(`${rel} exists`) : fail(`${rel} is missing`); }
function checkForbiddenFile(rel) { exists(rel) ? fail(`${rel} should not exist; use AGENT_CONTEXT.md or data/reports instead`) : pass(`${rel} absent`); }
function checkIncludes(rel, text, label) {
  try {
    readText(rel).includes(text) ? pass(label) : fail(`${label} missing`);
  } catch (error) {
    fail(`Cannot inspect ${rel}: ${error.message}`);
  }
}
function checkExcludes(rel, text, label) {
  try {
    !readText(rel).includes(text) ? pass(label) : fail(`${label} failed`);
  } catch (error) {
    fail(`Cannot inspect ${rel}: ${error.message}`);
  }
}
function walkFiles(dir, predicate, out = []) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const childRel = path.join(dir, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) walkFiles(childRel, predicate, out);
    else if (!predicate || predicate(childRel)) out.push(childRel);
  }
  return out;
}
function getQuestionList(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && Array.isArray(value.questions)) return value.questions;
  return [];
}
function checkPublicQuestionLeakage(filePath) {
  const forbiddenPublicKeys = new Set(['correctOption', 'correctAnswer', 'answerIndex', 'correctOptionIndex', 'answer']);
  const questions = getQuestionList(readJson(filePath));
  for (const [index, question] of questions.entries()) {
    if (!question || typeof question !== 'object') continue;
    for (const key of forbiddenPublicKeys) {
      if (question[key] != null) fail(`${filePath} question ${index + 1} exposes private answer field: ${key}`);
    }
  }
}

checkRequiredFile('AGENT_CONTEXT.md');
checkRequiredFile('README.md');
checkRequiredFile('vercel.json');
checkRequiredFile('api/index.py');
checkRequiredFile('api/requirements.txt');
checkRequiredFile('.vercelignore');
checkRequiredFile('.eslintrc.json');
checkRequiredFile('src/lib/quiz-catalog.ts');
checkRequiredFile('public/quiz-data/manifest.json');
checkRequiredFile('backend/app/config.py');
checkRequiredFile('backend/app/core/config.py');

for (const rel of [
  'DEBUG_PROMPTS.md',
  'PROJECT_PLAN.md',
  'docs/prompts.md',
  'docs/prompts/ULTRA_STRICT_WEBSITE_LAUNCH_PROMPT_BN.md',
  'detect_missing_svg.txt',
  'scripts/prompts/mcq-qa-engine.txt',
  '.cursor/rules/mcq-qa-engine.mdc',
  'website-audit-and-fake-questions-report.txt',
]) checkForbiddenFile(rel);

try {
  const vercel = readJson('vercel.json');
  const apiRewrite = Array.isArray(vercel.rewrites)
    && vercel.rewrites.some((rule) => rule.source === '/api/:path*' && String(rule.destination || '').includes('/api/index'));
  apiRewrite ? pass('Vercel /api/:path* rewrite is configured') : fail('Vercel /api/:path* rewrite is missing');
} catch (error) {
  fail(`vercel.json is invalid JSON: ${error.message}`);
}

checkIncludes('api/index.py', '@app.get("/api/health")', 'FastAPI health endpoint is present');
checkIncludes('api/requirements.txt', 'google-auth', 'API requirements include google-auth');
checkIncludes('backend/app/config.py', 'validate_production_settings()', 'Production secret guard is present');
checkIncludes('backend/app/core/config.py', 'from ..config import', 'Legacy core config re-exports canonical config');
checkIncludes('package.json', '"lint:code": "next lint"', 'Next lint script is configured');
checkIncludes('package.json', '"lint:repo": "node scripts/lint-project.js"', 'Repo lint script is configured');
checkIncludes('.github/workflows/autonomous-launch-gate.yml', 'corepack enable', 'Launch gate uses Corepack');
checkIncludes('.github/workflows/autonomous-launch-gate.yml', 'node scripts/ci-check-premium-svgs.js', 'Launch gate checks premium SVG drift');
checkExcludes('.github/workflows/autonomous-launch-gate.yml', 'pnpm/action-setup', 'Launch gate avoids duplicate pnpm setup');

try {
  const catalog = readText('src/lib/quiz-catalog.ts').toLowerCase();
  if (!catalog.includes('ict') && !catalog.includes('আইসিটি')) pass('ICT is not exposed in static quiz catalog');
  else fail('ICT appears in static quiz catalog');
} catch (error) {
  fail(`Cannot inspect quiz catalog: ${error.message}`);
}

const publicQuestionFiles = walkFiles('public/questions', (rel) => rel.endsWith('.json') && path.basename(rel) !== 'index.json');
if (publicQuestionFiles.length === 0) {
  fail('No public question JSON files found under public/questions');
} else {
  for (const rel of publicQuestionFiles) {
    try { checkPublicQuestionLeakage(rel); }
    catch (error) { fail(`${rel} is invalid JSON: ${error.message}`); }
  }
  if (!failures.some((item) => item.includes('exposes private answer field'))) {
    pass(`Public question files checked for answer-key leakage (${publicQuestionFiles.length} files)`);
  }
}

console.log('Project lint sanity checks');
for (const message of passes) console.log(`✓ ${message}`);
for (const message of failures) console.error(`✗ ${message}`);
if (failures.length) {
  console.error(`\n${failures.length} lint sanity check(s) failed.`);
  process.exit(1);
}
console.log('\nAll project lint sanity checks passed.');
