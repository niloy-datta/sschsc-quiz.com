"use client";

import React, { useMemo } from "react";
import katex from "katex";
import { cn } from "@/lib/utils";
import { sanitizeQuizText } from "@/lib/sanitize-quiz-text";

const MATH_SEGMENT_RE =
  /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\])/g;

function renderKatex(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(latex.trim(), {
      throwOnError: false,
      displayMode,
      strict: "ignore",
    });
  } catch {
    return latex;
  }
}

function renderRichSegment(text: string): React.ReactNode[] {
  const parts = text.split(MATH_SEGMENT_RE);
  return parts.map((part, i) => {
    if (!part) return null;

    if (part.startsWith("$$") && part.endsWith("$$")) {
      const html = renderKatex(part.slice(2, -2), true);
      return (
        <div
          key={i}
          className="quiz-math-display my-2 overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    if (part.startsWith("$") && part.endsWith("$")) {
      const html = renderKatex(part.slice(1, -1), false);
      return (
        <span
          key={i}
          className="quiz-math-inline mx-0.5 align-middle"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    if (part.startsWith("\\(") && part.endsWith("\\)")) {
      const html = renderKatex(part.slice(2, -2), false);
      return (
        <span
          key={i}
          className="quiz-math-inline mx-0.5 align-middle"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    if (part.startsWith("\\[") && part.endsWith("\\]")) {
      const html = renderKatex(part.slice(2, -2), true);
      return (
        <div
          key={i}
          className="quiz-math-display my-2 overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return (
      <React.Fragment key={i}>
        {boldParts.map((bp, j) => {
          if (bp.startsWith("**") && bp.endsWith("**")) {
            return (
              <strong key={j} className="text-cyan-300 font-semibold">
                {bp.slice(2, -2)}
              </strong>
            );
          }
          return <span key={j}>{bp}</span>;
        })}
      </React.Fragment>
    );
  });
}

/** Separate MCQ stem from embedded worked solutions in question text. */
function splitStemAndWorkedSolution(text: string): {
  stem: string;
  worked?: string;
} {
  const shorTotome = text.match(/^([\s\S]+?[?।])\s+(শর্তমতে[\s\S]+)$/i);
  if (shorTotome && shorTotome[1].length > 15 && shorTotome[2].length > 25) {
    return { stem: shorTotome[1].trim(), worked: shorTotome[2].trim() };
  }

  const mcqTail = text.match(/^([\s\S]+?নিচের কোনটি সঠিক\?)\s+([\s\S]+)$/i);
  if (mcqTail && mcqTail[2].length > 40) {
    return { stem: mcqTail[1].trim(), worked: mcqTail[2].trim() };
  }

  const afterQuestion = text.match(/^([\s\S]+?কত হ(?:বে|ার্জ)\?)\s+(?:শেষবেগ|A\s*থেকে|তাহলে)[\s\S]+$/i);
  if (afterQuestion) {
    return { stem: afterQuestion[1].trim(), worked: text.slice(afterQuestion[1].length).trim() };
  }

  const newlineWork = text.match(/^([\s\S]+)\n\s*(শর্তমতে[\s\S]+)$/i);
  if (newlineWork && newlineWork[1].length > 15) {
    return { stem: newlineWork[1].trim(), worked: newlineWork[2].trim() };
  }

  return { stem: text };
}

function formatLine(line: string): React.ReactNode {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const romanListMatch = trimmed.match(/^(iii|ii|iv|i|[ivx]+)\.\s+/i);
  if (romanListMatch) {
    return (
      <div className="flex gap-3 py-1.5 text-[15px] leading-relaxed rounded-lg bg-white/[0.03] border border-white/5 px-3">
        <span className="text-cyan-400 font-bold shrink-0 min-w-[2rem] tabular-nums">
          {romanListMatch[1]}.
        </span>
        <span className="flex-1 min-w-0">
          {renderRichSegment(trimmed.slice(romanListMatch[0].length))}
        </span>
      </div>
    );
  }

  const romanMatch = trimmed.match(/^(র\.|রর\.|ররর\.|খ\.|গ\.|ঘ\.)\s+/);
  if (romanMatch) {
    return (
      <div className="flex gap-3 py-1.5 text-[15px] leading-relaxed rounded-lg bg-white/[0.03] border border-white/5 px-3">
        <span className="text-cyan-400/90 font-semibold shrink-0 min-w-[2.5rem]">
          {romanMatch[1]}
        </span>
        <span className="flex-1 min-w-0">
          {renderRichSegment(trimmed.slice(romanMatch[0].length))}
        </span>
      </div>
    );
  }

  if (/^উদ্দীপক[:：]/i.test(trimmed) || /^নিচের\s+উদ্দীপক/i.test(trimmed)) {
    return (
      <p className="text-cyan-200/95 font-semibold border-l-2 border-cyan-500/50 pl-3 leading-relaxed">
        {renderRichSegment(trimmed)}
      </p>
    );
  }

  return (
    <p className="leading-relaxed text-[15px] sm:text-base break-words">
      {renderRichSegment(trimmed)}
    </p>
  );
}


type Props = {
  text: string;
  className?: string;
  /** Hide collapsible worked-solution block (e.g. during timed exam) */
  hideWorkedSolution?: boolean;
  /** Single-line MCQ option — no block layout */
  inline?: boolean;
  /** question | explanation | option */
  mode?: "question" | "explanation" | "option";
};

export function FormattedQuizText({
  text,
  className,
  hideWorkedSolution = false,
  inline = false,
  mode = "question",
}: Props) {
  const safeText = text == null ? "" : String(text);

  const normalized = useMemo(
    () => sanitizeQuizText(safeText, inline ? "option" : mode),
    [safeText, inline, mode],
  );

  const { stem, worked } = useMemo(
    () =>
      inline
        ? { stem: normalized, worked: undefined }
        : splitStemAndWorkedSolution(normalized),
    [normalized, inline],
  );

  if (!safeText.trim()) {
    return (
      <span className={cn("text-slate-500 italic text-sm", className)}>
        —
      </span>
    );
  }


  if (inline) {
    return (
      <span className={cn("text-white/95 font-bangla inline break-words", className)}>
        {renderRichSegment(normalized)}
      </span>
    );
  }

  const stemLines = stem.split(/\n+/);

  return (
    <div className={cn("space-y-2.5 text-white/95 font-bangla", className)}>
      {stemLines.map((line, i) => (
        <React.Fragment key={i}>{formatLine(line)}</React.Fragment>
      ))}


      {worked && !hideWorkedSolution && (
        <details className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 mt-1 group">
          <summary className="text-xs font-bold text-amber-300/90 cursor-pointer select-none list-none flex items-center gap-2">
            <span className="rounded-md bg-amber-500/15 px-2 py-0.5">
              কাজ / ব্যাখ্যা (ডেটা)
            </span>
            <span className="text-slate-500 text-[10px] group-open:hidden">
              ট্যাপ করে দেখুন
            </span>
          </summary>
          <div className="mt-3 space-y-2 text-sm text-slate-300 border-t border-amber-500/10 pt-3">
            {worked.split(/\n+/).map((line, i) => (
              <React.Fragment key={i}>{formatLine(line)}</React.Fragment>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
