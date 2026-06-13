import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface StudyComingSoonProps {
  title: string;
  description?: string;
  backHref: string;
  backLabel?: string;
}

export function StudyComingSoon({
  title,
  description = "এই ফিচার শীঘ্রই আসছে। এখন অধ্যায়ভিত্তিক কুইজ ও মডেল টেস্ট থেকে প্রস্তুতি চালিয়ে যাও।",
  backHref,
  backLabel = "প্রস্তুতি মেনুতে ফিরুন",
}: StudyComingSoonProps) {
  return (
    <div className="min-h-[60vh] font-bangla py-8">
      <Card variant="glass" className="max-w-xl mx-auto p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10">
          <Clock className="h-7 w-7 text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
        <p className="text-sm text-slate-400 mb-6">{description}</p>
        <Link href={backHref}>
          <Button variant="secondary" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
        </Link>
      </Card>
    </div>
  );
}
