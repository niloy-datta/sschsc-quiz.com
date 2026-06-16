export type ModelTestCategory = "model" | "prediction" | "quick" | "board";

export type ModelTestImportance = "high" | "medium" | "low";
export type ModelTestDifficulty = "easy" | "medium" | "hard" | "advanced";

export const MODEL_TEST_CATEGORY_ORDER: Record<ModelTestCategory, number> = {
  model: 0,
  board: 1,
  prediction: 2,
  quick: 3,
};

export const SORT_PRACTICE = 100000;
export const SORT_UNNUMBERED = 50000;

const BANGLA_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** Convert Bangla digits to English digits in any string. */
export function normalizeDigits(text: string): string {
  return text.replace(/[০-৯]/g, (c) => String(BANGLA_DIGITS.indexOf(c)));
}

export function isPracticeSourceKey(sourceKey: string): boolean {
  const s = sourceKey.toLowerCase();
  return (
    s.endsWith("_questions") ||
    s.endsWith("-questions") ||
    (s.includes("questions") &&
      !s.includes("model-test") &&
      !s.includes("model_test"))
  );
}

export function getModelTestCategory(slug: string): ModelTestCategory {
  const s = slug.toLowerCase();

  if (s.includes("board")) {
    return "board";
  }

  if (s.includes("prediction") || s.includes("প্রেডিকশন")) {
    return "prediction";
  }

  if (isPracticeSourceKey(slug)) {
    return "quick";
  }

  return "model";
}

