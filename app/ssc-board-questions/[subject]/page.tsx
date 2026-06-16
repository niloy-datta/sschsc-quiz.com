import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Clock } from "lucide-react";

const SUBJECT_MAP: Record<string, string> = {
  physics: "পদার্থবিজ্ঞান",
  chemistry: "রসায়ন",
  biology: "জীববিজ্ঞান",
  "higher-math": "উচ্চতর গণিত",
  math: "সাধারণ গণিত",
};

const AVAILABLE_YEARS: Record<string, string[]> = {
  physics: ["2022", "2023", "2024", "2025"],
  chemistry: ["2022", "2023", "2024", "2025"],
  biology: ["2022", "2023", "2024", "2025"],
  "higher-math": ["2022", "2023", "2024", "2025"],
  math: ["2022", "2023", "2024", "2025"],
};

const TARGET_YEARS = [
  { value: "2027", label: "২০২৭" },
  { value: "2028", label: "২০২৮" },
  { value: "2029", label: "২০২৯" },
  { value: "2030", label: "২০৩০" },
  { value: "2031", label: "২০৩১" },
];

const HISTORICAL_YEARS = [
  { value: "2022", label: "২০২২" },
  { value: "2023", label: "২০২৩" },
  { value: "2024", label: "২০২৪" },
  { value: "2025", label: "২০২৫" },
];

type Props = {
  params: { subject: string };
};

export default function SSCBoardSubjectYearsPage({ params }: Props) {
  const { subject } = params;
  const subjectLabel = SUBJECT_MAP[subject] || subject;
  
  const readyYears = AVAILABLE_YEARS[subject] || [];

  // Combine display years
  const displayYears = [
    ...HISTORICAL_YEARS.map(y => ({ ...y, hasData: readyYears.includes(y.value) })),
    ...TARGET_YEARS.map(y => ({ ...y, hasData: false })),
  ];

  return (
    <div className="min-h-screen bg-[#07111F] py-10 px-4 font-bangla text-white">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/ssc-board-questions"
            className="text-slate-400 hover:text-white flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> বিষয় তালিকা
          </Link>
          <Badge variant="default" className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20">
            SSC বোর্ড প্রশ্ন
          </Badge>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black">{subjectLabel}</h1>
          <p className="text-slate-400 text-sm">পরীক্ষার বছর নির্বাচন করো</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {displayYears.map((year) => {
            if (year.hasData) {
              return (
                <Link key={year.value} href={`/ssc-board-questions/${subject}/${year.value}`}>
                  <Card
                    variant="glass"
                    hoverable
                    className="p-4 text-center border-white/5 bg-white/5 hover:border-cyan-500/30 cursor-pointer flex flex-col items-center justify-center min-h-[90px]"
                  >
                    <span className="text-xl font-black text-white">{year.label}</span>
                    <Badge variant="default" className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20 mt-2 text-[10px]">
                      প্রস্তুত
                    </Badge>
                  </Card>
                </Link>
              );
            }

            return (
              <Card
                key={year.value}
                variant="glass"
                className="p-4 text-center border-white/5 bg-white/5 opacity-55 flex flex-col items-center justify-center min-h-[90px]"
              >
                <span className="text-xl font-black text-slate-400">{year.label}</span>
                <span className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> শীঘ্রই আসছে
                </span>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const subjects = ["physics", "chemistry", "biology", "higher-math", "math"];
  return subjects.map((subject) => ({ subject }));
}
