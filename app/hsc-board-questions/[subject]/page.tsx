import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BookOpen, ChevronRight, ArrowLeft } from "lucide-react";

const SUBJECT_MAP: Record<string, string> = {
  physics: "পদার্থবিজ্ঞান",
  chemistry: "রসায়ন",
  biology: "জীববিজ্ঞান",
  "higher-math": "উচ্চতর গণিত",
};

export default function HSCBoardSubjectPapersPage({
  params,
}: {
  params: { subject: string };
}) {
  const { subject } = params;
  const label = SUBJECT_MAP[subject] || subject;
  
  const papers = [
    { slug: "1st-paper", name: "১ম পত্র" },
    { slug: "2nd-paper", name: "২য় পত্র" },
  ];

  return (
    <div className="min-h-screen bg-[#07111F] py-10 px-4 font-bangla text-white">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/hsc-board-questions"
            className="text-slate-400 hover:text-white flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> বিষয় তালিকা
          </Link>
          <Badge variant="default" className="bg-purple-500/10 text-purple-300 border-purple-500/20">
            HSC বোর্ড প্রশ্ন
          </Badge>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black">{label}</h1>
          <p className="text-slate-400 text-sm">পত্র নির্বাচন করো</p>
        </div>

        <div className="space-y-3">
          {papers.map((paper) => (
            <Link key={paper.slug} href={`/hsc-board-questions/${subject}/${paper.slug}`}>
              <Card
                variant="glass"
                hoverable
                className="p-5 flex items-center justify-between border-white/5 bg-white/5 hover:border-purple-500/30 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-purple-400" />
                  <span className="text-lg font-bold text-white">
                    {label} {paper.name}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const subjects = ["physics", "chemistry", "biology", "higher-math"];
  return subjects.map((subject) => ({ subject }));
}
