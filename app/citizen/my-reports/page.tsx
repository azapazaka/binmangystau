import { AI_STATUS_META, CATEGORY_META, STATUS_META } from "@/lib/constants";
import { getCurrentCitizen } from "@/lib/auth";
import { listReports } from "@/lib/data-store";
import { getHumanConfirmationMeta } from "@/lib/human-confirmation";

export default async function CitizenMyReportsPage() {
  const citizen = await getCurrentCitizen();
  const reports = await listReports({ submittedBy: citizen?.email });

  return (
    <div className="grid gap-6">
      <section className="panel-surface rounded-[2.2rem] p-6 md:p-8">
        <p className="panel-kicker text-xs uppercase tracking-[0.34em]">My reports</p>
        <h1 className="panel-title mt-3 text-5xl">Мои жалобы</h1>
        <p className="panel-copy mt-4 max-w-3xl text-base leading-8">
          Здесь только ваши обращения: категории, статусы, score и подсказки AI без пересечения
          с операторским интерфейсом.
        </p>
      </section>

      <section className="panel-surface rounded-[2rem] p-5">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="panel-kicker text-left text-xs uppercase tracking-[0.26em]">
                <th className="px-4">Категория</th>
                <th className="px-4">Адрес</th>
                <th className="px-4">Статус</th>
                <th className="px-4">AI</th>
                <th className="px-4">Люди</th>
                <th className="px-4">Score</th>
                <th className="px-4">Дата</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="panel-table-row text-sm">
                  <td className="rounded-l-[1.3rem] px-4 py-4 font-semibold panel-section-title">
                    {CATEGORY_META[report.userCategory].label}
                  </td>
                  <td className="px-4 py-4">{report.address ?? "Адрес уточняется"}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_META[report.status].tone}`}>
                      {STATUS_META[report.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${AI_STATUS_META[report.aiValidationStatus].tone}`}>
                      {AI_STATUS_META[report.aiValidationStatus].shortLabel}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getHumanConfirmationMeta(report.humanConfirmationStatus).tone}`}>
                      {getHumanConfirmationMeta(report.humanConfirmationStatus).shortLabel}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-semibold panel-section-title">{report.severity}</td>
                  <td className="rounded-r-[1.3rem] px-4 py-4">
                    {new Date(report.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {reports.length === 0 ? (
          <div className="panel-muted-card mt-4 rounded-[1.4rem] border-dashed p-6 text-sm panel-copy">
            У вас пока нет обращений. Отправьте первую жалобу на отдельной странице создания.
          </div>
        ) : null}
      </section>
    </div>
  );
}
