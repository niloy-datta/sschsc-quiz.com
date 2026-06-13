import { notFound, redirect } from "next/navigation";
import {
  normalizeRouteLevel,
  unifiedSubjectBasePath,
} from "@/lib/quiz/unified-routes";

type Props = { params: { level: string; subject: string } };

/** Subject model-test list lives on the subject hub (`?tab=model`). Keep this route for old links. */
export default function UnifiedSubjectModelTestsPage({ params }: Props) {
  const routeLevel = normalizeRouteLevel(params.level);
  if (!routeLevel) notFound();

  redirect(`${unifiedSubjectBasePath(routeLevel, params.subject)}?tab=model&model=paper`);
}
