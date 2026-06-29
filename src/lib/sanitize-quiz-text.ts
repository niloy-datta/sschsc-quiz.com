/**
 * Sanitize quiz question/option/explanation text before display or normalization.
 * Fixes common OCR noise, bare LaTeX, corrupt characters, and placeholder junk.
 */

const EXISTING_MATH_RE =
  /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]/g;

const BENGALI_CHAR_RE = /[\u0980-\u09FF]/;

const CORRUPT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/স¤ক(?:্?)(?:ক্স|ক্স)?(?:র্ক|র্ক)/g, "সংক্র"],
  [/¤ক্স/g, "ং"],
  [/K¤ক্সাঙ্ক/g, "K-সাঙ্ক"],
  [/কি¤ক্সউটার/g, "কম্পিউটার"],
  [/næi/g, "নাই"],
  [/থে(?:া|)রি(?:য়|)য়াম/g, "থোরিয়াম"],
  [/Ñ/g, "-"],
  [/–/g, "-"],
  [/—/g, "-"],
];

function isMathChar(ch: string): boolean {
  return /[A-Za-z0-9=.,+\-*/^()_ \t\\{}[\]|;]/.test(ch);
}

function skipBraced(text: string, start: number): number | null {
  if (text[start] !== "{") return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return null;
}

function skipLatexCommand(text: string, start: number): number {
  let i = start + 1;
  while (i < text.length && /[a-zA-Z]/.test(text[i])) i++;

  while (i < text.length && text[i] === "{") {
    const next = skipBraced(text, i);
    if (next == null) break;
    i = next;
  }

  if (i < text.length && (text[i] === "^" || text[i] === "_")) {
    i++;
    if (i < text.length && text[i] === "{") {
      const next = skipBraced(text, i);
      if (next != null) i = next;
    } else if (i < text.length) {
      i++;
    }
  }

  return i;
}

function expandMathSpan(text: string, anchor: number): [number, number] {
  let start = anchor;
  while (start > 0 && isMathChar(text[start - 1]) && !BENGALI_CHAR_RE.test(text[start - 1])) {
    start--;
  }

  let end = anchor + 1;
  while (end < text.length) {
    if (text[end] === "\\") {
      end = skipLatexCommand(text, end);
      continue;
    }
    if (text[end] === "_" || text[end] === "^") {
      end++;
      if (end < text.length && text[end] === "{") {
        const next = skipBraced(text, end);
        if (next != null) end = next;
      } else if (end < text.length && /[A-Za-z0-9+\-]/.test(text[end])) {
        end++;
      }
      continue;
    }
    if (isMathChar(text[end]) && !BENGALI_CHAR_RE.test(text[end])) {
      end++;
      continue;
    }
    break;
  }

  return [start, end];
}

function mergeIntervals(intervals: Array<[number, number]>): Array<[number, number]> {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [sorted[0]!];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i]!;
    const last = merged[merged.length - 1]!;
    if (cur[0] <= last[1] + 1) {
      last[1] = Math.max(last[1], cur[1]);
    } else {
      merged.push(cur);
    }
  }
  return merged;
}

function getMathRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const re = new RegExp(EXISTING_MATH_RE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
}

function isInRange(index: number, ranges: Array<[number, number]>): boolean {
  for (const [start, end] of ranges) {
    if (index >= start && index < end) return true;
  }
  return false;
}

function findMathAnchors(segment: string): number[] {
  const anchors: number[] = [];
  const mathRanges = getMathRanges(segment);

  for (let i = 0; i < segment.length; i++) {
    if (isInRange(i, mathRanges)) {
      continue;
    }
    const ch = segment[i];
    if (ch === "\\" && /[a-zA-Z]/.test(segment[i + 1] ?? "")) {
      anchors.push(i);
      i = skipLatexCommand(segment, i) - 1;
      continue;
    }
    if ((ch === "_" || ch === "^") && i > 0 && /[A-Za-z0-9)]/.test(segment[i - 1] ?? "")) {
      anchors.push(i - 1);
    }
  }
  return anchors;
}

