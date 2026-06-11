import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Vote,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { listReports } from "@/lib/api";
import type { ReportRecord } from "@/types";

function formatReporter(reporterId: string | null) {
  if (!reporterId) return "Неизвестный житель";
  return `Житель ${reporterId.slice(0, 6).toUpperCase()}`;
}

export default function AdminCommunityPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listReports()
      .then((nextReports) => {
        if (!cancelled) setReports(nextReports);
      })
      .catch((nextError) => {
        if (cancelled) return;
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Не удалось загрузить данные сообщества.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const uniqueCitizens = new Set(
      reports.map((report) => report.submittedBy).filter(Boolean),
    ).size;
    const totalVotes = reports.reduce(
      (sum, report) => sum + report.humanVotesTotal,
      0,
    );
    const disputed = reports.filter(
      (report) => report.humanConfirmationStatus === "disputed",
    ).length;
    const verifiedByPublic = reports.filter(
      (report) => report.humanConfirmationStatus === "confirmed_real",
    ).length;

    return [
      {
        label: "Активные жители",
        value: uniqueCitizens,
        note: "уникальные авторы",
        icon: <Users size={18} />,
      },
      {
        label: "Голоса",
        value: totalVotes,
        note: "по проверке заявок",
        icon: <Vote size={18} />,
      },
      {
        label: "Подтверждено жителями",
        value: verifiedByPublic,
        note: "реальные случаи",
        icon: <ShieldCheck size={18} />,
      },
      {
        label: "Спорные случаи",
        value: disputed,
        note: "нужна модерация",
        icon: <Sparkles size={18} />,
      },
    ];
  }, [reports]);

  const leaderboard = useMemo(() => {
    const reporterMap = new Map<
      string,
      { reports: number; votesGenerated: number; resolved: number; latestAt: string }
    >();

    for (const report of reports) {
      const key = report.submittedBy ?? "anonymous";
      const current = reporterMap.get(key) ?? {
        reports: 0,
        votesGenerated: 0,
        resolved: 0,
        latestAt: report.createdAt,
      };

      current.reports += 1;
      current.votesGenerated += report.humanVotesTotal;
      current.resolved += report.status === "closed" ? 1 : 0;
      if (new Date(report.createdAt) > new Date(current.latestAt)) {
        current.latestAt = report.createdAt;
      }

      reporterMap.set(key, current);
    }

    return [...reporterMap.entries()]
      .map(([reporterId, value]) => ({
        reporterId,
        ...value,
        score: value.reports * 4 + value.resolved * 6 + value.votesGenerated,
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 8);
  }, [reports]);

  const watchlist = useMemo(() => {
    return reports
      .filter(
        (report) =>
          report.aiNeedsReview ||
          report.humanConfirmationStatus === "disputed" ||
          report.humanVotesTotal >= 4,
      )
      .sort((left, right) => right.humanVotesTotal - left.humanVotesTotal)
      .slice(0, 6);
  }, [reports]);

  return (
    <div className="space-y-4">
      <header>
        <p className="citizen-v2-eyebrow">Сообщество</p>
        <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
          Сообщество
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Активность жителей, спорные сигналы и вклад в проверку.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <article key={item.label} className="citizen-v2-panel flex gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              {item.icon}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
                {item.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {item.note}
              </p>
            </div>
          </article>
        ))}
      </section>

      {loading ? (
        <div className="citizen-v2-panel flex min-h-72 items-center justify-center text-sm text-slate-500">
          <LoaderCircle className="mr-2 animate-spin" size={16} />
          Загрузка активности...
        </div>
      ) : error ? (
        <div className="citizen-v2-panel rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="citizen-v2-panel">
            <div className="flex items-center justify-between">
              <div>
                <p className="citizen-v2-eyebrow">Рейтинг</p>
                <h2>Самые активные жители</h2>
              </div>
              <p className="text-xs text-slate-500">
                По заявкам, закрытиям и голосам
              </p>
            </div>
            <div className="mt-5 space-y-3">
              {leaderboard.map((citizen, index) => (
                <article
                  key={citizen.reporterId}
                  className="grid gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-sm md:grid-cols-[56px_minmax(0,1fr)_120px_120px]"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-black text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-950">
                      {formatReporter(
                        citizen.reporterId === "anonymous"
                          ? null
                          : citizen.reporterId,
                      )}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Последняя активность{" "}
                      {formatDistanceToNow(new Date(citizen.latestAt), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </p>
                  </div>
                  <div className="text-sm text-slate-500">
                    <p className="font-semibold text-slate-900">
                      {citizen.reports} заявок
                    </p>
                    <p className="mt-1">{citizen.resolved} закрыто</p>
                  </div>
                  <div className="text-sm text-slate-500">
                    <p className="font-semibold text-amber-700">
                      {citizen.score} баллов
                    </p>
                    <p className="mt-1">{citizen.votesGenerated} голосов</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="citizen-v2-panel">
              <p className="citizen-v2-eyebrow">Фокус</p>
              <h2>Заявки с вниманием жителей</h2>
              <div className="mt-4 space-y-3">
                {watchlist.map((report) => (
                  <article
                    key={report.id}
                    className="rounded-[22px] border border-slate-200 bg-slate-50/70 px-4 py-4"
                  >
                    <p className="text-sm font-semibold text-slate-950">
                      {report.description || "Описание не добавлено"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {report.address ?? report.district ?? "Локация не указана"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        {report.humanVotesTotal} голосов
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-slate-600">
                        {report.humanConfirmationStatus.replace(/_/g, " ")}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
