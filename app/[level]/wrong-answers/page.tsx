import { notFound } from "next/navigation";
import { StudyComingSoon } from "@/components/study/StudyComingSoon";
import { levelHubPath, normalizeRouteLevel } from "@/lib/quiz/unified-routes";

type Props = { params: { level: string } };

export default function LevelWrongAnswersPage({ params }: Props) {
  const routeLevel = normalizeRouteLevel(params.level);
  if (!routeLevel) notFound();

  return (
    <StudyComingSoon
      title="ভুল উত্তর Practice"
      description="ভুল করা প্রশ্নগুলো আবার প্র্যাকটিস করার ফিচার শীঘ্রই আসছে।"
      backHref={levelHubPath(routeLevel)}
    />
  );
}