function fixDoubleBackslash(str: string): string {
  if (/\\begin\{(matrix|pmatrix|bmatrix|vmatrix|Vmatrix|array|cases|align|split)\}/i.test(str)) {
    return str;
  }
  return str.replace(/\s*\\\\\s*/g, " / ");
}

export function normalizeBrokenLatex(text: string): string {
  let out = text;
  // Broken fraction (\frac corrupted to \f or rac)
  out = out.replace(/\\f\{/g, "\\frac{");
  out = out.replace(/\\?rac\{/g, "\\frac{");
  // Double text wrapper or extra closing brace
  out = out.replace(/\\text\{\\text\{/g, "\\text{");
  out = out.replace(/\\text\{([a-zA-Z0-9\s\^\{\}-]+)\}\}/g, "\\text{$1}");
  // OCR/export breaks \text{unit} into \t unit inside math
  out = out.replace(
    /\\t\s+(cm|m|s|Hz|ms\^\{-1\}|ms\^{-1\})/g,
    "\\text{ $1 }",
  );
  // Fix OCR-missing backslash before ext{ — must not corrupt valid \text{
  out = out.replace(/\\text\{/g, "__LATEX_TEXT__");
  out = out.replace(/(?<!\\)ext\{/g, "\\text{");
  out = out.replace(/(^|[^\\]) ext\{/g, "$1\\text{");
  out = out.replace(/__LATEX_TEXT__/g, "\\text{");
  out = out.replace(/= extconstant/gi, "= \\text{constant}");
  out = out.replace(/=extconstant/gi, "=\\text{constant}");
  
  // Double backslash outside matrix
  out = fixDoubleBackslash(out);

  // Common math/chem formulas
  out = out.replace(/\b([A-Z][a-z]?)_([a-zA-Z0-9])\b/g, "$1_{$2}");
  
  // Degree Celsius
  out = out.replace(/(\d+|[০-৯]+)\s*°\s*[Cc]\b/g, "$1^{\\circ}\\text{C}");
  out = out.replace(/(\d+|[০-৯]+)\s*\\?\^\{\\?circ\}\s*[Cc]\b/g, "$1^{\\circ}\\text{C}");
  out = out.replace(/(\d+|[০-৯]+)\s*\\?\^\\circ\s*[Cc]\b/g, "$1^{\\circ}\\text{C}");
  
  return out;
}

function normalizePlainOmega(text: string): string {
  // Replace Omega/\\Omega with Ω
  return text
    .replace(/(\d+(?:\.\d+)?)\s*\\?Omega\b/g, "$1Ω")
    .replace(/([০-৯]+(?:\.[০-৯]+)?)\s*\\?Omega\b/g, "$1Ω")
    .replace(/\\?Omega\b/g, "Ω");
}

function fixDelimitedMathBlock(block: string): string {
  if (block.startsWith("$$") && block.endsWith("$$")) {
    return `$$${normalizeBrokenLatex(block.slice(2, -2))}$$`;
  }
  if (block.startsWith("\\(") && block.endsWith("\\)")) {
    return `\\(${normalizeBrokenLatex(block.slice(2, -2))}\\)`;
  }
  if (block.startsWith("\\[") && block.endsWith("\\]")) {
    return `\\[${normalizeBrokenLatex(block.slice(2, -2))}\\]`;
  }
  if (block.startsWith("$") && block.endsWith("$")) {
    return `$${normalizeBrokenLatex(block.slice(1, -1))}$`;
  }
  return block;
}

function wrapBareLatexInPlainSegment(segment: string): string {
  let normalized = normalizePlainOmega(normalizeBrokenLatex(segment));
  
  // Normalize scientific notation directly to math block (supports Unicode lookbehinds/lookaheads)
  normalized = normalized.replace(/(?<!\d)(\d+(?:\.\d+)?)\s*(?:x|\*|\\times)\s*10\^\{([+-]?\d+)\}(?!\d)/gi, "$$$1 \\times 10^{$2}$$");
  normalized = normalized.replace(/(?<!\d)(\d+(?:\.\d+)?)\s*(?:x|\*|\\times)\s*10\^([+-]?\d+)(?!\d)/gi, "$$$1 \\times 10^{$2}$$");
  normalized = normalized.replace(/(?<![০-৯])([০-৯]+(?:\.[০-৯]+)?)\s*(?:x|\*|\\times)\s*১০\^\{([+-]?[০-৯]+)\}(?![০-৯])/g, "$$$1 \\times ১০^{$2}$$");
  normalized = normalized.replace(/(?<![০-৯])([০-৯]+(?:\.[০-৯]+)?)\s*(?:x|\*|\\times)\s*১০\^([+-]?[০-৯]+)(?![০-৯])/g, "$$$1 \\times ১০^{$2}$$");

  const anchors = findMathAnchors(normalized);
  if (!anchors.length && !/\\[a-zA-Z]|_\{|_\d|\^\{|\^\\circ/.test(normalized)) {
    return normalized;
  }

  const intervals = mergeIntervals(anchors.map((a) => expandMathSpan(normalized, a)));
  if (!intervals.length) return normalized;

  let out = "";
  let cursor = 0;
  for (const [start, end] of intervals) {
    out += normalized.slice(cursor, start);
    const raw = normalized.slice(start, end);
    const trimmed = raw.trim();
    const leading = raw.match(/^\s*/)?.[0] ?? "";
    const trailing = raw.match(/\s*$/)?.[0] ?? "";
    out += leading;
    out += trimmed.length >= 2 ? `$${trimmed}$` : raw;
    out += trailing;
    cursor = end;
  }
  out += normalized.slice(cursor);
  return out;
}

export function wrapBareLatex(text: string): string {
  if (!text) return text;

  let result = "";
  let lastIndex = 0;
  const re = new RegExp(EXISTING_MATH_RE.source, "g");
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    result += wrapBareLatexInPlainSegment(text.slice(lastIndex, match.index));
    result += fixDelimitedMathBlock(match[0]);
    lastIndex = match.index + match[0].length;
  }

  result += wrapBareLatexInPlainSegment(text.slice(lastIndex));
  return result;
}

function cleanCharacters(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\uF0B7\uF0FC\uF0E0\uF020\uF0A7\uF0B0\uF071\uF0D8\uF09F\u2022\u25CF\u25AA\u25A0\uF0A3]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\t/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/¤/g, ""); // Clean OCR currency symbols
}

function fixCorruptText(text: string): string {
  let out = text;
  for (const [pattern, replacement] of CORRUPT_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export function stripAsciiCircuitArt(text: string): string {
  return text
    .split("\n")
    .filter((line) => {
      const l = line.trim();
      // If it contains a resistor/capacitor block with connections: +--[ R ]--+
      if (/\+-{2,}\[[^\]]+\]-{2,}\+/i.test(l)) return false;
      // If it contains a source/meter: +--( V )--+
      if (/\+-{2,}\([^)]+\)-{2,}\+/i.test(l)) return false;
      // If it is just a border line of dashes/pluses: +------+ or +======+ or -------
      if (/^[+\-|=\s]{5,}$/.test(l) && (l.includes("+") || l.includes("-") || l.includes("="))) return false;
      // If it is a vertical circuit line: |      |
      if (/^\|[\s|]*\|$/.test(l)) return false;
      return true;
    })
    .join("\n")
    .replace(/\+-{2,}\[[^\]]+\]-{2,}\+/g, " ")
    .replace(/\+-{5,}\([^)]+\)-{5,}\+/g, " ")
    .replace(/\.(?:\s*।\s*){2,}/g, " ")
    .replace(/\s{2,}/g, " ");
}

function stripBoardMetadata(text: string): string {
  return text
    .replace(/-{3,}\s*===\s*Board Exam:[\s\S]*?===\s*-{3,}/gi, "")
    .replace(/===\s*Board Exam:[\s\S]*?===/gi, "")
    .replace(/[-=]{3,}\s*Board Exam[\s\S]*?[-=]{3,}/gi, "")
    .replace(/Board Exam\s*:\s*\d{4}/gi, "")
    .replace(/\b[A-Za-z]+ Board\s+\d{4}\b/gi, "")
    .replace(/\b[A-Za-z]+\s*বোর্ড\s*\d{4}\b/gi, "")
    .replace(/^সঠিক উত্তর:\s*[কখগঘ]\.?\s*/gi, "")
    .replace(/^উত্তর:\s*[কখগঘ]\.?\s*/gi, "")
    .trim();
}

function stripNoiseLines(text: string): string {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (/^-{3,}$/.test(line)) return false;
      if (/^\.+$/.test(line)) return false;
      if (/^[০-৯\d]{1,2}$/.test(line)) return false;
      if (/^[০-৯\d]+\s*=$/.test(line)) return false;
      if (/^[০-৯\d]+\s*\\?[a-zA-Z]+\\?\)?$/.test(line) && line.length <= 4) return false;
      if (
        /^[\d০-৯\s=()+\-*/\\^_{}\[\].,]+$/.test(line) &&
        line.length < 40
      ) {
        return false;
      }
      if (/^[\d০-৯]{1,3}$/.test(line)) return false;
      if (/^উত্তর$/i.test(line)) return false;
      return true;
    })
    .join("\n");
}

