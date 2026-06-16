"use client";

import React, { useMemo } from "react";
import { FormattedQuizText } from "@/lib/format-quiz-text";
import { resolveOptionDiagram } from "@/lib/quiz/quiz-diagrams";
import { QuizDiagram } from "@/components/quiz/QuizDiagram";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  questionText: string;
  optionImage?: string | null;
  className?: string;
};

export function QuizOptionText({ text, questionText, optionImage = null, className }: Props) {
  const diagram = useMemo(() => {
    if (optionImage && /^\/images\/quiz\//.test(optionImage)) {
      return {
        slug: optionImage.replace(/^\/images\/quiz\//, "").replace(/\.svg$/i, ""),
        src: optionImage,
        caption: text.trim(),
      };
    }
    return resolveOptionDiagram(text, questionText);
  }, [text, questionText, optionImage]);

  if (diagram) {
    return (
      <QuizDiagram
        src={diagram.src}
        caption={text.trim()}
        variant="option"
        className={className}
      />
    );
  }

  return (
    <FormattedQuizText
      text={text}
      inline
      className={cn("text-sm md:text-base leading-relaxed flex-1", className)}
    />
  );
}
