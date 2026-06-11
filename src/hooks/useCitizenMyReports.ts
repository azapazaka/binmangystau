import { useEffect, useMemo, useState } from "react";

import { buildCitizenMyReportIssues } from "@/components/citizen-v2/citizen-adapters";
import { listReports } from "@/lib/api";
import type { CitizenOverviewIssue } from "@/components/citizen-v2/citizen-adapters";

type FilterValue = "Все" | "Открыто" | "В работе" | "На проверке" | "Закрыто";

export function useCitizenMyReports(userId: string | null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<CitizenOverviewIssue[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("Все");

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setIssues([]);
      return;
    }

    let active = true;
    setLoading(true);

    listReports({ submittedBy: userId })
      .then((reports) => {
        if (!active) return;
        const nextIssues = buildCitizenMyReportIssues(reports);
        setIssues(nextIssues);
        setSelectedIssueId(nextIssues[0]?.id ?? null);
        setError(null);
        setLoading(false);
      })
      .catch((nextError: unknown) => {
        if (!active) return;
        setError(nextError instanceof Error ? nextError.message : "Не удалось загрузить заявки.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const filteredIssues = useMemo(() => {
    if (filter === "Все") return issues;
    if (filter === "Открыто") return issues.filter((issue) => issue.statusLabel === "На проверке");
    if (filter === "В работе") return issues.filter((issue) => issue.statusLabel === "В работе");
    if (filter === "На проверке") return issues.filter((issue) => issue.statusLabel === "Проверено");
    return issues.filter((issue) => issue.statusLabel === "Закрыто");
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
      { label: "Всего заявок", value: String(issues.length), note: "все обращения" },
      {
        label: "Активные",
        value: String(issues.filter((issue) => issue.statusLabel !== "Закрыто").length),
        note: "открытые и в работе",
      },
      {
        label: "Закрытые",
        value: String(issues.filter((issue) => issue.statusLabel === "Закрыто").length),
        note: "завершено",
      },
    ],
  };
}
