import { notFound, redirect } from "next/navigation";
import { levelModelTestsPath, normalizeRouteLevel } from "@/lib/quiz/unified-routes";

type Props = { params: { level: string } };

/** Legacy URL — Tier-A sets are paper-wise model tests now. */
export default function TierAHotRedirectPage({ params }: Props) {
  const routeLevel = normalizeRouteLevel(params.level);
  if (!routeLevel) notFound();
  if (routeLevel !== "hsc") notFound();

  redirect(levelModelTestsPath("hsc", "tab=paper"));
}
