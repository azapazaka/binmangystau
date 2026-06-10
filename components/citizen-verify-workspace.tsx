"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { HumanConfirmationBadge } from "@/components/human-confirmation-badge";
import { AI_STATUS_META, CATEGORY_META, STATUS_META } from "@/lib/constants";
import { getHumanConfirmationInterpretation } from "@/lib/human-confirmation";
import type { HumanVoteVerdict, ReportRecord } from "@/types";

type CitizenVerifyWorkspaceProps = {
  initialReports: ReportRecord[];
  citizenName: string;
  isDemoCitizen: boolean;
};

type SaveState =
  | { kind: "idle"; message: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

type LoadQueueOptions = {
  reset?: boolean;
  includeReviewed?: boolean;
};

const SWIPE_THRESHOLD = 120;
const QUEUE_LIMIT = 6;

export function CitizenVerifyWorkspace({
  initialReports,
  citizenName,
  isDemoCitizen,
}: CitizenVerifyWorkspaceProps) {
  const [queue, setQueue] = useState(initialReports);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [includeReviewed, setIncludeReviewed] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({
    kind: "idle",
    message:
      "Свайпайте вправо, если жалоба выглядит реальной, и влево, если что-то не сходится.",
  });

  const cardRef = useRef<HTMLDivElement | null>(null);
  const activePointerId = useRef<number | null>(null);
  const dragStartX = useRef(0);
  const dragOffset = useRef(0);
  const animationFrameId = useRef<number | null>(null);

  const topReport = queue[0] ?? null;
  const previewReports = queue.slice(1, 3);

  useEffect(() => {
    dragOffset.current = 0;
    setDragging(false);
    updateCardTransform(0, false);
  }, [topReport?.id]);

  useEffect(() => {
    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  function updateCardTransform(offset: number, immediate: boolean) {
    const node = cardRef.current;

    if (!node) {
      return;
    }

    node.style.transition = immediate ? "none" : "transform 180ms ease";
    node.style.transform = `translateX(${offset}px) rotate(${offset / 18}deg)`;
  }

  function scheduleCardTransform(offset: number) {
    dragOffset.current = offset;

    if (animationFrameId.current !== null) {
      return;
    }

    animationFrameId.current = window.requestAnimationFrame(() => {
      animationFrameId.current = null;
      updateCardTransform(dragOffset.current, true);
    });
  }

  async function loadMoreQueue(options: LoadQueueOptions = {}) {
    if (loadingMore) {
      return;
    }

    const shouldIncludeReviewed = options.includeReviewed ?? includeReviewed;
    setLoadingMore(true);

    try {
      const searchParams = new URLSearchParams({ limit: String(QUEUE_LIMIT) });

      if (shouldIncludeReviewed) {
        searchParams.set("includeReviewed", "1");
      }

      const response = await fetch(`/api/reports/verify-queue?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error("Не удалось обновить очередь.");
      }

      const payload = (await response.json()) as { reports?: ReportRecord[] };
      const nextReports = payload.reports ?? [];

      setQueue((current) => {
        if (options.reset) {
          return nextReports;
        }

        const currentIds = new Set(current.map((report) => report.id));
        const uniqueNextReports = nextReports.filter((report) => !currentIds.has(report.id));
        return uniqueNextReports.length > 0 ? [...current, ...uniqueNextReports] : current;
      });
    } catch (error) {
      setSaveState({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Не удалось обновить очередь. Попробуйте ещё раз.",
      });
    } finally {
      setLoadingMore(false);
    }
  }

  async function submitVote(verdict: HumanVoteVerdict) {
    if (!topReport || submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/reports/${topReport.id}/human-vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ verdict }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Не удалось сохранить голос.");
      }

      const nextQueueLength = Math.max(queue.length - 1, 0);
      setQueue((current) => current.filter((report) => report.id !== topReport.id));
      setSaveState({
        kind: "success",
        message:
          verdict === "real"
            ? "Голос записан: жалоба отмечена как реальная."
            : "Голос записан: жалоба отмечена как подозрительная.",
      });

      if (!includeReviewed && nextQueueLength <= 3) {
        void loadMoreQueue();
      }
    } catch (error) {
      setSaveState({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Не удалось сохранить голос. Попробуйте ещё раз.",
      });
    } finally {
      activePointerId.current = null;
      dragOffset.current = 0;
      setSubmitting(false);
      setDragging(false);
      updateCardTransform(0, false);
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!topReport || submitting) {
      return;
    }

    activePointerId.current = event.pointerId;
    dragStartX.current = event.clientX;
    dragOffset.current = 0;
    setDragging(true);
    updateCardTransform(0, true);

    if ("setPointerCapture" in event.currentTarget) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || activePointerId.current !== event.pointerId) {
      return;
    }

    scheduleCardTransform(event.clientX - dragStartX.current);
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (activePointerId.current !== event.pointerId) {
      return;
    }

    activePointerId.current = null;

    if ("releasePointerCapture" in event.currentTarget) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const currentOffset = dragOffset.current;

    if (Math.abs(currentOffset) >= SWIPE_THRESHOLD && topReport) {
      void submitVote(currentOffset > 0 ? "real" : "fake");
      return;
    }

    setDragging(false);
    dragOffset.current = 0;
    updateCardTransform(0, false);
  }

  function handleEnableReplayMode() {
    setIncludeReviewed(true);
    setSaveState({
      kind: "idle",
      message: "Демо-режим повтора включён. Можно снова пройти очередь и показать сценарий заново.",
    });
    void loadMoreQueue({ reset: true, includeReviewed: true });
  }

  return (
    <div className="grid gap-6">
      <section className="panel-surface rounded-[2.2rem] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Citizen verification</p>
            <h1 className="panel-title mt-3 text-5xl">Проверка жалоб жителями</h1>
            <p className="panel-copy mt-4 max-w-3xl text-base leading-8">
              {citizenName}, здесь вы помогаете администраторам отделять реальные городские
              проблемы от сомнительных карточек. AI остаётся отдельным сигналом, а ваш голос
              создаёт человеческое подтверждение.
            </p>
          </div>
          {includeReviewed ? (
            <span className="panel-badge rounded-full px-4 py-2 text-xs uppercase tracking-[0.24em]">
              Демо-режим повтора
            </span>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <div className="panel-surface rounded-[2rem] p-5 md:p-6">
          {topReport ? (
            <div className="grid gap-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="panel-kicker text-xs uppercase tracking-[0.28em]">Очередь проверки</p>
                  <p className="panel-copy mt-2 text-sm">
                    Доступно сейчас: {queue.length} {queue.length === 1 ? "карточка" : "карточек"}
                  </p>
                </div>
                {loadingMore ? (
                  <span className="panel-badge rounded-full px-3 py-1 text-xs">Обновляем очередь</span>
                ) : null}
              </div>

              <div className="relative mx-auto flex min-h-[640px] w-full max-w-[680px] items-center justify-center">
                {previewReports
                  .slice()
                  .reverse()
                  .map((report, index) => {
                    const layer = previewReports.length - index;
                    return (
                      <div
                        key={report.id}
                        className="panel-muted-card absolute inset-x-6 top-8 rounded-[2rem] border border-[color:var(--panel-border)] p-6 opacity-80"
                        style={{
                          transform: `translateY(${layer * 16}px) scale(${1 - layer * 0.04})`,
                        }}
                      >
                        <p className="panel-kicker text-xs uppercase tracking-[0.28em]">
                          Следующая жалоба
                        </p>
                        <p className="panel-title mt-4 text-xl font-semibold">
                          {report.address ?? "Адрес уточняется"}
                        </p>
                      </div>
                    );
                  })}

                <div
                  ref={cardRef}
                  role="button"
                  tabIndex={0}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  onPointerCancel={handlePointerEnd}
                  className="panel-surface-strong relative z-10 w-full overflow-hidden rounded-[2.2rem] border border-[color:var(--panel-border)] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.24)] outline-none will-change-transform"
                  style={{ touchAction: "pan-y" }}
                >
                  <div className="relative h-[280px] overflow-hidden rounded-[1.6rem]">
                    <Image
                      src={topReport.photoUrl}
                      alt={topReport.address ?? "Жалоба жителя"}
                      fill
                      unoptimized
                      sizes="(max-width: 1280px) 100vw, 680px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,23,42,0.92)] via-[rgba(15,23,42,0.18)] to-transparent" />
                    <div className="absolute left-4 right-4 top-4 flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white"
                        style={{ backgroundColor: CATEGORY_META[topReport.userCategory].color }}
                      >
                        {CATEGORY_META[topReport.userCategory].label}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${AI_STATUS_META[topReport.aiValidationStatus].tone}`}
                      >
                        {AI_STATUS_META[topReport.aiValidationStatus].shortLabel}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${STATUS_META[topReport.status].tone}`}
                      >
                        {STATUS_META[topReport.status].label}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="panel-title text-2xl font-semibold text-white">
                        {topReport.address ?? "Адрес уточняется"}
                      </p>
                      <p className="mt-2 text-sm text-white/80">
                        {new Date(topReport.createdAt).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4">
                    <p className="panel-copy text-base leading-8">
                      {topReport.description || "Житель не оставил текстового описания."}
                    </p>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="panel-muted-card rounded-[1.3rem] p-4">
                        <p className="panel-kicker text-xs uppercase tracking-[0.28em]">AI confirmation</p>
                        <p className="panel-title mt-3 text-lg font-semibold">
                          {AI_STATUS_META[topReport.aiValidationStatus].label}
                        </p>
                        <p className="panel-copy mt-2 text-sm leading-7">
                          {topReport.aiReason ?? "AI пока не оставил текстового пояснения."}
                        </p>
                      </div>

                      <div className="panel-muted-card rounded-[1.3rem] p-4">
                        <p className="panel-kicker text-xs uppercase tracking-[0.28em]">
                          Подтверждение людей
                        </p>
                        <div className="mt-3">
                          <HumanConfirmationBadge report={topReport} />
                        </div>
                        <p className="panel-copy mt-2 text-sm leading-7">
                          {getHumanConfirmationInterpretation(topReport)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => void submitVote("fake")}
                        disabled={submitting}
                        className="rounded-[1.4rem] border border-rose-300 bg-rose-50 px-5 py-4 text-left text-rose-900 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="block text-xs font-semibold uppercase tracking-[0.24em]">
                          Свайп влево
                        </span>
                        <span className="mt-2 block text-2xl font-semibold">Фейк</span>
                        <span className="mt-2 block text-sm leading-7">
                          Если фото или описание не похожи на реальную городскую проблему.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => void submitVote("real")}
                        disabled={submitting}
                        className="rounded-[1.4rem] border border-emerald-300 bg-emerald-50 px-5 py-4 text-left text-emerald-900 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="block text-xs font-semibold uppercase tracking-[0.24em]">
                          Свайп вправо
                        </span>
                        <span className="mt-2 block text-2xl font-semibold">Реально</span>
                        <span className="mt-2 block text-sm leading-7">
                          Если жалоба выглядит достоверно и действительно касается городской среды.
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="panel-muted-card rounded-[1.8rem] border-dashed p-8">
              <p className="panel-kicker text-xs uppercase tracking-[0.28em]">Очередь пуста</p>
              <h2 className="panel-title mt-3 text-3xl font-semibold">На сейчас всё просмотрено</h2>
              <p className="panel-copy mt-4 max-w-2xl text-sm leading-8">
                {isDemoCitizen
                  ? "Вы уже прошли доступную очередь. Для показа сценария другим можно заново включить демо-повтор и пройти те же карточки ещё раз."
                  : "Вы уже помогли с доступными жалобами. Позже сюда попадут новые обращения или карточки, по которым ещё не хватает человеческого сигнала."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {isDemoCitizen ? (
                  <button
                    type="button"
                    onClick={handleEnableReplayMode}
                    disabled={loadingMore}
                    className="panel-primary-button rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Показать демо-очередь заново
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void loadMoreQueue()}
                    disabled={loadingMore}
                    className="panel-primary-button rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Проверить очередь ещё раз
                  </button>
                )}
                <Link href="/citizen/my-reports" className="panel-link rounded-full px-5 py-3 text-sm font-semibold">
                  Перейти к моим жалобам
                </Link>
              </div>
            </div>
          )}
        </div>

        <aside className="grid gap-4">
          <section className="panel-surface rounded-[1.8rem] p-5">
            <p className="panel-kicker text-xs uppercase tracking-[0.3em]">Как это работает</p>
            <div className="mt-4 grid gap-3">
              <div className="panel-muted-card rounded-[1.2rem] p-4">
                <p className="panel-section-title text-lg font-semibold">1. Смотрите карточку</p>
                <p className="panel-copy mt-2 text-sm leading-7">
                  Фото, описание, адрес и AI-метка помогают быстро понять контекст жалобы.
                </p>
              </div>
              <div className="panel-muted-card rounded-[1.2rem] p-4">
                <p className="panel-section-title text-lg font-semibold">2. Голосуете свайпом</p>
                <p className="panel-copy mt-2 text-sm leading-7">
                  Вправо: жалоба выглядит реальной. Влево: есть признаки фейка или ошибки.
                </p>
              </div>
              <div className="panel-muted-card rounded-[1.2rem] p-4">
                <p className="panel-section-title text-lg font-semibold">3. Помогаете админам</p>
                <p className="panel-copy mt-2 text-sm leading-7">
                  Итоговый human confirmation появляется рядом с AI и ручной модерацией.
                </p>
              </div>
            </div>
          </section>

          <section className="panel-surface rounded-[1.8rem] p-5">
            <p className="panel-kicker text-xs uppercase tracking-[0.3em]">Состояние</p>
            <div className="mt-4 rounded-[1.2rem] border border-[color:var(--panel-border)] bg-[var(--panel-soft)] p-4">
              <p
                className={
                  saveState.kind === "error"
                    ? "text-sm font-medium text-rose-900"
                    : saveState.kind === "success"
                      ? "text-sm font-medium text-emerald-900"
                      : "text-sm font-medium panel-copy"
                }
              >
                {saveState.message}
              </p>
              {submitting ? (
                <p className="panel-copy mt-3 text-xs uppercase tracking-[0.22em]">
                  Сохраняем голос...
                </p>
              ) : null}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
