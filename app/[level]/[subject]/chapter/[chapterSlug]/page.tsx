import { notFound } from "next/navigation";
import { QuizChapterPage } from "@/components/quiz/QuizChapterPage";
import {
  normalizeRouteLevel,
  parseUnifiedSubjectSlug,
  unifiedChapterPathPrefix,
  unifiedSubjectBasePath,
} from "@/lib/quiz/unified-routes";

const BLOCKED_SUBJECTS = ["ict"];

type Props = {
  params: { level: string; subject: string; chapterSlug: string };
};

export default function UnifiedChapterQuizPage({ params }: Props) {
  const routeLevel = normalizeRouteLevel(params.level);
  if (!routeLevel) notFound();
  if (BLOCKED_SUBJECTS.includes(params.subject)) notFound();

  const parsed = parseUnifiedSubjectSlug(routeLevel, params.subject);
  const subjectBase = unifiedSubjectBasePath(routeLevel, params.subject);

  return (
    <QuizChapterPage
      apiSubjectSlug={parsed.apiSubjectSlug}
      chapterSlug={params.chapterSlug}
      backUrl={subjectBase}
      examName={`${params.subject} — ${params.chapterSlug}`}
      chapterPathPrefix={unifiedChapterPathPrefix(routeLevel, params.subject)}
    />
  );
}
