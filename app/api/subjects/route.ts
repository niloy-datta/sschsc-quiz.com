/** Legacy Next.js proxy — prefer src/lib/api.ts */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_BASE =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/api/subjects`, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch subjects" },
        { status: res.status },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Subjects API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
