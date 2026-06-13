import { notFound } from "next/navigation";
import { StudyComingSoon } from "@/components/study/StudyComingSoon";
import { levelHubPath, normalizeRouteLevel } from "@/lib/quiz/unified-routes";

type Props = { params: { level: string } };

export default function LevelFullBookTestPage({ params }: Props) {
  const routeLevel = normalizeRouteLevel(params.level);
  if (!routeLevel) notFound();

  const title =
    routeLevel === "ssc" ? "SSC ফুল বুক টেস্ট" : "HSC ফুল বুক টেস্ট";

  return (
    <StudyComingSoon title={title} backHref={levelHubPath(routeLevel)} />
  );
}
