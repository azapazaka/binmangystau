import type { CitizenDashboardStat } from "./citizen-dashboard-data";

type CitizenStatsRowProps = {
  stats: CitizenDashboardStat[];
};

export function CitizenStatsRow({ stats }: CitizenStatsRowProps) {
  return (
    <section
      aria-label="Citizen dashboard statistics"
      className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="rounded-[24px] border border-white/70 bg-white/92 p-5 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.3)]"
        >
          <p className="text-sm font-medium text-slate-500">{stat.label}</p>
          <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">
            {stat.value}
          </p>
          <p className="mt-2 text-sm text-slate-400">{stat.note}</p>
        </article>
      ))}
    </section>
  );
}
