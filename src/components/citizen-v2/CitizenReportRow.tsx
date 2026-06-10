import type { CitizenOverviewIssue } from "@/components/citizen-v2/citizen-adapters";
import { CitizenStatusBadge } from "@/components/citizen-v2/CitizenStatusBadge";

export function CitizenReportRow({
  issue,
  selected,
  onSelect,
}: {
  issue: CitizenOverviewIssue;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "grid w-full gap-4 rounded-[24px] border bg-white px-4 py-4 text-left transition md:grid-cols-[112px_minmax(0,1.5fr)_140px_88px_96px]",
        selected
          ? "border-teal-600 shadow-[0_26px_60px_-42px_rgba(15,118,110,0.55)]"
          : "border-slate-200 hover:border-slate-300",
      ].join(" ")}
    >
      {issue.imageUrl ? (
        <img src={issue.imageUrl} alt={issue.title} className="h-20 w-full rounded-2xl object-cover" />
      ) : (
        <div className="flex h-20 w-full items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-400">
          No photo
        </div>
      )}
      <div className="min-w-0">
        <p className="text-lg font-semibold text-slate-950">{issue.title}</p>
        <p className="mt-1 text-sm text-slate-600">{issue.address}</p>
        <p className="mt-1 text-sm text-slate-400">{issue.reportedAtLabel}</p>
      </div>
      <div className="space-y-2">
        <CitizenStatusBadge label={issue.statusLabel} tone="info" />
      </div>
      <div className="text-sm">
        <p className="text-slate-400">Clusters</p>
        <p className="mt-1 text-2xl font-bold text-slate-950">{issue.distanceLabel.replace(/\D/g, "") || "0"}</p>
      </div>
      <div className="space-y-2">
        <CitizenStatusBadge label={issue.priorityLabel} tone="warning" />
      </div>
    </button>
  );
}
