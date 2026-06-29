/**
 * Shared utilities for SVG audit, validation, and fix scripts.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const QUESTIONS_DIR = path.join(ROOT, "public", "questions");
const QUIZ_DATA_DIR = path.join(ROOT, "public", "quiz-data");
const PUBLIC_DIR = path.join(ROOT, "public");
const SVG_DIR = path.join(ROOT, "public", "images", "quiz");

const LEKHOCHITRA_OPT = /^\[?\s*লেখচিত্র\s*[১২৩৪1-4]|^ঘ\s*\]?$/i;
const CHITRA_OPT = /^চিত্র\s*[কখগঘ]/i;

const VISUAL_STEM =
  /\[চিত্র\s*[:：]|\(চিত্র\s*[:：]|চিত্রে|চিত্রভিত্তিক|উপরের\s*চিত্র|নিচের\s*চিত্র|প্রশ্নের\s*চিত্র|উদ্দীপক|লেখচিত্র|গ্রাফ|diagram|circuit|বল\s*চিত্র|V-I|I-V|স্থানাঙ্ক|coordinate|parabola|বর্তনী|(?<!ভ্যা|ভ্য|ভা)লেন্স|দর্পণ|mirror|lens|চিত্রটি\s*লক্ষ্য|উদ্দীপকের\s*চিত্র/i;

const ICT_SUBJECT_RE = /^ict(\/|$|-)/i;

function collectQuestions(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.questions)) return data.questions;
  const out = [];
  for (const v of Object.values(data || {})) {
    if (!Array.isArray(v)) continue;
    for (const item of v) {
      if (item?.questions) out.push(...item.questions);
      else if (item && typeof item === "object" && (item.id || item.text || item.questionText))
        out.push(item);
    }
  }
  return out;
}

function questionText(q) {
  return String(q.text ?? q.questionText ?? q.question ?? "").trim();
}

function getOptions(q) {
  if (Array.isArray(q.options))
    return q.options.map((o) => (typeof o === "string" ? o : o?.text ?? "")).map(String);
  return [q.optionA, q.optionB, q.optionC, q.optionD].map((o) => String(o ?? "").trim());
}

function optionsNeedGraph(q) {
  return getOptions(q).some((o) => LEKHOCHITRA_OPT.test(o.trim()) || CHITRA_OPT.test(o.trim()));
}

function needsDiagram(q) {
  const text = questionText(q);
  const opts = getOptions(q);
  if (/\[চিত্র\s*[:：]|\(চিত্র\s*[:：]|চিত্রভিত্তিক|উপরের\s*চিত্র|নিচের\s*চিত্র|প্রশ্নের\s*চিত্র|diagram\s*required/i.test(text))
    return true;
  if (/উদ্দীপক/i.test(text) && /চিত্র|লেখচিত্র|diagram|AB\s*=|MN\s*=|গোলক|পরিবাহ|দর্পণ|লেন্স|তরঙ্গ|বর্তনী|লেখ/i.test(text))
    return true;
  if (/^[\s\S]*চিত্রে[\s\S]{0,120}(?:নিচের|কোনটি|সঠিক|কত|কী)/i.test(text)) return true;
  if (opts.some((o) => LEKHOCHITRA_OPT.test(o) || CHITRA_OPT.test(o))) return true;
  if (/(?:^|\s)চিত্র\s*[কখগঘ](?:\s|$)/i.test(text)) return true;
  if (/\(চিত্র\s*[:：][^)]+\)/i.test(text)) return true;
  if (VISUAL_STEM.test(text)) return true;
  return false;
}

function imagePath(q) {
  const img = q.image ?? q.svg;
  return typeof img === "string" && img.trim() ? img.trim() : null;
}

function publicPathFromWeb(webPath) {
  if (!webPath || typeof webPath !== "string") return null;
  const normalized = webPath.replace(/^\//, "");
  return path.join(PUBLIC_DIR, normalized);
}

function fileExists(webPath) {
  const p = publicPathFromWeb(webPath);
  return p ? fs.existsSync(p) : false;
}

function isPlaceholderPath(webPath) {
  if (!webPath) return false;
  return /\/images\/quiz\/(premium|generated)\//i.test(webPath);
}

function slugFromImage(webPath) {
  if (!webPath) return null;
  return webPath.replace(/^\/images\/quiz\//, "").replace(/\.svg$/i, "");
}

function walkQuestionFiles(callback) {
  const entries = [];
  if (!fs.existsSync(QUESTIONS_DIR)) return entries;

  function walkDir(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walkDir(p);
      else if (ent.name.endsWith(".json") && ent.name !== "index.json") {
        const relFile = path.relative(QUESTIONS_DIR, p).replace(/\\/g, "/");
        if (ICT_SUBJECT_RE.test(relFile)) continue;
        let data;
        try {
          data = JSON.parse(fs.readFileSync(p, "utf8"));
        } catch {
          continue;
        }
        const questions = collectQuestions(data);
        for (const q of questions) {
          if (!q || typeof q !== "object") continue;
          entries.push({
            question: q,
            filePath: p,
            relFile,
            source: "questions",
          });
        }
      }
    }
  }

  for (const subject of fs.readdirSync(QUESTIONS_DIR)) {
    const dir = path.join(QUESTIONS_DIR, subject);
    if (fs.statSync(dir).isDirectory()) walkDir(dir);
  }

  if (fs.existsSync(QUIZ_DATA_DIR)) {
    function walkMega(dir) {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walkMega(p);
        else if (ent.name.endsWith(".json") && !ent.name.includes(".index.")) {
          const relFile = path.relative(QUIZ_DATA_DIR, p).replace(/\\/g, "/");
          if (/ict/i.test(relFile)) continue;
          let data;
          try {
            data = JSON.parse(fs.readFileSync(p, "utf8"));
          } catch {
            continue;
          }
          if (data.modelTests) {
            for (const [setId, list] of Object.entries(data.modelTests)) {
              if (!Array.isArray(list)) continue;
              for (const q of list) {
                if (!q || typeof q !== "object") continue;
                entries.push({
                  question: q,
                  filePath: p,
                  relFile: `${relFile}#${setId}`,
                  source: "quiz-data",
                });
              }
            }
          }
          if (data.chapters) {
            for (const [chId, list] of Object.entries(data.chapters)) {
              if (!Array.isArray(list)) continue;
              for (const q of list) {
                if (!q || typeof q !== "object") continue;
                entries.push({
                  question: q,
                  filePath: p,
                  relFile: `${relFile}#${chId}`,
                  source: "quiz-data",
                });
              }
            }
          }
        }
      }
    }
    walkMega(QUIZ_DATA_DIR);
  }

  if (callback) callback(entries);
  return entries;
}

function walkSvgFiles() {
  const files = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith(".svg")) files.push(p);
    }
  }
  walk(SVG_DIR);
  return files;
}

function analyzeImageState(q) {
  const img = imagePath(q);
  if (!img) return { status: "no_image", image: null };
  if (!fileExists(img)) return { status: "broken_path", image: img };
  if (isPlaceholderPath(img)) return { status: "placeholder_path", image: img, file_exists: true };
  return { status: "ok", image: img };
}

function analyzeOptionImages(q) {
  const opts = getOptions(q);
  const needsOpts = optionsNeedGraph(q);
  const raw = q.optionImages;
  if (!needsOpts) return { needs: false, status: "n/a", paths: [] };
  if (!Array.isArray(raw) || raw.length !== 4)
    return { needs: true, status: "missing_or_invalid", paths: raw || [] };
  const broken = raw.filter((p) => !fileExists(p));
  if (broken.length) return { needs: true, status: "broken_paths", paths: raw, broken };
  return { needs: true, status: "ok", paths: raw };
}

module.exports = {
  ROOT,
  QUESTIONS_DIR,
  QUIZ_DATA_DIR,
  PUBLIC_DIR,
  SVG_DIR,
  LEKHOCHITRA_OPT,
  CHITRA_OPT,
  VISUAL_STEM,
  collectQuestions,
  questionText,
  getOptions,
  optionsNeedGraph,
  needsDiagram,
  imagePath,
  publicPathFromWeb,
  fileExists,
  isPlaceholderPath,
  slugFromImage,
  walkQuestionFiles,
  walkSvgFiles,
  analyzeImageState,
  analyzeOptionImages,
};