/** Extract serial number from slug/title — Bangla + English digits. */
export function extractTestNumber(title: string): number | null {
  if (isPracticeSourceKey(title)) {
    return null;
  }

  const s = normalizeDigits(title.toLowerCase());

  const patterns = [
    /model[-_]?test[-_]?(\d+)/,
    /super[-_]?model[-_]?set[-_]?(\d+)/,
    /prediction[-_]?set[-_]?(\d+)/,
    /prediction[-_]?round(\d+)/,
    /special[-_]?set[-_]?(\d+)/,
    /high[-_]?common[-_]?set[-_]?(\d+)/,
    /high[-_]?common[-_]?sets[-_]?(\d+)/,
    /zoologyset(\d+)/,
    /ch(\d+)set(\d+)/,
    /sets?(\d+)/,
    /set[-_]?(\d+)/,
    /round(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = s.match(pattern);
    if (match) {
      const num = parseInt(match[match.length - 1], 10);
      if (!Number.isNaN(num)) return num;
    }
  }

  const trailing = s.match(/(\d+)$/);
  if (trailing) return parseInt(trailing[1], 10);

  const all = s.match(/\d+/g);
  if (all?.length) return parseInt(all[0], 10);

  return null;
}

/** @deprecated use extractTestNumber */
export function extractModelTestNumber(slug: string): number {
  const n = extractTestNumber(slug);
  return n ?? 9999;
}

function formatUnnumberedTitle(sourceKey: string): string {
  const s = sourceKey.toLowerCase();
  if (s.includes("killer")) return "Model Test Challenge";
  if (s.includes("nightmare")) return "Model Test Advanced";
  if (s.includes("board")) return "Model Test Board";
  if (s.includes("final")) return "Model Test Final";
  const short = sourceKey.replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
  return `Model Test · ${short.slice(0, 28)}`;
}

/** Clean display title — preserves serial number, never raw slug. */
export function formatModelTestTitle(rawTitle: string): string {
  return formatModelTestDisplayTitle(rawTitle);
}

export function formatModelTestDisplayTitle(sourceKey: string): string {
  if (isPracticeSourceKey(sourceKey)) {
    return "Model Test Practice";
  }

  const num = extractTestNumber(sourceKey);
  if (num !== null) {
    return `Model Test ${String(num).padStart(2, "0")}`;
  }

  return formatUnnumberedTitle(sourceKey);
}

export function shortSourceKeyLabel(sourceKey: string): string {
  const s = sourceKey
    .replace(/^ssc[-_]?/i, "")
    .replace(/^hsc[-_]?/i, "")
    .replace(/physics|chemistry|biology/gi, "")
    .replace(/[_-]+/g, " ")
    .trim();
  return s.length > 3 ? s.slice(0, 20) : sourceKey.slice(0, 20);
}

export function getSortNumber(sourceKey: string, testNumber: number | null): number {
  if (isPracticeSourceKey(sourceKey)) return SORT_PRACTICE;
  if (testNumber !== null) return testNumber;
  return SORT_UNNUMBERED;
}

export function resolveDisplayTitleCollisions<
  T extends { sourceKey: string; displayTitle: string },
>(items: T[]): T[] {
  const byTitle = new Map<string, T[]>();
  for (const item of items) {
    const list = byTitle.get(item.displayTitle) ?? [];
    list.push(item);
    byTitle.set(item.displayTitle, list);
  }

  return items.map((item) => {
    const group = byTitle.get(item.displayTitle)!;
    if (group.length <= 1) return item;
    return {
      ...item,
      displayTitle: `${item.displayTitle} · ${shortSourceKeyLabel(item.sourceKey)}`,
    };
  });
}

export function inferModelTestDifficulty(
  slug: string,
  sortNumber: number,
): ModelTestDifficulty | undefined {
  const s = slug.toLowerCase();

  if (
    s.includes("killer") ||
    s.includes("nightmare") ||
    s.includes("challenge")
  ) {
    return "advanced";
  }

  if (s.includes("hard")) {
    return "hard";
  }

  if (sortNumber >= 11 && sortNumber < SORT_UNNUMBERED) {
    return "advanced";
  }

  if (sortNumber >= 6 && sortNumber < SORT_UNNUMBERED) {
    return "hard";
  }

  if (sortNumber <= 3) {
    return "easy";
  }

  if (sortNumber < SORT_UNNUMBERED) {
    return "medium";
  }

  return undefined;
}

export type ModelTestScope = "chapter" | "paper" | "board" | "whole-syllabus";

export type ChapterCoveredEntry =
  | string
  | {
      chapter?: string | number;
      chapterName?: string;
      chapterNo?: string | number;
      name?: string;
    };

interface ModelTestScopeMeta {
  tags?: unknown[];
  chaptersCovered?: ChapterCoveredEntry[];
  scope?: string;
}

/** Normalize chaptersCovered — JSON may use strings or { chapter, chapterName } objects. */
export function normalizeChaptersCovered(
  chapters?: ChapterCoveredEntry[] | unknown[],
): string[] {
  if (!chapters?.length) return [];

  return chapters
    .map((entry) => {
      if (typeof entry === "string") {
        return entry.replace(/\s*&\s*.*/g, "").trim();
      }
      if (entry && typeof entry === "object") {
        const obj = entry as Record<string, unknown>;
        if (typeof obj.chapterName === "string" && obj.chapterName.trim()) {
          return obj.chapterName.trim();
        }
        if (typeof obj.name === "string" && obj.name.trim()) {
          return obj.name.trim();
        }
        if (obj.chapter != null) return String(obj.chapter).trim();
        if (obj.chapterNo != null) return String(obj.chapterNo).trim();
      }
      if (typeof entry === "number") return String(entry);
      return "";
    })
    .filter(Boolean);
}

/** Chapter-wise (single chapter/topic) vs full-paper model tests. */
export function inferModelTestScope(
  sourceKey: string,
  meta?: ModelTestScopeMeta,
): ModelTestScope {
  const s = sourceKey.toLowerCase();
  const tags = (meta?.tags ?? []).map((t) => String(t).toLowerCase());
  const coveredChapterCount = normalizeChaptersCovered(meta?.chaptersCovered).length;

  if (
    tags.includes("chapter-wise") ||
    tags.includes("chapter") ||
    meta?.scope === "chapter"
  ) {
    return "chapter";
  }
  if (
    tags.includes("paper-wise") ||
    tags.includes("paper") ||
    meta?.scope === "paper"
  ) {
    return "paper";
  }

  if (
    /chapter[-_]\d{2}[-_](?:high-priority-)?(?:set|model-test)/.test(s) ||
    /ch\d|chapter[-_]?\d|chapterwise|zoologyset|chset\d|chemistryset\d+$/.test(s)
  ) {
    return "chapter";
  }
  if (/physicsfirstpaperch\d/.test(s)) return "chapter";
  if (/model-test-\d+-[a-z]/.test(s) && !/model-test-\d+$/.test(s)) {
    return "chapter";
  }
  if (coveredChapterCount === 1) return "chapter";

  if (
    s.includes("board-standard") ||
    s.includes("board_style") ||
    (s.includes("board") && !s.includes("board-questions"))
  ) {
    return "board";
  }
  if (
    s.includes("whole-syllabus") ||
    s.includes("full-book") ||
    s.includes("wholebook") ||
    s.includes("finalsets")
  ) {
    return "whole-syllabus";
  }
  if (
    /tier-a-hot|high-common|super-model|killer-set/.test(s)
  ) {
    return "paper";
  }
  if (/hsc-[a-z0-9-]+-paper-model-test-\d+$/.test(s)) return "paper";
  if (/ssc-[a-z-]+-(board-standard|high-common)/.test(s)) return "paper";
  if (/physicsfirstpapersets|super-model-set/.test(s)) return "paper";
  if (/model-test-\d+$/.test(s)) return "paper";
  if (coveredChapterCount >= 3) return "paper";

  return "paper";
}

export function inferModelTestImportance(
  type: ModelTestCategory,
  testNumber: number | null,
  sourceKey?: string,
  tags?: unknown[],
): ModelTestImportance {
  if (sourceKey && isHyperMegaHotSource(sourceKey, tags?.map(String))) return "high";
  if (type === "board") return "high";
  if (testNumber !== null && testNumber <= 5) return "high";
  if (testNumber !== null && testNumber <= 10) return "medium";
  if (type === "prediction" && testNumber !== null && testNumber <= 3) {
    return "medium";
  }
  return "low";
}

export function inferModelTestPriority(
  type: ModelTestCategory,
  testNumber: number | null,
  _sourceKey?: string,
): number {
  const base: Record<ModelTestCategory, number> = {
    model: 0,
    board: 40,
    prediction: 80,
    quick: 120,
  };
  const num = testNumber ?? 50;
  return base[type] + num;
}

/** Student-facing title from continuous UI index (1-based). */
export function formatUiDisplayTitle(
  displayIndex: number,
  scope: ModelTestScope = "paper",
  chapterNo?: number | null,
): string {
  const num = String(displayIndex).padStart(2, "0");
  switch (scope) {
    case "chapter":
      const ch = chapterNo != null ? String(chapterNo).padStart(2, "0") : "01";
      return `Chapter ${ch} Model Test ${num}`;
    case "board":
      return `Board Standard Model Test ${num}`;
    case "whole-syllabus":
      return `Whole Syllabus Model Test ${num}`;
    default:
      return `Model Test ${num}`;
  }
}

export function extractChapterNumber(sourceKey: string): number | null {
  const s = normalizeDigits(sourceKey.toLowerCase());
  const m = s.match(/chapter[-_]?(\d+)|ch(\d+)/);
  if (m) return parseInt(m[1] ?? m[2], 10);
  return null;
}

const UI_TITLE_PATTERN = /^Model Test \d{2}$/;
const CHAPTER_TITLE_PATTERN = /^Chapter \d{2} Model Test \d{2}$/;
const BOARD_TITLE_PATTERN = /^Board Standard Model Test \d{2}$/;
const WHOLE_TITLE_PATTERN = /^Whole Syllabus Model Test \d{2}$/;
const HYPER_MEGA_HOT_TITLE_PATTERN = /^Hyper Mega Hot SET \d+(?: · .+)?$/i;

export function isHyperMegaHotSource(sourceKey?: string, tags?: string[]): boolean {
  const s = (sourceKey ?? "").toLowerCase();
  if (/tier-a-hot|hyper-mega|mega-hot-model/.test(s)) return true;
  const normalized = (tags ?? []).map((t) => String(t).toLowerCase());
  return normalized.includes("mega-hot") || normalized.includes("hyper-exclusive");
}

export function isValidUiDisplayTitle(title: string): boolean {
  return UI_TITLE_PATTERN.test(title);
}

/** Keep imported Bangla-friendly titles instead of renumbering. */
export function isStudentFacingTitle(title: string): boolean {
  const t = title.trim();
  return (
    UI_TITLE_PATTERN.test(t) ||
    CHAPTER_TITLE_PATTERN.test(t) ||
    BOARD_TITLE_PATTERN.test(t) ||
    WHOLE_TITLE_PATTERN.test(t) ||
    HYPER_MEGA_HOT_TITLE_PATTERN.test(t)
  );
}

export function extractSetNumber(sourceKey: string): number | null {
  const s = normalizeDigits(sourceKey.toLowerCase());
  const m = s.match(/(?:set|model-test)[-_]?(\d+)$/);
  if (m) return parseInt(m[1], 10);
  return extractTestNumber(sourceKey);
}

export function containsRawTitleLeak(text: string): boolean {
  const s = text.toLowerCase();
  return (
    s.includes("_") ||
    s.includes("prediction") ||
    s.includes("practice") ||
    s.includes("high-common") ||
    s.includes("questions") ||
    s.includes("zoology") ||
    s.includes("super-model") ||
    s.includes("·") ||
    /[০-৯]/.test(text)
  );
}

export function defaultSortTests<
  T extends {
    sortNumber: number;
    sourceKey: string;
    questionCount?: number;
    scope?: ModelTestScope;
  },
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aHot = isHyperMegaHotSource(a.sourceKey) ? 0 : 1;
    const bHot = isHyperMegaHotSource(b.sourceKey) ? 0 : 1;
    if (aHot !== bHot) return aHot - bHot;

    if (a.scope === "chapter" && b.scope === "chapter") {
      const aCh = extractChapterNumber(a.sourceKey) ?? 999;
      const bCh = extractChapterNumber(b.sourceKey) ?? 999;
      if (aCh !== bCh) return aCh - bCh;
      const aSet = extractSetNumber(a.sourceKey) ?? a.sortNumber;
      const bSet = extractSetNumber(b.sourceKey) ?? b.sortNumber;
      if (aSet !== bSet) return aSet - bSet;
    }
    if (a.sortNumber !== b.sortNumber) return a.sortNumber - b.sortNumber;
    const aq = a.questionCount ?? 0;
    const bq = b.questionCount ?? 0;
    if (aq !== bq) return bq - aq;
    return a.sourceKey.localeCompare(b.sourceKey);
  });
}

