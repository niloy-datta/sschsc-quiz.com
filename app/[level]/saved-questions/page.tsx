import { notFound } from "next/navigation";
import { StudyComingSoon } from "@/components/study/StudyComingSoon";
import { levelHubPath, normalizeRouteLevel } from "@/lib/quiz/unified-routes";

type Props = { params: { level: string } };

export default function LevelSavedQuestionsPage({ params }: Props) {
  const routeLevel = normalizeRouteLevel(params.level);
  if (!routeLevel) notFound();

  return (
    <StudyComingSoon
      title="সেভ করা প্রশ্ন"
      description="প্রশ্ন সেভ ও রিভিউ করার ফিচার শীঘ্রই আসছে।"
      backHref={levelHubPath(routeLevel)}
    />
  );
}
