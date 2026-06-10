import { NextResponse } from "next/server";

import { getCurrentSession, signOutCurrentUser } from "@/lib/auth";
import { getLoginPathForRole } from "@/lib/role-config";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  const formData = await request.formData().catch(() => null);
  const redirectTo =
    String(formData?.get("redirectTo") ?? "") ||
    (session ? getLoginPathForRole(session.role) : "/");

  await signOutCurrentUser();

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
