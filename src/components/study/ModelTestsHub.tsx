"use client";

import Link from "next/link";
import { ChevronRight, Target } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface ModelTestLink {
  href: string;
  label: string;
}

interface ModelTestsHubProps {
  title: string;
  subtitle: string;
  links: ModelTestLink[];
}

export function ModelTestsHub({ title, subtitle, links }: ModelTestsHubProps) {
  return (
    <div className="min-h-screen font-bangla py-8 pb-24">
      <div className="mb-8">
        <Badge variant="default" className="mb-3 inline-flex items-center gap-1">
          <Target className="h-3 w-3" />
          মডেল টেস্ট
        </Badge>
        <h1 className="text-2xl md:text-3xl font-black text-white mb-2">{title}</h1>
        <p className="text-slate-400 text-sm">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card variant="glass" className="p-4 flex items-center gap-3 hoverable group">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                <Target className="h-5 w-5 text-cyan-400" />
              </div>
              <span className="flex-1 font-semibold text-white">{link.label}</span>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
