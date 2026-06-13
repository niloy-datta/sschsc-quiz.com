import { levelHubPath } from "@/lib/quiz/unified-routes";
import { HeroSectionNew } from "@/components/home/HeroSectionNew";
import { HomeMobileNav } from "@/components/home/HomeMobileNav";
import { QuickStartSection } from "@/components/home/QuickStartSection";
import { DailyTaskSection } from "@/components/home/DailyTaskSection";
import { ChapterPracticeSection } from "@/components/home/ChapterPracticeSection";
import { LeaderboardPreviewSection } from "@/components/home/LeaderboardPreviewSection";
import { FinalCTASection } from "@/components/home/FinalCTASection";

export default function Home() {
  return (
    <div className="relative" id="home">
      <HeroSectionNew />
      <HomeMobileNav />
      <QuickStartSection />
      <DailyTaskSection />
      <ChapterPracticeSection />
      <LeaderboardPreviewSection />
      <FinalCTASection />

      <footer className="border-t border-white/10 bg-[#07111F]/90 py-8 text-center text-xs text-slate-500 font-bangla">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© ২০২৬ বিজ্ঞান র্যাঙ্কার। সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex gap-4">
            <a href="/" className="hover:text-slate-300">হোম</a>
            <span>•</span>
            <a href={levelHubPath("ssc")} className="hover:text-slate-300">SSC</a>
            <span>•</span>
            <a href={levelHubPath("hsc")} className="hover:text-slate-300">HSC</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
