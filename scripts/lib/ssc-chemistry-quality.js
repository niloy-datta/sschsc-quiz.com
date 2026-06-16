/**
 * Detect low-quality / template-spam SSC Chemistry model-test sets.
 */

function normalizeStem(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isJunkQuestionText(text) {
  const t = String(text ?? "").trim();
  if (!t || t.length < 8) return true;
  if (/^Chemistry Q\d/i.test(t)) return true;
  if (/ Q\d+$/i.test(t) && t.split(/\s+/).length <= 4) return true;
  if (/^Metal\s/i.test(t)) return true;
  if (/^Metal সাধারণত/i.test(t)) return true;
  if (/^Balancing equation/i.test(t)) return true;
  if (/^Balancing equation মানে/i.test(t)) return true;
  if (/^\d+ mol পদার্থে/i.test(t)) return true;
  if (/^x=\d+ হলে মান কত/i.test(t)) return true;
  return false;
}

function uniqueStemCount(questions) {
  const stems = new Set();
  for (const q of questions) {
    const text = q?.text ?? q?.questionText ?? q?.question ?? "";
    stems.add(normalizeStem(text));
  }
  return stems.size;
}

function isLowQualitySet(questions) {
  if (!Array.isArray(questions) || questions.length < 20) return true;

  const texts = questions.map((q) => String(q?.text ?? q?.questionText ?? q?.question ?? "").trim());
  const junkHits = texts.filter(isJunkQuestionText).length;
  const unique = uniqueStemCount(questions);

  if (junkHits >= 2) return true;
  if (unique < 12) return true;
  if (junkHits / questions.length > 0.15) return true;

  return false;
}

module.exports = {
  isJunkQuestionText,
  isLowQualitySet,
  uniqueStemCount,
  normalizeStem,
};
