#!/usr/bin/env node
/**
 * add-all-missing-svgs.js
 * 
 * Reads data/missing-svg-now.json, and for each entry:
 * 1. Copies the current_image placeholder SVG to the suggested_image_path
 * 2. Updates the question JSON's "image" field to point to the new path
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const missingFile = path.join(ROOT, 'data', 'missing-svg-now.json');

if (!fs.existsSync(missingFile)) {
  console.error('Missing file:', missingFile);
  process.exit(1);
}

const missing = JSON.parse(fs.readFileSync(missingFile, 'utf8'));
console.log(`Total missing SVGs: ${missing.length}`);

let copied = 0;
let skipped = 0;
let jsonUpdated = 0;
let errors = [];

// Group by file to batch JSON updates
const fileGroups = {};

for (const entry of missing) {
  const srcPath = path.join(ROOT, 'public', entry.current_image);
  const destPath = path.join(ROOT, 'public', entry.suggested_image_path);
  
  // 1. Copy SVG file
  if (!fs.existsSync(srcPath)) {
    errors.push(`Source SVG missing: ${srcPath} (for ${entry.question_id})`);
    skipped++;
    continue;
  }
  
  if (fs.existsSync(destPath)) {
    // Already exists, skip copy
  } else {
    try {
      // Ensure directory exists
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcPath, destPath);
      copied++;
    } catch (e) {
      errors.push(`Copy error for ${entry.question_id}: ${e.message}`);
      skipped++;
      continue;
    }
  }
  
  // 2. Group JSON updates
  // The file field is relative like "biology-1st-paper/chattogram-2023.json"
  // The question JSON files are in public/questions/{subject}/
  const jsonFile = path.join(ROOT, 'public', 'questions', entry.file);
  if (!fs.existsSync(jsonFile)) {
    errors.push(`JSON file missing: ${jsonFile} (for ${entry.question_id})`);
    continue;
  }
  
  if (!fileGroups[jsonFile]) {
    fileGroups[jsonFile] = [];
  }
  fileGroups[jsonFile].push({
    questionId: entry.question_id,
    newImage: entry.suggested_image_path
  });
}

console.log(`SVGs copied: ${copied}`);
console.log(`SVGs skipped (already exist): ${skipped}`);
console.log(`Errors: ${errors.length}`);
if (errors.length > 0) {
  console.log('\nFirst 10 errors:');
  errors.slice(0, 10).forEach(e => console.log('  -', e));
}

// 3. Update JSON files
console.log(`\nUpdating ${Object.keys(fileGroups).length} JSON files...`);

for (const [jsonFile, updates] of Object.entries(fileGroups)) {
  try {
    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    let changed = false;
    
    for (const update of updates) {
      if (data[update.questionId]) {
        data[update.questionId].image = update.newImage;
        changed = true;
        jsonUpdated++;
      }
    }
    
    if (changed) {
      fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2), 'utf8');
    }
  } catch (e) {
    errors.push(`JSON update error for ${jsonFile}: ${e.message}`);
  }
}

console.log(`JSON entries updated: ${jsonUpdated}`);
console.log(`JSON files with errors: ${errors.length - copied - skipped}`);
console.log('\nDone!');
