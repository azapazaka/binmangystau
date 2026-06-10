"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { CityMap } from "@/components/city-map";
import { HumanConfirmationBadge } from "@/components/human-confirmation-badge";
import { AI_STATUS_META, CATEGORY_META, STATUS_META } from "@/lib/constants";
import { getHumanConfirmationInterpretation } from "@/lib/human-confirmation";
import { getEffectiveVisualSeverity } from "@/lib/priority";
import { getModeratorAiStatusMeta } from "@/lib/review-status";
import type {
  AiVisualSeverity,
  ClusterRecord,
  DashboardStats,
  ReportCategory,
  ReportRecord,
  ReviewVerdict,
  StatusHistoryRecord,
} from "@/types";

type DashboardClientProps = {
  initialClusters: ClusterRecord[];
  stats: DashboardStats;
  initialReport: ReportRecord | null;
  initialHistory: StatusHistoryRecord[];
  operatorName: string;
};

type ClusterDetailResponse = {
  report: ReportRecord | null;
  history: StatusHistoryRecord[];
};

type ReviewResponse = {
  report: ReportRecord;
  cluster: ClusterRecord;
  stats: DashboardStats;
};

type ReviewDraft = {
  verdict: ReviewVerdict;
  correctedCategory: ReportCategory | "";
  correctedVisualSeverity: AiVisualSeverity | "";
  note: string;
};

