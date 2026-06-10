import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAdmin } from "@/lib/auth";
import { updateClusterStatus } from "@/lib/data-store";

const schema = z.object({
  status: z.enum(["open", "in_progress", "closed"]),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Некорректный статус." },
      { status: 400 },
    );
  }

  const { id } = await params;
  const cluster = await updateClusterStatus(id, parsed.data.status, admin.id);

  if (!cluster) {
    return NextResponse.json({ message: "Cluster not found." }, { status: 404 });
  }

  return NextResponse.json({ cluster });
}
