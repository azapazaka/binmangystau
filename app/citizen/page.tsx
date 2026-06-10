import Link from "next/link";

import { HumanConfirmationBadge } from "@/components/human-confirmation-badge";
import { AI_STATUS_META, CATEGORY_META, STATUS_META } from "@/lib/constants";
import { getCurrentCitizen } from "@/lib/auth";
import { getCitizenSummary } from "@/lib/citizen-data";
import { getHumanConfirmationMeta } from "@/lib/human-confirmation";
import { listReports } from "@/lib/data-store";

export default async function CitizenHomePage() {
  const citizen = await getCurrentCitizen();
  const allReports = await listReports();
  const myReports = allReports.filter((report) => report.submittedBy === citizen?.email);
  const summary = getCitizenSummary(allReports, citizen?.email ?? "");
  const latestReport = myReports[0] ?? null;
  const latestHumanMeta = latestReport
    ? getHumanConfirmationMeta(latestReport.humanConfirmationStatus)
    : null;

  return (
    <div className="grid gap-5">
      <section className="panel-surface rounded-[2rem] p-6 md:p-8">
        <p className="panel-kicker text-xs uppercase tracking-[0.3em]">Рабочее место гражданина</p>
        <h1 className="panel-title mt-3 text-6xl leading-[0.92]">Обзор гражданина</h1>
        <p className="panel-copy mt-4 max-w-[62ch] text-lg leading-8">
          Главное по обращениям без визуального шума: прогресс, статус и ближайшее нужное действие.
        </p>

        <div className="mt-8 flex flex-wrap gap-6">
          <div>
            <p className="panel-kicker text-[11px] uppercase tracking-[0.22em]">Всего жалоб</p>
            <p className="mt-2 text-3xl font-extrabold">{summary.totalReports}</p>
          </div>
          <div>
            <p className="panel-kicker text-[11px] uppercase tracking-[0.22em]">Закрыто</p>
            <p className="mt-2 text-3xl font-extrabold">{summary.resolvedReports}</p>
          </div>
          <div>
            <p className="panel-kicker text-[11px] uppercase tracking-[0.22em]">Место в рейтинге</p>
            <p className="mt-2 text-3xl font-extrabold">{summary.currentRank ?? "—"}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <article className="panel-surface rounded-[1.8rem] p-6">
          <p className="panel-kicker text-xs uppercase tracking-[0.3em]">Сейчас важно</p>
          <h2 className="panel-title mt-3 text-[3rem] leading-[0.94]">Главный фокус недели</h2>
          <p className="panel-copy mt-6 max-w-[56ch] text-lg leading-9">
            {latestReport
              ? `Последнее обращение связано с адресом ${latestReport.address ?? "без уточненного адреса"}. Здесь удобно держать в фокусе текущий статус и приоритет.`
              : "Пока нет отправленных обращений. Начните с подачи первой заявки и после этого здесь появится ваш основной фокус."}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="panel-muted-card rounded-[1.2rem] p-4">
              <p className="panel-kicker text-[11px] uppercase tracking-[0.22em]">Статус</p>
              <p className="panel-section-title mt-2 text-lg font-semibold">
                {latestReport ? STATUS_META[latestReport.status].label : "Нет данных"}
              </p>
            </div>
            <div className="panel-muted-card rounded-[1.2rem] p-4">
              <p className="panel-kicker text-[11px] uppercase tracking-[0.22em]">AI</p>
              <p className="panel-section-title mt-2 text-lg font-semibold">
                {latestReport ? AI_STATUS_META[latestReport.aiValidationStatus].shortLabel : "—"}
              </p>
            </div>
            <div className="panel-muted-card rounded-[1.2rem] p-4">
              <p className="panel-kicker text-[11px] uppercase tracking-[0.22em]">Люди</p>
              <p className="panel-section-title mt-2 text-lg font-semibold">
                {latestHumanMeta ? latestHumanMeta.shortLabel : "—"}
              </p>
            </div>
          </div>
        </article>

        <article className="panel-surface rounded-[1.8rem] p-6">
          <p className="panel-kicker text-xs uppercase tracking-[0.3em]">Коротко</p>
          <h2 className="panel-title mt-3 text-[2.5rem] leading-[0.96]">Что видно сразу</h2>
          <div className="mt-6 grid gap-3">
            <Link href="/citizen/report" className="panel-interactive-card rounded-[1.2rem] p-4">
              <p className="panel-section-title text-lg font-semibold">Создать жалобу</p>
              <p className="panel-copy mt-2 text-sm leading-7">Подача новой проблемы с фото и местом.</p>
            </Link>
            <Link href="/citizen/my-reports" className="panel-interactive-card rounded-[1.2rem] p-4">
              <p className="panel-section-title text-lg font-semibold">Мои жалобы</p>
              <p className="panel-copy mt-2 text-sm leading-7">Все ваши обращения и текущие статусы.</p>
            </Link>
            <Link href="/citizen/profile" className="panel-interactive-card rounded-[1.2rem] p-4">
              <p className="panel-section-title text-lg font-semibold">Профиль</p>
              <p className="panel-copy mt-2 text-sm leading-7">Личные данные, активность и настройка профиля.</p>
            </Link>
            <Link href="/citizen/verify" className="panel-interactive-card rounded-[1.2rem] p-4">
              <p className="panel-section-title text-lg font-semibold">Проверка жалоб</p>
              <p className="panel-copy mt-2 text-sm leading-7">
                Свайпайте реальные и фейковые жалобы, чтобы добавить человеческое подтверждение.
              </p>
            </Link>
          </div>
        </article>
      </section>

      <section className="panel-surface rounded-[1.8rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="panel-kicker text-xs uppercase tracking-[0.3em]">Последние обращения</p>
            <h2 className="panel-title mt-2 text-3xl">Что вы отправляли недавно</h2>
          </div>
          <Link href="/citizen/my-reports" className="panel-link text-sm font-semibold">
            Открыть весь список
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {myReports.slice(0, 3).map((report) => (
            <article key={report.id} className="panel-muted-card rounded-[1.3rem] p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white"
                  style={{ backgroundColor: CATEGORY_META[report.userCategory].color }}
                >
                  {CATEGORY_META[report.userCategory].label}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${STATUS_META[report.status].tone}`}
                >
                  {STATUS_META[report.status].label}
                </span>
                <HumanConfirmationBadge report={report} compact />
              </div>
              <h3 className="panel-section-title mt-4 text-xl font-semibold">
                {report.address ?? "Адрес уточняется"}
              </h3>
              <p className="panel-copy mt-2 text-sm leading-7">{report.description}</p>
            </article>
          ))}

          {myReports.length === 0 ? (
            <div className="panel-muted-card rounded-[1.3rem] border-dashed p-6 text-sm panel-copy lg:col-span-3">
              Пока нет отправленных обращений. Начните с раздела «Создать жалобу».
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
