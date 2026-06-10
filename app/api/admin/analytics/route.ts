import { NextResponse } from "next/server";

import { getCityPulseAnalytics, getCityPulseMode } from "@/lib/citypulse-admin";

export async function GET() {
  return NextResponse.json({
    mode: getCityPulseMode(),
    analytics: getCityPulseAnalytics(),
    generatedAt: new Date().toISOString(),
  });
}
