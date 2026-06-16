export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
      <section className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-300 border-t-transparent" />
        <h1 className="mt-6 text-2xl font-bold">লোড হচ্ছে...</h1>
        <p className="mt-3 text-slate-300">Quiz data প্রস্তুত করা হচ্ছে। একটু অপেক্ষা করুন।</p>
      </section>
    </main>
  );
}
