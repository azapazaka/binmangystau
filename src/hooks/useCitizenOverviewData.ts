import { useEffect, useMemo, useState } from "react";

import { buildCitizenOverviewIssues, buildCitizenOverviewStats } from "@/components/citizen-v2/citizen-adapters";
import { listClusters, listReports } from "@/lib/api";
import type { ClusterRecord, ReportRecord } from "@/types";

type CitizenOverviewState = {
  loading: boolean;
  error: string | null;
  reports: ReportRecord[];
  clusters: ClusterRecord[];
  selectedIssueId: string | null;
};

export function useCitizenOverviewData() {
  const [state, setState] = useState<CitizenOverviewState>({
    loading: true,
    error: null,
    reports: [],
    clusters: [],
    selectedIssueId: null,
  });

  useEffect(() => {
    let active = true;

    Promise.all([listReports(), listClusters({ category: "all" })])
      .then(([reports, clusters]) => {
        if (!active) {
          return;
        }

        setState((current) => ({
          loading: false,
          error: null,
          reports,
          clusters,
          selectedIssueId:
            current.selectedIssueId && clusters.some((cluster) => cluster.id === current.selectedIssueId)
              ? current.selectedIssueId
              : clusters[0]?.id ?? null,
        }));
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setState({
          loading: false,
          error: error instanceof Error ? error.message : "Failed to load citizen overview.",
          reports: [],
          clusters: [],
          selectedIssueId: null,
        });
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(
    () => buildCitizenOverviewStats(state.reports),
    [state.reports],
  );
  const issues = useMemo(
    () => buildCitizenOverviewIssues(state.clusters),
    [state.clusters],
  );
  const selectedIssue =
    issues.find((issue) => issue.id === state.selectedIssueId) ?? issues[0] ?? null;

  const setSelectedIssueId = (selectedIssueId: string | null) => {
    setState((current) => ({ ...current, selectedIssueId }));
  };

  return {
    ...state,
    stats,
    issues,
    selectedIssue,
    setSelectedIssueId,
  };
}
