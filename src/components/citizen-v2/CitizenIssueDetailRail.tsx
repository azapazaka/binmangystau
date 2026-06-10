import { CalendarClock, CircleCheck, MapPin } from "lucide-react";
import type { ReactNode } from "react";

import type { CitizenOverviewIssue } from "@/components/citizen-v2/citizen-adapters";
import { CitizenStatusBadge } from "@/components/citizen-v2/CitizenStatusBadge";

export function CitizenIssueDetailRail({
  issue,
  emptyTitle = "No issue selected",
  emptyBody = "Select a live issue from the map or list to inspect its details.",
  primaryAction,
}: {
  issue: CitizenOverviewIssue | null;
  emptyTitle?: string;
  emptyBody?: string;
  primaryAction?: ReactNode;
}) {
  if (!issue) {
    return (
      <article className="citizen-v2-panel">
        <h2 className="text-sm font-bold text-slate-900">{emptyTitle}</h2>
        <p className="mt-1 text-xs text-slate-500">{emptyBody}</p>
      </article>
    );
  }

  return (
    <article className="citizen-v2-panel">
      <div className="flex flex-wrap items-center gap-1.5">
        <CitizenStatusBadge label={issue.statusLabel} tone="success" />
        <CitizenStatusBadge label={issue.priorityLabel} tone="warning" />
      </div>

      {issue.imageUrl ? (
        <img
          src={issue.imageUrl}
          alt={issue.title}
          className="mt-3 h-32 w-full rounded-2xl object-cover"
        />
      ) : (
        <div className="mt-3 flex h-32 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50/60 via-slate-50 to-emerald-50/60 text-xs font-medium text-slate-400">
          No photo available yet
        </div>
      )}

      <h2 className="mt-3 text-sm font-bold text-slate-950">{issue.title}</h2>
      <div className="mt-2 flex items-start gap-2 text-xs text-slate-600">
        <MapPin size={14} className="mt-0.5 flex-shrink-0 text-slate-400" />
        <div>
          <p className="font-medium text-slate-900">{issue.address}</p>
          <p className="text-slate-500">{issue.district}</p>
        </div>
      </div>

      {issue.description ? (
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600">{issue.description}</p>
      ) : null}

      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-xs">
        <div className="flex items-center gap-2">
          <CircleCheck size={13} className="flex-shrink-0 text-slate-400" />
          <span className="font-medium text-slate-900">{issue.reporterLabel ?? "Community signal"}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarClock size={13} className="flex-shrink-0 text-slate-400" />
          <span className="text-slate-500">Latest activity: {issue.reportedAtLabel ?? "—"}</span>
        </div>
      </div>

      {primaryAction ? <div className="mt-3">{primaryAction}</div> : null}
    </article>
  );
}
