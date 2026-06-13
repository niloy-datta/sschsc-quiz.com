"use client";

import React, { useMemo } from "react";
import katex from "katex";
import { cn } from "@/lib/utils";
const MATH_SEGMENT_RE =
  /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\])/g;

function normalizeLatex(text: string): string {
  return text.replace(/\\rac\{/g, "\\frac{").replace(/rac\{/g, "frac{");
}

function renderKatex(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(normalizeLatex(latex.trim()), {
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
  const shorTotome = text.match(
    /^([\s\S]+?[?।])\s+(শর্তমতে[\s\S]+)$/i,
  );
  if (shorTotome && shorTotome[1].length > 15 && shorTotome[2].length > 25) {
    return { stem: shorTotome[1].trim(), worked: shorTotome[2].trim() };
  }

  const mcqTail = text.match(
    /^([\s\S]+?নিচের কোনটি সঠিক\?)\s+([\s\S]+)$/i,
  );
  if (mcqTail && mcqTail[2].length > 40) {
    return { stem: mcqTail[1].trim(), worked: mcqTail[2].trim() };
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

  const listMatch = trimmed.match(/^([ivx]+|[i]+)\.\s+/i);
  if (listMatch) {
    return (
      <div className="flex gap-2 pl-1 text-[15px] leading-relaxed">
        <span className="text-cyan-400/90 font-semibold shrink-0 min-w-[1.5rem]">
          {listMatch[0].trim()}
        </span>
        <span className="flex-1">
          {renderRichSegment(trimmed.slice(listMatch[0].length))}
        </span>
      </div>
    );
  }

  if (trimmed.startsWith("উদ্দীপক:")) {
    return (
      <p
        className="text-cyan-200/95 font-semibold border-l-2 border-cyan-500/50 pl-3 leading-relaxed"
      >
        {renderRichSegment(trimmed)}
      </p>
    );
  }

  if (trimmed.startsWith("[") && trimmed.includes("চিত্র")) {
    return (
      <p className="text-slate-400 text-sm italic leading-relaxed bg-white/5 rounded-lg px-3 py-2">
        {renderRichSegment(trimmed)}
      </p>
    );
  }

  return (
    <p className="leading-relaxed text-[15px] sm:text-base">
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
};

export function FormattedQuizText({
  text,
  className,
  hideWorkedSolution = false,
  inline = false,
}: Props) {
  const normalized = normalizeLatex(text);

  const { stem, worked } = useMemo(
    () =>
      inline
        ? { stem: normalized, worked: undefined }
        : splitStemAndWorkedSolution(normalized),
    [normalized, inline],
  );

  if (inline) {
    return (
      <span className={cn("text-white/95 font-bangla inline", className)}>
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
          <summary
            className="text-xs font-bold text-amber-300/90 cursor-pointer select-none list-none flex items-center gap-2"
          >
            <span className="rounded-md bg-amber-500/15 px-2 py-0.5">
              কাজ / ব্যাখ্যা (ডেটা)
            </span>
            <span className="text-slate-500 text-[10px] group-open:hidden">
              ট্যাপ করে দেখুন
            </span>
          </summary>
          <div
            className="mt-3 space-y-2 text-sm text-slate-300 border-t border-amber-500/10 pt-3"
          >
            {worked.split(/\n+/).map((line, i) => (
              <React.Fragment key={i}>{formatLine(line)}</React.Fragment>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