/** Assign continuous Model Test 01..N titles after sorting. */
export function assignContinuousDisplayTitles<
  T extends {
    displayTitle: string;
    cleanTitle: string;
    displayIndex?: number;
    scope?: ModelTestScope;
    sourceKey?: string;
    sourceDisplayTitle?: string;
  },
>(items: T[]): T[] {
  return items.map((item, index) => {
    const displayIndex = index + 1;

    if (item.sourceDisplayTitle && isStudentFacingTitle(item.sourceDisplayTitle)) {
      return {
        ...item,
        displayIndex,
        displayTitle: item.sourceDisplayTitle,
        cleanTitle: item.sourceDisplayTitle,
      };
    }

    const scope = item.scope ?? "paper";
    const chapterNo = item.sourceKey
      ? extractChapterNumber(item.sourceKey)
      : null;
    const setNo =
      item.sourceKey && scope === "chapter"
        ? extractSetNumber(item.sourceKey)
        : displayIndex;
    const displayTitle =
      scope === "chapter" && chapterNo != null && setNo != null
        ? `Chapter ${String(chapterNo).padStart(2, "0")} Model Test ${String(setNo).padStart(2, "0")}`
        : formatUiDisplayTitle(displayIndex, scope, chapterNo);

    return {
      ...item,
      displayIndex,
      displayTitle,
      cleanTitle: displayTitle,
    };
  });
}

