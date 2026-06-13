import { notFound } from "next/navigation";
import { ModelTestsLevelHub } from "@/components/study/ModelTestsLevelHub";
import {
  SSC_MATH_CATALOG,
  SSC_SCIENCE_CATALOG,
  HSC_SCIENCE_PAPERS,
  hscSubjectSlug,
} from "@/lib/quiz-catalog";
import {
  normalizeRouteLevel,
  toQuizLevel,
  unifiedModelTestPathPrefix,
} from "@/lib/quiz/unified-routes";

type Props = { params: { level: string } };

export default function LevelModelTestsPage({ params }: Props) {
  const routeLevel = normalizeRouteLevel(params.level);
  if (!routeLevel) notFound();

  const quizLevel = toQuizLevel(routeLevel);

  if (routeLevel === "ssc") {
    const scienceSubjects = SSC_SCIENCE_CATALOG.map((subject) => ({
      slug: subject.slug,
      name: subject.name,
      modelTestBasePath: unifiedModelTestPathPrefix("ssc", subject.slug),
    }));
    const mathSubjects = SSC_MATH_CATALOG.map((subject) => ({
      slug: subject.slug,
      name: subject.name,
      modelTestBasePath: unifiedModelTestPathPrefix("ssc", subject.slug),
    }));

    return (
      <div className="space-y-12">
        <ModelTestsLevelHub
          level={quizLevel}
          title="SSC বিজ্ঞান — মডেল টেস্ট"
          subtitle="পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান — পত্রভিত্তিক টেস্ট"
          subjects={scienceSubjects}
          sectionLabel="বিজ্ঞান বিষয়"
        />
        <ModelTestsLevelHub
          level={quizLevel}
          title="SSC গণিত — মডেল টেস্ট"
          subtitle="উচ্চতর গণিত ও সাধারণ গণিত — পত্রভিত্তিক টেস্ট"
          subjects={mathSubjects}
          sectionLabel="গণিত বিষয়"
        />
      </div>
    );
  }

  const subjects = HSC_SCIENCE_PAPERS.map((paper) => {
    const slug = hscSubjectSlug(paper.subject, paper.paper);
    return {
      slug,
      name: paper.name,
      modelTestBasePath: unifiedModelTestPathPrefix("hsc", slug),
    };
  });

  return (
    <ModelTestsLevelHub
      level={quizLevel}
      title="HSC মডেল টেস্ট"
      subtitle="পত্র বেছে নাও — টাইমার ও স্কোর সহ মডেল টেস্ট"
      subjects={subjects}
    />
  );
}
