import Link from "next/link";

import { PublicThemeToggle } from "@/components/public-theme-toggle";
import { APP_NAME } from "@/lib/constants";
import { getPublicRoleContent } from "@/lib/public-role-content";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="portal-page">
      <div className="portal-shell flex flex-col gap-4">
        <header className="portal-topbar">
          <div className="portal-brand">
            <Link href="/" className="portal-logo" aria-label={APP_NAME}>
              <span className="portal-logo-mark">C</span>
            </Link>
            <div>
              <p className="text-[1.4rem] font-extrabold leading-none">{APP_NAME}</p>
              <p className="portal-subtle text-sm">Вход в роли гражданина или админа</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="portal-ghost-button px-5 py-3">
              На главную
            </Link>
            <Link href={getPublicRoleContent("admin").pageHref} className="portal-ghost-button px-5 py-3">
              Админ
            </Link>
            <Link href={getPublicRoleContent("citizen").pageHref} className="portal-ghost-button px-5 py-3">
              Гражданин
            </Link>
            <PublicThemeToggle />
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.74fr)]">
          <div className="portal-section">
            <p className="landing-kicker">Access portal</p>
            <h1 className="auth-display mt-5">
              Один спокойный вход в нужную рабочую роль.
            </h1>
            <p className="portal-copy mt-6 max-w-[54ch] text-lg">
              Житель быстро попадает к подаче и истории обращений. Админ сразу открывает рабочую среду
              с очередью, картой и аналитикой.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <article className="auth-story-card">
                <p className="landing-card-kicker">Citizen</p>
                <h2 className="mt-3 text-2xl font-extrabold">Роль гражданина</h2>
                <p className="portal-copy mt-3 text-sm">
                  Подача жалоб, история, профиль и рейтинг.
                </p>
              </article>

              <article className="auth-story-card">
                <p className="landing-card-kicker">Admin</p>
                <h2 className="mt-3 text-2xl font-extrabold">Роль админа</h2>
                <p className="portal-copy mt-3 text-sm">
                  Очередь, карта, аналитика и рабочие статусы.
                </p>
              </article>
            </div>
          </div>

          <section className="auth-panel">{children}</section>
        </section>
      </div>
    </main>
  );
}
