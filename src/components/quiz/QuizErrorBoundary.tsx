"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class QuizErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[QuizErrorBoundary] Caught error:", error, errorInfo);
  }

  handleReset = () => {
    // Reset local error state
    this.setState({ hasError: false, error: null });
    // Force full page reload to reset Zustand store and all quiz state
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6 font-bangla">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">
                কুইজ লোড করতে সমস্যা হয়েছে
            </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন
                বা পরে আবার চেষ্টা করুন।
              </p>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-300">
                    Technical details
                  </summary>
                  <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-red-300">
                    {this.state.error.message}
                    {"\n"}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500"
              >
                <RotateCcw className="h-4 w-4" />
                আবার চেষ্টা করুন
              </Button>
              <Link href="/">
                <Button variant="secondary" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  হোম পেজ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
