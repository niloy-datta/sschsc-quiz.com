import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'sschsc-quiz',
    checkedAt: new Date().toISOString(),
  });
}
