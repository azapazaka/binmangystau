"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { DEMO_ACCOUNTS, ROLE_META } from "@/lib/constants";
import { getDefaultAreaPath, getRegisterPathForRole } from "@/lib/role-config";
import type { AccountRole } from "@/types";

type LoginFormProps = {
  role: AccountRole;
};

export function LoginForm({ role }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demo = DEMO_ACCOUNTS[role];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    formData.set("role", role);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { message?: string; redirectTo?: string };

      if (!response.ok) {
        setError(payload.message ?? "Не удалось выполнить вход.");
        return;
      }

      router.push(payload.redirectTo ?? getDefaultAreaPath(role));
      router.refresh();
    } catch {
      setError("Сервис авторизации временно недоступен.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-form-card portal-card">
      <div className="grid gap-3">
        <p className="landing-card-kicker">{ROLE_META[role].label}</p>
        <h1 className="text-4xl leading-none">
          {role === "citizen" ? "Вход для гражданина" : "Вход для админа"}
        </h1>
        <p className="portal-copy text-sm">
          {role === "citizen"
            ? "Откройте личный кабинет, заявки и историю обращений."
            : "Откройте рабочую зону с очередью, картой и аналитикой."}
        </p>
      </div>

      <div className="auth-demo-card">
        <p className="landing-card-kicker">Demo доступ</p>
        <p className="mt-2 text-sm font-semibold">{demo.email}</p>
        <p className="portal-subtle mt-1 text-sm">{demo.password}</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Электронная почта</span>
          <input name="email" type="email" defaultValue={demo.email} className="auth-input" />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Пароль</span>
          <input name="password" type="password" defaultValue={demo.password} className="auth-input" />
        </label>

        {error ? <div className="auth-error-card">{error}</div> : null}

        <button type="submit" disabled={loading} className="auth-submit-button px-6 py-3">
          {loading ? "Выполняем вход..." : "Войти"}
        </button>
      </form>

      <p className="portal-subtle text-sm">
        Нет аккаунта?{" "}
        <Link href={getRegisterPathForRole(role)} className="font-semibold text-current">
          Перейти к регистрации
        </Link>
      </p>
    </div>
  );
}
