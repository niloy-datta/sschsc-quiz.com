/**
 * Detect low-quality / template-spam quiz sets (repeated stems, placeholder text).
 */

function normalizeStem(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function extractText(q) {
  return String(q?.text ?? q?.questionText ?? q?.question ?? "").trim();
}

function isGarbledBijoyText(text) {
  const t = String(text ?? "").trim();
  if (!t) return false;
  if (/[\u0980-\u09FF]/.test(t)) return false;
  return /[‡†©ÖÏ«»¤`‚]/.test(t) || /wb‡Pi|DÏxc|cÖ‡k|Av‡jv|Ki‡Z|jf¨|mieivn|†gvU|DËi/i.test(t);
}

function isJunkQuestionText(text, subject) {
  const t = String(text ?? "").trim();
  if (!t || t.length < 6) return true;
  if (isGarbledBijoyText(t)) return true;
  if (/ Q\d+$/i.test(t) && t.split(/\s+/).length <= 4) return true;
  if (/^Chemistry Q/i.test(t) || /^Physics Q/i.test(t) || /^Biology Q/i.test(t)) return true;
  if (/^Higher Math Q/i.test(t)) return true;
  if (/^Metal\s/i.test(t) || /^Metal সাধারণত/i.test(t)) return true;
  if (/^Balancing equation/i.test(t)) return true;
  if (/^\d+ mol পদার্থে/i.test(t)) return true;
  if (/^সেট ও ফাংশন Q/i.test(t) || /^বীজগণিত Q/i.test(t) || /^ক্রম ও ধারা Q/i.test(t)) return true;
  if (/^x=\d+ হলে মান কত/i.test(t)) return true;
  if (subject === "higher-math" && /^x>\d+ smallest integer$/i.test(t)) return true;
  if (/ — MCQ \d+ \(সেট \d+\)\??/.test(t)) return true;
  if (/\s\[\d+\]\s*$/.test(t)) return true;
  return false;
}

function uniqueStemCount(questions) {
  const stems = new Set();
  for (const q of questions) {
    stems.add(normalizeStem(extractText(q)));
  }
  return stems.size;
}

function isLowQualitySet(questions, subject = "", chapterNo = null) {
  if (!Array.isArray(questions) || questions.length < 20) return true;

  const texts = questions.map(extractText);
  const junkHits = texts.filter((t) => isJunkQuestionText(t, subject)).length;
  const unique = uniqueStemCount(questions);

  if (junkHits >= 2) return true;
  if (texts.filter(isGarbledBijoyText).length >= 1) return true;
  if (unique < 12) return true;
  if (junkHits / questions.length > 0.15) return true;

  if (subject === "physics" && chapterNo === "01") {
    const wrongTopicRe =
      /ট্রান্সফরমার|দর্পণ|আয়না|আয়না|তেজস্ক্র|অ্যাঙ্গিও|আপতন কোণ|সংকট কোণ|প্রতিসৃত|ইলেকট্রিক ফিল্ড|বর্তনী|লেন্স|তরঙ্গ|নিউক্লিয়|রেডিও|হৃদপিণ্ড|নেফ্রন/i;
    const wrongHits = texts.filter((t) => wrongTopicRe.test(t)).length;
    if (wrongHits >= 2) return true;
  }

  return false;
}

module.exports = {
  normalizeStem,
  extractText,
  isGarbledBijoyText,
  isJunkQuestionText,
  isLowQualitySet,
  uniqueStemCount,
};
