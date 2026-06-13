import Link from "next/link";
import { BOARD_YEARS } from "@/lib/quiz-catalog";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Props = {
  level: "SSC" | "HSC";
  hscBoardBase?: string;
};

/** Board year grid — marks missing years without fake data. */
export function BoardYearsSection({ level, hscBoardBase }: Props) {
  const hscDataYears = new Set(["2023", "2024"]);

  return (
    <section className="max-w-4xl mx-auto px-4 py-8 font-bangla">
      <h2 className="text-2xl font-bold text-white mb-4">
        বোর্ড প্রশ্ন (২০২২–২০২৬)
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {BOARD_YEARS.map((year) => {
          const hasData =
            level === "HSC" ? hscDataYears.has(year) : false;
          const href =
            level === "HSC" && hasData
              ? `${hscBoardBase ?? "/hsc-board-questions"}/physics/1st-paper/${year}`
              : undefined;

          return (
            <Card
              key={year}
              variant="dark"
              className={`p-4 text-center ${href ? "hover:border-purple-glow/40" : ""}`}
            >
              {href ? (
                <Link href={href} className="block">
                  <span className="text-lg font-bold text-white">{year}</span>
                  <Badge variant="premium" className="mt-2 text-xs">ডেটা আছে</Badge>
                </Link>
              ) : (
                <div>
                  <span className="text-lg font-bold text-slate-500">{year}</span>
                  <p className="text-xs text-slate-600 mt-2">শীঘ্রই আসছে</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      {level === "HSC" && (
        <Link
          href="/hsc-board-questions"
          className="text-purple-glow text-sm mt-4 inline-block hover:underline"
        >
          HSC বোর্ড প্রশ্ন (ইমেজ) →
        </Link>
      )}
    </section>
  );
}
