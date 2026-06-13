"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Loader2 } from "lucide-react";
import { loadSubjectQuizData } from "@/lib/quiz/load-quiz-data";
import {
  getChapterQuizSets,
  groupChapterQuizSets,
} from "@/lib/quiz/normalize-quiz-data";
import { parseHscSubjectPaper } from "@/lib/quiz-api";
import { expectedMcqForSubject, resolveFileSubjectSlug } from "@/lib/quiz/registry";
import {
  expandQuizSetForDisplay,
  MOCK_SET_SIZE,
  type QuizListItem,
} from "@/lib/quiz-helper";
import type { NormalizedQuizSet } from "@/lib/quiz/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type Props = {
  apiSubjectSlug: string;
  chapterSlug: string;
  backUrl: string;
  examName: string;
  chapterPathPrefix?: string;
};

export function QuizChapterPage({
  apiSubjectSlug,
  chapterSlug,
  backUrl,
  examName,
  chapterPathPrefix,
}: Props) {
  const [sets, setSets] = useState<NormalizedQuizSet[]>([]);
  const [displaySets, setDisplaySets] = useState<QuizListItem[]>([]);
  const [chapterName, setChapterName] = useState(examName);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);

  const { level, subject, paper } = parseHscSubjectPaper(apiSubjectSlug);
  const fileSlug = resolveFileSubjectSlug(level, subject, paper);
  const expectedMcq = expectedMcqForSubject(fileSlug);
  const chapterBase =
    chapterPathPrefix ?? `${backUrl.replace(/\/$/, "")}/chapter`;
  const setBasePath = `${chapterBase}/${chapterSlug}`;

  useEffect(() => {
    loadSubjectQuizData(level, subject, paper).then((parsed) => {
      if (!parsed) {
        setLoading(false);
        return;
      }

      const chapterSets = getChapterQuizSets(parsed, chapterSlug);
      const applySets = (chapterSets: NormalizedQuizSet[], name: string) => {
        setSets(chapterSets);
        setChapterName(name);
        const total = chapterSets.reduce((n, s) => n + s.questionCount, 0);
        setTotalQuestions(total);
        const hrefBase = `${setBasePath}/set`;
        const expanded = chapterSets.flatMap((set, i) =>
          expandQuizSetForDisplay(set, hrefBase, i),
        );
        setDisplaySets(expanded);
      };

      if (chapterSets.length) {
        applySets(chapterSets, chapterSets[0].chapterName ?? examName);
        setLoading(false);
        return;
      }

      const groups = groupChapterQuizSets(parsed.chapterSets);
      const group = groups.find((g) => g.chapterSlug === chapterSlug);
      if (group) {
        applySets(group.sets, group.chapterName);
      }
      setLoading(false);
    });
  }, [level, subject, paper, chapterSlug, examName]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-glow" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 font-bangla pb-24">
      <Link
        href={backUrl}
        className="text-slate-400 hover:text-white text-sm mb-6 inline-block"
      >
        ← ফিরে যাও
      </Link>

      <div className="mb-8 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-white">{chapterName}</h1>
        <p className="text-slate-400 text-sm flex flex-wrap items-center gap-2">
          <Badge variant="default" className="text-[10px] border-cyan-400/20 text-cyan-300">
            {totalQuestions} MCQ total
          </Badge>
          {displaySets.length > 1 && (
            <span>{displaySets.length} mock sets · {MOCK_SET_SIZE} MCQ each</span>
          )}
          {displaySets.length <= 1 && sets.length > 0 && (
            <span>{sets.length} সেট · ~{expectedMcq} MCQ</span>
          )}
        </p>
      </div>

      {displaySets.length === 0 ? (
        <Card variant="glass" className="p-10 text-center text-slate-400">
          <BookOpen className="h-10 w-10 mx-auto mb-3 text-slate-600" />
          <p>এই অধ্যায়ে MCQ সেট এখনো যোগ করা হয়নি</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href={`${backUrl}?tab=model`}>
              <Button variant="primary">মডেল টেস্ট দেখো</Button>
            </Link>
            <Link href={backUrl}>
              <Button variant="secondary">ফিরে যাও</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {displaySets.map((item) => (
            <Card
              key={item.setId}
              variant="glass"
              className="p-4 sm:p-5 border-white/5 flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <h3 className="font-bold text-white">{item.title}</h3>
                <div className="flex flex-wrap gap-2">
                  <p className="text-sm text-slate-400">{item.questionCount} MCQ</p>
                  {item.mode === "timed" && (
                    <Badge variant="default" className="text-[10px]">Timed</Badge>
                  )}
                  {item.mode === "practice" && (
                    <Badge variant="default" className="text-[10px]">Practice</Badge>
                  )}
                </div>
              </div>
              <Link href={item.href}>
                <Button className="min-h-[44px] shrink-0">শুরু করুন</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
