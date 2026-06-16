import { notFound } from "next/navigation";
import { ChapterSetClient } from "@/components/quiz/ChapterSetClient";
import { parseVirtualSetId, sliceQuestionsForVirtualSet } from "@/lib/quiz-helper";
import { loadQuizQuestionsFromDisk } from "@/lib/quiz-server-loader";
import {
  normalizeRouteLevel,
  parseUnifiedSubjectSlug,
  resolveSubjectTitle,
  toQuizLevel,
  unifiedSubjectBasePath,
} from "@/lib/quiz/unified-routes";

const BLOCKED_SUBJECTS = ["ict"];

type Props = {
  params: { level: string; subject: string; chapterSlug: string; setId: string };
};

export default async function UnifiedChapterSetPage({ params }: Props) {
  const routeLevel = normalizeRouteLevel(params.level);
  if (!routeLevel) notFound();
  if (BLOCKED_SUBJECTS.includes(params.subject)) notFound();

  const parsed = parseUnifiedSubjectSlug(routeLevel, params.subject);
  const quizLevel = toQuizLevel(routeLevel);
  const subjectBase = unifiedSubjectBasePath(routeLevel, params.subject);

  const { sourceSetId } = parseVirtualSetId(params.setId);
  const fetchKey = sourceSetId === "default" ? params.setId : sourceSetId;

  const { questions, path, attemptedPaths } = await loadQuizQuestionsFromDisk(
    routeLevel,
    parsed.registrySubject,
    fetchKey,
    parsed.paper,
  );

  const sliced = sliceQuestionsForVirtualSet(questions, params.setId);

  return (
    <ChapterSetClient
      level={quizLevel}
      subject={parsed.routeSubject}
      paper={parsed.routePaper}
      chapterSlug={params.chapterSlug}
      setId={params.setId}
      backUrl={subjectBase}
      chaptersUrl={`${subjectBase}/chapters`}
      title={resolveSubjectTitle(routeLevel, params.subject)}
      initialQuestions={sliced}
      loadedFromPath={path}
      attemptedPaths={attemptedPaths}
    />
  );
}
