import { notFound } from "next/navigation";
import { SavedQuestionsClient } from "@/components/quiz/SavedQuestionsClient";
import { normalizeRouteLevel } from "@/lib/quiz/unified-routes";

type Props = { params: { level: string } };

export const metadata = {
  title: "সেভ করা প্রশ্ন — Quiz Dashboard",
  description: "কুইজ থেকে সেভ করা প্রশ্নগুলো আবার অনুশীলন করুন।",
};

export default function LevelSavedQuestionsPage({ params }: Props) {
  const routeLevel = normalizeRouteLevel(params.level);
  if (!routeLevel) notFound();

  return <SavedQuestionsClient level={routeLevel} />;
}
