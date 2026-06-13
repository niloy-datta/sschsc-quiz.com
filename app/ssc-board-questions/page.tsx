import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BookOpen, GraduationCap, ChevronRight } from "lucide-react";

const SUBJECT_MAP: Record<string, string> = {
  physics: "পদার্থবিজ্ঞান",
  chemistry: "রসায়ন",
  biology: "জীববিজ্ঞান",
  "higher-math": "উচ্চতর গণিত",
  math: "সাধারণ গণিত",
};

const SUBJECT_ICONS: Record<string, any> = {
  physics: BookOpen,
  chemistry: BookOpen,
  biology: GraduationCap,
  "higher-math": BookOpen,
  math: BookOpen,
};

export default function SSCBoardQuestionsPage() {
  const subjects = ["physics", "chemistry", "biology", "higher-math", "math"];

  return (
    <div className="min-h-screen bg-[#07111F] py-10 px-4 font-bangla text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="default" className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20">
            এসএসসি বোর্ড প্রশ্ন
          </Badge>
          <h1 className="text-3xl md:text-4xl font-black">SSC বোর্ড প্রশ্ন ব্যাংক</h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base">
            বিগত বছরের বোর্ড প্রশ্নগুলো নিয়ে কুইজ দিয়ে তোমার প্রস্তুতি ঝালাই করো।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((subject) => {
            const label = SUBJECT_MAP[subject] || subject;
            const Icon = SUBJECT_ICONS[subject] || BookOpen;

            return (
              <Link key={subject} href={`/ssc-board-questions/${subject}`}>
                <Card
                  variant="glass"
                  hoverable
                  className="p-6 flex items-center justify-between border-white/5 bg-white/5 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                      <Icon className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white leading-snug">
                        {label}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">বোর্ড প্রশ্নাবলী</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 hover:text-white" />
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="text-center pt-4">
          <Link href="/ssc" className="text-sm text-slate-400 hover:text-white underline">
            SSC হাব-এ ফিরে যাও
          </Link>
        </div>
      </div>
    </div>
  );
}