export function verifyContinuousDisplayOrder(
  items: { displayTitle: string }[],
): boolean {
  if (!items.length) return true;
  for (let i = 0; i < items.length; i++) {
    if (items[i].displayTitle !== formatUiDisplayTitle(i + 1)) return false;
  }
  return true;
}

export function reportSerialGaps(
  items: { testNumber: number | null; displayTitle: string }[],
): number[] {
  const nums = items
    .map((t) => t.testNumber)
    .filter((n): n is number => n !== null && n < SORT_UNNUMBERED)
    .sort((a, b) => a - b);

  if (!nums.length) return [];

  const gaps: number[] = [];
  const min = nums[0];
  const max = nums[nums.length - 1];
  const set = new Set(nums);

  for (let i = min; i <= max; i++) {
    if (!set.has(i)) gaps.push(i);
  }
  return gaps;
}

export function toBanglaNumber(num: number): string {
  return String(num)
    .split("")
    .map((char) => {
      const d = parseInt(char, 10);
      return isNaN(d) ? char : BANGLA_DIGITS[d];
    })
    .join("");
}

function banglaTwoDigit(num: number): string {
  const raw = toBanglaNumber(num);
  return raw.length >= 2 ? raw : `০${raw}`;
}

/** Strip level/subject/paper noise — cards show chapter + test only. */
function stripSubjectNoise(text: string): string {
  return normalizeDigits(text)
    .replace(/[_-]+/g, " ")
    .replace(/\b(ssc|hsc)\b/gi, " ")
    .replace(
      /\b(physics|chemistry|biology|higher[\s-]?math|general[\s-]?math)\b/gi,
      " ",
    )
    .replace(/\b(1st|2nd|3rd|\d+(?:st|nd|rd|th))\s*paper\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function parseModelTestTitle(rawTitle: string): {
  chapterLabel: string;
  testLabel: string;
  sortChapter: number;
  sortTest: number;
} {
  const clean = stripSubjectNoise(rawTitle);

  const hyperMatch = clean.match(/hyper mega hot set[\s-]*(\d+)/i);
  if (hyperMatch) {
    const setNum = parseInt(hyperMatch[1], 10);
    return {
      chapterLabel: "Hyper Mega Hot",
      testLabel: `SET ${banglaTwoDigit(setNum)}`,
      sortChapter: 0,
      sortTest: setNum,
    };
  }

  const chMatch =
    clean.match(/(?:chapter|ch)[\s-]*(\d+)/i) ??
    clean.match(/chapter[\s-]*(\d+)/i);
  const chNum = chMatch ? parseInt(chMatch[1], 10) : 1;
  const hasCh = !!chMatch;

  const testMatch =
    clean.match(/model[\s-]*test[\s-]*(\d+)/i) ??
    clean.match(/(?:^|\s)test[\s-]*(\d+)/i) ??
    clean.match(/(?:^|\s)set[\s-]*(\d+)/i);
  const testNum = testMatch ? parseInt(testMatch[1], 10) : 1;

  let chapterLabel = `অধ্যায় ${banglaTwoDigit(chNum)}`;
  if (!hasCh) {
    if (clean.includes("board")) {
      chapterLabel = "বোর্ড টেস্ট";
    } else if (
      clean.includes("final") ||
      clean.includes("whole") ||
      clean.includes("full")
    ) {
      chapterLabel = "ফুল বুক";
    } else {
      chapterLabel = "মডেল টেস্ট";
    }
  }

  return {
    chapterLabel,
    testLabel: `টেস্ট ${banglaTwoDigit(testNum)}`,
    sortChapter: chNum,
    sortTest: testNum,
  };
}

