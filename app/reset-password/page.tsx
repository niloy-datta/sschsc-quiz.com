"use client";

import React, { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { Brain, Mail, ArrowLeft, CheckCircle, X } from "lucide-react";

const inputWithIconClass =
  "h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400 disabled:opacity-60";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email.trim()) {
      setError("ইমেইল প্রয়োজন");
      return;
    }

    if (!isFirebaseConfigured || !auth) {
      setError("রিসেট লিংক পাঠানো যায়নি। ইমেইল ঠিক আছে কিনা দেখুন।");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess(true);
    } catch {
      setError("রিসেট লিংক পাঠানো যায়নি। ইমেইল ঠিক আছে কিনা দেখুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#07111F] px-4 py-10 font-bangla text-white">
      <div className="glass-card relative mx-auto w-full max-w-md overflow-hidden rounded-3xl p-6 shadow-2xl sm:p-8">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-purple-500 to-cyan-400" />

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10">
            <Brain className="h-8 w-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            পাসওয়ার্ড রিসেট করুন
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            আপনার ইমেইল দিন, আমরা পাসওয়ার্ড রিসেট লিংক পাঠাবো।
          </p>
        </div>

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।</span>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <X className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">
              ইমেইল
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="তোমার ইমেইল"
                disabled={loading || success}
                className={inputWithIconClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="auth-button-primary"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                পাঠানো হচ্ছে...
              </>
            ) : (
              "রিসেট লিংক পাঠান"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-cyan-400"
          >
            <ArrowLeft className="h-4 w-4" />
            লগইনে ফিরে যান
          </Link>
        </div>
      </div>
    </section>
  );
}
