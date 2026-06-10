import { format } from "date-fns";
import {
  Bot,
  ClipboardList,
  LoaderCircle,
  MapPin,
  MessageSquareWarning,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { listClusters, listReports } from "@/lib/api";
import { AI_STATUS_META, STATUS_META } from "@/lib/constants";
import type { ClusterRecord, ReportRecord } from "@/types";

const FILTERS = [
  { key: "all", label: "All reports" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In progress" },
  { key: "closed", label: "Resolved" },
  { key: "needs_review", label: "Needs review" },
] as const;

function formatReporter(reporterId: string | null) {
  if (!reporterId) return "Unknown citizen";
  return `Citizen ${reporterId.slice(0, 6).toUpperCase()}`;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [clusters, setClusters] = useState<ClusterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<(typeof FILTERS)[number]["key"]>("all");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([listReports(), listClusters({ category: "all" })])
      .then(([nextReports, nextClusters]) => {
        if (cancelled) return;
        setReports(nextReports);
        setClusters(nextClusters);
        setSelectedReportId(nextReports[0]?.id ?? null);
      })
      .catch((nextError) => {
        if (cancelled) return;
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Unable to load reports right now.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const clusterMap = useMemo(
    () => new Map(clusters.map((cluster) => [cluster.id, cluster])),
    [clusters],
  );

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesFilter =
        activeFilter === "all" ||
        report.status === activeFilter ||
        (activeFilter === "needs_review" &&
          (report.aiNeedsReview || report.reviewStatus === "pending"));

      const matchesSearch =
        !query ||
        report.description.toLowerCase().includes(query) ||
        (report.address ?? "").toLowerCase().includes(query) ||
        (report.district ?? "").toLowerCase().includes(query) ||
        formatReporter(report.submittedBy).toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, reports, search]);

  const selectedReport =
    filteredReports.find((report) => report.id === selectedReportId) ??
    filteredReports[0] ??
    null;

  const metrics = useMemo(() => {
    const total = reports.length;
    const pendingReview = reports.filter(
      (report) => report.aiNeedsReview || report.reviewStatus === "pending",
    ).length;
    const verified = reports.filter(
      (report) => report.aiValidationStatus === "valid",
    ).length;
    const disputed = reports.filter(
      (report) => report.humanConfirmationStatus === "disputed",
    ).length;

    return [
      {
        label: "Total reports",
        value: total,
        note: "Live submissions in the system",
        icon: <ClipboardList size={18} />,
      },
      {
        label: "Needs moderation",
        value: pendingReview,
        note: "AI or human review still pending",
        icon: <MessageSquareWarning size={18} />,
      },
      {
        label: "AI verified",
        value: verified,
        note: "High-confidence valid reports",
        icon: <ShieldCheck size={18} />,
      },
      {
        label: "Community disputes",
        value: disputed,
        note: "Reports with split public votes",
        icon: <Users size={18} />,
      },
    ];
  }, [reports]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="citizen-v2-eyebrow">Operations queue</p>
          <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
            Reports
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Review every submission flowing into CityPulse, trace where it
            lands, and spot the items that still need a human decision.
          </p>
        </div>
        <label className="flex min-w-[260px] flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm xl:max-w-sm xl:flex-none">
          <Search size={16} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search description, place, or citizen"
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="citizen-v2-panel flex items-start gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              {metric.icon}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {metric.label}
              </p>
              <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                {metric.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {metric.note}
              </p>
            </div>
          </article>
        ))}
      </section>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setActiveFilter(filter.key)}
            className={[
              "rounded-2xl border px-4 py-2 text-sm font-semibold transition",
              activeFilter === filter.key
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_360px]">
        <section className="citizen-v2-panel overflow-hidden !p-0">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-slate-900">
                Live report stream
              </p>
              <p className="text-xs text-slate-500">
                {filteredReports.length} reports match the current view
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
              Synced from Supabase
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center text-sm text-slate-500">
              <LoaderCircle className="mr-2 animate-spin" size={16} />
              Loading report queue...
            </div>
          ) : error ? (
            <div className="m-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="m-5 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 px-5 py-12 text-center">
              <p className="text-sm font-semibold text-slate-900">
                No reports match this filter
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try another status or clear the search query.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredReports.map((report) => {
                const cluster = report.clusterId
                  ? clusterMap.get(report.clusterId)
                  : null;
                const aiState = AI_STATUS_META[report.aiValidationStatus];
                const statusState = STATUS_META[report.status];
                const isSelected = selectedReport?.id === report.id;

                return (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => setSelectedReportId(report.id)}
                    className={[
                      "grid w-full gap-4 px-5 py-4 text-left transition hover:bg-slate-50/80 lg:grid-cols-[112px_minmax(0,1.8fr)_170px_140px]",
                      isSelected ? "bg-emerald-50/55" : "bg-white",
                    ].join(" ")}
                  >
                    {report.photoUrl ? (
                      <img
                        src={report.photoUrl}
                        alt={report.description || "Report photo"}
                        className="h-20 w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-20 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-400">
                        No photo
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CategoryBadge category={report.userCategory} />
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusState.bgClass} ${statusState.textClass}`}
                        >
                          {statusState.label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${aiState.bgClass} ${aiState.textClass}`}
                        >
                          {aiState.label}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-950">
                        {report.description || "No description provided"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} />
                          {report.address ?? report.district ?? "Location missing"}
                        </span>
                        <span>{formatReporter(report.submittedBy)}</span>
                        <span>
                          {format(new Date(report.createdAt), "dd MMM, HH:mm")}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-slate-600">
                      <p className="font-semibold text-slate-900">
                        {cluster ? `Cluster ${cluster.id.slice(0, 6)}` : "Unclustered"}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Priority {Math.round(report.priorityScore)} ·{" "}
                        {report.aiConfidence
                          ? `${Math.round(report.aiConfidence * 100)}% confidence`
                          : "No confidence score"}
                      </p>
                    </div>

                    <div className="text-sm text-slate-600">
                      <p className="font-semibold text-slate-900">
                        {report.humanVotesTotal} community votes
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {report.humanConfirmationStatus.replace(/_/g, " ")}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="citizen-v2-panel">
            <p className="citizen-v2-eyebrow">Selected report</p>
            {selectedReport ? (
              <>
                <div className="mt-1 flex items-center gap-2">
                  <CategoryBadge category={selectedReport.userCategory} />
                  <span className="text-xs font-semibold text-slate-500">
                    {selectedReport.clusterId
                      ? `Cluster ${selectedReport.clusterId.slice(0, 6)}`
                      : "Awaiting cluster assignment"}
                  </span>
                </div>
                <p className="mt-3 text-lg font-bold leading-7 text-slate-950">
                  {selectedReport.description || "No description provided"}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {selectedReport.reviewNote ??
                    selectedReport.aiReason ??
                    "No manual note yet. This report is still following the default AI and moderation flow."}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      AI status
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Bot size={14} className="text-emerald-700" />
                      {AI_STATUS_META[selectedReport.aiValidationStatus].label}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Confidence
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Sparkles size={14} className="text-amber-600" />
                      {selectedReport.aiConfidence
                        ? `${Math.round(selectedReport.aiConfidence * 100)}%`
                        : "Unavailable"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Top AI factors
                  </p>
                  {selectedReport.topFactors.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No factor breakdown was saved for this report.
                    </p>
                  ) : (
                    selectedReport.topFactors.slice(0, 4).map((factor) => (
                      <div
                        key={factor.key}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900">
                            {factor.label}
                          </p>
                          <span className="text-xs font-semibold text-emerald-700">
                            +{factor.impact}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {factor.value}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Select a report from the queue to inspect its status, signals,
                and public feedback.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
