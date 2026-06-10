import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAdmin } from "@/lib/auth";
import { reviewReportByAdmin } from "@/lib/data-store";

const schema = z
  .object({
    verdict: z.enum(["confirmed", "corrected", "invalidated"]),
    correctedCategory: z.enum(["road", "light", "trash", "traffic", "other"]).nullable().optional(),
    correctedVisualSeverity: z.enum(["low", "medium", "high"]).nullable().optional(),
    note: z.string().max(500).optional(),
  })
  .superRefine((value, context) => {
    if (
      value.verdict === "corrected" &&
      !value.correctedCategory &&
      !value.correctedVisualSeverity
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Нужно указать хотя бы одно исправление.",
        path: ["verdict"],
      });
    }
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
      { message: "Проверьте данные проверки модератора." },
      { status: 400 },
    );
  }

  const { id } = await params;
  const reviewed = await reviewReportByAdmin(id, {
    ...parsed.data,
    reviewedBy: admin.id,
  });

  if (!reviewed) {
    return NextResponse.json({ message: "Report not found." }, { status: 404 });
  }

  return NextResponse.json(reviewed);
}
