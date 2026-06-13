/**
 * Rebuild public/questions/{subject}/index.json board entries from disk.
 * Boards are ordered year-first (2022 → 2025), then standard board order.
 *
 * Usage:
 *   node scripts/rebuild-question-index.js
 *   node scripts/rebuild-question-index.js physics-2nd-paper
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");

const BOARD_ORDER = [
  "barishal",
  "chattogram",
  "cumilla",
  "dhaka",
  "dinajpur",
  "jashore",
  "mymensingh",
  "rajshahi",
  "sylhet",
];

const BOARD_FILE_RE =
  /^(barishal|chattogram|cumilla|dhaka|dinajpur|jashore|mymensingh|rajshahi|sylhet)-(\d{4})\.json$/;

function boardRank(board) {
  const idx = BOARD_ORDER.indexOf(board);
  return idx === -1 ? 99 : idx;
}

function titleCaseBoard(board) {
  if (board === "chattogram") return "Chattogram";
  if (board === "cumilla") return "Cumilla";
  if (board === "barishal") return "Barishal";
  return board.charAt(0).toUpperCase() + board.slice(1);
}

function collectBoardFiles(subjectDir) {
  const entries = [];
  for (const file of fs.readdirSync(subjectDir)) {
    const match = file.match(BOARD_FILE_RE);
    if (!match) continue;
    const [, board, year] = match;
    const fullPath = path.join(subjectDir, file);
    let questionCount = 0;
    try {
      const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      questionCount = Array.isArray(data) ? data.length : 0;
    } catch {
      continue;
    }
    entries.push({
      id: `${board}-${year}`,
      title: `${titleCaseBoard(board)} Board ${year}`,
      questionCount,
      year: Number(year),
      board,
    });
  }
  return entries.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return boardRank(a.board) - boardRank(b.board);
  });
}

function rebuildSubjectIndex(subjectSlug) {
  const subjectDir = path.join(QUESTIONS_DIR, subjectSlug);
  const indexPath = path.join(subjectDir, "index.json");
  if (!fs.existsSync(subjectDir)) {
    console.warn(`Skip missing folder: ${subjectSlug}`);
    return null;
  }

  const boards = collectBoardFiles(subjectDir).map(({ id, title, questionCount }) => ({
    id,
    title,
    questionCount,
  }));

  let index = { subject: subjectSlug, chapters: [], modelTests: [], boards: [] };
  if (fs.existsSync(indexPath)) {
    try {
      index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    } catch (err) {
      console.warn(`Could not parse ${indexPath}:`, err.message);
    }
  }

  index.boards = boards;
  fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");

  const years = [...new Set(boards.map((b) => b.id.match(/(\d{4})$/)?.[1]).filter(Boolean))].sort();
  console.log(
    `✅ ${subjectSlug}: ${boards.length} board sets (${years.join(", ") || "no years"})`,
  );
  return { subjectSlug, boards: boards.length, years };
}

function main() {
  const target = process.argv[2];
  if (target) {
    rebuildSubjectIndex(target);
    return;
  }

  const subjects = fs
    .readdirSync(QUESTIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const slug of subjects.sort()) {
    rebuildSubjectIndex(slug);
  }
}

main();
