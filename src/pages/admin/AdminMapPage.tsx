import { format } from "date-fns";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Gauge,
  MapPin,
  Search,
  SlidersHorizontal,
  Tag,
  X,
  XCircle,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

import { CityMap } from "@/components/maps/CityMap";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { useAuth } from "@/contexts/AuthContext";
import { listClusters, listReports, reviewReport, updateClusterStatus } from "@/lib/api";
import { AI_STATUS_META, CATEGORY_META, STATUS_META } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import type {
  AiVisualSeverity,
  ClusterRecord,
  ReportCategory,
  ReportRecord,
} from "@/types";

// ── helpers ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "all", label: "Все" },
  { key: "road", label: "Дороги" },
  { key: "light", label: "Освещение" },
  { key: "trash", label: "Мусор" },
  { key: "traffic", label: "Трафик" },
  { key: "other", label: "Другое" },
];

const SEVERITY_META: Record<AiVisualSeverity, { label: string; bg: string; text: string }> = {
  low: { label: "Низкая", bg: "bg-emerald-50", text: "text-emerald-700" },
  medium: { label: "Средняя", bg: "bg-amber-50", text: "text-amber-700" },
  high: { label: "Высокая", bg: "bg-rose-50", text: "text-rose-700" },
};

// ── Report detail modal ────────────────────────────────────────────────────
function ReportModal({
  report,
  onClose,
  onReviewed,
}: {
  report: ReportRecord;
  onClose: () => void;
  onReviewed: (updated: Partial<ReportRecord>) => void;
}) {
  const { user } = useAuth();
  const [correcting, setCorrecting] = useState(false);
  const [correctedCategory, setCorrectedCategory] = useState<ReportCategory>(
    report.aiCategory ?? report.userCategory,
  );
  const [correctedSeverity, setCorrectedSeverity] = useState<AiVisualSeverity>(
    report.aiVisualSeverity ?? "low",
  );
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aiStatus = AI_STATUS_META[report.aiValidationStatus ?? "unavailable"];
  const effectiveCategory = report.aiCategory ?? report.userCategory;

  async function submit(verdict: "confirmed" | "corrected" | "invalidated") {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      await reviewReport(report.id, {
        verdict,
        correctedCategory: verdict === "corrected" ? correctedCategory : null,
        correctedVisualSeverity: verdict === "corrected" ? correctedSeverity : null,
        note: note.trim() || undefined,
        reviewedBy: user.id,
      });
      onReviewed({
        reviewStatus: verdict,
        aiCorrect: verdict === "confirmed",
        expertCategory: verdict === "corrected" ? correctedCategory : null,
        expertVisualSeverity: verdict === "corrected" ? correctedSeverity : null,
        reviewNote: note.trim() || null,
        reviewedBy: user.id,
        reviewedAt: new Date().toISOString(),
        aiNeedsReview: false,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
      setSaving(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700">
              Обращение
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900">
              {CATEGORY_META[effectiveCategory]?.label ?? effectiveCategory}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="mt-1 text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-0 md:grid-cols-[1fr_1.1fr]">
            {/* Photo */}
            <div className="bg-slate-100">
              {report.photoUrl ? (
                <img
                  src={report.photoUrl}
                  alt="Фото обращения"
                  className="h-full max-h-[340px] w-full object-cover"
                />
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-slate-400">
                  Нет фото
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-4 p-5">
              {/* Location */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Локация
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {report.address ?? `${report.lat.toFixed(5)}, ${report.lng.toFixed(5)}`}
                </p>
                {report.district && (
                  <p className="mt-0.5 text-xs text-slate-500">{report.district}</p>
                )}
              </div>

              {/* Description */}
              {report.description && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Описание
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{report.description}</p>
                </div>
              )}

              {/* User category */}
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Категория пользователя:
                </p>
                <CategoryBadge category={report.userCategory} />
              </div>

              {/* AI Analysis */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <Bot size={14} className="text-teal-600" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                    AI-анализ
                  </p>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {/* Validation status */}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${aiStatus.bgClass} ${aiStatus.textClass}`}
                  >
                    {aiStatus.label}
                  </span>

                  {/* AI category */}
                  {report.aiCategory && (
                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                      {CATEGORY_META[report.aiCategory]?.label}
                    </span>
                  )}

                  {/* Visual severity */}
                  {report.aiVisualSeverity && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${SEVERITY_META[report.aiVisualSeverity].bg} ${SEVERITY_META[report.aiVisualSeverity].text}`}
                    >
                      {SEVERITY_META[report.aiVisualSeverity].label}
                    </span>
                  )}

                  {/* Confidence */}
                  {report.aiConfidence != null && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {Math.round(report.aiConfidence * 100)}% уверенность
                    </span>
                  )}
                </div>

                {/* AI reason */}
                {report.aiReason && (
                  <p className="mt-2 text-[11px] leading-5 text-slate-600">{report.aiReason}</p>
                )}

                {/* Tags */}
                {report.aiTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <Tag size={10} className="text-slate-400" />
                    {report.aiTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-500 ring-1 ring-slate-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Review status badge */}
              {report.reviewStatus !== "pending" && (
                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  Проверено:{" "}
                  {report.reviewStatus === "confirmed"
                    ? "Подтверждено"
                    : report.reviewStatus === "corrected"
                      ? "Исправлено"
                      : "Отклонено"}
                </div>
              )}

              <p className="text-[10px] text-slate-400">
                {format(new Date(report.createdAt), "dd.MM.yyyy HH:mm")}
              </p>
            </div>
          </div>

          {/* Review actions */}
          {report.reviewStatus === "pending" && (
            <div className="border-t border-slate-100 px-5 pb-5 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Действия администратора
              </p>

              {correcting ? (
                <div className="mt-3 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500">
                        Категория
                      </label>
                      <select
                        value={correctedCategory}
                        onChange={(e) => setCorrectedCategory(e.target.value as ReportCategory)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-teal-500"
                      >
                        {(Object.keys(CATEGORY_META) as ReportCategory[]).map((cat) => (
                          <option key={cat} value={cat}>
                            {CATEGORY_META[cat].label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500">
                        Серьёзность
                      </label>
                      <select
                        value={correctedSeverity}
                        onChange={(e) => setCorrectedSeverity(e.target.value as AiVisualSeverity)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-teal-500"
                      >
                        {(Object.keys(SEVERITY_META) as AiVisualSeverity[]).map((s) => (
                          <option key={s} value={s}>
                            {SEVERITY_META[s].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Примечание (необязательно)"
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-teal-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => submit("corrected")}
                      className="flex-1 rounded-xl bg-teal-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {saving ? "Сохранение..." : "Сохранить исправление"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCorrecting(false)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => submit("confirmed")}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    <CheckCircle2 size={13} /> Подтвердить
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setCorrecting(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    <AlertTriangle size={13} /> Исправить
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => submit("invalidated")}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    <XCircle size={13} /> Отклонить
                  </button>
                </div>
              )}

              {error && (
                <p className="mt-2 text-xs text-rose-600">{error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Cluster detail panel ───────────────────────────────────────────────────
function ClusterPanel({
  cluster,
  onClose,
  onStatusChange,
  onOpenReport,
}: {
  cluster: ClusterRecord;
  onClose: () => void;
  onStatusChange: (status: ClusterRecord["status"]) => void;
  onOpenReport: (report: ReportRecord) => void;
}) {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    setLoadingReports(true);
    listReports({ clusterId: cluster.id })
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoadingReports(false));
  }, [cluster.id]);

  const aiStatus = AI_STATUS_META[cluster.aiValidationStatus ?? "unavailable"];
  const sm = STATUS_META[cluster.status];

  return (
    <div className="citizen-v2-panel h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <CategoryBadge category={cluster.category} />
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sm.bgClass} ${sm.textClass}`}>
            {sm.label}
          </span>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
          <X size={14} />
        </button>
      </div>

      {/* Photo */}
      {cluster.representativePhotoUrl && (
        <img
          src={cluster.representativePhotoUrl}
          alt=""
          className="mt-3 h-36 w-full rounded-2xl object-cover"
        />
      )}

      {/* Address */}
      <p className="mt-3 text-sm font-bold text-slate-900">
        {cluster.address ?? `${cluster.lat.toFixed(4)}, ${cluster.lng.toFixed(4)}`}
      </p>
      {cluster.district && (
        <p className="mt-0.5 text-xs text-slate-500">{cluster.district}</p>
      )}

      {/* Stats */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-50 p-2">
          <p className="text-sm font-bold text-slate-900">{cluster.reportCount}</p>
          <p className="text-[9px] text-slate-400">Заявки</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <p className="text-sm font-bold text-slate-900">{Math.round(cluster.priorityScore)}</p>
          <p className="text-[9px] text-slate-400">Приоритет</p>
        </div>
        <div className={`rounded-xl p-2 ${aiStatus.bgClass}`}>
          <p className={`text-[10px] font-bold ${aiStatus.textClass}`}>{aiStatus.label}</p>
          <p className="text-[9px] text-slate-400">AI</p>
        </div>
      </div>

      {/* AI top factors */}
      {cluster.topFactors.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Факторы приоритета
          </p>
          <div className="mt-1.5 space-y-1">
            {cluster.topFactors.slice(0, 3).map((factor) => (
              <div key={factor.key} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">{factor.label}</span>
                <span className="font-semibold text-slate-800">{factor.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority reason */}
      {cluster.priorityReason && (
        <div className="mt-3 rounded-xl bg-teal-50 px-3 py-2">
          <p className="text-[11px] leading-5 text-teal-800">{cluster.priorityReason}</p>
        </div>
      )}

      {/* Status change */}
      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Статус кластера
        </p>
        <div className="mt-1.5 flex gap-1.5">
          {(["open", "in_progress", "closed"] as const).map((status) => {
            const meta = STATUS_META[status];
            return (
              <button
                key={status}
                type="button"
                onClick={() => onStatusChange(status)}
                className={[
                  "flex-1 rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition",
                  cluster.status === status
                    ? `${meta.bgClass} ${meta.textClass} border-current`
                    : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100",
                ].join(" ")}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reports in cluster */}
      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Обращения в кластере
        </p>
        <div className="mt-2 space-y-2">
          {loadingReports ? (
            <p className="text-xs text-slate-400">Загрузка...</p>
          ) : reports.length === 0 ? (
            <p className="text-xs text-slate-400">Нет обращений</p>
          ) : (
            reports.map((report) => {
              const rAiStatus = AI_STATUS_META[report.aiValidationStatus ?? "unavailable"];
              return (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => onOpenReport(report)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-2.5 text-left transition hover:border-teal-300 hover:bg-teal-50/30"
                >
                  {report.photoUrl ? (
                    <img
                      src={report.photoUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[8px] text-slate-400">
                      —
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${rAiStatus.bgClass} ${rAiStatus.textClass}`}>
                        {rAiStatus.label}
                      </span>
                      {report.aiVisualSeverity && (
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${SEVERITY_META[report.aiVisualSeverity].bg} ${SEVERITY_META[report.aiVisualSeverity].text}`}>
                          {SEVERITY_META[report.aiVisualSeverity].label}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] font-medium text-slate-700">
                      {report.description || report.address || "Без описания"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {format(new Date(report.createdAt), "dd.MM.yy HH:mm")}
                    </p>
                  </div>
                  <ChevronRight size={12} className="shrink-0 text-slate-400" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AdminMapPage() {
  const [clusters, setClusters] = useState<ClusterRecord[]>([]);
  const [allReports, setAllReports] = useState<ReportRecord[]>([]);
  const [cat, setCat] = useState("all");
  const [selected, setSelected] = useState<ClusterRecord | null>(null);
  const [search, setSearch] = useState("");
  const [openReport, setOpenReport] = useState<ReportRecord | null>(null);

  async function refreshClusters(currentCategory: string, selectedId?: string | null) {
    const nextClusters = await listClusters({
      category: currentCategory !== "all" ? (currentCategory as ReportCategory) : undefined,
    });

    setClusters(nextClusters);
    setSelected((current) => {
      const targetId = selectedId ?? current?.id ?? null;
      return targetId
        ? (nextClusters.find((cluster) => cluster.id === targetId) ?? nextClusters[0] ?? null)
        : (nextClusters[0] ?? null);
    });
  }

  async function refreshReports() {
    const nextReports = await listReports();
    setAllReports(nextReports);
  }

  useEffect(() => {
    refreshClusters(cat).catch(console.error);
  }, [cat]);

  useEffect(() => {
    refreshReports().catch(console.error);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-map-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clusters" },
        () => {
          refreshClusters(cat, selected?.id ?? null).catch(console.error);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        () => {
          refreshReports().catch(console.error);
          refreshClusters(cat, selected?.id ?? null).catch(console.error);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [cat, selected?.id]);

  const stats = useMemo(() => {
    const active = clusters.filter((c) => c.status !== "closed").length;
    const highPriority = clusters.filter((c) => c.priorityScore >= 65).length;
    return { reports: allReports.length, clusters: clusters.length, active, highPriority };
  }, [clusters, allReports]);

  const handleStatusChange = async (status: ClusterRecord["status"]) => {
    if (!selected) return;
    try {
      await updateClusterStatus(selected.id, status);
      setClusters((cs) =>
        cs.map((c) => (c.id === selected.id ? { ...c, status } : c)),
      );
      setSelected((cur) => (cur ? { ...cur, status } : null));
    } catch (e) {
      console.error(e);
    }
  };

  const filteredReports = allReports
    .filter((r) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.address?.toLowerCase().includes(q) ||
        r.district?.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    })
    .slice(0, 10);

  function handleReportReviewed(reportId: string, updated: Partial<ReportRecord>) {
    setAllReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, ...updated } : r)),
    );
    if (openReport?.id === reportId) {
      setOpenReport((r) => (r ? { ...r, ...updated } : null));
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <p className="citizen-v2-eyebrow">Карта и обращения</p>
        <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
          Карта и обращения
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Сводка по карте, свежие обращения и быстрый просмотр выбранного кластера.
        </p>
      </header>

      {/* Stats */}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Обращения", value: stats.reports, note: "в системе" },
          { label: "Кластеры", value: stats.clusters, note: "на карте" },
          { label: "Активные", value: stats.active, note: "не закрыты" },
          { label: "Приоритет", value: stats.highPriority, note: "65+" },
        ].map((item) => (
          <article key={item.label} className="citizen-v2-panel flex gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Gauge size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                {item.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{item.note}</p>
            </div>
          </article>
        ))}
      </section>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <Search size={14} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по адресу или описанию"
            className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCat(c.key)}
              className={[
                "rounded-xl border px-3 py-1.5 text-xs font-medium transition",
                cat === c.key
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              {c.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <SlidersHorizontal size={12} />
          Фильтры
        </button>
      </div>

      {/* Map + panel */}
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        {/* Left: map + reports table */}
        <div className="space-y-4">
          <div className="citizen-v2-panel !p-2">
            <div className="overflow-hidden rounded-2xl">
              <CityMap
                clusters={clusters}
                selectedId={selected?.id}
                onSelect={(id) =>
                  setSelected(clusters.find((c) => c.id === id) ?? null)
                }
                height="440px"
                className="rounded-2xl"
              />
            </div>
          </div>

          {/* Reports table */}
          <div className="citizen-v2-panel">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                {search ? `Результаты: ${filteredReports.length}` : "Последние обращения"}
              </p>
              <span className="text-[10px] text-slate-400">
                Нажмите на строку для просмотра
              </span>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="pb-2 pr-3">Фото</th>
                    <th className="pb-2 pr-3">Описание</th>
                    <th className="pb-2 pr-3">Адрес</th>
                    <th className="pb-2 pr-3">Дата</th>
                    <th className="pb-2 pr-3">Категория</th>
                    <th className="pb-2 pr-3">AI</th>
                    <th className="pb-2">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        Заявки не найдены
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => {
                      const sm = STATUS_META[report.status];
                      const aiSt = AI_STATUS_META[report.aiValidationStatus ?? "unavailable"];
                      return (
                        <tr
                          key={report.id}
                          onClick={() => setOpenReport(report)}
                          className="cursor-pointer border-b border-slate-50 transition hover:bg-teal-50/40"
                        >
                          <td className="py-2 pr-3">
                            {report.photoUrl ? (
                              <img
                                src={report.photoUrl}
                                alt=""
                                className="h-9 w-9 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-[8px] text-slate-400">
                                —
                              </div>
                            )}
                          </td>
                          <td className="max-w-[160px] truncate py-2 pr-3 font-medium text-slate-900">
                            {report.description || "Без описания"}
                          </td>
                          <td className="py-2 pr-3 text-slate-500">
                            <div className="flex items-center gap-1">
                              <MapPin size={10} className="shrink-0 text-slate-400" />
                              <span className="max-w-[110px] truncate">
                                {report.address ?? report.district ?? "—"}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 pr-3 text-slate-500">
                            {format(new Date(report.createdAt), "dd.MM.yy")}
                          </td>
                          <td className="py-2 pr-3">
                            <CategoryBadge category={report.aiCategory ?? report.userCategory} />
                          </td>
                          <td className="py-2 pr-3">
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${aiSt.bgClass} ${aiSt.textClass}`}>
                              {aiSt.label}
                            </span>
                          </td>
                          <td className="py-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sm.bgClass} ${sm.textClass}`}>
                              {sm.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: cluster detail panel */}
        {selected ? (
          <ClusterPanel
            key={selected.id}
            cluster={selected}
            onClose={() => setSelected(null)}
            onStatusChange={handleStatusChange}
            onOpenReport={setOpenReport}
          />
        ) : (
          <div
            className="citizen-v2-panel flex flex-col items-center justify-center gap-3 text-center"
            style={{ minHeight: 300 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <MapPin size={22} />
            </div>
            <p className="text-sm font-semibold text-slate-500">Точка не выбрана</p>
            <p className="max-w-[180px] text-xs text-slate-400">
              Выберите точку на карте или в списке
            </p>
          </div>
        )}
      </div>

      {/* Report detail modal */}
      {openReport && (
        <ReportModal
          report={openReport}
          onClose={() => setOpenReport(null)}
          onReviewed={(updated) => handleReportReviewed(openReport.id, updated)}
        />
      )}
    </div>
  );
}
