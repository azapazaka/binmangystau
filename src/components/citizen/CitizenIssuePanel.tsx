import { CircleCheck, FilePenLine, X } from "lucide-react";

import type { CitizenDashboardIssue } from "./citizen-dashboard-data";
import { citizenCopy } from "@/components/citizen-v2/citizen-copy";

type CitizenIssuePanelProps = {
  issue: CitizenDashboardIssue;
  onClose?: () => void;
  onViewDetails?: () => void;
  detailsHref?: string;
};

export function CitizenIssuePanel({
  issue,
  onClose,
  onViewDetails,
  detailsHref,
}: CitizenIssuePanelProps) {
  const resolvedDetailsHref = detailsHref ?? issue.detailsHref;
  const handleViewDetails =
    onViewDetails ??
    (resolvedDetailsHref
      ? () => {
          window.location.assign(resolvedDetailsHref);
        }
      : undefined);
  const description =
    issue.description ?? "Community members flagged this issue for review.";
  const reporterLabel = issue.reporterLabel ?? "Reported by community";
  const reportedAtLabel = issue.reportedAtLabel ?? "Time unavailable";
  const notesTitle = issue.notesTitle ?? "Notes";
  const noteSummary = issue.noteSummary ?? "Additional details will appear here.";

  return (
    <aside className="rounded-[28px] border border-white/75 bg-white/95 p-4 shadow-[0_30px_80px_-44px_rgba(15,23,42,0.34)]">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          {issue.title}
        </span>
        {onClose ? (
          <button
            type="button"
            aria-label="Close selected issue"
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-50"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      <img
        src={issue.imageUrl}
        alt={issue.title}
        className="mt-4 h-40 w-full rounded-2xl object-cover"
      />

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {issue.statusLabel}
        </span>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          {issue.priorityLabel}
        </span>
      </div>

      <h2 className="mt-4 text-[1.05rem] font-bold text-slate-900">
        {issue.address}, {citizenCopy.cityName}
      </h2>
      <p className="mt-1 text-sm text-slate-400">{issue.district}</p>
      <p className="mt-4 text-sm leading-7 text-slate-600">{description}</p>

      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-sm text-slate-600">
        <div className="flex items-start gap-3">
          <CircleCheck size={18} className="mt-0.5 text-slate-400" />
          <div>
            <p className="font-medium text-slate-800">{reporterLabel}</p>
            <p className="text-slate-400">{reportedAtLabel}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <FilePenLine size={18} className="mt-0.5 text-slate-400" />
          <div>
            <p className="font-medium text-slate-800">{notesTitle}</p>
            <p className="text-slate-400">{noteSummary}</p>
          </div>
        </div>
      </div>

      {handleViewDetails ? (
        <button
          type="button"
          className="mt-5 w-full rounded-2xl bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
          onClick={handleViewDetails}
        >
          View Details
        </button>
      ) : null}
    </aside>
  );
}
