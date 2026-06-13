/**
 * Legacy Next.js proxy — strips answer keys before returning quiz payloads.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_BASE =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

const ANSWER_KEY_FIELDS = new Set([
  "correctOption",
  "answer",
  "explanation",
  "correctOptionText",
  "correctOptionIndex",
]);

function stripAnswerKeys<T extends Record<string, unknown>>(doc: T): T {
  const out = { ...doc };
  ANSWER_KEY_FIELDS.forEach((key) => {
    delete out[key];
  });
  return out;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const live = searchParams.get("live");

  try {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (live) params.set("live", live);

    const url = `${API_BASE}/api/quizzes${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch quizzes" },
        { status: res.status },
      );
    }

    const data = await res.json();
    const sanitized = Array.isArray(data)
      ? data.map((item) => stripAnswerKeys(item))
      : data;
    return NextResponse.json(sanitized);
  } catch (error) {
    console.error("Quizzes API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
