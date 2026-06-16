import { notFound } from "next/navigation";
import { WrongAnswersClient } from "@/components/quiz/WrongAnswersClient";
import { normalizeRouteLevel } from "@/lib/quiz/unified-routes";

type Props = { params: { level: string } };

export const metadata = {
  title: "ভুল উত্তরের অনুশীলন — Quiz Dashboard",
  description: "কুইজে ভুল করা প্রশ্নগুলো আবার অনুশীলন করে ঘাটতি পূরণ করুন।",
};

export default function LevelWrongAnswersPage({ params }: Props) {
  const routeLevel = normalizeRouteLevel(params.level);
  if (!routeLevel) notFound();

  return <WrongAnswersClient level={routeLevel} />;
}
