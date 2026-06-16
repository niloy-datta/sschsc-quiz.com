/**
 * Phase 0: Data Backup
 * Phase 1: Data Integrity Cleanup, Deduplication, Rebuild Indexes & Sync
 * Target: Local static question pools (scratch/parsed_quizzes.json & public/questions/**/*.json)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BACKUP_DIR = path.join(ROOT, 'backups', `phase01_backup_${Date.now()}`);
const SCRATCH_FILE = path.join(ROOT, 'scratch', 'parsed_quizzes.json');
const PUBLIC_Q_DIR = path.join(ROOT, 'public', 'questions');
const INDEX_FILE = path.join(ROOT, 'data', 'master-question-index.json');

let stats = {
    totalFiles: 0,
    beforeCount: 0,
    afterCount: 0,
    duplicatesRemoved: 0,
    corruptRemoved: 0,
    indexesRebuilt: 0
};

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const fileStats = exists && fs.statSync(src);
    const isDirectory = exists && fileStats.isDirectory();
    
    if (isDirectory) {
        ensureDir(dest);
        fs.readdirSync(src).forEach(childItemName => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else if (exists) {
        fs.copyFileSync(src, dest);
    }
}

console.log('🚀 [PHASE 0] Starting Data Backup...');
ensureDir(BACKUP_DIR);

if (fs.existsSync(SCRATCH_FILE)) {
    ensureDir(path.join(BACKUP_DIR, 'scratch'));
    fs.copyFileSync(SCRATCH_FILE, path.join(BACKUP_DIR, 'scratch', 'parsed_quizzes.json'));
    console.log('   ✅ Backed up: scratch/parsed_quizzes.json');
}
if (fs.existsSync(PUBLIC_Q_DIR)) {
    copyRecursiveSync(PUBLIC_Q_DIR, path.join(BACKUP_DIR, 'public-questions'));
    console.log('   ✅ Backed up: public/questions/ directory');
}

console.log('\n🚀 [PHASE 1] Running Data Integrity Cleanup & Deduplication...');

// 1. Clean scratch/parsed_quizzes.json
if (fs.existsSync(SCRATCH_FILE)) {
    let raw = JSON.parse(fs.readFileSync(SCRATCH_FILE, 'utf8'));
    let cleanedObj = {};
    
    for (let key in raw) {
        let qArray = raw[key];
        if (!Array.isArray(qArray)) continue;
        stats.totalFiles++;

        let seen = new Set();
        let cleanedArray = [];

        for (let q of qArray) {
            stats.beforeCount++;
            let text = (q.question_text || q.questionText || q.text || '').trim();
            
            if (!text || (!q.options && !q.optionA)) {
                stats.corruptRemoved++;
                continue; // Skip empty/corrupted records without text or options
            }

            let normalizedText = text.toLowerCase().replace(/\s+/g, ' ');
            if (seen.has(normalizedText)) {
                stats.duplicatesRemoved++;
                continue;
            }

            seen.add(normalizedText);
            cleanedArray.push(q);
            stats.afterCount++;
        }
        cleanedObj[key] = cleanedArray;
    }
    
    // Sync Data
    fs.writeFileSync(SCRATCH_FILE, JSON.stringify(cleanedObj, null, 2));
    console.log('   🔄 Synced clean data to: scratch/parsed_quizzes.json');
}

// 2. Clean public/questions/**/*.json & Rebuild Index
let masterIndex = [];

function processPublicQuestions(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            processPublicQuestions(fullPath);
        } else if (item.isFile() && item.name.endsWith('.json') && item.name !== 'index.json') {
            stats.totalFiles++;
            let qArray;
            try {
                qArray = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            } catch (e) { continue; }
            
            if (!Array.isArray(qArray)) continue;

            let seen = new Set();
            let cleanedArray = [];

            for (let q of qArray) {
                stats.beforeCount++;
                let text = (q.text || q.questionText || q.question_text || '').trim();
                
                if (!text) {
                    stats.corruptRemoved++;
                    continue;
                }

                let normalizedText = text.toLowerCase().replace(/\s+/g, ' ');
                if (seen.has(normalizedText)) {
                    stats.duplicatesRemoved++;
                    continue;
                }

                seen.add(normalizedText);
                cleanedArray.push(q);
                stats.afterCount++;
            }

            // Sync Data
            fs.writeFileSync(fullPath, JSON.stringify(cleanedArray, null, 2));

            // Rebuild Index logic
            const relativePath = path.relative(ROOT, fullPath).replace(/\\/g, '/');
            let subjectMatch = relativePath.match(/public\/questions\/([^/]+)/);
            let subject = subjectMatch ? subjectMatch[1] : 'unknown';
            
            masterIndex.push({
                file: relativePath,
                subject: subject,
                questionCount: cleanedArray.length,
                lastSynced: new Date().toISOString()
            });
            stats.indexesRebuilt++;
        }
    }
}

processPublicQuestions(PUBLIC_Q_DIR);

console.log('\n🚀 Rebuilding Data Indexes...');
ensureDir(path.dirname(INDEX_FILE));
fs.writeFileSync(INDEX_FILE, JSON.stringify(masterIndex, null, 2));
console.log(`   ✅ Master index rebuilt at: ${path.relative(ROOT, INDEX_FILE)}`);

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║     📊 PHASE 0 & 1 - DATA CLEANUP & SYNC RESULT REPORT       ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');
console.log(`📁 Files Processed:           ${stats.totalFiles}`);
console.log(`📝 Total Questions (Before):  ${stats.beforeCount}`);
console.log(`🗑️  Empty/Corrupt Removed:     ${stats.corruptRemoved}`);
console.log(`👯 Exact Duplicates Removed:  ${stats.duplicatesRemoved}`);
console.log(`✅ Total Questions (After):   ${stats.afterCount}`);
console.log(`🗂️  Index Entries Built:       ${stats.indexesRebuilt}`);
console.log(`\n💾 Secure Backup Saved To:    ${path.relative(ROOT, BACKUP_DIR)}`);
console.log('\n🏁 Phase 0 and Phase 1 completed successfully.');