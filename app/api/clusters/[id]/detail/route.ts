import { NextResponse } from "next/server";

import { getCurrentAdmin } from "@/lib/auth";
import { getClusterDetailForAdmin } from "@/lib/data-store";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const detail = await getClusterDetailForAdmin(id);

  return NextResponse.json(detail);
}
