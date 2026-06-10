import { NextResponse } from "next/server";

import { registerWithRole } from "@/lib/auth";
import { getDefaultAreaPath, getLoginPathForRole } from "@/lib/role-config";
import type { AccountRole } from "@/types";

export async function POST(request: Request) {
  const formData = await request.formData();
  const role = String(formData.get("role") ?? "citizen") as AccountRole;
  const fullName = String(formData.get("fullName") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!fullName.trim() || !email.trim()) {
    return NextResponse.json(
      { message: "Заполните имя и email." },
      { status: 400 },
    );
  }

  if (role === "citizen" && password.trim().length < 6) {
    return NextResponse.json(
      { message: "Пароль должен содержать минимум 6 символов." },
      { status: 400 },
    );
  }

  const result = await registerWithRole({
    role,
    fullName: fullName.trim(),
    email: email.trim(),
    password,
  });

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message ?? "Registration failed." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: result.message,
    redirectTo: result.requiresLogin ? getLoginPathForRole(role) : getDefaultAreaPath(role),
  });
}
