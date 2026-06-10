import { ArrowUpRight, MapPinned } from "lucide-react";

import type { CitizenDashboardIssue } from "./citizen-dashboard-data";

type NearbyIssuesRailProps = {
  issues: CitizenDashboardIssue[];
  onSelectIssue?: (issue: CitizenDashboardIssue) => void;
  selectedIssueId?: string | null;
};

export function NearbyIssuesRail({
  issues,
  onSelectIssue,
  selectedIssueId,
}: NearbyIssuesRailProps) {
  return (
    <section className="mt-5 rounded-[28px] border border-white/70 bg-white/92 p-5 shadow-[0_30px_80px_-42px_rgba(15,23,42,0.28)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
            Nearby Issues
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Recent community reports around your area.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <MapPinned size={16} />
          View all on map
        </button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {issues.map((issue) => {
          const isSelected = issue.id === selectedIssueId;

          return (
            <article
              key={issue.id}
              className={[
                "overflow-hidden rounded-[24px] border bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]",
                isSelected
                  ? "border-emerald-200 shadow-[0_28px_55px_-42px_rgba(5,150,105,0.6)]"
                  : "border-slate-200/80 shadow-[0_28px_55px_-44px_rgba(15,23,42,0.22)]",
              ].join(" ")}
            >
              <img
                src={issue.imageUrl}
                alt={issue.title}
                className="h-40 w-full object-cover"
              />

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{issue.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{issue.address}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {issue.distanceLabel}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {issue.statusLabel}
                  </span>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {issue.priorityLabel}
                  </span>
                </div>

                <button
                  type="button"
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  onClick={() => onSelectIssue?.(issue)}
                >
                  Focus issue
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
