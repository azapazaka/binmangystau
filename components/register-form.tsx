"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ROLE_META } from "@/lib/constants";
import { getLoginPathForRole } from "@/lib/role-config";
import type { AccountRole } from "@/types";

type RegisterFormProps = {
  role: AccountRole;
};

export function RegisterForm({ role }: RegisterFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    formData.set("role", role);
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { message?: string; redirectTo?: string };

      if (!response.ok) {
        setError(payload.message ?? "Не удалось завершить регистрацию.");
        return;
      }

      if (payload.message) {
        setMessage(payload.message);
      }

      if (payload.redirectTo && role === "citizen") {
        router.push(payload.redirectTo);
        router.refresh();
      }
    } catch {
      setError("Сервис регистрации временно недоступен.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-form-card portal-card">
      <div className="grid gap-3">
        <p className="landing-card-kicker">{ROLE_META[role].label}</p>
        <h1 className="text-4xl leading-none">
          {role === "citizen" ? "Регистрация гражданина" : "Регистрация админа"}
        </h1>
        <p className="portal-copy text-sm">
          {role === "citizen"
            ? "Создайте аккаунт для подачи и отслеживания обращений."
            : "Оставьте заявку на доступ в операторскую рабочую зону."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Имя</span>
          <input
            name="fullName"
            type="text"
            placeholder={role === "citizen" ? "Например, Айдана" : "Например, оператор акимата"}
            className="auth-input"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Электронная почта</span>
          <input
            name="email"
            type="email"
            placeholder={role === "citizen" ? "you@example.com" : "operator@citypulse.local"}
            className="auth-input"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Пароль</span>
          <input
            name="password"
            type="password"
            placeholder={role === "citizen" ? "Минимум 6 символов" : "Рабочий пароль"}
            className="auth-input"
          />
        </label>

        {message ? <div className="auth-success-card">{message}</div> : null}
        {error ? <div className="auth-error-card">{error}</div> : null}

        <button type="submit" disabled={loading} className="auth-submit-button px-6 py-3">
          {loading
            ? "Сохраняем..."
            : role === "citizen"
              ? "Создать аккаунт"
              : "Оставить заявку"}
        </button>
      </form>

      <p className="portal-subtle text-sm">
        Уже есть доступ?{" "}
        <Link href={getLoginPathForRole(role)} className="font-semibold text-current">
          Перейти ко входу
        </Link>
      </p>
    </div>
  );
}
