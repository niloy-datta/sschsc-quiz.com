import { notFound } from "next/navigation";
import { HscLevelHubPage } from "@/components/study/HscLevelHubPage";
import { SscLevelHubPage } from "@/components/study/SscLevelHubPage";
import { normalizeRouteLevel } from "@/lib/quiz/unified-routes";

type Props = { params: { level: string } };

export default function LevelHubPage({ params }: Props) {
  const routeLevel = normalizeRouteLevel(params.level);
  if (!routeLevel) notFound();

  if (routeLevel === "ssc") return <SscLevelHubPage />;
  return <HscLevelHubPage />;
}
