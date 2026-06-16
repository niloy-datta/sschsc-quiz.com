import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
      <section className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="mt-4 text-slate-300">এই পেজ বা quiz data পাওয়া যায়নি। Subject, chapter বা model test link আবার check করুন।</p>
        <Link href="/" className="mt-8 inline-flex rounded-full bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950">
          হোমে ফিরুন
        </Link>
      </section>
    </main>
  );
}
