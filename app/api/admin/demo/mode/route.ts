import { NextRequest, NextResponse } from "next/server";

import {
  getCityPulseAnalytics,
  listSmartBins,
  setCityPulseMode,
} from "@/lib/citypulse-admin";
import type { CityPulseMode } from "@/types";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { mode?: CityPulseMode };
  const nextMode = payload.mode === "live" ? "live" : "simulation";

  return NextResponse.json({
    mode: setCityPulseMode(nextMode),
    bins: listSmartBins(),
    analytics: getCityPulseAnalytics(),
  });
}
