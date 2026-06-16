const fs = require("fs");
const path = require("path");

const SUBJECTS = ["biology", "physics", "chemistry", "higher-math", "general-math"];
let totalRemoved = 0;

for (const subject of SUBJECTS) {
  const indexPath = path.join("public", "questions", subject, "index.json");
  
  if (!fs.existsSync(indexPath)) {
    console.log(`[${subject}] index.json not found, skipping`);
    continue;
  }

  const data = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  
  if (!data.boards || !Array.isArray(data.boards)) {
    console.log(`[${subject}] No boards array, skipping`);
    continue;
  }

  const originalCount = data.boards.length;
  data.boards = data.boards.filter(b => !b.id.endsWith("-2026"));
  const removed = originalCount - data.boards.length;
  totalRemoved += removed;

  fs.writeFileSync(indexPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`[${subject}] Removed ${removed} fake 2026 entries (${originalCount} → ${data.boards.length})`);
}

console.log(`\n✅ Total: ${totalRemoved} fake 2026 entries removed across ${SUBJECTS.length} subjects`);
