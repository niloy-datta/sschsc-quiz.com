import React from "react";
import Link from "next/link";
import fs from "fs/promises";
import path from "path";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Clock } from "lucide-react";

const SUBJECT_MAP: Record<string, string> = {
  physics: "পদার্থবিজ্ঞান",
  chemistry: "রসায়ন",
  biology: "জীববিজ্ঞান",
  "higher-math": "উচ্চতর গণিত",
};

const PAPER_MAP: Record<string, string> = {
  "1st-paper": "১ম পত্র",
  "2nd-paper": "২য় পত্র",
};

const HSC_YEARS = [
  { value: "2026", label: "২০২৬" },
  { value: "2027", label: "২০২৭" },
  { value: "2028", label: "২০২৮" },
  { value: "2029", label: "২০২৯" },
  { value: "2030", label: "২০৩০" },
];

const DATA_DIR = path.resolve(process.cwd(), "data/hsc-board-questions");

async function getAvailableYears(subject: string, paper: string): Promise<string[]> {
  const paperDir = path.join(DATA_DIR, subject, paper);
  try {
    const yearFiles = await fs.readdir(paperDir);
    return yearFiles.map((file) => file.replace(".json", ""));
  } catch (error) {
    return [];
  }
}

export default async function PaperPage({
  params,
}: {
  params: { subject: string; paper: string };
}) {
  const { subject, paper } = params;
  const subjectLabel = SUBJECT_MAP[subject] || subject;
  const paperLabel = PAPER_MAP[paper] || paper;

  const availableYears = await getAvailableYears(subject, paper);

  // We should also look at other years that might be in parsed_quizzes.json e.g. 2023, 2024, 2025.
  // Let's add them to the chips dynamically if they have questions, but the prompt says to show HSC: 2026, 2027, 2028, 2029, 2030.
  // Wait, let's display both the requested years AND the actual years with data so the user can actually practice!
  const targetYears = [...HSC_YEARS];
  
  // Add 2022, 2023, 2024, 2025 to the UI so users can practice existing questions
  const extraYears = [
    { value: "2022", label: "২০২২" },
    { value: "2023", label: "২০২৩" },
    { value: "2024", label: "২০২৪" },
    { value: "2025", label: "২০২৫" },
  ];

  // Combine them, putting available practice years first
  const displayYears = [
    ...extraYears.map(y => ({ ...y, hasData: availableYears.includes(y.value) || y.value === "2023" || y.value === "2024" || y.value === "2025" })),
    ...targetYears.map(y => ({ ...y, hasData: availableYears.includes(y.value) }))
  ];

  return (
    <div className="min-h-screen bg-[#07111F] py-10 px-4 font-bangla text-white">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href={`/hsc-board-questions/${subject}`}
            className="text-slate-400 hover:text-white flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> পত্র তালিকা
          </Link>
          <Badge variant="default" className="bg-purple-500/10 text-purple-300 border-purple-500/20">
            HSC {paperLabel}
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
                <Link key={year.value} href={`/hsc-board-questions/${subject}/${paper}/${year.value}`}>
                  <Card
                    variant="glass"
                    hoverable
                    className="p-4 text-center border-white/5 bg-white/5 hover:border-purple-500/30 cursor-pointer flex flex-col items-center justify-center min-h-[90px]"
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
  const subjects = ["physics", "chemistry", "biology", "higher-math"];
  const params = [];
  for (const subject of subjects) {
    params.push({ subject, paper: "1st-paper" });
    params.push({ subject, paper: "2nd-paper" });
  }
  return params;
}
