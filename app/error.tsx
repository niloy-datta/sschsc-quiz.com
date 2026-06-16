'use client';

import Link from 'next/link';

export default function RouteFallback({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
      <section className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="mt-4 text-slate-300">This page could not load properly. Please try again or return home.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950">
            Try again
          </button>
          <Link href="/" className="rounded-full border border-white/15 px-6 py-3 text-sm font-bold text-white">
            Go home
          </Link>
        </div>
      </section>
    </main>
  );
}
