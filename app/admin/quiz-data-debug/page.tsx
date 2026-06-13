import { auditQuizDataFiles } from "@/lib/quiz/audit-quiz-data";
import { QUIZ_REGISTRY } from "@/lib/quiz/registry";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function QuizDataDebugPage() {
  const report = await auditQuizDataFiles();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 font-bangla space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Quiz Data Debug</h1>
          <p className="text-slate-400 text-sm mt-1">
            Developer verification — public/quiz-data/
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-cyan-400 hover:underline"
        >
          ← Admin
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Subjects loaded" value={report.totalSubjects} />
        <StatCard label="Chapter sets" value={report.totalChapters} />
        <StatCard label="Total sets" value={report.totalSets} />
        <StatCard label="Total questions" value={report.totalQuestions} />
        <StatCard label="Skipped bad Q" value={report.skippedBadQuestions} />
        <StatCard label="Duplicate IDs fixed" value={report.duplicateIdsFixed} />
        <StatCard
          label="Manifest"
          value={report.manifestExists ? "OK" : "Missing"}
        />
        <StatCard label="Registry entries" value={QUIZ_REGISTRY.length} />
      </div>

      {report.missingFiles.length > 0 && (
        <Card variant="glass" className="p-5 border-red-500/20">
          <h2 className="text-red-400 font-bold mb-3">Missing files</h2>
          <ul className="text-sm text-slate-300 space-y-1">
            {report.missingFiles.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </Card>
      )}

      {report.invalidJsonFiles.length > 0 && (
        <Card variant="glass" className="p-5 border-amber-500/20">
          <h2 className="text-amber-400 font-bold mb-3">Invalid JSON</h2>
          <ul className="text-sm text-slate-300 space-y-1">
            {report.invalidJsonFiles.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card variant="glass" className="p-5 overflow-x-auto">
        <h2 className="text-white font-bold mb-4">Per-subject breakdown</h2>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-slate-400 border-b border-white/10">
              <th className="py-2 pr-4">File</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Chapters</th>
              <th className="py-2 pr-4">Model tests</th>
              <th className="py-2 pr-4">Board sets</th>
              <th className="py-2 pr-4">Questions</th>
              <th className="py-2">Skipped</th>
            </tr>
          </thead>
          <tbody>
            {report.subjects.map((row) => (
              <tr key={row.registryPath} className="border-b border-white/5">
                <td className="py-2 pr-4 text-slate-300 font-mono text-xs">
                  {row.registryPath}
                </td>
                <td className="py-2 pr-4">
                  {row.exists
                    ? row.loadError
                      ? <span className="text-amber-400">Error</span>
                      : <span className="text-emerald-400">OK</span>
                    : <span className="text-red-400">Missing</span>}
                </td>
                <td className="py-2 pr-4 text-white">{row.chapterSetCount}</td>
                <td className="py-2 pr-4 text-white">{row.modelTestSetCount}</td>
                <td className="py-2 pr-4 text-white">{row.boardSetCount}</td>
                <td className="py-2 pr-4 text-white">{row.totalQuestions}</td>
                <td className="py-2 text-slate-400">
                  {row.stats.skippedEmpty +
                    row.stats.skippedInvalidOptions +
                    row.stats.skippedInvalidCorrect +
                    row.stats.skippedBrokenOcr}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card variant="glass" className="p-4 border-white/5">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
    </Card>
  );
}
