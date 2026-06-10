import { NextResponse } from "next/server";

import { listClusters } from "@/lib/data-store";
import type { ReportCategory } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get("category") as ReportCategory | "all" | null) ?? "all";
  const period =
    (searchParams.get("period") as "week" | "month" | "all" | null) ?? "all";

  const clusters = await listClusters({ category, period });

  return NextResponse.json({ clusters });
}
