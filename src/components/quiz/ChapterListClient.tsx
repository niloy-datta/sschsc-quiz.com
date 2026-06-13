"use client";



import React, { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { BookOpen, Loader2 } from "lucide-react";

import { loadSubjectQuizData } from "@/lib/quiz/load-quiz-data";

import { groupChapterQuizSets } from "@/lib/quiz/normalize-quiz-data";

import { expectedMcqForSubject, resolveFileSubjectSlug } from "@/lib/quiz/registry";

import { Card } from "@/components/ui/Card";

import { Button } from "@/components/ui/Button";



type Props = {

  level: "SSC" | "HSC";

  subject: string;

  paper?: string;

  basePath: string;

  chapterPathPrefix: string;

  title: string;

};



export function ChapterListClient({

  level,

  subject,

  paper,

  basePath,

  chapterPathPrefix,

  title,

}: Props) {

  const [groups, setGroups] = useState<

    ReturnType<typeof groupChapterQuizSets>

  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);



  const registryLevel = level === "SSC" ? "ssc" : "hsc";



  useEffect(() => {

    loadSubjectQuizData(registryLevel, subject, paper).then((parsed) => {

      if (!parsed) {

        setError("ডেটা লোড করা যায়নি");

        setLoading(false);

        return;

      }

      const chapterGroups = groupChapterQuizSets(

        parsed.chapterSets.filter((s) => s.questionCount > 0),

      );

      if (parsed.loadError && !chapterGroups.length) {

        setError("ডেটা এখনো যোগ করা হয়নি");

      }

      setGroups(chapterGroups);

      setLoading(false);

    });

  }, [registryLevel, subject, paper]);



  const fileSlug = resolveFileSubjectSlug(registryLevel, subject, paper);

  const expectedMcq = expectedMcqForSubject(fileSlug);



  const totalQuestions = useMemo(

    () => groups.reduce((sum, g) => sum + g.questionCount, 0),

    [groups],

  );



  if (loading) {

    return (

      <div className="flex justify-center py-20">

        <Loader2 className="h-8 w-8 animate-spin text-purple-glow" />

      </div>

    );

  }



  return (

    <div className="max-w-4xl mx-auto px-4 py-10 font-bangla pb-24">

      <Link

        href={basePath}

        className="text-slate-400 hover:text-white text-sm mb-6 inline-block"

      >

        ← {title}

      </Link>



      <div className="mb-8 space-y-2">

        <h1 className="text-3xl font-black text-white">অধ্যায়ভিত্তিক কুইজ</h1>

        <p className="text-slate-400 text-sm">

          {groups.length} অধ্যায় · {totalQuestions} প্রশ্ন

        </p>

      </div>



      {error || groups.length === 0 ? (

        <Card variant="glass" className="p-10 text-center text-slate-400">

          <BookOpen className="h-10 w-10 mx-auto mb-3 text-slate-600" />

          <p>ডেটা এখনো যোগ করা হয়নি</p>

          <Link href={basePath} className="mt-4 inline-block">

            <Button variant="secondary">ফিরে যাও</Button>

          </Link>

        </Card>

      ) : (

        <div className="grid gap-4">

          {groups.map((group) => {

            const chapterHref = `${chapterPathPrefix}/${group.chapterSlug}`;

            const firstSet = group.sets[0];

            const startHref = firstSet

              ? `${chapterPathPrefix}/${group.chapterSlug}/set/${encodeURIComponent(firstSet.id)}`

              : chapterHref;



            return (

              <Card

                key={group.chapterSlug}

                variant="glass"

                className="p-5 border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"

              >

                <div className="space-y-1">

                  <h3 className="text-lg font-bold text-white">

                    {group.chapterName}

                  </h3>

                  <p className="text-sm text-slate-400">

                    {group.sets.length} সেট · {expectedMcq} MCQ প্রতি সেট

                  </p>

                </div>

                <div className="flex gap-2">

                  <Link href={chapterHref}>

                    <Button variant="secondary" className="min-h-[44px]">

                      সব সেট

                    </Button>

                  </Link>

                  <Link href={startHref}>

                    <Button className="min-h-[44px]">কুইজ শুরু</Button>

                  </Link>

                </div>

              </Card>

            );

          })}

        </div>

      )}

    </div>

  );

}

