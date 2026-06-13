"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { parseHscSubjectPaper } from "@/lib/quiz-api";
import { fetchNormalizedQuestionsWithMeta } from "@/lib/quiz/load-quiz-data";
import { loadModelTestsFromStatic } from "@/lib/model-test-loader";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { ApiQuestion } from "@/types/quiz";

type Props = {
  apiSubjectSlug: string;
  testId: string;
  backUrl: string;
  examName: string;
  timeLimitSec?: number;
  modelTestListing: { level: "SSC" | "HSC"; subjectSlug: string };
  paper?: string | null;
  /** Pre-loaded on the server (same pattern as board questions) */
  initialQuestions?: ApiQuestion[];
  loadedFromPath?: string | null;
  attemptedPaths?: string[];
};

export function ModelTestQuizPage({
  apiSubjectSlug,
  testId,
  backUrl,
  examName,
  timeLimitSec,
  modelTestListing,
  paper = null,
  initialQuestions,
  loadedFromPath = null,
  attemptedPaths: serverAttemptedPaths = [],
}: Props) {
  const [questions, setQuestions] = useState<ApiQuestion[]>(initialQuestions ?? []);
  const [loading, setLoading] = useState(!initialQuestions?.length);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [attemptedPaths, setAttemptedPaths] = useState<string[]>(serverAttemptedPaths);
  const [resolvedExamName, setResolvedExamName] = useState(examName);

  useEffect(() => {
    setResolvedExamName(examName);
  }, [examName]);

  useEffect(() => {
    loadModelTestsFromStatic({
      level: modelTestListing.level,
      subjectSlug: modelTestListing.subjectSlug,
    }).then(({ items }) => {
      const match = items.find((t) => t.sourceKey === testId);
      if (match) {
        setResolvedExamName(
          match.sourceDisplayTitle && match.sourceDisplayTitle !== match.displayTitle
            ? match.sourceDisplayTitle
            : match.displayTitle,
        );
      }
    });
  }, [modelTestListing, testId]);

  useEffect(() => {
    if (initialQuestions?.length) {
      setQuestions(initialQuestions);
      setLoading(false);
      setFetchError(null);
      if (loadedFromPath) {
        console.log("Fetched Quiz Data:", {
          testId,
          path: loadedFromPath,
          count: initialQuestions.length,
          source: "server",
        });
      }
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFetchError(null);
    setAttemptedPaths([]);
    setQuestions([]);

    const { level, subject: subj, paper: parsedPaper } =
      parseHscSubjectPaper(apiSubjectSlug);
    const registrySubject = subj === "math" ? "math" : subj;

    fetchNormalizedQuestionsWithMeta(
      level,
      registrySubject,
      testId,
      paper ?? parsedPaper,
    )
      .then((result) => {
        if (cancelled) return;
        setAttemptedPaths(result.attemptedPaths);
        if (result.questions.length > 0) {
          console.log("Fetched Quiz Data:", {
            testId,
            apiSubjectSlug,
            path: result.path,
            count: result.questions.length,
            source: "client",
          });
          setQuestions(result.questions);
          setFetchError(null);
        } else {
          setQuestions([]);
          setFetchError(
            `Missing JSON File: Could not find data for testId: ${testId}`,
          );
        }
      })
      .catch((err) => {
        console.error("Failed to load model test questions:", err);
        if (!cancelled) {
          setQuestions([]);
          setFetchError(
            `Missing JSON File: Could not find data for testId: ${testId}`,
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiSubjectSlug, testId, paper, initialQuestions, loadedFromPath]);

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
              `Missing JSON File: Could not find data for testId: ${testId}`}
          </p>
          <div className="text-left text-sm text-slate-400 space-y-2 bg-black/20 rounded-lg p-4 font-mono">
            <p>
              <span className="text-slate-500">subject:</span> {apiSubjectSlug}
            </p>
            <p>
              <span className="text-slate-500">testId:</span> {testId}
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
          <Link href={backUrl}>
            <Button variant="secondary">← ফিরে যাও</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const registryLevel =
    apiSubjectSlug.endsWith("-1st-paper") ||
    apiSubjectSlug.endsWith("-2nd-paper")
      ? "hsc"
      : "ssc";

  return (
    <QuizRunner
      questions={questions}
      examSlug={`${apiSubjectSlug}/${testId}`}
      examName={resolvedExamName}
      backUrl={backUrl}
      timeLimitSec={timeLimitSec ?? questions.length * 60}
      quizSubmitMeta={{
        quizId: testId,
        level: registryLevel,
        subject: apiSubjectSlug,
        paper,
        type: "model-test",
      }}
    />
  );
}
