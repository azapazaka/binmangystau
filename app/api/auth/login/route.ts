import { NextResponse } from "next/server";

import { signInWithRole } from "@/lib/auth";
import { getDefaultAreaPath } from "@/lib/role-config";
import type { AccountRole } from "@/types";

export async function POST(request: Request) {
  const formData = await request.formData();
  const role = String(formData.get("role") ?? "citizen") as AccountRole;
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const result = await signInWithRole(role, email, password);

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message ?? "Login failed." },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true, redirectTo: getDefaultAreaPath(role) });
}
