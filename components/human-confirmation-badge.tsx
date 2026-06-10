import { getHumanConfirmationCountsLabel, getHumanConfirmationMeta } from "@/lib/human-confirmation";
import type { ReportRecord } from "@/types";

type HumanConfirmationBadgeProps = {
  report: Pick<
    ReportRecord,
    "humanConfirmationStatus" | "humanRealVotes" | "humanFakeVotes" | "humanVotesTotal"
  >;
  compact?: boolean;
};

export function HumanConfirmationBadge({
  report,
  compact = false,
}: HumanConfirmationBadgeProps) {
  const meta = getHumanConfirmationMeta(report.humanConfirmationStatus);
  const countsLabel = getHumanConfirmationCountsLabel(report);

  return (
    <div className={compact ? "flex flex-wrap items-center gap-2" : "grid gap-2"}>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${meta.tone}`}>
        {meta.shortLabel}
      </span>
      <span className="panel-copy text-xs">{countsLabel}</span>
    </div>
  );
}
