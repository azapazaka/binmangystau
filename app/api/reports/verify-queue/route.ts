import { NextResponse } from "next/server";

import { getCurrentCitizen } from "@/lib/auth";
import { listCitizenVerificationQueue } from "@/lib/data-store";

export async function GET(request: Request) {
  const citizen = await getCurrentCitizen();

  if (!citizen) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get("limit") ?? "8");
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 20) : 8;
  const includeReviewed =
    citizen.isDemo &&
    ["1", "true", "yes", "on"].includes((searchParams.get("includeReviewed") ?? "").toLowerCase());
  const reports = await listCitizenVerificationQueue(citizen.id, { limit, includeReviewed });

  return NextResponse.json({ reports });
}
