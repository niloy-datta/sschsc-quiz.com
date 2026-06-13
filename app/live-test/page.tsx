"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Calendar, BookOpen, Clock, ArrowLeft } from "lucide-react";

export default function LiveTestPage() {
  return (
    <div className="min-h-screen bg-[#07111F] py-10 px-4 font-bangla text-white pb-24">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <Badge variant="premium" className="inline-flex items-center gap-2 text-sm px-4 py-1">
            শীঘ্রই আসছে...
          </Badge>
          <h1 className="text-3xl md:text-4xl font-black">লাইভ টেস্ট ব্যাটল</h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm">
            একই সময়ে সারা দেশের শিক্ষার্থীদের সাথে লাইভ পরীক্ষায় অংশ নেওয়ার সুবিধা
            শীঘ্রই চালু হচ্ছে।
          </p>
        </div>

        <Card variant="glass" className="p-6 md:p-8 border-purple-500/20 text-center space-y-6">
          <div className="space-y-3">
            <h2 className="text-xl font-bold">লাইভ মডেল টেস্ট</h2>
            <p className="text-sm text-slate-400">
              সময়সূচি, সিলেবাস ও র‍্যাঙ্কিং প্রকাশ করা হলে জানানো হবে।
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-300">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-purple-400" />
              <span>সময় — ঘোষণা করা হবে</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span>নির্ধারিত সময়কাল</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-emerald-400" />
              <span>MCQ সেট</span>
            </div>
          </div>

          <Button variant="secondary" disabled className="w-full min-h-[44px] cursor-not-allowed opacity-70">
            শীঘ্রই আসছে...
          </Button>
        </Card>

        <div className="text-center">
          <Link href="/">
            <Button variant="secondary" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              হোমে ফিরে যাও
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
