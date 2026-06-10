import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentCitizen } from "@/lib/auth";
import { createReport } from "@/lib/data-store";
import { assessReportModeration } from "@/lib/local-moderation";
import type { LocationSource, ReportCategory } from "@/types";

const schema = z.object({
  category: z.enum(["road", "light", "trash", "traffic", "other"]),
  description: z.string().max(500).optional(),
  locationSource: z.enum(["manual", "geolocation", "map"]).default("manual"),
  lat: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : undefined)),
  lng: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : undefined)),
  manualAddress: z.string().optional(),
  addressLabel: z.string().optional(),
  moderationAttempt: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : 1)),
});

function getOptionalFormValue(
  formData: FormData,
  key: string,
): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const photo = formData.get("photo");

  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json(
      { message: "Фото обязательно для отправки заявки." },
      { status: 400 },
    );
  }

  const parsed = schema.safeParse({
    category: getOptionalFormValue(formData, "category"),
    description: getOptionalFormValue(formData, "description"),
    locationSource: getOptionalFormValue(formData, "locationSource"),
    lat: getOptionalFormValue(formData, "lat"),
    lng: getOptionalFormValue(formData, "lng"),
    manualAddress: getOptionalFormValue(formData, "manualAddress"),
    addressLabel: getOptionalFormValue(formData, "addressLabel"),
    moderationAttempt: getOptionalFormValue(formData, "moderationAttempt"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Проверьте заполнение формы." },
      { status: 400 },
    );
  }

  const {
    category,
    description,
    locationSource,
    lat,
    lng,
    manualAddress,
    addressLabel,
    moderationAttempt,
  } = parsed.data;
  const citizen = await getCurrentCitizen();
  const usesCoordinates = locationSource === "geolocation" || locationSource === "map";

  if (usesCoordinates && (!lat || !lng)) {
    return NextResponse.json(
      { message: "Укажите точку на карте или определите местоположение." },
      { status: 400 },
    );
  }

  if (locationSource === "manual" && !manualAddress?.trim()) {
    return NextResponse.json(
      { message: "Укажите адрес вручную." },
      { status: 400 },
    );
  }

  const moderation = assessReportModeration({
    category: category as ReportCategory,
    description: description ?? "",
    moderationAttemptCount: moderationAttempt ?? 1,
  });

  if (moderation.decision !== "accepted") {
    return NextResponse.json(
      {
        message: moderation.message,
        reasons: moderation.reasons,
        suggestedCategory: moderation.suggestedCategory,
        decision: moderation.decision,
        moderationAttemptCount: moderation.moderationAttemptCount,
      },
      { status: moderation.decision === "rejected" ? 403 : 422 },
    );
  }

  const report = await createReport({
    category: category as ReportCategory,
    description,
    photo,
    lat,
    lng,
    manualAddress: locationSource === "manual" ? manualAddress : undefined,
    addressLabel: usesCoordinates ? addressLabel : undefined,
    locationSource: locationSource as LocationSource,
    submittedBy: citizen?.email ?? null,
  });

  return NextResponse.json({ report }, { status: 201 });
}
