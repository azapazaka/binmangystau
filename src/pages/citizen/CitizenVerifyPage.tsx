import { Award, ShieldCheck, ThumbsUp } from "lucide-react";

import { CitizenShell } from "@/components/citizen-v2/CitizenShell";
import { CitizenVerifyQueueCard } from "@/components/citizen-v2/CitizenVerifyQueueCard";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useCitizenVerifyQueue } from "@/hooks/useCitizenVerifyQueue";

export default function CitizenVerifyPage() {
  const { user } = useAuth();
  const { loading, error, submitting, current, next, vote, civicImpact } =
    useCitizenVerifyQueue(user?.id ?? null);

  return (
    <CitizenShell
      title="Очередь проверки"
      subtitle="Жители помогают подтверждать обращения и снижать шум в системе."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main content */}
        <div className="space-y-5">
          {loading ? (
            <div className="citizen-v2-panel text-sm text-slate-500">
              Загрузка очереди...
            </div>
          ) : error ? (
            <div className="citizen-v2-panel text-sm text-rose-700">
              {error}
            </div>
          ) : current ? (
            <CitizenVerifyQueueCard
              report={current}
              disabled={submitting}
              onVote={vote}
            />
          ) : (
            <div className="citizen-v2-panel flex h-64 items-center justify-center text-sm text-slate-500">
              Сейчас нет заявок для проверки.
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Civic impact */}
          <article className="citizen-v2-panel">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Ваш вклад
                </p>
                <p className="text-2xl font-black tracking-[-0.04em] text-slate-950">
                  {civicImpact.score}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-[18px] bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <ThumbsUp size={16} />
                  <span className="text-xs font-medium">Полезные голоса</span>
                </div>
                <p className="mt-1.5 text-xl font-bold text-slate-950">
                  {civicImpact.helpfulVotes}
                </p>
              </div>
              <div className="rounded-[18px] bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <Award size={16} />
                  <span className="text-xs font-medium">Проверено сегодня</span>
                </div>
                <p className="mt-1.5 text-xl font-bold text-slate-950">
                  {civicImpact.verifiedToday}
                </p>
              </div>
            </div>
          </article>

          {/* Next in queue */}
          <article className="citizen-v2-panel">
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              Дальше в очереди
            </p>
            <h2 className="mt-1 text-sm font-bold text-slate-900">
              Следующие заявки
            </h2>

            <div className="mt-4 space-y-2.5">
              {next.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Дополнительных заявок сейчас нет.
                </p>
              ) : (
                next.map((report) => (
                  <div
                    key={report.id}
                    className="flex gap-3 rounded-[18px] border border-slate-200 bg-white p-2.5"
                  >
                    {report.photoUrl ? (
                      <img
                        src={report.photoUrl}
                        alt={report.description || report.userCategory}
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-semibold text-slate-400">
                        Нет фото
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-900">
                        {report.description || report.userCategory}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {report.address ??
                          report.district ??
                          "Локация не указана"}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <CategoryBadge
                          category={report.aiCategory ?? report.userCategory}
                        />
                        {report.aiConfidence && (
                          <span className="text-[10px] text-slate-400">
                            {Math.round(report.aiConfidence * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </div>
      </div>
    </CitizenShell>
  );
}
