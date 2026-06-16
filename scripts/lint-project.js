#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const failures = [];
const passes = [];

function pass(message) {
  passes.push(message);
}

function fail(message) {
  failures.push(message);
}

function readText(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function readJson(rel) {
  return JSON.parse(readText(rel));
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function checkRequiredFile(rel) {
  if (exists(rel)) pass(`${rel} exists`);
  else fail(`${rel} is missing`);
}

function walkFiles(dir, predicate, out = []) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const childRel = path.join(dir, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      walkFiles(childRel, predicate, out);
    } else if (!predicate || predicate(childRel)) {
      out.push(childRel);
    }
  }
  return out;
}

function hasForbiddenKey(value, forbiddenKeys, location) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => hasForbiddenKey(item, forbiddenKeys, `${location}[${index}]`));
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) {
      fail(`${location}.${key} exposes a private answer/explanation field`);
    }
    hasForbiddenKey(nested, forbiddenKeys, `${location}.${key}`);
  }
}

checkRequiredFile('vercel.json');
checkRequiredFile('api/index.py');
checkRequiredFile('.vercelignore');
checkRequiredFile('src/lib/quiz-catalog.ts');
checkRequiredFile('public/quiz-data/manifest.json');

try {
  const vercel = readJson('vercel.json');
  const apiRewrite = Array.isArray(vercel.rewrites)
    && vercel.rewrites.some((rule) => rule.source === '/api/:path*' && String(rule.destination || '').includes('/api/index'));
  if (apiRewrite) pass('Vercel /api/:path* rewrite is configured');
  else fail('Vercel /api/:path* rewrite is missing');
} catch (error) {
  fail(`vercel.json is invalid JSON: ${error.message}`);
}

try {
  const apiEntry = readText('api/index.py');
  if (apiEntry.includes('@app.get("/api/health")')) pass('FastAPI health endpoint is present');
  else fail('FastAPI /api/health endpoint is missing from api/index.py');
} catch (error) {
  fail(`Cannot inspect api/index.py: ${error.message}`);
}

try {
  const catalog = readText('src/lib/quiz-catalog.ts').toLowerCase();
  if (!catalog.includes('ict') && !catalog.includes('আইসিটি')) pass('ICT is not exposed in static quiz catalog');
  else fail('ICT appears in static quiz catalog');
} catch (error) {
  fail(`Cannot inspect quiz catalog: ${error.message}`);
}

const publicQuestionFiles = walkFiles('public/questions', (rel) => rel.endsWith('.json'));
if (publicQuestionFiles.length === 0) {
  fail('No public question JSON files found under public/questions');
} else {
  const forbiddenPublicKeys = new Set(['correctOption', 'answer', 'correctOptionText', 'correctOptionIndex', 'explanation']);
  for (const rel of publicQuestionFiles) {
    try {
      hasForbiddenKey(readJson(rel), forbiddenPublicKeys, rel);
    } catch (error) {
      fail(`${rel} is invalid JSON: ${error.message}`);
    }
  }
  if (!failures.some((item) => item.includes('exposes a private answer/explanation field'))) {
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
