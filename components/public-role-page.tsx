import Image from "next/image";
import Link from "next/link";

import { PublicTrafficVisual } from "@/components/public-traffic-visual";
import { PublicThemeToggle } from "@/components/public-theme-toggle";
import { APP_NAME } from "@/lib/constants";
import {
  getPublicRoleContent,
  getPublicRoleLoginHref,
  getPublicRoleRegisterHref,
  type PublicRoleKey,
} from "@/lib/public-role-content";

type PublicRolePageProps = {
  role: PublicRoleKey;
};

export function PublicRolePage({ role }: PublicRolePageProps) {
  const content = getPublicRoleContent(role);

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
            <Link href={getPublicRoleLoginHref(role)} className="portal-primary-button px-5 py-3">
              Войти
            </Link>
            <PublicThemeToggle />
          </div>
        </header>

        <section className="portal-section grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="flex flex-col justify-center">
            <p className="landing-kicker">{content.navLabel}</p>
            <h1 className="portal-display mt-5">{content.heroTitle}</h1>
            <p className="portal-copy mt-6 max-w-[56ch] text-lg">{content.heroDescription}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={getPublicRoleRegisterHref(role)} className="portal-primary-button px-6 py-3">
                {content.heroCtaLabel}
              </Link>
              <Link href={getPublicRoleLoginHref(role)} className="portal-ghost-button px-6 py-3">
                {content.heroSecondaryLabel}
              </Link>
            </div>

            <div className="portal-soft-surface mt-10 rounded-[2rem] p-5">
              <p className="landing-card-kicker">{content.previewTag}</p>
              <p className="mt-3 text-2xl font-extrabold leading-tight">{content.previewTitle}</p>
              <p className="portal-copy mt-3 text-base">{content.previewDescription}</p>
            </div>
          </div>

          <PublicTrafficVisual variant="main" />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="portal-card">
            <p className="landing-kicker">{content.previewListTitle}</p>
            <h2 className="mt-3 text-[2.2rem] font-extrabold leading-[0.98]">{content.summaryTitle}</h2>
            <p className="portal-copy mt-4 text-base">{content.summaryDescription}</p>
            <div className="mt-6 grid gap-3">
              {content.overview.map((item) => (
                <div key={item.title} className="panel-muted-card rounded-[1.2rem] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="panel-section-title text-lg font-semibold">{item.title}</p>
                      <p className="panel-copy mt-2 text-sm leading-7">{item.description}</p>
                    </div>
                    <span className="panel-badge rounded-full px-3 py-1 text-xs">Готово</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="portal-card">
            <p className="landing-kicker">Роль в фокусе</p>
            <h2 className="mt-3 text-[2.2rem] font-extrabold leading-[0.98]">{content.roleLabel}</h2>
            <p className="portal-copy mt-4 text-base">{content.capabilitiesDescription}</p>
            <div className="portal-soft-surface mt-6 rounded-[1.4rem] p-5">
              <p className="landing-card-kicker">{content.previewTag}</p>
              <p className="mt-3 text-xl font-extrabold leading-tight">{content.summaryTitle}</p>
              <p className="portal-copy mt-3 text-sm">{content.summaryDescription}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {content.features.map((item) => (
                  <span key={item} className="panel-badge rounded-full px-4 py-2 text-xs">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={getPublicRoleRegisterHref(role)} className="portal-primary-button px-6 py-3">
                {content.heroCtaLabel}
              </Link>
              <Link href={getPublicRoleLoginHref(role)} className="portal-ghost-button px-6 py-3">
                {content.heroSecondaryLabel}
              </Link>
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="portal-card">
            <p className="landing-kicker">Ключевые возможности</p>
            <h2 className="mt-3 text-[2.2rem] font-extrabold leading-[0.98]">{content.capabilitiesTitle}</h2>
            <p className="portal-copy mt-4 text-base">{content.capabilitiesDescription}</p>
            <div className="mt-6 grid gap-3">
              {content.features.map((item) => (
                <div key={item} className="panel-muted-card rounded-[1.2rem] p-4">
                  <div className="landing-line-item">
                    <span className="landing-line-dot" aria-hidden="true" />
                    <div>
                      <p className="panel-section-title text-base font-semibold">{item}</p>
                      <p className="panel-copy mt-1 text-sm">Только то, что помогает быстро ориентироваться.</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="portal-card">
            <p className="landing-kicker">Как это работает</p>
            <h2 className="mt-3 text-[2.2rem] font-extrabold leading-[0.98]">{content.workflowTitle}</h2>
            <p className="portal-copy mt-4 text-base">{content.workflowDescription}</p>
            <div className="mt-6 grid gap-3">
              {content.workflow.map((item, index) => (
                <div key={item} className="panel-muted-card rounded-[1.2rem] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="panel-section-title text-base font-semibold">{item}</p>
                      <p className="panel-copy mt-1 text-sm">Шаг {index + 1}</p>
                    </div>
                    <span className="panel-badge rounded-full px-3 py-1 text-xs">Flow</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
