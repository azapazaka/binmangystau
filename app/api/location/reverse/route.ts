import { NextResponse } from "next/server";
import { z } from "zod";

import { reverseGeocode } from "@/lib/geocoding";

const schema = z.object({
  lat: z.coerce.number().finite(),
  lng: z.coerce.number().finite(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = schema.safeParse({
    lat: searchParams.get("lat"),
    lng: searchParams.get("lng"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Некорректные координаты." },
      { status: 400 },
    );
  }

  const location = await reverseGeocode(parsed.data.lat, parsed.data.lng);

  return NextResponse.json({ location });
}
