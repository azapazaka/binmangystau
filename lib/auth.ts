import { cookies } from "next/headers";

import { DEMO_ADMIN } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AccountRole } from "@/types";

const ROLE_HINT_COOKIE = "citypulse-role-hint";

export type SessionUser = {
  id: string;
  role: AccountRole;
  email: string;
  fullName: string;
  isDemo: boolean;
};

type AuthResult = {
  ok: boolean;
  message?: string;
  requiresLogin?: boolean;
};

type RegisterInput = {
  role: AccountRole;
  email: string;
  password: string;
  fullName: string;
};

function isAccountRole(value: unknown): value is AccountRole {
  return value === "citizen" || value === "admin";
}

async function writeRoleHint(role: AccountRole) {
  const cookieStore = await cookies();

  cookieStore.set(ROLE_HINT_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ROLE_HINT_COOKIE);
}

export async function signInWithRole(
  role: AccountRole,
  email: string,
  password: string,
): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const metadataRole = user?.user_metadata.role;

  if (user && isAccountRole(metadataRole) && metadataRole !== role) {
    await supabase.auth.signOut();

    return {
      ok: false,
      message:
        role === "admin"
          ? "Этот аккаунт не имеет доступа к панели администратора."
          : "Этот аккаунт не относится к роли гражданина.",
    };
  }

  await writeRoleHint(role);
  return { ok: true };
}

export async function registerWithRole(input: RegisterInput): Promise<AuthResult> {
  if (input.role === "admin") {
    return {
      ok: true,
      requiresLogin: true,
      message:
        "Регистрация администратора пока отключена в приложении. Используйте заранее подготовленный аккаунт.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        role: input.role,
        full_name: input.fullName,
      },
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  const loginResult = await signInWithRole(input.role, input.email, input.password);

  if (!loginResult.ok) {
    return {
      ok: true,
      requiresLogin: true,
      message:
        "Аккаунт создан. Если Supabase требует подтверждение email, завершите вход после подтверждения.",
    };
  }

  return { ok: true };
}

export async function signOutCurrentUser() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  await clearAuthCookies();
}

export async function getCurrentSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const roleHint = cookieStore.get(ROLE_HINT_COOKIE)?.value;
  const supabase = await createSupabaseServerClient();
  const result = await supabase.auth.getUser();
  const user = result.data.user;

  if (!user) {
    return null;
  }

  const metadataRole = user.user_metadata.role;
  const role = isAccountRole(metadataRole)
    ? metadataRole
    : isAccountRole(roleHint)
      ? roleHint
      : "citizen";

  return {
    id: user.id,
    role,
    email: user.email ?? `user@${role}.local`,
    fullName:
      (user.user_metadata.full_name as string | undefined)?.trim() ||
      user.email ||
      "CityPulse user",
    isDemo: false,
  };
}

export async function getCurrentUserForRole(role: AccountRole) {
  if (!isSupabaseConfigured()) {
    return {
      id: `${role}-demo`,
      role,
      email: role === "admin" ? DEMO_ADMIN.email : "citizen@citypulse.local",
      fullName: role === "admin" ? DEMO_ADMIN.fullName : "Demo citizen",
      isDemo: true,
    };
  }

  const session = await getCurrentSession();

  if (!session || session.role !== role) {
    return null;
  }

  return session;
}

export async function getCurrentCitizen() {
  return getCurrentUserForRole("citizen");
}

export async function getCurrentAdmin() {
  return getCurrentUserForRole("admin");
}

export async function signInAdmin(email: string, password: string) {
  return signInWithRole("admin", email, password);
}

export async function signOutAdmin() {
  return signOutCurrentUser();
}
