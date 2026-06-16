"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  fetchNormalizedQuestionsWithMeta,
  loadSubjectQuizData,
} from "@/lib/quiz/load-quiz-data";
import { findQuizSetById, getChapterQuizSets, toApiQuestion } from "@/lib/quiz/normalize-quiz-data";
import { parseVirtualSetId, sliceQuestionsForVirtualSet } from "@/lib/quiz-helper";
import { expectedMcqForSubject, resolveFileSubjectSlug } from "@/lib/quiz/registry";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { ApiQuestion } from "@/types/quiz";

type Props = {
  level: "SSC" | "HSC";
  subject: string;
  paper?: string;
  chapterSlug: string;
  setId: string;
  backUrl: string;
  chaptersUrl: string;
  title: string;
  /** Pre-loaded on the server (same pattern as board questions) */
  initialQuestions?: ApiQuestion[];
  loadedFromPath?: string | null;
  attemptedPaths?: string[];
};

export function ChapterSetClient({
  level,
  subject,
  paper,
  chapterSlug,
  setId,
  backUrl,
  chaptersUrl,
  title,
  initialQuestions,
  loadedFromPath = null,
  attemptedPaths: serverAttemptedPaths = [],
}: Props) {
  const [loading, setLoading] = useState(!initialQuestions?.length);
  const [examName, setExamName] = useState(title);
  const [questions, setQuestions] = useState<ApiQuestion[]>(initialQuestions ?? []);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [attemptedPaths, setAttemptedPaths] = useState<string[]>(serverAttemptedPaths);
  const [quizMeta, setQuizMeta] = useState<{
    quizId: string;
    type: string;
    chapterName?: string;
  } | null>(null);

  const registryLevel = level === "SSC" ? "ssc" : "hsc";

  useEffect(() => {
    if (initialQuestions?.length) {
      setQuestions(initialQuestions);
      setLoading(false);
      setFetchError(null);
      const { sourceSetId, partIndex } = parseVirtualSetId(setId);
      const partLabel = partIndex !== null ? ` · Set ${partIndex + 1}` : "";
      setExamName(`${title}${partLabel}`);
      setQuizMeta({
        quizId: sourceSetId,
        type: "chapter-wise",
      });
      return;
    }

    let cancelled = false;

    async function loadSet() {
      setLoading(true);
      setFetchError(null);
      try {
        const parsed = await loadSubjectQuizData(registryLevel, subject, paper);
        if (!parsed || cancelled) {
          if (!cancelled) setLoading(false);
          return;
        }

        const { sourceSetId, partIndex } = parseVirtualSetId(setId);
        let set =
          sourceSetId !== "default"
            ? findQuizSetById(parsed, sourceSetId)
            : undefined;

        if (!set) {
          const chapterSets = getChapterQuizSets(parsed, chapterSlug);
          set =
            sourceSetId === "default"
              ? chapterSets[0]
              : chapterSets.find((s) => s.id === sourceSetId);
        }

        if (!set) {
          if (!cancelled) {
            setFetchError(`Could not find set metadata for setId: ${setId}`);
            setLoading(false);
          }
          return;
        }

        const fetchKey = set.sourceKey ?? set.id;
        let apiQuestions: ApiQuestion[];
        let pathsTried: string[] = [];

        if (set.questions.length > 0) {
          apiQuestions = set.questions.map(toApiQuestion);
        } else {
          const result = await fetchNormalizedQuestionsWithMeta(
            registryLevel,
            subject,
            fetchKey,
            paper,
          );
          apiQuestions = result.questions;
          pathsTried = result.attemptedPaths;
        }

        if (!cancelled) {
          setAttemptedPaths(pathsTried);
        }

        if (cancelled || !apiQuestions.length) {
          if (!cancelled) {
            setFetchError(`Missing JSON File: Could not find data for setId: ${setId}`);
            setLoading(false);
          }
          return;
        }

        const sliced = sliceQuestionsForVirtualSet(apiQuestions, setId);
        setQuestions(sliced);
        const partLabel = partIndex !== null ? ` · Set ${partIndex + 1}` : "";
        setExamName(
          `${set.chapterName ?? set.displayTitle ?? title}${partLabel}`,
        );
        setQuizMeta({
          quizId: sourceSetId,
          type: "chapter-wise",
          chapterName: set.chapterName ?? undefined,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSet();
    return () => {
      cancelled = true;
    };
  }, [
    registryLevel,
    subject,
    paper,
    chapterSlug,
    setId,
    title,
    initialQuestions,
    loadedFromPath,
  ]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-glow" />
      </div>
    );
  }

  if (fetchError || !questions.length) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 font-bangla">
        <Card variant="glass" className="p-8 border-red-500/30 text-center space-y-4">
          <AlertCircle className="h-10 w-10 mx-auto text-red-400" />
          <p className="text-red-300 font-semibold text-lg">
            {fetchError ??
              `Missing JSON File: Could not find data for setId: ${setId}`}
          </p>
          <div className="text-left text-sm text-slate-400 space-y-2 bg-black/20 rounded-lg p-4 font-mono">
            <p>
              <span className="text-slate-500">setId:</span> {setId}
            </p>
            <p>
              <span className="text-slate-500">chapter:</span> {chapterSlug}
            </p>
            {attemptedPaths.length > 0 && (
              <div>
                <p className="text-slate-500 mb-1">Paths tried:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs break-all">
                  {attemptedPaths.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <Link href={chaptersUrl}>
            <Button variant="secondary">অধ্যায় তালিকা</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const fileSlug = resolveFileSubjectSlug(registryLevel, subject, paper);
  const expectedMcq = expectedMcqForSubject(fileSlug);
  const timeLimit = Math.max(600, questions.length * 60);

  return (
    <QuizRunner
      questions={questions}
      examSlug={`${subject}/${chapterSlug}/${setId}`}
      examName={examName}
      backUrl={backUrl}
      timeLimitSec={timeLimit}
      quizSubmitMeta={{
        level: registryLevel,
        subject: fileSlug,
        paper: paper ?? null,
        chapter: chapterSlug,
        chapterName: quizMeta?.chapterName,
        type: "chapter-wise",
        quizId: quizMeta?.quizId ?? `${chapterSlug}-${setId}`,
        expectedMcq,
      }}
    />
  );
}
