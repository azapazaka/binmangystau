import { AlertTriangle, MapPin, ThumbsDown, ThumbsUp } from "lucide-react";

import { CitizenStatusBadge } from "@/components/citizen-v2/CitizenStatusBadge";
import { CATEGORY_META } from "@/lib/constants";
import type { ReportRecord } from "@/types";

export function CitizenVerifyQueueCard({
  report,
  disabled,
  onVote,
}: {
  report: ReportRecord | null;
  disabled?: boolean;
  onVote: (verdict: "real" | "fake") => void;
}) {
  if (!report) {
    return null;
  }

  const aiCategory = report.aiCategory ?? report.userCategory;
  const categoryMeta = CATEGORY_META[aiCategory];
  const confidence = report.aiConfidence
    ? Math.round(report.aiConfidence * 100)
    : null;
  const confidenceLabel = confidence !== null ? `${confidence}%` : "Нет данных";

  const totalVotes = report.humanVotesTotal;
  const realPct =
    totalVotes > 0 ? Math.round((report.humanRealVotes / totalVotes) * 100) : 50;
  const fakePct = totalVotes > 0 ? 100 - realPct : 50;

  return (
    <article className="citizen-v2-panel">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium text-slate-400">
            Заявка #{report.id.slice(0, 8)}
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight tracking-[-0.03em] text-slate-950">
            Это реальная городская проблема?
          </h2>
        </div>
        <CitizenStatusBadge
          label={`Отправлено ${new Date(report.createdAt).toLocaleDateString("ru-RU")}`}
          tone="success"
        />
      </div>

      {/* Photo + AI panel */}
      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_280px]">
        {/* Photo */}
        <div>
          {report.photoUrl ? (
            <img
              src={report.photoUrl}
              alt={report.description || report.userCategory}
              className="h-[300px] w-full rounded-[20px] object-cover"
            />
          ) : (
            <div className="flex h-[300px] items-center justify-center rounded-[20px] bg-slate-100 text-sm font-medium text-slate-400">
              Нет фото
            </div>
          )}
        </div>

        {/* AI detected panel */}
        <div className="rounded-[20px] bg-gradient-to-b from-emerald-50/80 to-slate-50/80 p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            AI-анализ
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: categoryMeta?.color ?? "#94a3b8" }}
            />
            <p className="text-xl font-bold text-slate-950">
              {categoryMeta?.label ?? aiCategory}
            </p>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Точность {confidenceLabel}
          </p>

          {/* Confidence bar */}
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-teal-600 transition-all"
              style={{
                width:
                  confidence !== null ? `${confidence}%` : "35%",
              }}
            />
          </div>

          {/* Location */}
          <div className="mt-5 flex items-start gap-2 text-sm text-slate-600">
            <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
            <div>
              <p className="font-medium text-slate-900">
                {report.address ??
                  `${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}`}
              </p>
              <p className="text-xs text-slate-500">
                {report.district ?? "Район не указан"}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="mt-4 text-sm leading-6 text-slate-600">
            {report.description ||
              "Описание не добавлено."}
          </p>

          {/* AI tags */}
          {report.aiTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {report.aiTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vote buttons */}
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onVote("real")}
          className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-left transition hover:border-emerald-400 disabled:opacity-50"
        >
          <ThumbsUp size={20} className="text-emerald-700" />
          <p className="mt-2 text-sm font-bold text-emerald-900">Да, проблема есть</p>
          <p className="mt-1 text-xs text-emerald-700/80">
            Нужна реакция служб
          </p>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onVote("fake")}
          className="rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-4 text-left transition hover:border-amber-400 disabled:opacity-50"
        >
          <AlertTriangle size={20} className="text-amber-700" />
          <p className="mt-2 text-sm font-bold text-amber-900">Не по теме</p>
          <p className="mt-1 text-xs text-amber-700/80">
            Не относится к городской проблеме
          </p>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onVote("fake")}
          className="rounded-[20px] border border-rose-200 bg-rose-50 px-5 py-4 text-left transition hover:border-rose-400 disabled:opacity-50"
        >
          <ThumbsDown size={20} className="text-rose-700" />
          <p className="mt-2 text-sm font-bold text-rose-900">Фейк</p>
          <p className="mt-1 text-xs text-rose-700/80">
            Спам или ложная заявка
          </p>
        </button>
      </div>

      {/* Community consensus bar */}
      <div className="mt-5 rounded-[20px] border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
            Мнение жителей
          </p>
          <span className="text-[11px] text-slate-400">
            {totalVotes} голосов
          </span>
        </div>

        <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="rounded-l-full bg-emerald-500 transition-all"
            style={{ width: `${realPct}%` }}
          />
          <div
            className="rounded-r-full bg-rose-400 transition-all"
            style={{ width: `${fakePct}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-700">
              Реально {realPct}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span className="font-medium text-slate-700">
              Фейк / не по теме {fakePct}%
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
