import { CalendarDays, CircleCheck, FileStack } from "lucide-react";
import { useMemo } from "react";

import { CitizenFilterChipGroup } from "@/components/citizen-v2/CitizenFilterChipGroup";
import { CitizenIssueDetailRail } from "@/components/citizen-v2/CitizenIssueDetailRail";
import { CitizenMetricCard } from "@/components/citizen-v2/CitizenMetricCard";
import { CitizenReportRow } from "@/components/citizen-v2/CitizenReportRow";
import { CitizenShell } from "@/components/citizen-v2/CitizenShell";
import {
  CitizenTimeline,
  type CitizenTimelineItem,
} from "@/components/citizen-v2/CitizenTimeline";
import { CityMap } from "@/components/maps/CityMap";
import { useAuth } from "@/contexts/AuthContext";
import { useCitizenMyReports } from "@/hooks/useCitizenMyReports";

const FILTERS = [
  "All",
  "Open",
  "In Progress",
  "Under Review",
  "Resolved",
] as const;

function buildTimeline(issueTitle: string | null): CitizenTimelineItem[] {
  return [
    {
      title: "Submitted",
      at: "Initial report captured",
      note: `${issueTitle ?? "Issue"} was submitted by the citizen.`,
      status: "complete",
    },
    {
      title: "AI Verified",
      at: "Verification in progress",
      note: "AI review and clustering are being applied.",
      status: "complete",
    },
    {
      title: "Assigned",
      at: "Waiting for department handoff",
      note: "Assignment details will appear once available.",
      status: "current",
    },
    {
      title: "Resolved",
      at: "Pending",
      note: "The citizen will see closure here when the issue is completed.",
      status: "upcoming",
    },
  ];
}

export default function CitizenMyReportsPage() {
  const { user } = useAuth();
  const {
    loading,
    error,
    filter,
    setFilter,
    issues,
    selectedIssue,
    selectedIssueId,
    setSelectedIssueId,
    stats,
  } = useCitizenMyReports(user?.id ?? null);

  const timeline = useMemo(
    () => buildTimeline(selectedIssue?.title ?? null),
    [selectedIssue],
  );

  // Build a fake single-cluster for the mini map
  const miniMapCluster = useMemo(() => {
    if (!selectedIssue) return [];
    return [
      {
        id: selectedIssue.id,
        category: selectedIssue.category,
        effectiveCategory: selectedIssue.category,
        lat: 43.6532,
        lng: 51.1975,
        address: selectedIssue.address,
        district: selectedIssue.district,
        zoneCoefficient: 1,
        reportCount: 1,
        severity: 0,
        priorityScore: 50,
        priorityReason: null,
        topFactors: [],
        prioritySourceReportId: null,
        status: "open" as const,
        representativePhotoUrl: selectedIssue.imageUrl || null,
        aiValidationStatus: "valid" as const,
        effectiveVisualSeverity: null,
        moderatorReviewStatus: "pending" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }, [selectedIssue]);

  return (
    <CitizenShell
      title="My Reports"
      subtitle="Track the status and progress of the issues you reported in real time."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Stats row */}
          <section className="grid gap-4 md:grid-cols-3">
            <CitizenMetricCard
              icon={<FileStack size={22} />}
              label={stats[0]?.label ?? "Total reports"}
              value={stats[0]?.value ?? "0"}
              note={stats[0]?.note ?? ""}
              tone="teal"
            />
            <CitizenMetricCard
              icon={<CalendarDays size={22} />}
              label={stats[1]?.label ?? "Active reports"}
              value={stats[1]?.value ?? "0"}
              note={stats[1]?.note ?? ""}
              tone="amber"
            />
            <CitizenMetricCard
              icon={<CircleCheck size={22} />}
              label={stats[2]?.label ?? "Resolved reports"}
              value={stats[2]?.value ?? "0"}
              note={stats[2]?.note ?? ""}
              tone="green"
            />
          </section>

          {/* Filter + report list */}
          <section className="citizen-v2-panel">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CitizenFilterChipGroup
                value={filter}
                options={FILTERS}
                onChange={setFilter}
              />
              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700"
              >
                Newest first
              </button>
            </div>
            <div className="mt-4 space-y-2.5">
              {loading ? (
                <p className="text-sm text-slate-500">
                  Loading your live reports...
                </p>
              ) : error ? (
                <p className="text-sm text-rose-700">{error}</p>
              ) : issues.length === 0 ? (
                <p className="text-sm text-slate-500">
                  You do not have any live reports yet.
                </p>
              ) : (
                issues.map((issue) => (
                  <CitizenReportRow
                    key={issue.id}
                    issue={issue}
                    selected={issue.id === selectedIssueId}
                    onSelect={() => setSelectedIssueId(issue.id)}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Detail rail */}
          <CitizenIssueDetailRail issue={selectedIssue} />

          {/* Mini map */}
          {selectedIssue && (
            <div className="citizen-v2-panel !p-2">
              <div className="overflow-hidden rounded-2xl">
                <CityMap
                  clusters={miniMapCluster}
                  selectedId={selectedIssue.id}
                  height="160px"
                  className="rounded-2xl"
                />
              </div>
            </div>
          )}

          {/* Timeline */}
          <article className="citizen-v2-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                  Progress
                </p>
                <h2 className="mt-1 text-sm font-bold text-slate-900">
                  Report timeline
                </h2>
              </div>
            </div>
            <div className="mt-4">
              <CitizenTimeline items={timeline} />
            </div>
          </article>
        </div>
      </div>
    </CitizenShell>
  );
}
