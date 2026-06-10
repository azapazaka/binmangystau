import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";

import { PublicTrafficVisual } from "@/components/public-traffic-visual";
import { PublicThemeToggle } from "@/components/public-theme-toggle";
import { APP_NAME } from "@/lib/constants";
import { getDashboardStats } from "@/lib/data-store";
import {
  getPublicRoleContent,
  getPublicRoleLoginHref,
  type PublicRoleKey,
} from "@/lib/public-role-content";

export default async function LandingPage() {
  await connection();
  const stats = await getDashboardStats();
  const roleCards: PublicRoleKey[] = ["citizen", "admin"];

  return (
    <main className="portal-page">
      <div className="portal-shell flex flex-col gap-4">
        <header className="portal-topbar landing-reveal">
          <div className="portal-brand">
            <Link href="/" className="portal-logo" aria-label={APP_NAME}>
              <Image
                src="/graphics/citypulse-logo-mark.png"
                alt=""
                width={28}
                height={34}
                className="h-8 w-7 object-contain"
                priority
              />
            </Link>
            <div>
              <p className="text-[1.4rem] font-extrabold leading-none">{APP_NAME}</p>
              <p className="portal-subtle text-sm">Единый городской портал обращений</p>
            </div>
          </div>

          <nav className="portal-nav">
            <Link href="/" className="portal-nav-link px-4 py-3">
              На главную
            </Link>
            <Link href={getPublicRoleContent("admin").pageHref} className="portal-nav-link px-4 py-3">
              Для админа
            </Link>
            <Link href={getPublicRoleContent("citizen").pageHref} className="portal-nav-link px-4 py-3">
              Для гражданина
            </Link>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <Link href={getPublicRoleLoginHref("citizen")} className="portal-primary-button px-5 py-3">
              Войти
            </Link>
            <PublicThemeToggle />
          </div>
        </header>

        <section className="portal-section grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="flex flex-col justify-center">
            <p className="landing-kicker">CityPulse portal</p>
            <h1 className="portal-display mt-5">
              Городская платформа, в которой всё важное видно сразу.
            </h1>
            <p className="portal-copy mt-6 max-w-[54ch] text-lg">
              Один портал для гражданина и администратора. У каждой роли теперь есть своя отдельная
              входная страница, а кабинеты и рабочие сценарии остаются прежними.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={getPublicRoleContent("citizen").pageHref} className="portal-primary-button px-6 py-3">
                Страница гражданина
              </Link>
              <Link href={getPublicRoleContent("admin").pageHref} className="portal-ghost-button px-6 py-3">
                Страница админа
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6">
              <div>
                <p className="landing-kicker">Всего</p>
                <p className="mt-2 text-3xl font-extrabold">{stats.totalReports}</p>
              </div>
              <div>
                <p className="landing-kicker">В работе</p>
                <p className="mt-2 text-3xl font-extrabold">{stats.inProgress}</p>
              </div>
              <div>
                <p className="landing-kicker">Закрыто</p>
                <p className="mt-2 text-3xl font-extrabold">{stats.resolved}</p>
              </div>
            </div>
          </div>

          <PublicTrafficVisual variant="main" />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {roleCards.map((role) => {
            const content = getPublicRoleContent(role);

            return (
              <article key={role} className="portal-card landing-reveal landing-reveal-delay-1">
                <p className="landing-card-kicker">{content.previewTag}</p>
                <h2 className="mt-4 text-[2.5rem] font-extrabold leading-[0.96]">{content.previewTitle}</h2>
                <p className="portal-copy mt-4 text-base">{content.previewDescription}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {content.features.map((item) => (
                    <span key={item} className="panel-badge rounded-full px-4 py-2 text-xs">
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-8 grid gap-3">
                  {content.overview.slice(0, 2).map((item) => (
                    <div key={item.title} className="panel-muted-card rounded-[1.2rem] p-4">
                      <p className="panel-section-title text-base font-semibold">{item.title}</p>
                      <p className="panel-copy mt-2 text-sm">{item.description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href={content.pageHref} className="portal-primary-button px-6 py-3">
                    Открыть страницу роли
                  </Link>
                  <Link href={getPublicRoleLoginHref(role)} className="portal-ghost-button px-6 py-3">
                    Войти
                  </Link>
                </div>
              </article>
            );
          })}
        </section>

        <section id="about" className="portal-card landing-reveal landing-reveal-delay-2">
          <p className="landing-kicker">Как устроено</p>
          <h2 className="mt-3 text-[2.4rem] font-extrabold leading-[0.96]">Один продукт, две отдельные точки входа</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="panel-muted-card rounded-[1.2rem] p-5">
              <p className="landing-card-kicker">Landing</p>
              <p className="panel-section-title mt-2 text-lg font-semibold">Общий портал</p>
              <p className="panel-copy mt-2 text-sm leading-7">
                Короткое знакомство с продуктом и выбор роли без длинного скролла.
              </p>
            </div>
            <div className="panel-muted-card rounded-[1.2rem] p-5">
              <p className="landing-card-kicker">Citizen</p>
              <p className="panel-section-title mt-2 text-lg font-semibold">Отдельная public-страница</p>
              <p className="panel-copy mt-2 text-sm leading-7">
                Аккуратный вход в сценарии подачи жалоб, историю обращений и профиль.
              </p>
            </div>
            <div className="panel-muted-card rounded-[1.2rem] p-5">
              <p className="landing-card-kicker">Admin</p>
              <p className="panel-section-title mt-2 text-lg font-semibold">Отдельная public-страница</p>
              <p className="panel-copy mt-2 text-sm leading-7">
                Переход в очередь, карту и аналитику без изменения рабочих маршрутов.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
