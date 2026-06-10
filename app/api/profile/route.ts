import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentSession } from "@/lib/auth";
import { getCurrentUserProfile, saveCurrentUserProfile } from "@/lib/profile-store";

const citizenProfileSchema = z.object({
  displayName: z.string().max(48),
  district: z.string().max(64),
  bio: z.string().max(280),
  avatarUrl: z.string().nullable(),
});

const adminProfileSchema = citizenProfileSchema.extend({
  position: z.string().max(56),
  department: z.string().max(64),
  categories: z.array(z.enum(["road", "light", "trash", "traffic", "other"])),
});

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const profile = await getCurrentUserProfile(session);

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed =
    session.role === "admin"
      ? adminProfileSchema.safeParse(payload)
      : citizenProfileSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid profile payload." }, { status: 400 });
  }

  const profile = await saveCurrentUserProfile(session, parsed.data);

  return NextResponse.json({ profile });
}
