"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchSubjects } from "@/lib/quiz-api";
import {
  HSC_SCIENCE_PAPERS,
  SSC_CATALOG,
  type QuizLevel,
} from "@/lib/quiz-catalog";
import type { ApiSubject } from "@/types/quiz";
import { Card } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";
import { subjectHrefForCatalog } from "@/lib/quiz/unified-routes";

type Props = {
  level: QuizLevel;
};

function subjectHref(level: QuizLevel, s: ApiSubject): string {
  return subjectHrefForCatalog(level, s.slug);
}

export function LevelHubClient({ level }: Props) {
  const [subjects, setSubjects] = useState<ApiSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects(level).then((list) => {
      setSubjects(list.length ? list : fallbackList(level));
      setLoading(false);
    });
  }, [level]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-glow" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {subjects.map((s) => (
        <Link key={s.slug} href={subjectHref(level, s)}>
          <Card variant="glass" hoverable className="p-6">
            <h2 className="text-xl font-bold text-white">{s.name}</h2>
            <p className="text-slate-400 text-sm mt-1">{s.slug}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function fallbackList(level: QuizLevel): ApiSubject[] {
  if (level === "SSC") {
    return SSC_CATALOG.map((s) => ({
      id: s.slug,
      name: s.name,
      slug: s.slug,
      category: "SSC",
    }));
  }
  return HSC_SCIENCE_PAPERS.map((p) => ({
    id: `${p.subject}-${p.paper}`,
    name: p.name,
    slug: `${p.subject}-${p.paper}`,
    category: "HSC",
  }));
}
