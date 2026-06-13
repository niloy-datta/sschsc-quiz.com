import { notFound } from "next/navigation";
import { ModelTestQuizPage } from "@/components/quiz/ModelTestQuizPage";
import { loadQuizQuestionsFromDisk } from "@/lib/quiz-server-loader";
import {
  normalizeRouteLevel,
  parseUnifiedSubjectSlug,
  toQuizLevel,
  unifiedModelTestPathPrefix,
} from "@/lib/quiz/unified-routes";

type Props = {
  params: { level: string; subject: string; testId: string };
};

export default async function UnifiedModelTestPage({ params }: Props) {
  const routeLevel = normalizeRouteLevel(params.level);
  if (!routeLevel) notFound();

  const parsed = parseUnifiedSubjectSlug(routeLevel, params.subject);
  const quizLevel = toQuizLevel(routeLevel);
  const backUrl = unifiedModelTestPathPrefix(routeLevel, params.subject);

  const { questions, path, attemptedPaths } = await loadQuizQuestionsFromDisk(
    routeLevel,
    parsed.registrySubject,
    params.testId,
    parsed.paper,
  );

  return (
    <ModelTestQuizPage
      apiSubjectSlug={parsed.apiSubjectSlug}
      testId={params.testId}
      backUrl={backUrl}
      examName="Model Test"
      timeLimitSec={1800}
      modelTestListing={{ level: quizLevel, subjectSlug: parsed.apiSubjectSlug }}
      paper={parsed.paper ?? null}
      initialQuestions={questions}
      loadedFromPath={path}
      attemptedPaths={attemptedPaths}
    />
  );
}
