import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ShieldCheck, ShieldAlert, Check, Sparkles, Crown } from "lucide-react";

export function PremiumUnlockSection() {
  const premiumFeatures = [
    "আনলিমিটেড রিয়েল-টাইম লাইভ কুইজ ব্যাটল এরিনা",
    "অধ্যায়ভিত্তিক বিগত ১০ বছরের বোর্ড প্রশ্নব্যাংক ও সমাধান",
    "AI দুর্বল চ্যাপ্টার রিভিশন ট্র্যাকার ও প্রোগ্রেস সাজেশন",
    "পদার্থবিজ্ঞান ও রসায়নের জটিল গাণিতিক শর্টকাট ট্রিকস",
    "সাপ্তাহিক লাইভ মেগা লিডারবোর্ড টুর্নামেন্ট ও পুরষ্কার",
    "বিজ্ঞাপন মুক্ত প্রিমিয়াম গেমিং ইন্টারফেস ও প্রফাইল থিম"
  ];

  return (
    <section id="premium" className="py-16 md:py-28 relative overflow-hidden font-bangla">
      {/* Dynamic luxury gold background flares */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gold-rank/5 rounded-full blur-[130px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        
        {/* Header Title */}
        <div className="text-center space-y-3 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gold-dark/60 border border-gold-rank/40 text-gold-rank text-xs md:text-sm font-black animate-pulse">
            <Crown className="h-4 w-4" />
            <span>বিজ্ঞান র্যাঙ্কারস এলিট ক্লাব</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            প্রস্তুতি নাও চ্যাম্পিয়নদের মতো
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">
            সীমাবদ্ধতা দূর করো। প্রিমিয়াম যুদ্ধঘরে প্রবেশ করে তোমার সর্বোচ্চ র্যাঙ্ক অর্জন নিশ্চিত করো।
          </p>
        </div>

        {/* Pricing/Unlock Panel */}
        <Card variant="premium" className="relative p-8 md:p-12 max-w-3xl mx-auto overflow-hidden shadow-[0_0_50px_rgba(251,191,36,0.08)] border-gold-rank/30">
          
          {/* Top-right corner gold glow decal */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold-rank/10 to-transparent pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Value Pitch List (Left) */}
            <div className="md:col-span-7 space-y-6">
              <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-gold-rank" />
                প্রো মেম্বারশিপের সুবিধাসমূহ:
              </h3>
              
              <ul className="space-y-3.5">
                {premiumFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-300 text-xs sm:text-sm">
                    <span className="h-5 w-5 rounded-full bg-gold-rank/15 text-gold-rank flex items-center justify-center shrink-0 mt-0.5 border border-gold-rank/25">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </span>
                    <span className="font-semibold leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Price & Action HUD (Right) */}
            <div className="md:col-span-5 p-6 rounded-2xl bg-slate-950/70 border border-gold-rank/20 flex flex-col justify-center items-center text-center space-y-6 shadow-inner">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">মাসিক সাবস্ক্রিপশন</span>
                
                <div className="flex items-baseline justify-center gap-1.5 py-2">
                  <span className="text-4xl sm:text-5xl font-black text-gold-rank font-outfit">৩৫০</span>
                  <span className="text-xl font-bold text-white">টাকা</span>
                  <span className="text-slate-500 text-xs">/মাস</span>
                </div>
                
                <span className="text-[10px] text-slate-500 line-through block font-outfit">৭০০ টাকা (৫০% ছাড়)</span>
              </div>

              <div className="w-full space-y-3">
                <Button variant="premium" fullWidth size="lg" className="font-extrabold shadow-glow-gold">
                  👑 প্রো এরিনা আনলক করো
                </Button>
                
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  বিকাশ, রকেট অথবা নগদের মাধ্যমে মুহূর্তেই পেমেন্ট সম্পন্ন করে প্রবেশ করো এলিট ক্লাবে।
                </p>
              </div>

              {/* Secure payment markers */}
              <div className="flex items-center gap-2 border-t border-slate-900 pt-4 w-full justify-center">
                <ShieldCheck className="h-4 w-4 text-gold-rank" />
                <span className="text-[10px] text-slate-400 font-bold">শতভাগ নিরাপদ ও ইনস্ট্যান্ট অ্যাক্টিভেশন</span>
              </div>

            </div>

          </div>

        </Card>

      </div>
    </section>
  );
}
