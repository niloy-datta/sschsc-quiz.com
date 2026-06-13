"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { FormattedQuizText } from "@/lib/format-quiz-text";
import {
  Brain,
  Users,
  BookOpen,
  BarChart3,
  LogOut,
  Plus,
  Trash2,
  Trophy,
  AlertTriangle,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalQuizzes: number;
  totalExams: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  highScore: number;
  examsTaken: number;
}

interface AdminQuiz {
  id: string;
  questionText: string;
  subject: string;
  category: string;
  is_live: boolean;
  correctOption: string;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "quizzes" | "users">(
    "dashboard",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New quiz form state
  const [newQuiz, setNewQuiz] = useState({
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: "A",
    subject: "physics",
    category: "HSC",
    is_live: false,
    explanation: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchUsers();
      fetchQuizzes();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const data = await api.get<{ user?: { role?: string } }>("/api/auth/me");
      if (data.user?.role === "ADMIN") {
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/admin/login", { password });
      setIsAuthenticated(true);
      setPassword("");
    } catch {
      setError("ভুল পাসওয়ার্ড");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/api/admin/logout");
    } catch (err) {
      console.error("Admin logout failed:", err);
    }
    setIsAuthenticated(false);
  };

  const fetchStats = async () => {
    try {
      setStats(await api.get<AdminStats>("/api/admin/dashboard-stats"));
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsers(await api.get<AdminUser[]>("/api/admin/users"));
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchQuizzes = async () => {
    try {
      setQuizzes(await api.get<AdminQuiz[]>("/api/admin/quizzes"));
    } catch (err) {
      console.error("Failed to fetch quizzes:", err);
    }
  };

  const handleAddQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/admin/add-quiz", newQuiz);
        setNewQuiz({
          questionText: "",
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
          correctOption: "A",
          subject: "physics",
          category: "HSC",
          is_live: false,
          explanation: "",
        });
        fetchQuizzes();
    } catch {
      setError("কুইজ যোগ করতে ব্যর্থ");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("এই কুইজ মুছে ফেলবেন?")) return;
    try {
      await api.delete(`/api/admin/delete-quiz/${quizId}`);
      fetchQuizzes();
    } catch (err) {
      console.error("Failed to delete quiz:", err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center font-bangla">
        <Card variant="glass" className="max-w-md w-full p-8">
          <div className="text-center mb-6">
            <Brain className="h-12 w-12 mx-auto text-purple-glow mb-3" />
            <h1 className="text-2xl font-bold text-white">অ্যাডমিন লগইন</h1>
            <p className="text-slate-400 text-sm mt-1">
              শুধুমাত্র অ্যাডমিনদের জন্য
            </p>
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-error-red/10 border border-error-red/20 text-error-red text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="অ্যাডমিন পাসওয়ার্ড"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm mb-4 focus:outline-none focus:border-purple-glow/50"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <Button
            variant="primary"
            className="w-full"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "লগইন হচ্ছে..." : "লগইন"}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-dark font-bangla">
      <div className="border-b border-slate-800 bg-navy-dark/90 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-glow" />
            <span className="text-white font-bold">অ্যাডমিন প্যানেল</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {(["dashboard", "quizzes", "users"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === tab
                      ? "bg-purple-glow/20 text-purple-glow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab === "dashboard"
                    ? "ড্যাশবোর্ড"
                    : tab === "quizzes"
                      ? "কুইজ"
                      : "ব্যবহারকারী"}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {activeTab === "dashboard" && (
          <>
            <h2 className="text-xl font-bold text-white mb-6">
              ড্যাশবোর্ড ওভারভিউ
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Card variant="glass" className="p-5">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-purple-glow" />
                  <div>
                    <p className="text-xs text-slate-500">মোট ব্যবহারকারী</p>
                    <p className="text-2xl font-black text-white">
                      {stats?.totalUsers || 0}
                    </p>
                  </div>
                </div>
              </Card>
              <Card variant="glass" className="p-5">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-cyan-400" />
                  <div>
                    <p className="text-xs text-slate-500">মোট কুইজ</p>
                    <p className="text-2xl font-black text-white">
                      {stats?.totalQuizzes || 0}
                    </p>
                  </div>
                </div>
              </Card>
              <Card variant="glass" className="p-5">
                <div className="flex items-center gap-3">
                  <Trophy className="h-8 w-8 text-amber-400" />
                  <div>
                    <p className="text-xs text-slate-500">মোট পরীক্ষা</p>
                    <p className="text-2xl font-black text-white">
                      {stats?.totalExams || 0}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        {activeTab === "quizzes" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">কুইজ ব্যবস্থাপনা</h2>
            </div>

            <Card variant="glass" className="p-6 mb-8">
              <h3 className="text-lg font-bold text-white mb-4">
                নতুন কুইজ যোগ করুন
              </h3>
              <div className="space-y-4">
                <textarea
                  value={newQuiz.questionText}
                  onChange={(e) =>
                    setNewQuiz({ ...newQuiz, questionText: e.target.value })
                  }
                  placeholder="প্রশ্ন লিখুন"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-glow/50 h-24"
                />
                <div className="grid grid-cols-2 gap-4">
                  {(["A", "B", "C", "D"] as const).map((opt) => (
                    <input
                      key={opt}
                      value={
                        newQuiz[
                          `option${opt}` as keyof typeof newQuiz
                        ] as string
                      }
                      onChange={(e) =>
                        setNewQuiz({
                          ...newQuiz,
                          [`option${opt}`]: e.target.value,
                        })
                      }
                      placeholder={`অপশন ${opt}`}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-glow/50"
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <select
                    value={newQuiz.correctOption}
                    onChange={(e) =>
                      setNewQuiz({ ...newQuiz, correctOption: e.target.value })
                    }
                    className="px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm"
                  >
                    <option value="A">সঠিক: A</option>
                    <option value="B">সঠিক: B</option>
                    <option value="C">সঠিক: C</option>
                    <option value="D">সঠিক: D</option>
                  </select>
                  <select
                    value={newQuiz.subject}
                    onChange={(e) =>
                      setNewQuiz({ ...newQuiz, subject: e.target.value })
                    }
                    className="px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm"
                  >
                    <option value="physics">পদার্থবিজ্ঞান</option>
                    <option value="chemistry">রসায়ন</option>
                    <option value="biology">জীববিজ্ঞান</option>
                    <option value="higher-math">উচ্চতর গণিত</option>
                  </select>
                  <select
                    value={newQuiz.category}
                    onChange={(e) =>
                      setNewQuiz({ ...newQuiz, category: e.target.value })
                    }
                    className="px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm"
                  >
                    <option value="HSC">HSC</option>
                    <option value="SSC">SSC</option>
                  </select>
                </div>
                <textarea
                  value={newQuiz.explanation}
                  onChange={(e) =>
                    setNewQuiz({ ...newQuiz, explanation: e.target.value })
                  }
                  placeholder="ব্যাখ্যা (ঐচ্ছিক)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-glow/50 h-20"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isLive"
                    checked={newQuiz.is_live}
                    onChange={(e) =>
                      setNewQuiz({ ...newQuiz, is_live: e.target.checked })
                    }
                    className="rounded"
                  />
                  <label htmlFor="isLive" className="text-sm text-slate-400">
                    লাইভ কুইজ
                  </label>
                </div>
                <Button
                  variant="primary"
                  onClick={handleAddQuiz}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-1" /> কুইজ যোগ করুন
                </Button>
              </div>
            </Card>

            <Card variant="glass" className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                সকল কুইজ ({quizzes.length})
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-start justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-900/60"
                  >
                    <div className="flex-1 mr-4">
                      <div className="text-sm text-white mb-1">
                        <FormattedQuizText
                          text={quiz.questionText}
                          inline
                          hideWorkedSolution={false}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="default" className="text-[10px]">
                          {quiz.subject}
                        </Badge>
                        <Badge variant="default" className="text-[10px]">
                          {quiz.category}
                        </Badge>
                        {quiz.is_live && (
                          <Badge variant="success" className="text-[10px]">
                            লাইভ
                          </Badge>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="text-error-red hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {activeTab === "users" && (
          <>
            <h2 className="text-xl font-bold text-white mb-6">
              ব্যবহারকারী তালিকা
            </h2>
            <Card variant="glass" className="p-6">
              <div className="space-y-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-900/60"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {u.name}
                      </p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex gap-2">
                        <Badge variant="default" className="text-[10px]">
                          {u.role}
                        </Badge>
                        <Badge variant="default" className="text-[10px]">
                          {u.examsTaken} পরীক্ষা
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        সর্বোচ্চ: {u.highScore}
                      </p>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-center text-slate-500 py-8">
                    কোনো ব্যবহারকারী নেই
                  </p>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
