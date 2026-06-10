import { useEffect, useMemo, useState } from "react";

import { castHumanVote, getVerifyQueue } from "@/lib/api";
import type { ReportRecord } from "@/types";

export function useCitizenVerifyQueue(userId: string | null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reports, setReports] = useState<ReportRecord[]>([]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setReports([]);
      return;
    }

    let active = true;
    setLoading(true);

    getVerifyQueue(userId)
      .then((nextReports) => {
        if (!active) return;
        setReports(nextReports);
        setError(null);
        setLoading(false);
      })
      .catch((nextError: unknown) => {
        if (!active) return;
        setError(nextError instanceof Error ? nextError.message : "Failed to load verify queue.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const current = reports[0] ?? null;
  const next = reports.slice(1, 5);

  const vote = async (verdict: "real" | "fake") => {
    if (!userId || !current) return;
    setSubmitting(true);
    setError(null);
    try {
      await castHumanVote(current.id, userId, verdict);
      setReports((existing) => existing.slice(1));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to submit vote.");
    } finally {
      setSubmitting(false);
    }
  };

  const civicImpact = useMemo(() => {
    const helpfulVotes = reports.reduce((sum, report) => sum + report.humanVotesTotal, 0);
    return {
      score: helpfulVotes * 12 + 420,
      helpfulVotes,
      verifiedToday: reports.filter((report) => report.humanVotesTotal > 0).length,
    };
  }, [reports]);

  return {
    loading,
    error,
    submitting,
    current,
    next,
    vote,
    civicImpact,
  };
}
