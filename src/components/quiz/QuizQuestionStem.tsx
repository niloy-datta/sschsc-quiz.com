"use client";

import React, { useMemo } from "react";
import { FormattedQuizText } from "@/lib/format-quiz-text";
import {
  questionNeedsDiagramPlaceholder,
  resolveQuizDiagram,
  stripQuestionDiagramMarkers,
  isTrustedStoredDiagram,
} from "@/lib/quiz/quiz-diagrams";
import { QuizDiagram } from "@/components/quiz/QuizDiagram";

type Props = {
  text: string;
  image?: string | null;
  className?: string;
  hideWorkedSolution?: boolean;
};

export function QuizQuestionStem({
  text,
  image = null,
  className,
  hideWorkedSolution = false,
}: Props) {
  const diagram = useMemo(() => {
    const resolved = resolveQuizDiagram({ text, image });
    if (resolved) return resolved;
    if (image && isTrustedStoredDiagram(image)) {
      const slug = image
        .replace(/^\/images\/quiz\//, "")
        .replace(/\.svg$/i, "");
      return { slug, src: image, caption: undefined };
    }
    return null;
  }, [text, image]);

  const showMissingNotice = useMemo(
    () => !diagram && !image && questionNeedsDiagramPlaceholder(text),
    [diagram, image, text],
  );

  const displayText = useMemo(() => {
    if (!diagram) return text;
    return stripQuestionDiagramMarkers(text);
  }, [text, diagram]);

  return (
    <>
      {diagram && (
        <QuizDiagram
          src={diagram.src}
          caption={diagram.caption}
          variant="question"
        />
      )}
      {showMissingNotice && (
        <p className="mb-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90 font-bangla">
          📷 এই প্রশ্নে নির্দিষ্ট চিত্র/ডায়াগ্রাম প্রয়োজন — স্কেচটি শীঘ্রই যুক্ত করা হবে।
        </p>
      )}
      <FormattedQuizText
        text={displayText}
        className={className}
        hideWorkedSolution={hideWorkedSolution}
      />
    </>
  );
}
