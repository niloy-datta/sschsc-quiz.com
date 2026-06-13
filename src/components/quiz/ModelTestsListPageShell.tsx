import { Suspense, type ComponentProps } from "react";
import { ModelTestsListClient } from "@/components/quiz/ModelTestsListClient";
import { ModelTestsListSkeleton } from "@/components/quiz/ModelTestsListSkeleton";

type Props = ComponentProps<typeof ModelTestsListClient>;

export function ModelTestsListPageShell(props: Props) {
  return (
    <Suspense fallback={<ModelTestsListSkeleton />}>
      <ModelTestsListClient {...props} />
    </Suspense>
  );
}
