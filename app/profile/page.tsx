"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProfileCompletionPrompt } from "@/components/profile/ProfileCompletionPrompt";
import {
  CLASS_OPTIONS,
  SUBJECT_OPTIONS,
  examYearOptions,
  subjectLabel,
} from "@/lib/profile-options";
import {
  isProfileComplete,
  normalizeLevel,
  levelLabel,
  type StudentLevel,
} from "@/lib/profile-utils";
import { BADGE_LABELS } from "@/lib/leaderboard-api";
import { Loader2, LogOut, User } from "lucide-react";

export default function ProfilePage() {
  const { user, loading, syncProfile, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  const [form, setForm] = useState({
    name: "",
    className: "",
    examYear: "",
    favoriteSubject: "",
    weakSubjects: "",
    picture: "",
    collegeName: "",
  });

  const selectedLevel = useMemo(
    () => normalizeLevel(form.className),
    [form.className],
  );

  const yearOptions = useMemo(
    () => examYearOptions(selectedLevel),
    [selectedLevel],
  );

  useEffect(() => {
    if (user) {
      const level = normalizeLevel(user.className, user.level);
      const year = user.examYear ?? user.targetExamYear;
      setForm({
        name: user.name || "",
        className: level === "ssc" ? "SSC" : level === "hsc" ? "HSC" : user.className || "",
        examYear: year ? String(year) : "",
        favoriteSubject: user.favoriteSubject || "",
        weakSubjects: user.weakSubjects || "",
        picture: user.picture || "",
        collegeName: user.collegeName || user.schoolName || "",
      });
    }
  }, [user]);

  const handleClassChange = (className: string) => {
    const level = normalizeLevel(className);
    const years = examYearOptions(level);
    const currentYear = form.examYear;
    const stillValid = years.some((y) => y.value === currentYear);
    setForm({
      ...form,
      className,
      examYear: stillValid ? currentYear : "",
    });
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSave = async () => {
    if (!form.className) {
      setMessage({ type: "err", text: "শ্রেণি (SSC/HSC) নির্বাচন করুন।" });
      return;
    }
    if (!form.examYear) {
      setMessage({ type: "err", text: "পরীক্ষার বছর নির্বাচন করুন।" });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await syncProfile({
        name: form.name,
        className: form.className,
        examYear: parseInt(form.examYear, 10),
        favoriteSubject: form.favoriteSubject || undefined,
        weakSubjects: form.weakSubjects || undefined,
        picture: form.picture || undefined,
        collegeName: form.collegeName || undefined,
        schoolName: form.collegeName || undefined,
      });
      setMessage({ type: "ok", text: "প্রোফাইল আপডেট হয়েছে।" });
    } catch {
      setMessage({
        type: "err",
        text: "প্রোফাইল আপডেট করা যায়নি। আবার চেষ্টা করুন।",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07111F]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07111F] px-4 pb-24">
        <Card variant="glass" className="max-w-md w-full p-8 text-center font-bangla">
          <User className="h-14 w-14 mx-auto text-purple-400 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            প্রোফাইল দেখতে আগে লগইন করুন।
          </h1>
          <Link href="/login">
            <Button className="mt-6 w-full min-h-[44px]">লগইন করুন</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const profileComplete = isProfileComplete(user);
  const displayLevel = normalizeLevel(user.className, user.level);
  const badgeLabel = user.badge ? BADGE_LABELS[user.badge] : null;

  return (
    <div className="min-h-screen bg-[#07111F] py-8 pb-24 font-bangla">
      <div className="max-w-lg mx-auto px-4 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-black text-white">প্রোফাইল</h1>
          <p className="text-slate-400 text-sm mt-1">বিজ্ঞান বিভাগ • গোপনীয় ও সহজ</p>
        </div>

        {!profileComplete && <ProfileCompletionPrompt variant="hint" />}

        <Card variant="glass" className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            {form.picture ? (
              <img
                src={form.picture}
                alt=""
                className="h-16 w-16 rounded-2xl object-cover border border-white/10"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-purple-500/20 flex items-center justify-center text-2xl">
                👤
              </div>
            )}
            <div>
              <p className="font-bold text-white text-lg">{user.name}</p>
              <p className="text-xs text-slate-400">
                গ্রুপ: বিজ্ঞান • {levelLabel(displayLevel)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <p className="text-[10px] text-slate-500">র‍্যাঙ্ক</p>
              <p className="text-lg font-bold text-white">
                {profileComplete && user.rank ? `#${user.rank}` : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <p className="text-[10px] text-slate-500">স্কোর</p>
              <p className="text-lg font-bold text-cyan-400">{user.score ?? 0}</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <p className="text-[10px] text-slate-500">ব্যাজ</p>
              <p className="text-xs font-bold text-yellow-300 truncate">
                {badgeLabel || "—"}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="glass" className="p-6 space-y-4">
          <label className="block">
            <span className="text-sm text-slate-400 mb-1 block">নাম</span>
            <input
              className="auth-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-400 mb-1 block">
              শ্রেণি <span className="text-red-400">*</span>
            </span>
            <select
              className="auth-input"
              value={form.className}
              onChange={(e) => handleClassChange(e.target.value)}
              required
            >
              <option value="">SSC বা HSC নির্বাচন করো</option>
              {CLASS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            গ্রুপ: <span className="font-semibold text-white">বিজ্ঞান (Science)</span>
          </div>

          <label className="block">
            <span className="text-sm text-slate-400 mb-1 block">
              পরীক্ষার বছর <span className="text-red-400">*</span>
            </span>
            <select
              className="auth-input"
              value={form.examYear}
              onChange={(e) => setForm({ ...form, examYear: e.target.value })}
              disabled={!selectedLevel}
              required
            >
              <option value="">
                {selectedLevel ? "বছর নির্বাচন করো" : "প্রথমে শ্রেণি নির্বাচন করো"}
              </option>
              {yearOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-slate-400 mb-1 block">কলেজ/স্কুলের নাম (ঐচ্ছিক)</span>
            <input
              className="auth-input"
              value={form.collegeName}
              onChange={(e) => setForm({ ...form, collegeName: e.target.value })}
              placeholder="যেমন: ঢাকা কলেজ, মতিঝিল মডেল স্কুল..."
            />
            <p className="mt-1 text-[10px] text-slate-500">
              কলেজের নাম যোগ করলে College Wars লিডারবোর্ডে অংশ নিতে পারবে
            </p>
          </label>

          <label className="block">
            <span className="text-sm text-slate-400 mb-1 block">প্রিয় বিষয় (ঐচ্ছিক)</span>
            <select
              className="auth-input"
              value={form.favoriteSubject}
              onChange={(e) => setForm({ ...form, favoriteSubject: e.target.value })}
            >
              <option value="">নির্বাচন করো</option>
              {SUBJECT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-slate-400 mb-1 block">দুর্বল বিষয় (ঐচ্ছিক)</span>
            <select
              className="auth-input"
              value={form.weakSubjects}
              onChange={(e) => setForm({ ...form, weakSubjects: e.target.value })}
            >
              <option value="">নির্বাচন করো</option>
              {SUBJECT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-slate-400 mb-1 block">অ্যাভাটার URL (ঐচ্ছিক)</span>
            <input
              className="auth-input text-sm"
              value={form.picture}
              onChange={(e) => setForm({ ...form, picture: e.target.value })}
              placeholder="https://..."
            />
          </label>

          {form.favoriteSubject && (
            <p className="text-xs text-slate-500">
              প্রিয়: {subjectLabel(form.favoriteSubject)}
            </p>
          )}

          {message && (
            <p
              className={
                message.type === "ok" ? "text-green-400 text-sm" : "text-red-400 text-sm"
              }
            >
              {message.text}
            </p>
          )}

          <Button
            fullWidth
            className="min-h-[44px]"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
          </Button>
        </Card>

        <div className="text-center space-y-3">
          <Link href="/dashboard" className="text-cyan-400 text-sm hover:underline">
            ড্যাশবোর্ড দেখো →
          </Link>
          <div>
            <Button
              variant="ghost"
              fullWidth
              className="min-h-[44px] text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {loggingOut ? "লগআউট হচ্ছে..." : "লগআউট"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
