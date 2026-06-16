"use client";

import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt?: string;
  caption?: string;
  /** compact = MCQ option graph */
  variant?: "question" | "option";
  className?: string;
};

export function QuizDiagram({
  src,
  alt = "প্রশ্নের চিত্র",
  caption,
  variant = "question",
  className,
}: Props) {
  if (variant === "option") {
    return (
      <span
        className={cn(
          "inline-flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/30 border border-white/5 my-1",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-28 h-28 md:w-32 md:h-32 object-contain"
        />
        {caption && (
          <span className="text-[10px] text-slate-500 mt-1 select-none font-sans">
            {caption}
          </span>
        )}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "my-3 flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl bg-slate-950/20 border border-white/10 max-w-3xl mx-auto w-full",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full max-w-3xl h-auto object-contain rounded-xl"
      />
      {caption && (
        <p className="text-slate-400 text-xs sm:text-sm font-sans leading-relaxed text-center px-2 pt-3 mt-2 border-t border-white/5 w-full">
          {caption}
        </p>
      )}
    </div>
  );
}
