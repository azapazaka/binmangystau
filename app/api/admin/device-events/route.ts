import { NextRequest, NextResponse } from "next/server";

import { ingestDeviceEvent } from "@/lib/citypulse-admin";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    bin_id: string;
    fill_level?: number;
    temperature?: number;
    waste_type?: "plastic" | "metal" | "mixed";
    status?: "normal" | "warning" | "full" | "fire" | "sos";
    sos?: boolean;
    timestamp?: string;
  };

  if (!payload.bin_id) {
    return NextResponse.json({ error: "bin_id is required" }, { status: 400 });
  }

  return NextResponse.json(ingestDeviceEvent(payload));
}
