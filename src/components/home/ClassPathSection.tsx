"use client";

import React, { useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { educationPaths } from "@/lib/mockData";
import { GraduationCap, Sword, Check } from "lucide-react";

export function ClassPathSection() {
  const [selectedPath, setSelectedPath] = useState<string | null>("hsc"); // Default selected

  return (
    <section className="py-12 md:py-16 relative overflow-hidden font-bangla">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-purple-glow/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center space-y-3 mb-12">
          <Badge variant="default" className="border-purple-glow/20 text-slate-300">ভর্তি ও বোর্ড পরীক্ষার লক্ষ্য</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            তোমার পরীক্ষার লক্ষ্য নির্বাচন করো
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            তোমার শ্রেণী অনুযায়ী সিলেবাস নির্ধারণ করে সরাসরি লাইভ কুইজ র্যাঙ্কিং যুদ্ধে প্রবেশ করো।
          </p>
        </div>

        {/* Portal Path Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {educationPaths.map((path) => {
            const isSelected = selectedPath === path.id;
            const isPurple = path.accent === "purple";
            
            return (
              <Card
                key={path.id}
                variant={isSelected ? (isPurple ? "glass" : "glass") : "dark"}
                onClick={() => setSelectedPath(path.id)}
                className={`cursor-pointer p-8 relative overflow-hidden transition-all duration-500 border ${
                  isSelected
                    ? isPurple
                      ? "border-purple-glow shadow-glow-purple bg-purple-dark/20 scale-[1.02]"
                      : "border-cyan-glow shadow-glow-cyan bg-cyan-dark/20 scale-[1.02]"
                    : "border-slate-900 hover:border-slate-800 hover:scale-[1.01]"
                }`}
              >
                {/* Glowing portal background effect inside the card */}
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] pointer-events-none -z-10 opacity-30 ${
                  isPurple ? "bg-purple-glow" : "bg-cyan-glow"
                }`} />

                {/* Selection indicator check bubble */}
                <div className={`absolute top-4 right-4 h-6 w-6 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  isSelected
                    ? isPurple
                      ? "bg-purple-glow border-purple-glow text-white"
                      : "bg-cyan-glow border-cyan-glow text-[#02030b]"
                    : "border-slate-800 text-transparent"
                }`}>
                  <Check className="h-4.5 w-4.5 stroke-[3]" />
                </div>

                <div className="space-y-4">
                  {/* Category icon */}
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center border transition-colors ${
                    isSelected
                      ? isPurple
                        ? "bg-purple-glow/10 border-purple-glow/30 text-purple-glow"
                        : "bg-cyan-glow/10 border-cyan-glow/30 text-cyan-glow"
                      : "bg-slate-950 border-slate-900 text-slate-500"
                  }`}>
                    <GraduationCap className="h-6 w-6" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 font-semibold">{path.tag}</span>
                    <h3 className={`text-xl md:text-2xl font-black ${
                      isSelected ? "text-white" : "text-slate-300"
                    }`}>
                      {path.name}
                    </h3>
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed">
                    {path.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between">
                    <Badge variant={isSelected ? "rank" : "default"}>
                      {path.badge}
                    </Badge>
                    <span className={`text-xs font-bold flex items-center gap-1.5 ${
                      isSelected
                        ? isPurple
                          ? "text-purple-glow"
                          : "text-cyan-glow"
                        : "text-slate-500"
                    }`}>
                      <Sword className="h-4 w-4" />
                      ব্যাটেল চালু আছে
                    </span>
                  </div>
                </div>

              </Card>
            );
          })}
        </div>

      </div>
    </section>
  );
}
