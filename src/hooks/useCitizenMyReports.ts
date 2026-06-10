import { useEffect, useMemo, useState } from "react";

import { buildCitizenOverviewIssues } from "@/components/citizen-v2/citizen-adapters";
import { listClusters, listReports } from "@/lib/api";
import type { CitizenOverviewIssue } from "@/components/citizen-v2/citizen-adapters";

type FilterValue = "All" | "Open" | "In Progress" | "Under Review" | "Resolved";

export function useCitizenMyReports(userId: string | null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<CitizenOverviewIssue[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("All");

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setIssues([]);
      return;
    }

    let active = true;
    setLoading(true);

    Promise.all([listReports({ submittedBy: userId }), listClusters({ category: "all" })])
      .then(([reports, clusters]) => {
        if (!active) return;
        const clusterIds = new Set(reports.map((report) => report.clusterId).filter(Boolean));
        const nextIssues = buildCitizenOverviewIssues(
          clusters.filter((cluster) => clusterIds.has(cluster.id)),
        );
        setIssues(nextIssues);
        setSelectedIssueId(nextIssues[0]?.id ?? null);
        setError(null);
        setLoading(false);
      })
      .catch((nextError: unknown) => {
        if (!active) return;
        setError(nextError instanceof Error ? nextError.message : "Failed to load reports.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const filteredIssues = useMemo(() => {
    if (filter === "All") return issues;
    if (filter === "Open") return issues.filter((issue) => issue.statusLabel === "Under review");
    if (filter === "In Progress") return issues.filter((issue) => issue.statusLabel === "In progress");
    if (filter === "Under Review") return issues.filter((issue) => issue.statusLabel === "Reviewed");
    return issues.filter((issue) => issue.statusLabel === "Resolved");
  }, [filter, issues]);

  const selectedIssue =
    filteredIssues.find((issue) => issue.id === selectedIssueId) ?? filteredIssues[0] ?? null;

  return {
    loading,
    error,
    filter,
    setFilter,
    issues: filteredIssues,
    selectedIssue,
    selectedIssueId,
    setSelectedIssueId,
    stats: [
      { label: "Total reports", value: String(issues.length), note: "all submissions" },
      {
        label: "Active reports",
        value: String(issues.filter((issue) => issue.statusLabel !== "Resolved").length),
        note: "open or in progress",
      },
      {
        label: "Resolved reports",
        value: String(issues.filter((issue) => issue.statusLabel === "Resolved").length),
        note: "finished",
      },
    ],
  };
}
