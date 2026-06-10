import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentCitizen } from "@/lib/auth";
import { upsertHumanVoteForReport } from "@/lib/data-store";

const schema = z.object({
  verdict: z.enum(["real", "fake"]),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const citizen = await getCurrentCitizen();

  if (!citizen) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректный голос жителя." }, { status: 400 });
  }

  const { id } = await params;
  const report = await upsertHumanVoteForReport(id, citizen.id, parsed.data.verdict);

  if (!report) {
    return NextResponse.json({ message: "Report not found." }, { status: 404 });
  }

  return NextResponse.json({ report });
}
