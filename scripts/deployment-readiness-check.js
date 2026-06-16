#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const reportDir = path.join(root, 'data', 'reports');
fs.mkdirSync(reportDir, { recursive: true });

const checks = [];
function exists(rel, label = rel) {
  const ok = fs.existsSync(path.join(root, rel));
  checks.push({ area: label, status: ok ? 'pass' : 'fail', note: rel });
  return ok;
}
function fileIncludes(rel, text, label) {
  const p = path.join(root, rel);
  const ok = fs.existsSync(p) && fs.readFileSync(p, 'utf8').includes(text);
  checks.push({ area: label, status: ok ? 'pass' : 'fail', note: `${rel} includes ${text}` });
  return ok;
}

exists('vercel.json', 'Vercel config');
exists('api/index.py', 'FastAPI serverless entry');
exists('requirements.txt', 'Root Python requirements');
exists('backend/requirements.txt', 'Backend Python requirements');
exists('.env.local.example', 'Environment example');
exists('app/not-found.tsx', 'Global not-found page');
exists('app/loading.tsx', 'Global loading page');
exists('app/error.tsx', 'Global error boundary');
exists('DEPLOYMENT_CHECKLIST.md', 'Deployment checklist');
exists('PROJECT_MAINTAINABILITY.md', 'Maintainability plan');
exists('AUTONOMOUS_ENGINE_PLAN.md', 'Autonomous plan');
fileIncludes('requirements.txt', 'google-auth', 'Firestore REST dependency');
fileIncludes('package.json', '"build": "next build"', 'Next build script');
fileIncludes('package.json', '"typecheck"', 'Typecheck script');
fileIncludes('package.json', '"data:validate-mcq"', 'MCQ validation script');

const catalogPath = path.join(root, 'src', 'lib', 'quiz-catalog.ts');
let ictCatalog = false;
if (fs.existsSync(catalogPath)) {
  const catalog = fs.readFileSync(catalogPath, 'utf8').toLowerCase();
  ictCatalog = catalog.includes('ict') || catalog.includes('আইসিটি');
}
checks.push({ area: 'ICT catalog status', status: ictCatalog ? 'fail' : 'pass', note: ictCatalog ? 'ICT text found in quiz catalog' : 'No ICT text in quiz catalog' });

const failed = checks.filter((c) => c.status === 'fail');
const md = [
  '# Deployment Readiness Static Check',
  '',
  '| Area | Status | Note |',
  '| --- | --- | --- |',
  ...checks.map((c) => `| ${c.area} | ${c.status} | ${c.note} |`),
  '',
  `Result: ${failed.length ? 'NOT READY' : 'STATIC READY'}`,
  '',
  'This script does not delete or mutate quiz questions.',
].join('\n');

fs.writeFileSync(path.join(reportDir, 'deployment_readiness_static_check.md'), `${md}\n`, 'utf8');
console.log(md);
if (failed.length) process.exit(1);
