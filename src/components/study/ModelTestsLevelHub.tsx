"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Target } from "lucide-react";
import { loadModelTestsFromStatic } from "@/lib/model-test-loader";
import { filterByCategoryTab, type ModelTestItem } from "@/lib/model-test-filters";
import { ModelTestCard } from "@/components/quiz/ModelTestCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { unifiedSubjectBasePath } from "@/lib/quiz/unified-routes";

export interface ModelTestsSubjectEntry {
  slug: string;
  name: string;
  modelTestBasePath: string;
}

interface SubjectGroup {
  slug: string;
  name: string;
  paperItems: ModelTestItem[];
  chapterCount: number;
  loading: boolean;
}

interface ModelTestsLevelHubProps {
  title: string;
  subtitle: string;
  level: "SSC" | "HSC";
  subjects: ModelTestsSubjectEntry[];
  /** Optional section label (e.g. বিজ্ঞান / গণিত) */
  sectionLabel?: string;
}

const PREVIEW_LIMIT = 6;

export function ModelTestsLevelHub({
  title,
  subtitle,
  level,
  subjects,
  sectionLabel,
}: ModelTestsLevelHubProps) {
  const routeLevel = level.toLowerCase() as "ssc" | "hsc";
  const [groups, setGroups] = useState<SubjectGroup[]>(
    subjects.map((s) => ({
      slug: s.slug,
      name: s.name,
      paperItems: [],
      chapterCount: 0,
      loading: true,
    })),
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      const results = await Promise.all(
        subjects.map(async (subject) => {
          const { items } = await loadModelTestsFromStatic({
            level,
            subjectSlug: subject.slug,
          });
          const paper = filterByCategoryTab(items, "paperWise").items;
          const chapter = filterByCategoryTab(items, "chapterWise").items;
          return {
            slug: subject.slug,
            name: subject.name,
            paperItems: paper,
            chapterCount: chapter.length,
            loading: false,
          };
        }),
      );
      if (!cancelled) setGroups(results);
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [level, subjects.map((s) => s.slug).join(",")]);

  const totalPaper = groups.reduce((n, g) => n + g.paperItems.length, 0);
  const stillLoading = groups.some((g) => g.loading);

  return (
    <div className="min-h-screen font-bangla py-8 pb-24">
      <div className="mb-8">
        {sectionLabel && (
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-500/80">
            {sectionLabel}
          </p>
        )}
        <Badge variant="default" className="mb-3 inline-flex items-center gap-1">
          <Target className="h-3 w-3" />
          পত্রভিত্তিক মডেল টেস্ট
        </Badge>
        <h1 className="text-2xl md:text-3xl font-black text-white mb-2">{title}</h1>
        <p className="text-slate-400 text-sm">{subtitle}</p>
        {!stillLoading && (
          <p className="text-slate-500 text-xs mt-2">
            {totalPaper} পত্রভিত্তিক টেস্ট · অধ্যায়ভিত্তিক টেস্ট বিষয় পেজ থেকে দেখো
          </p>
        )}
      </div>

      {stillLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-purple-glow" />
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => {
            const subjectHref = unifiedSubjectBasePath(routeLevel, group.slug);
            const preview = group.paperItems.slice(0, PREVIEW_LIMIT);
            return (
              <section key={group.slug}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-cyan-400" />
                    {group.name}
                    <span className="text-sm font-normal text-slate-400">
                      ({group.paperItems.length} পত্র · {group.chapterCount} অধ্যায়)
                    </span>
                  </h2>
                  <Link
                    href={`${subjectHref}?tab=model&model=paper`}
                    className="text-sm text-cyan-400 hover:underline shrink-0"
                  >
                    সব দেখুন →
                  </Link>
                </div>

                {group.paperItems.length === 0 ? (
                  <Card variant="glass" className="p-6 text-center text-slate-500">
                    পত্রভিত্তিক মডেল টেস্ট এখনো যোগ করা হয়নি।
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {preview.map((test) => (
                      <ModelTestCard
                        key={test.id}
                        test={test}
                        href={`${subjectHref}/model-tests/${test.sourceKey}`}
                      />
                    ))}
                  </div>
                )}
                {group.paperItems.length > PREVIEW_LIMIT && (
                  <p className="mt-3 text-center text-xs text-slate-500">
                    +{group.paperItems.length - PREVIEW_LIMIT} আরও পত্রভিত্তিক টেস্ট
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