function collapseWhitespace(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
}

export function detectPlaceholderQuestion(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (/replace with Bengali question text/i.test(t)) return true;
  if (/^\[[A-Za-z\s]+ image\s*—\s*Q\d+\]/i.test(t)) return true;
  if (/\[image question\]/i.test(t)) return true;
  if (/\[diagram required\]/i.test(t)) return true;
  if (/চিত্র\s*প্রয়োজন/i.test(t)) return true;
  if (/image-based\s*question\s*missing/i.test(t)) return true;
  return false;
}

export function normalizeStatementList(text: string): string {
  let cleaned = text;

  // 1. Standardize roman markers (i., ii., iii., iv.)
  cleaned = cleaned.replace(/(?:\b|\()i\s*[.)\-\]]/gi, "i.");
  cleaned = cleaned.replace(/(?:\b|\()ii\s*[.)\-\]]/gi, "ii.");
  cleaned = cleaned.replace(/(?:\b|\()iii\s*[.)\-\]]/gi, "iii.");
  cleaned = cleaned.replace(/(?:\b|\()iv\s*[.)\-\]]/gi, "iv.");

  // 2. Standardize Bangla list markers if used as roman statement markers (র., রর., ররর., রররর.)
  cleaned = cleaned.replace(/(?:\b|\()র\s*\./g, "র.");
  cleaned = cleaned.replace(/(?:\b|\()রর\s*\./g, "রর.");
  cleaned = cleaned.replace(/(?:\b|\()ররর\s*\./g, "ররর.");
  cleaned = cleaned.replace(/(?:\b|\()রররর\s*\./g, "রররর.");

  // 3. Force list markers to start on a new line (put \n before them, with lookbehinds to prevent prefix collisions)
  cleaned = cleaned.replace(/\s*(?<!i)(iv\.)\s*/gi, "\niv. ");
  cleaned = cleaned.replace(/\s*(?<!i)(iii\.)\s*/gi, "\niii. ");
  cleaned = cleaned.replace(/\s*(?<!i)(ii\.)\s*/gi, "\nii. ");
  cleaned = cleaned.replace(/\s*(?<!i)(i\.)\s*/gi, "\ni. ");

  cleaned = cleaned.replace(/\s*(?<!র)(রররর\.)\s*/g, "\nরররর. ");
  cleaned = cleaned.replace(/\s*(?<!র)(ররর\.)\s*/g, "\nররর. ");
  cleaned = cleaned.replace(/\s*(?<!র)(রর\.)\s*/g, "\nরর. ");
  cleaned = cleaned.replace(/\s*(?<!র)(র\.)\s*/g, "\nর. ");

  // 4. Force tail question to a new line (e.g. নিচের কোনটি সঠিক?)
  cleaned = cleaned.replace(/\s*(নিচের\s+কোনটি?\s+সঠিক\??|কোনটি?\s+সঠিক\??)\s*$/gi, "\n$1");

  // 5. Parse line by line to merge split lines correctly
  const lines = cleaned.split("\n").map(l => l.trim()).filter(Boolean);
  const resultLines: string[] = [];
  let inStatements = false;

  for (const line of lines) {
    const isStatement = /^(i|ii|iii|iv|র|রর|ররর|রররর)\.\s+/i.test(line);
    const isTail = /^(নিচের\s+কোনটি?\s+সঠিক|কোনটি?\s+সঠিক)/i.test(line);

    if (isStatement) {
      inStatements = true;
      resultLines.push(line);
    } else if (isTail) {
      inStatements = false;
      resultLines.push(""); // Spacing before the tail question
      resultLines.push(line);
    } else {
      if (inStatements && resultLines.length > 0) {
        // This is a split line belonging to the previous statement
        const lastIdx = resultLines.length - 1;
        resultLines[lastIdx] = resultLines[lastIdx] + " " + line;
      } else {
        resultLines.push(line);
      }
    }
  }

  return resultLines.join("\n");
}

/** Remove worked solutions accidentally pasted into MCQ stems. */
function stripLeakedWorkedSolution(text: string): string {
  let out = text;
  out = out.replace(/^([\s\S]*?[?।])\s+শেষবেগ[\s\S]+$/i, "$1");
  out = out.replace(
    /^([\s\S]*?কত হার্জ\?)\s+(?:A\s*থেকে|তাহলে|২টি|2\s*টি)[\s\S]+$/i,
    "$1",
  );
  out = out.replace(
    /^([\s\S]*?নিচের\s+কোনটি\s+সঠিক\?)\s+(?:তাই|অতএব)[\s\S]+$/i,
    "$1",
  );
  return out;
}

export function sanitizeQuestionText(text: string): string {
  if (!text) return "";
  
  if (detectPlaceholderQuestion(text)) {
    const trimmed = text.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      return "চিত্র/ডায়াগ্রাম প্রয়োজন";
    }
    if (trimmed === "চিত্র প্রয়োজন" || trimmed === "চিত্র প্রয়োজন") {
      return "চিত্র/ডায়াগ্রাম প্রয়োজন";
    }
    return "চিত্র/ডায়াগ্রাম প্রয়োজন";
  }

  let out = fixCorruptText(String(text));
  out = cleanCharacters(out);
  out = stripAsciiCircuitArt(out);
  out = normalizeStatementList(out);
  out = stripNoiseLines(out);
  out = stripLeakedWorkedSolution(out);
  out = collapseWhitespace(out);
  out = wrapBareLatex(out);

  return out;
}

export function sanitizeOptionText(text: string): string {
  if (!text) return "";

  let out = fixCorruptText(String(text));
  out = cleanCharacters(out);
  
  // Remove duplicate/empty option labels at the start, e.g. A. Option, ক. Option, A. A. Option
  out = out.replace(/^(?:[A-Da-dক-ঘ]\s*[\.)\-]\s*)+/g, "");
  out = out.replace(/\{\(v\+r\)\}/gi, "$\\frac{V}{R}$");
  // Broken Ohm decoy: "35 A A" → "35 A"
  out = out.replace(/(\d+(?:\.\d+)?)\s+A\s+A\b/g, "$1 A");
  
  out = collapseWhitespace(out);
  out = wrapBareLatex(out);

  return out;
}

export function sanitizeExplanationText(text: string): string {
  if (!text) return "";

  let out = fixCorruptText(String(text));
  out = cleanCharacters(out);
  out = stripBoardMetadata(out);
  out = stripNoiseLines(out);
  out = collapseWhitespace(out);
  out = wrapBareLatex(out);

  return out;
}

export function formatStimulusText(text: string): string {
  if (!text) return "";

  let out = fixCorruptText(String(text));
  out = cleanCharacters(out);
  out = stripAsciiCircuitArt(out);
  out = normalizeStatementList(out);
  out = stripNoiseLines(out);
  out = collapseWhitespace(out);
  out = wrapBareLatex(out);

  return out;
}

export function sanitizeQuizText(
  text: string,
  mode: "question" | "explanation" | "option" = "question",
): string {
  if (!text) return "";
  if (mode === "option") return sanitizeOptionText(text);
  if (mode === "explanation") return sanitizeExplanationText(text);
  return sanitizeQuestionText(text);
}

// Keep backward compatibility aliases
export { detectPlaceholderQuestion as isPlaceholderQuestionText };
export function prepareQuizTextForRender(text: string): string {
  return sanitizeQuizText(text);
}
export { normalizeBrokenLatex as normalizeLatex };
