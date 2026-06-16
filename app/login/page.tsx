"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Brain, LogIn, Mail, Lock, X, Chrome, RefreshCw, AlertTriangle } from "lucide-react";

const inputWithIconClass =
  "h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const afterLoginPath = safeNextPath(searchParams.get("next"));
  const {
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    error,
    setError,
    loading,
    backendStatus,
    retryBackend,
  } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setError(null);

    if (!email.trim() || !password.trim()) {
      setLocalError("ইমেইল এবং পাসওয়ার্ড উভয়ই প্রয়োজন");
      return;
    }
    if (password.length < 6) {
      setLocalError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      return;
    }

    try {
      let profile: Awaited<ReturnType<typeof loginWithEmail>> = null;
      if (isRegister) {
        if (!name.trim()) {
          setLocalError("নাম প্রয়োজন");
          return;
        }
        profile = await registerWithEmail(email, password, name);
      } else {
        profile = await loginWithEmail(email, password);
      }
      if (profile) {
        window.location.href = afterLoginPath;
      }
    } catch {
      setLocalError("লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLocalError(null);
    const profile = await loginWithGoogle();
    if (profile) {
      window.location.href = afterLoginPath;
    }
  };

  const displayError = localError || error;
  const isBackendDown = backendStatus === "down" && !localError;
  const isRetrying = backendStatus === "checking";

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#07111F] px-4 py-10 font-bangla text-white">
      <div className="glass-card relative mx-auto w-full max-w-md overflow-hidden rounded-3xl p-6 shadow-2xl sm:p-8">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-purple-500 to-cyan-400" />

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10">
            <Brain className="h-8 w-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            {isRegister ? "অ্যাকাউন্ট তৈরি করুন" : "লগইন করুন"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {isRegister
              ? "তোমার বিজ্ঞান যুদ্ধের অ্যাকাউন্ট তৈরি করো"
              : "তোমার অ্যাকাউন্টে সাইন ইন করো"}
          </p>
        </div>

        {isBackendDown && (
          <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-300">
                  ব্যাকএন্ড সার্ভার সংযুক্ত নেই
                </p>
                <p className="mt-1 text-xs text-amber-400/70">
                  FastAPI সার্ভার (port 8000) চালু নেই। আলাদা টার্মিনালে <code className="rounded bg-slate-800 px-1 py-0.5">pnpm dev:backend</code> চালান।
                </p>
                <button
                  type="button"
                  onClick={retryBackend}
                  disabled={isRetrying}
                  className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/30 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                  {isRetrying ? "সংযোগ চেষ্টা হচ্ছে..." : "আবার চেষ্টা করুন"}
                </button>
              </div>
            </div>
          </div>
        )}

        {displayError && !isBackendDown && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <X className="h-4 w-4 shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                নাম
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="তোমার নাম"
                  className={inputWithIconClass}
                />
              </div>
            </div>
          )}

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
                className={inputWithIconClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">
              পাসওয়ার্ড
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="পাসওয়ার্ড দিন"
                className={inputWithIconClass}
              />
            </div>
          </div>

          {!isRegister && (
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-slate-400 transition-colors hover:text-cyan-400"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="auth-button-primary"
          >
            {loading ? (
              <div className="h-5 w-5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                {isRegister ? "অ্যাকাউন্ট তৈরি করুন" : "লগইন করুন"}
              </>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-xs text-slate-500">অথবা</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-400/30 hover:bg-white/10 disabled:opacity-50"
        >
          <Chrome className="h-4 w-4" />
          গুগল দিয়ে লগইন করুন
        </button>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setLocalError(null);
              setError(null);
            }}
            className="text-sm text-slate-400 transition-colors hover:text-white"
          >
            {isRegister
              ? "ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন"
              : "নতুন অ্যাকাউন্ট? রেজিস্টার করুন"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#07111F]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
