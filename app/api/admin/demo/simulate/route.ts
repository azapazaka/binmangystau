import { NextRequest, NextResponse } from "next/server";

import { applyCityPulseDemoAction } from "@/lib/citypulse-admin";
import type { CityPulseDemoAction } from "@/types";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    action?: CityPulseDemoAction;
    binId?: string;
  };

  return NextResponse.json(
    applyCityPulseDemoAction(payload.action ?? "fill_up", payload.binId),
  );
}
