import { notFound } from "next/navigation";
import { ChapterListClient } from "@/components/quiz/ChapterListClient";
import {
  normalizeRouteLevel,
  parseUnifiedSubjectSlug,
  resolveSubjectTitle,
  toQuizLevel,
  unifiedChapterPathPrefix,
  unifiedSubjectBasePath,
} from "@/lib/quiz/unified-routes";

const BLOCKED_SUBJECTS = ["ict"];

type Props = { params: { level: string; subject: string } };

export default function UnifiedChaptersPage({ params }: Props) {
  const routeLevel = normalizeRouteLevel(params.level);
  if (!routeLevel) notFound();
  if (BLOCKED_SUBJECTS.includes(params.subject)) notFound();

  const parsed = parseUnifiedSubjectSlug(routeLevel, params.subject);
  const subjectBase = unifiedSubjectBasePath(routeLevel, params.subject);

  return (
    <ChapterListClient
      level={toQuizLevel(routeLevel)}
      subject={parsed.apiSubjectSlug}
      basePath={subjectBase}
      chapterPathPrefix={unifiedChapterPathPrefix(routeLevel, params.subject)}
      title={resolveSubjectTitle(routeLevel, params.subject)}
    />
  );
}
