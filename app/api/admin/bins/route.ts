import { NextResponse } from "next/server";

import { getCityPulseMode, listSmartBins } from "@/lib/citypulse-admin";

export async function GET() {
  return NextResponse.json({
    mode: getCityPulseMode(),
    bins: listSmartBins(),
    generatedAt: new Date().toISOString(),
  });
}
