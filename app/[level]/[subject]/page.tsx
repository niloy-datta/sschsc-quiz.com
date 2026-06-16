import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SubjectDetailClient } from "@/components/quiz/SubjectDetailClient";
import { Loader2 } from "lucide-react";
import {
  normalizeRouteLevel,
  parseUnifiedSubjectSlug,
  resolveSubjectTitle,
  toQuizLevel,
  unifiedChapterPathPrefix,
  unifiedModelTestPathPrefix,
} from "@/lib/quiz/unified-routes";

type Props = {
  params: { level: string; subject: string };
};

const BLOCKED_SUBJECTS = ["ict"];

export default function UnifiedSubjectPage({ params }: Props) {
  const routeLevel = normalizeRouteLevel(params.level);
  if (!routeLevel) notFound();
  if (BLOCKED_SUBJECTS.includes(params.subject)) notFound();

  const parsed = parseUnifiedSubjectSlug(routeLevel, params.subject);
  const quizLevel = toQuizLevel(routeLevel);
  const basePath = `/${routeLevel}`;

  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-purple-glow" />
        </div>
      }
    >
      <SubjectDetailClient
        level={quizLevel}
        subjectSlug={parsed.apiSubjectSlug}
        basePath={basePath}
        chapterPathPrefix={unifiedChapterPathPrefix(routeLevel, params.subject)}
        modelTestPathPrefix={unifiedModelTestPathPrefix(routeLevel, params.subject)}
        title={resolveSubjectTitle(routeLevel, params.subject)}
      />
    </Suspense>
  );
}