type SaveState =
  | { kind: "idle"; message: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function DashboardClient({
  initialClusters,
  stats,
  initialReport,
  initialHistory,
  operatorName,
}: DashboardClientProps) {
  const [clusters, setClusters] = useState(initialClusters);
  const [dashboardStats, setDashboardStats] = useState(stats);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(
    initialClusters[0]?.id ?? null,
  );
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(initialReport);
  const [selectedHistory, setSelectedHistory] = useState<StatusHistoryRecord[]>(initialHistory);
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft>(() => createReviewDraft(initialReport));
  const [detailPending, setDetailPending] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({
    kind: "idle",
    message: "",
  });
  const [pending, startTransition] = useTransition();

  const selectedCluster =
    clusters.find((cluster) => cluster.id === selectedClusterId) ?? clusters[0] ?? null;
  const moderationStatusMeta = selectedReport
    ? getModeratorAiStatusMeta(selectedReport.reviewStatus, selectedCluster?.aiValidationStatus ?? "unavailable")
    : null;
  const selectedVisualSeverity = selectedReport ? getEffectiveVisualSeverity(selectedReport) : null;

  const sortedClusters = useMemo(
    () =>
      [...clusters].sort(
        (left, right) =>
          right.priorityScore - left.priorityScore ||
          right.severity - left.severity,
      ),
    [clusters],
  );

  useEffect(() => {
    if (!selectedClusterId) {
      setSelectedReport(null);
      setSelectedHistory([]);
      return;
    }

    let active = true;

    async function loadDetail() {
      const isInitialCluster = selectedClusterId === initialClusters[0]?.id;

      if (isInitialCluster) {
        setSelectedReport(initialReport);
        setSelectedHistory(initialHistory);
      }

      setDetailPending(true);

      try {
        const response = await fetch(`/api/clusters/${selectedClusterId}/detail`);

        if (!response.ok || !active) {
          return;
        }

        const payload = (await response.json()) as ClusterDetailResponse;

        if (!active) {
          return;
        }

        setSelectedReport(payload.report);
        setSelectedHistory(payload.history);
      } finally {
        if (active) {
          setDetailPending(false);
        }
      }
    }

    void loadDetail();

    return () => {
      active = false;
    };
  }, [initialClusters, initialHistory, initialReport, selectedClusterId]);

  useEffect(() => {
    setReviewDraft(createReviewDraft(selectedReport));
    setSaveState({ kind: "idle", message: "" });
  }, [selectedReport]);

  async function handleStatusChange(clusterId: string, nextStatus: ClusterRecord["status"]) {
    startTransition(async () => {
      const response = await fetch(`/api/clusters/${clusterId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { cluster: ClusterRecord };

      setClusters((current) =>
        current.map((cluster) => (cluster.id === clusterId ? payload.cluster : cluster)),
      );
    });
  }

  function handleReviewSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedReport) {
      return;
    }

    setSaveState({ kind: "idle", message: "" });

    startTransition(async () => {
      const response = await fetch(`/api/reports/${selectedReport.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verdict: reviewDraft.verdict,
          correctedCategory:
            reviewDraft.verdict === "corrected" && reviewDraft.correctedCategory
              ? reviewDraft.correctedCategory
              : null,
          correctedVisualSeverity:
            reviewDraft.verdict === "corrected" && reviewDraft.correctedVisualSeverity
              ? reviewDraft.correctedVisualSeverity
              : null,
          note: reviewDraft.note,
        }),
      });

      if (!response.ok) {
        setSaveState({
          kind: "error",
          message: "Не удалось сохранить проверку модератора. Попробуйте ещё раз.",
        });
        return;
      }

      const payload = (await response.json()) as ReviewResponse;

      setSelectedReport(payload.report);
      setDashboardStats(payload.stats);
      setClusters((current) =>
        current.map((cluster) => (cluster.id === payload.cluster.id ? payload.cluster : cluster)),
      );
      setSaveState({
        kind: "success",
        message: "Проверка модератора сохранена, приоритет обновлён.",
      });
    });
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "Всего заявок", value: dashboardStats.totalReports },
          { label: "За неделю", value: dashboardStats.weeklyReports },
          { label: "В обработке", value: dashboardStats.inProgress },
          { label: "Решено", value: dashboardStats.resolved },
          { label: "Проверено модератором", value: dashboardStats.reviewedReports },
          { label: "AI был прав", value: `${dashboardStats.aiAgreementRate}%` },
        ].map((item) => (
          <article key={item.label} className="panel-surface rounded-[1.8rem] p-5">
            <p className="panel-kicker text-xs uppercase tracking-[0.34em]">{item.label}</p>
            <p className="panel-title mt-4 text-4xl font-semibold">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6">
        <div>
          <CityMap
            clusters={sortedClusters}
            selectedClusterId={selectedCluster?.id}
            onSelectCluster={setSelectedClusterId}
            heightClassName="h-[460px] sm:h-[540px] xl:h-[620px]"
          />
        </div>

        {selectedCluster ? (
          <aside className="panel-surface w-full rounded-[2rem] p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white"
                style={{ backgroundColor: CATEGORY_META[selectedCluster.effectiveCategory].color }}
              >
                {CATEGORY_META[selectedCluster.effectiveCategory].label}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${STATUS_META[selectedCluster.status].tone}`}
              >
                {STATUS_META[selectedCluster.status].label}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${
                  moderationStatusMeta?.tone ?? AI_STATUS_META[selectedCluster.aiValidationStatus].tone
                }`}
              >
                {moderationStatusMeta?.shortLabel ?? AI_STATUS_META[selectedCluster.aiValidationStatus].shortLabel}
              </span>
            </div>

            <h3 className="panel-section-title mt-4 text-2xl font-semibold">
              {selectedCluster.address ?? "Адрес уточняется"}
            </h3>
            <p className="panel-copy mt-2 text-sm">Оператор: {operatorName}</p>
            {detailPending ? (
              <p className="panel-copy mt-2 text-xs uppercase tracking-[0.24em]">
                Загружаем детали обращения...
              </p>
            ) : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              <div className="panel-muted-card rounded-[1.2rem] p-4">
                <p className="panel-kicker text-xs uppercase tracking-[0.24em]">Жалобы</p>
                <p className="panel-title mt-2 text-2xl font-semibold">{selectedCluster.reportCount}</p>
              </div>
              <div className="panel-muted-card rounded-[1.2rem] p-4">
                <p className="panel-kicker text-xs uppercase tracking-[0.24em]">
                  Приоритет обращения
                </p>
                <p className="panel-title mt-2 text-2xl font-semibold">
                  {selectedCluster.priorityScore}
                </p>
                <p className="panel-copy mt-1 text-xs">Базовый score: {selectedCluster.severity}</p>
              </div>
              <div className="panel-muted-card rounded-[1.2rem] p-4">
                <p className="panel-kicker text-xs uppercase tracking-[0.24em]">Район</p>
                <p className="panel-title mt-2 text-lg font-semibold">
                  {selectedCluster.district ?? "Алматы"}
                </p>
              </div>
            </div>

            {selectedReport ? (
              <div className="mt-6 grid gap-4">
                <div className="panel-muted-card rounded-[1.3rem] p-4">
                  <p className="panel-kicker text-xs uppercase tracking-[0.3em]">
                    Приоритет обращения
                  </p>
                  <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <p className="panel-title text-5xl font-semibold">{selectedReport.priorityScore}</p>
                    {selectedReport.reviewedAt ? (
                      <p className="panel-copy text-xs">
                        Последняя проверка:{" "}
                        {new Date(selectedReport.reviewedAt).toLocaleString("ru-RU")}
                      </p>
                    ) : null}
                  </div>
                  <p className="panel-section-title mt-4 text-lg font-semibold">
                    Почему это важно
                  </p>
                  <p className="panel-copy mt-2 max-w-[68ch] text-sm leading-7">
                    {selectedReport.priorityReason ?? "Приоритет будет рассчитан после оценки данных."}
                  </p>

                  {selectedReport.topFactors.length > 0 ? (
                    <>
                      <p className="panel-section-title mt-4 text-lg font-semibold">
                        Что повлияло на приоритет
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedReport.topFactors.map((factor) => (
                          <span
                            key={`${factor.key}-${factor.label}`}
                            className="panel-badge rounded-full px-3 py-1 text-xs"
                          >
                            {factor.label}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>

                <div className="panel-muted-card rounded-[1.3rem] p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="panel-kicker text-xs uppercase tracking-[0.3em]">Жалоба жителя</p>
                    {selectedReport.submittedBy ? (
                      <span className="panel-badge rounded-full px-3 py-1 text-xs">
                        {selectedReport.submittedBy}
                      </span>
                    ) : null}
                    {selectedVisualSeverity ? (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${getVisualSeverityTone(
                          selectedVisualSeverity,
                        )}`}
                      >
                        {getVisualSeverityLabel(selectedVisualSeverity)}
                      </span>
                    ) : null}
                  </div>
                  <p className="panel-copy mt-4 max-w-[68ch] text-sm leading-7">
                    {selectedReport.description || "Житель не оставил текстовое описание."}
                  </p>
                </div>

                <div className="panel-muted-card rounded-[1.3rem] p-4">
                  <p className="panel-kicker text-xs uppercase tracking-[0.3em]">
                    Подтверждение от людей
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <HumanConfirmationBadge report={selectedReport} compact />
                  </div>
                  <p className="panel-copy mt-3 max-w-[68ch] text-sm leading-7">
                    {getHumanConfirmationInterpretation(selectedReport)}
                  </p>
                </div>

                <form onSubmit={handleReviewSubmit} className="panel-muted-card rounded-[1.3rem] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="panel-kicker text-xs uppercase tracking-[0.3em]">
                        Проверка модератора
                      </p>
                      <p className="panel-copy mt-2 max-w-[68ch] text-sm leading-7">
                        Отметьте, насколько оценка AI совпадает с экспертным мнением.
                      </p>
                    </div>
                    {pending ? (
                      <span className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900">
                        Сохраняем...
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3">
                    <label className="grid gap-2 text-sm">
                      <span className="font-medium">Решение модератора</span>
                      <select
                        value={reviewDraft.verdict}
                        onChange={(event) =>
                          setReviewDraft((current) => ({
                            ...current,
                            verdict: event.target.value as ReviewVerdict,
                          }))
                        }
                        className="panel-select rounded-[1rem] px-4 py-3 text-sm outline-none"
                      >
                        <option value="confirmed">AI оценил верно</option>
                        <option value="corrected">Нужно скорректировать</option>
                        <option value="invalidated">AI ошибся</option>
                      </select>
                    </label>

                    {reviewDraft.verdict === "corrected" ? (
                      <div className="grid gap-3 xl:grid-cols-2">
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium">Исправленная категория</span>
                          <select
                            value={reviewDraft.correctedCategory}
                            onChange={(event) =>
                              setReviewDraft((current) => ({
                                ...current,
                                correctedCategory: event.target.value as ReportCategory | "",
                              }))
                            }
                            className="panel-select rounded-[1rem] px-4 py-3 text-sm outline-none"
                          >
                            <option value="">Без изменения</option>
                            {(Object.keys(CATEGORY_META) as ReportCategory[]).map((category) => (
                              <option key={category} value={category}>
                                {CATEGORY_META[category].label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="grid gap-2 text-sm">
                          <span className="font-medium">Исправленная срочность</span>
                          <select
                            value={reviewDraft.correctedVisualSeverity}
                            onChange={(event) =>
                              setReviewDraft((current) => ({
                                ...current,
                                correctedVisualSeverity:
                                  event.target.value as AiVisualSeverity | "",
                              }))
                            }
                            className="panel-select rounded-[1rem] px-4 py-3 text-sm outline-none"
                          >
                            <option value="">Без изменения</option>
                            <option value="low">Низкая</option>
                            <option value="medium">Средняя</option>
                            <option value="high">Высокая</option>
                          </select>
                        </label>
                      </div>
                    ) : null}

                    <label className="grid gap-2 text-sm">
                      <span className="font-medium">Комментарий модератора</span>
                      <textarea
                        value={reviewDraft.note}
                        onChange={(event) =>
                          setReviewDraft((current) => ({
                            ...current,
                            note: event.target.value,
                          }))
                        }
                        rows={3}
                        className="rounded-[1rem] border border-[var(--panel-border)] bg-[var(--panel-soft)] px-4 py-3 text-sm outline-none"
                        placeholder="Коротко поясните, почему вы согласны или что именно скорректировали."
                      />
                    </label>

                    {saveState.kind !== "idle" ? (
                      <div
                        className={
                          saveState.kind === "success"
                            ? "rounded-[1rem] bg-emerald-100 px-4 py-3 text-sm text-emerald-900"
                            : "rounded-[1rem] bg-rose-100 px-4 py-3 text-sm text-rose-900"
                        }
                      >
                        {saveState.message}
                      </div>
                    ) : null}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="panel-primary-button rounded-full px-5 py-3 text-sm font-semibold"
                      >
                        Сохранить проверку
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : null}

            <div className="mt-6 grid gap-2">
              <p className="panel-kicker text-xs uppercase tracking-[0.3em]">История статуса</p>
              {selectedHistory.map((entry) => (
                <div key={entry.id} className="panel-muted-card rounded-[1.1rem] px-4 py-3 text-sm">
                  {entry.oldStatus ? STATUS_META[entry.oldStatus].label : "Новая"} →{" "}
                  {STATUS_META[entry.newStatus].label}
                </div>
              ))}
            </div>
          </aside>
        ) : null}
      </section>

      {selectedReport ? (
        <section className="panel-surface rounded-[2rem] p-5">
          <p className="panel-kicker text-xs uppercase tracking-[0.3em]">Оценка AI</p>
          <p className="panel-section-title mt-3 text-lg font-semibold">
            {selectedReport.aiDeepAnalysis?.summary ??
              selectedReport.aiReason ??
              "Оценка AI пока недоступна."}
          </p>

          {selectedReport.aiDeepAnalysis ? (
            <div className="mt-4 grid gap-3">
              <div className="grid gap-3 xl:grid-cols-2">
                <InfoTile
                  title="Что увидел AI"
                  value={selectedReport.aiDeepAnalysis.observedIssue}
                />
                <InfoTile
                  title="Ожидаемая срочность"
                  value={selectedReport.aiDeepAnalysis.urgency}
                />
                <InfoTile title="Риски" value={selectedReport.aiDeepAnalysis.safetyRisk} />
                <InfoTile
                  title="Рекомендуемое действие"
                  value={selectedReport.aiDeepAnalysis.recommendedAction}
                />
              </div>

              <div className="rounded-[1rem] border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
                <p className="panel-kicker text-[11px] uppercase tracking-[0.22em]">
                  На чем основана оценка
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedReport.aiDeepAnalysis.evidence.map((item) => (
                    <span key={item} className="panel-badge rounded-full px-3 py-1 text-xs">
                      {item}
                    </span>
                  ))}
                </div>
                {selectedReport.aiDeepAnalyzedAt ? (
                  <p className="panel-copy mt-3 text-xs">
                    Обновлено: {new Date(selectedReport.aiDeepAnalyzedAt).toLocaleString("ru-RU")}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="panel-copy mt-3 max-w-[68ch] text-sm leading-7">
              Глубокая оценка появится после первой загрузки этого обращения в админской панели.
            </p>
          )}
        </section>
      ) : null}

      <section className="panel-surface rounded-[2rem] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="panel-kicker text-xs uppercase tracking-[0.35em]">Очередь модератора</p>
            <h2 className="panel-section-title mt-2 text-2xl font-semibold">
              Кластеры, отсортированные по приоритету обращения
            </h2>
          </div>
          {pending ? (
            <span className="rounded-full bg-amber-100 px-4 py-2 text-sm text-amber-900">
              Обновляем данные...
            </span>
          ) : null}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="panel-kicker text-left text-xs uppercase tracking-[0.26em]">
                <th className="px-4">Категория</th>
                <th className="px-4">Адрес</th>
                <th className="px-4">Жалобы</th>
                <th className="px-4">Приоритет</th>
                <th className="px-4">Статус</th>
                <th className="px-4">AI</th>
                <th className="px-4">Действие</th>
              </tr>
            </thead>
            <tbody>
              {sortedClusters.map((cluster) => (
                <tr
                  key={cluster.id}
                  className={`cursor-pointer text-sm ${
                    selectedCluster?.id === cluster.id ? "panel-table-row-active" : "panel-table-row"
                  }`}
                  onClick={() => setSelectedClusterId(cluster.id)}
                >
                  <td className="rounded-l-[1.3rem] px-4 py-4 font-semibold panel-section-title">
                    {CATEGORY_META[cluster.effectiveCategory].label}
                  </td>
                  <td className="px-4 py-4">{cluster.address}</td>
                  <td className="px-4 py-4">{cluster.reportCount}</td>
                  <td className="px-4 py-4">
                    <div className="font-semibold panel-section-title">{cluster.priorityScore}</div>
                    <div className="panel-copy text-xs">Базовый score: {cluster.severity}</div>
                    {cluster.effectiveVisualSeverity ? (
                      <div className="panel-copy mt-1 text-xs">
                        Срочность: {getVisualSeverityLabel(cluster.effectiveVisualSeverity).toLowerCase()}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_META[cluster.status].tone}`}>
                      {STATUS_META[cluster.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        getModeratorAiStatusMeta(
                          cluster.moderatorReviewStatus,
                          cluster.aiValidationStatus,
                        ).tone
                      }`}
                    >
                      {
                        getModeratorAiStatusMeta(
                          cluster.moderatorReviewStatus,
                          cluster.aiValidationStatus,
                        ).shortLabel
                      }
                    </span>
                  </td>
                  <td className="rounded-r-[1.3rem] px-4 py-4">
                    <select
                      value={cluster.status}
                      onChange={(event) =>
                        handleStatusChange(cluster.id, event.target.value as ClusterRecord["status"])
                      }
                      className="panel-select rounded-full px-4 py-2 text-sm outline-none"
                    >
                      <option value="open">Открыто</option>
                      <option value="in_progress">В работе</option>
                      <option value="closed">Закрыто</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function createReviewDraft(report: ReportRecord | null): ReviewDraft {
  if (!report) {
    return {
      verdict: "confirmed",
      correctedCategory: "",
      correctedVisualSeverity: "",
      note: "",
    };
  }

  if (report.reviewStatus === "corrected") {
    return {
      verdict: "corrected",
      correctedCategory: report.expertCategory ?? "",
      correctedVisualSeverity: report.expertVisualSeverity ?? "",
      note: report.reviewNote ?? "",
    };
  }

  if (report.reviewStatus === "invalidated") {
    return {
      verdict: "invalidated",
      correctedCategory: "",
      correctedVisualSeverity: "",
      note: report.reviewNote ?? "",
    };
  }

  return {
    verdict: "confirmed",
    correctedCategory: "",
    correctedVisualSeverity: "",
    note: report.reviewNote ?? "",
  };
}

function InfoTile({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[var(--panel-border)] bg-[var(--panel-soft)] p-3">
      <p className="panel-kicker text-[11px] uppercase tracking-[0.22em]">{title}</p>
      <p className="mt-2 text-sm leading-7">{value}</p>
    </div>
  );
}

function getVisualSeverityLabel(level: AiVisualSeverity) {
  switch (level) {
    case "high":
      return "Высокая срочность";
    case "medium":
      return "Средняя срочность";
    case "low":
      return "Низкая срочность";
  }
}

function getVisualSeverityTone(level: AiVisualSeverity) {
  switch (level) {
    case "high":
      return "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200";
    case "medium":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-100";
    case "low":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-100";
  }
}
