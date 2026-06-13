/** Legacy route disabled — questions load from /public/questions/*.json only. */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      error:
        "This endpoint has been disabled. Questions are served from static JSON only.",
    },
    { status: 403 },
  );
}
