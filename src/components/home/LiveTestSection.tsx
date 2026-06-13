"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Clock, BookOpen, Calendar, Bell } from "lucide-react";

export function LiveTestSection() {
  return (
    <section className="py-16 font-bangla">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <Badge variant="default" className="inline-flex items-center gap-2 mb-4">
            লাইভ টেস্ট
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            পরবর্তী <span className="text-gradient-purple">লাইভ মডেল টেস্ট</span>
          </h2>
          <p className="text-slate-400 mt-2">
            নির্দিষ্ট সময়ে সবাই একসাথে পরীক্ষা দাও, rank দেখো
          </p>
        </div>

        <Card variant="glass" className="max-w-3xl mx-auto p-6 md:p-8 border-purple-500/20">
          <div className="flex flex-col gap-6 items-center text-center">
            <Badge variant="premium" className="text-sm px-4 py-1">
              শীঘ্রই আসছে...
            </Badge>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                <Calendar className="h-4 w-4" />
                <span>সময়সূচি শীঘ্রই প্রকাশ করা হবে</span>
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-white">
                লাইভ মডেল টেস্ট ব্যাটল
              </h3>

              <p className="text-sm text-slate-400 max-w-md mx-auto">
                SSC ও HSC বিজ্ঞানের জন্য সময়-নির্ধারিত লাইভ পরীক্ষা চালু হচ্ছে।
                র‍্যাঙ্কিং ও রিয়েল-টাইম ফলাফল একসাথে দেখতে পারবে।
              </p>

              <div className="flex flex-wrap justify-center gap-4 text-sm pt-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  <span>নির্ধারিত সময়</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <BookOpen className="h-4 w-4 text-purple-400" />
                  <span>MCQ সেট</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="secondary" disabled className="flex items-center gap-2 cursor-not-allowed opacity-70">
                শীঘ্রই আসছে...
              </Button>
              <Button variant="secondary" disabled className="flex items-center gap-2 cursor-not-allowed opacity-70">
                <Bell className="h-4 w-4" />
                রিমাইন্ডার — শীঘ্রই
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
