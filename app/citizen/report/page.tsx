import { ReportForm } from "@/components/report-form";
import { getDashboardStats } from "@/lib/data-store";

export default async function CitizenReportPage() {
  const stats = await getDashboardStats();

  return (
    <div className="grid gap-6">
      <section className="panel-surface rounded-[2.2rem] p-6 md:p-8">
        <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Create report</p>
        <h1 className="panel-title mt-3 text-5xl">Подача обращения</h1>
        <p className="panel-copy mt-4 max-w-3xl text-base leading-8">
          Тот же сценарий подачи, только в более короткой и чистой подаче.
        </p>
      </section>

      <ReportForm weeklyReports={stats.weeklyReports} />
    </div>
  );
}
