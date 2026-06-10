import { buildCitizenLeaderboard, getCitizenSummary } from "@/lib/citizen-data";
import { getCurrentCitizen } from "@/lib/auth";
import { listReports } from "@/lib/data-store";

export default async function CitizenRatingPage() {
  const citizen = await getCurrentCitizen();
  const reports = await listReports();
  const summary = getCitizenSummary(reports, citizen?.email ?? "");
  const leaderboard = buildCitizenLeaderboard(reports);

  return (
    <div className="grid gap-6">
      <section className="panel-surface rounded-[2.2rem] p-6 md:p-8">
        <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Citizen rating</p>
        <h1 className="panel-title mt-3 text-5xl">Рейтинг активности</h1>
        <p className="panel-copy mt-4 max-w-3xl text-base leading-8">
          Здесь видно и личную статистику гражданина, и общий лидерборд по активности в системе.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Мои обращения", value: summary.totalReports },
          { label: "Закрытые обращения", value: summary.resolvedReports },
          { label: "Мой score", value: summary.activityScore },
        ].map((item) => (
          <article key={item.label} className="panel-surface rounded-[1.8rem] p-5">
            <p className="panel-kicker text-xs uppercase tracking-[0.28em]">{item.label}</p>
            <p className="panel-title mt-4 text-4xl font-semibold">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="panel-surface rounded-[2rem] p-5">
        <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Leaderboard</p>
        <h2 className="panel-section-title mt-2 text-2xl font-semibold">Топ граждан по активности</h2>

        <div className="mt-5 grid gap-3">
          {leaderboard.map((entry) => {
            const isCurrentUser = citizen?.email === entry.citizenId;

            return (
              <article
                key={entry.citizenId}
                className={`grid gap-3 rounded-[1.4rem] border px-5 py-4 md:grid-cols-[0.12fr_1fr_0.25fr_0.25fr_0.25fr] ${
                  isCurrentUser
                    ? "panel-table-row-active"
                    : "panel-table-row border-transparent"
                }`}
              >
                <div className="text-2xl font-semibold">#{entry.rank}</div>
                <div className="font-medium">{entry.citizenId}</div>
                <div>Жалобы: {entry.totalReports}</div>
                <div>Закрыто: {entry.resolvedReports}</div>
                <div className="font-semibold">Score: {entry.activityScore}</div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
