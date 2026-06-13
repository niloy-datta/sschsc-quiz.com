"use client";

import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { weaknessReports } from "@/lib/mockData";
import { Brain, AlertCircle, ArrowUpRight, Zap } from "lucide-react";

export function WeaknessReportSection() {
  return (
    <section id="stats" className="py-12 md:py-16 relative overflow-hidden font-bangla">
      <div className="absolute top-1/2 right-1/4 w-[250px] h-[250px] bg-red-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Visual Analysis Grid */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <Card variant="glass" className="p-6 md:p-8 border-purple-glow/15 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 to-purple-glow" />

              <div className="space-y-6">
                
                {/* AI Radar Header */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-glow/10 border border-purple-glow/30 flex items-center justify-center text-purple-glow">
                    <Brain className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">AI দুর্বলতা বিশ্লেষণ</h4>
                    <p className="text-[11px] text-slate-500 font-semibold">ভুল উত্তরের তথ্যের ভিত্তিতে স্বয়ংক্রিয় আপডেট</p>
                  </div>
                </div>

                {/* Radar Mock Visualization (SVG based concentric circles) */}
                <div className="relative h-48 flex items-center justify-center border border-slate-900/60 rounded-2xl bg-slate-950/40 p-4">
                  {/* Concentric Circles */}
                  <div className="absolute h-36 w-36 rounded-full border border-slate-800/40 flex items-center justify-center">
                    <div className="h-24 w-24 rounded-full border border-slate-800/60 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full border border-slate-800 flex items-center justify-center bg-purple-glow/5" />
                    </div>
                  </div>
                  
                  {/* Glowing Radar Sweep line simulation */}
                  <div className="absolute h-20 w-[1px] bg-gradient-to-t from-transparent to-purple-glow origin-bottom bottom-1/2 left-1/2 -translate-x-1/2 animate-[spin_5s_linear_infinite]" />
                  
                  {/* Subject plot points */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-success-green shadow-glow-green text-[9px] flex items-center justify-center font-bold text-black border border-slate-950 font-outfit">
                    🧬
                  </div>
                  <div className="absolute bottom-10 left-12 h-3.5 w-3.5 rounded-full bg-error-red shadow-glow-red text-[9px] flex items-center justify-center font-bold text-black border border-slate-950 font-outfit">
                    ⚛️
                  </div>
                  <div className="absolute bottom-12 right-16 h-3.5 w-3.5 rounded-full bg-amber-500 shadow-glow-gold text-[9px] flex items-center justify-center font-bold text-black border border-slate-950 font-outfit">
                    🧪
                  </div>

                  {/* Core Status Message */}
                  <div className="text-center z-10 space-y-1">
                    <span className="text-xs text-slate-400 font-semibold block">গড় দক্ষতা রেটিং</span>
                    <span className="text-2xl font-black text-white font-outfit">৬৩%</span>
                    <Badge variant="default" className="text-[9px] border-slate-800">মাঝারি প্রস্তুতি</Badge>
                  </div>

                </div>

                {/* Accuracy bars list */}
                <div className="space-y-3">
                  {weaknessReports.map((item, idx) => {
                    const isCritical = item.status === "critical";
                    const isWarning = item.status === "warning";
                    
                    let progressColor = "bg-success-green shadow-glow-green/30";
                    let textColor = "text-success-green";
                    if (isCritical) {
                      progressColor = "bg-error-red shadow-glow-red/30";
                      textColor = "text-error-red";
                    } else if (isWarning) {
                      progressColor = "bg-amber-500 shadow-glow-gold/30";
                      textColor = "text-amber-500";
                    }

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-300">{item.chapter} ({item.subject})</span>
                          <span className={`${textColor} font-outfit font-bold`}>{item.accuracy}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                          <div
                            className={`h-full ${progressColor} rounded-full transition-all duration-500`}
                            style={{ width: `${item.accuracy}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </Card>
          </div>

          {/* Explanation & Action Pitch (Right Column on Desktop) */}
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs md:text-sm font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>দুর্বলতা পর্যবেক্ষণ রিপোর্ট</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              তোমার ভুলগুলোই হবে তোমার <br />
              র্যাঙ্ক আপ করার হাতিয়ার
            </h2>
            
            <p className="text-base text-slate-400 leading-relaxed">
              সিস্টেম প্রতিটি ব্যাটল ম্যাচের ভুল প্রশ্নগুলো ট্র্যাক করে। AI দুর্বল চ্যাপ্টারগুলো চিহ্নিত করে সাজেস্ট করবে কোন বইয়ের কোন পৃষ্ঠা পড়তে হবে। ভুল শুধরে আবার যুদ্ধে ঝাঁপিয়ে পড়ো!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="secondary" className="flex items-center justify-center gap-2 group" onClick={() => {
                const el = document.getElementById("quiz");
                el?.scrollIntoView({ behavior: "smooth" });
              }}>
                ভুল প্রশ্নগুলো ঝালাই করো
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Button>
              <Button variant="ghost" className="flex items-center justify-center gap-1.5" onClick={() => {
                const el = document.getElementById("premium");
                el?.scrollIntoView({ behavior: "smooth" });
              }}>
                <Zap className="h-4 w-4 text-gold-rank fill-gold-rank/20" />
                প্রিমিয়াম গাইডলাইন আনলক করো
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
