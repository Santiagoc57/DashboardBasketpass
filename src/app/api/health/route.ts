import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: isSupabaseConfigured,
    timestamp: new Date().toISOString(),
  });
}
