import { notFound } from "next/navigation";
import { FinalFocusSection } from "@/components/home/FinalFocusSection";
import { normalizeRouteLevel } from "@/lib/quiz/unified-routes";

type Props = { params: { level: string } };

export default function LevelFinalFocusPage({ params }: Props) {
  const routeLevel = normalizeRouteLevel(params.level);
  if (!routeLevel) notFound();

  return (
    <div className="min-h-screen pb-24">
      <FinalFocusSection embedded />
    </div>
  );
}
