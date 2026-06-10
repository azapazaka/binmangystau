"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";

import { CATEGORY_META } from "@/lib/constants";
import type { LocationSource, ReportCategory } from "@/types";

import { LocationPickerModal } from "./location-picker-modal";

type ReportFormProps = {
  weeklyReports: number;
};

type SubmissionFeedback = {
  kind: "success" | "retry" | "rejected" | "error" | "info";
  message: string;
  reasons?: string[];
  suggestedCategory?: ReportCategory | null;
};

type ReportApiErrorPayload = {
  message?: string;
  reasons?: string[];
  suggestedCategory?: ReportCategory | null;
  decision?: "retry" | "rejected";
  moderationAttemptCount?: number;
};

type ResolvedLocationPayload = {
  location?: {
    address?: string | null;
  };
};

type LocationDraft = {
  source: LocationSource;
  lat: number | null;
  lng: number | null;
  resolvedAddress: string;
  addressOverride: string;
};

const STEPS = [
  { id: 0, title: "Категория", hint: "Выберите тип проблемы" },
  { id: 1, title: "Фото", hint: "Добавьте изображение" },
  { id: 2, title: "Место", hint: "Адрес, геопозиция или карта" },
  { id: 3, title: "Проверка", hint: "Описание и отправка" },
] as const;

function createInitialLocationDraft(): LocationDraft {
  return {
    source: "manual",
    lat: null,
    lng: null,
    resolvedAddress: "",
    addressOverride: "",
  };
}

export function ReportForm({ weeklyReports }: ReportFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<LocationDraft>(createInitialLocationDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [feedback, setFeedback] = useState<SubmissionFeedback | null>(null);
  const [moderationAttempts, setModerationAttempts] = useState(0);

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(photo);
    setPreviewUrl(nextPreviewUrl);

    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [photo]);

  const trimmedAddress = location.addressOverride.trim();
  const isLocked = moderationAttempts >= 3;
  const hasSelectedCoordinates = location.lat !== null && location.lng !== null;
  const hasValidLocation =
    location.source === "manual"
      ? trimmedAddress.length > 0
      : hasSelectedCoordinates;

  const locationSummary = useMemo(() => {
    if (trimmedAddress) {
      return trimmedAddress;
    }

    if (location.resolvedAddress) {
      return location.resolvedAddress;
    }

    if (location.source === "manual") {
      return "Введите адрес вручную.";
    }

    if (location.source === "geolocation") {
      return "Определите текущее местоположение.";
    }

    return "Выберите точку на карте.";
  }, [location.resolvedAddress, location.source, trimmedAddress]);

  function updateLocationSource(nextSource: LocationSource) {
    setLocation((current) => {
      if (nextSource === "manual") {
        return {
          source: "manual",
          lat: null,
          lng: null,
          resolvedAddress: current.resolvedAddress,
          addressOverride: current.addressOverride,
        };
      }

      return {
        ...current,
        source: nextSource,
      };
    });
  }

  async function resolveAddressFromCoordinates(lat: number, lng: number) {
    const response = await fetch(`/api/location/reverse?lat=${lat}&lng=${lng}`);

    if (!response.ok) {
      throw new Error("Reverse geocoding request failed.");
    }

    const payload = (await response.json()) as ResolvedLocationPayload;

    return payload.location?.address?.trim() || "Локация уточняется";
  }

  function activateManualMode() {
    updateLocationSource("manual");
  }

  async function activateGeolocationMode() {
    if (!navigator.geolocation) {
      setFeedback({
        kind: "info",
        message: "Браузер не поддерживает геолокацию. Введите адрес вручную или выберите точку на карте.",
      });
      return;
    }

    setIsResolvingLocation(true);
    setFeedback({
      kind: "info",
      message: "Определяем местоположение...",
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLat = position.coords.latitude;
        const nextLng = position.coords.longitude;

        try {
          const resolvedAddress = await resolveAddressFromCoordinates(nextLat, nextLng);

          setLocation({
            source: "geolocation",
            lat: nextLat,
            lng: nextLng,
            resolvedAddress,
            addressOverride: resolvedAddress,
          });
          setFeedback({
            kind: "info",
            message: "Местоположение определено. Адрес можно уточнить перед отправкой.",
          });
        } catch {
          setLocation({
            source: "geolocation",
            lat: nextLat,
            lng: nextLng,
            resolvedAddress: "Локация уточняется",
            addressOverride: "Локация уточняется",
          });
          setFeedback({
            kind: "info",
            message: "Точка найдена, но адрес не удалось уточнить автоматически.",
          });
        } finally {
          setIsResolvingLocation(false);
        }
      },
      () => {
        setIsResolvingLocation(false);
        setFeedback({
          kind: "info",
          message: "Доступ к геопозиции отклонен. Введите адрес вручную или выберите точку на карте.",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60_000,
      },
    );
  }

  function activateMapMode() {
    setIsMapPickerOpen(true);
  }

  function handleMapLocationConfirm(nextLocation: {
    lat: number;
    lng: number;
    address: string;
  }) {
    setLocation({
      source: "map",
      lat: nextLocation.lat,
      lng: nextLocation.lng,
      resolvedAddress: nextLocation.address,
      addressOverride: nextLocation.address,
    });
    setIsMapPickerOpen(false);
    setFeedback({
      kind: "info",
      message: "Точка на карте выбрана. При необходимости уточните адрес.",
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLocked) {
      setFeedback({
        kind: "rejected",
        message:
          "Эта попытка уже отклонена после трех проверок. Начните новую заявку и опишите проблему заново.",
      });
      return;
    }

    if (!category || !photo || !hasValidLocation) {
      setFeedback({
        kind: "error",
        message: "Выберите категорию, приложите фото и укажите место проблемы.",
      });
      return;
    }

    const formData = new FormData();
    formData.set("category", category);
    formData.set("photo", photo);
    formData.set("description", description);
    formData.set("moderationAttempt", String(moderationAttempts + 1));
    formData.set("locationSource", location.source);

    if (location.source === "manual") {
      formData.set("manualAddress", trimmedAddress);
    } else if (location.lat !== null && location.lng !== null) {
      formData.set("lat", String(location.lat));
      formData.set("lng", String(location.lng));

      if (trimmedAddress) {
        formData.set("addressLabel", trimmedAddress);
      }
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as ReportApiErrorPayload;

      if (!response.ok) {
        const nextAttemptCount = payload.moderationAttemptCount ?? moderationAttempts + 1;

        if (payload.decision === "retry" || payload.decision === "rejected") {
          setModerationAttempts(nextAttemptCount);
          setFeedback({
            kind: payload.decision,
            message: payload.message ?? "Локальная проверка не пройдена.",
            reasons: payload.reasons ?? [],
            suggestedCategory: payload.suggestedCategory ?? null,
          });
          setCurrentStep(3);
          return;
        }

        setFeedback({
          kind: "error",
          message: payload.message ?? "Не удалось отправить заявку.",
        });
        setCurrentStep(3);
        return;
      }

      resetForm();
      setFeedback({
        kind: "success",
        message: "Заявка принята. Спасибо, что помогаете городу становиться лучше.",
      });
    } catch {
      setFeedback({
        kind: "error",
        message: "Сервер недоступен. Попробуйте еще раз.",
      });
      setCurrentStep(3);
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setCategory(null);
    setPhoto(null);
    setDescription("");
    setLocation(createInitialLocationDraft());
    setModerationAttempts(0);
    setIsMapPickerOpen(false);
    setCurrentStep(0);
  }

  function goToStep(step: number) {
    setCurrentStep(step);
  }

  function goNext() {
    setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1));
  }

  function goBack() {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  const currentStepMeta = STEPS[currentStep];

  return (
    <>
      <section className="panel-surface rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-4 border-b pb-6 panel-divider lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="panel-kicker text-xs uppercase tracking-[0.28em]">Citizen wizard</p>
            <h2 className="panel-title mt-3 text-4xl leading-[0.96]">Подача жалобы без перегруза</h2>
            <p className="panel-copy mt-4 max-w-[60ch] text-base leading-8">
              Один flow, разбитый на понятные шаги. Логика отправки и проверки остается прежней.
            </p>
          </div>
          <div className="panel-muted-card rounded-[1.3rem] px-4 py-4 text-sm">
            За неделю принято {weeklyReports} заявок
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isDone = step.id < currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => goToStep(step.id)}
                className={`rounded-[1.3rem] border px-4 py-4 text-left transition ${
                  isActive
                    ? "panel-primary-button border-transparent"
                    : "panel-muted-card"
                }`}
              >
                <p className={`text-xs uppercase tracking-[0.22em] ${isActive ? "text-white/70" : "panel-copy"}`}>
                  Шаг {step.id + 1}
                </p>
                <p className="mt-2 text-lg font-semibold">{step.title}</p>
                <p className={`mt-1 text-sm leading-6 ${isActive ? "text-white/80" : "panel-copy"}`}>
                  {isDone ? "Готово" : step.hint}
                </p>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-6">
          <section className="panel-muted-card rounded-[1.7rem] p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="panel-kicker text-xs uppercase tracking-[0.24em]">
                  Шаг {currentStepMeta.id + 1}
                </p>
                <h3 className="panel-section-title mt-2 text-2xl font-semibold">
                  {currentStepMeta.title}
                </h3>
              </div>
              <span className="panel-badge rounded-full px-3 py-1 text-xs">{currentStepMeta.hint}</span>
            </div>

            {currentStep === 0 ? (
              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {Object.entries(CATEGORY_META).map(([key, meta]) => {
                  const isActive = category === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key as ReportCategory)}
                      className={`rounded-[1.35rem] border px-4 py-4 text-left transition ${
                        isActive
                          ? "panel-primary-button border-transparent shadow-lg"
                          : "panel-surface-strong hover:border-[color:var(--panel-border)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">{meta.label}</span>
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: meta.color }} />
                      </div>
                      <p className={`mt-3 text-sm leading-6 ${isActive ? "text-white/80" : "panel-copy"}`}>
                        {meta.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {currentStep === 1 ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.44fr)_minmax(0,0.56fr)]">
                <div className="grid gap-3">
                  <label className="grid gap-2">
                    <span className="panel-copy text-sm font-medium">Добавьте фото проблемы</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
                      className="panel-input rounded-xl px-3 py-3 text-sm"
                    />
                  </label>
                  <div className="panel-muted-card rounded-[1.2rem] p-4">
                    <p className="panel-kicker text-[11px] uppercase tracking-[0.22em]">Поддерживается</p>
                    <p className="panel-copy mt-2 text-sm leading-7">JPG, PNG или WEBP. Фото помогает точнее проверить обращение.</p>
                  </div>
                </div>

                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Предпросмотр проблемы"
                    className="h-72 w-full rounded-[1.4rem] object-cover"
                  />
                ) : (
                  <div className="panel-input grid h-72 place-items-center rounded-[1.4rem] text-sm panel-copy">
                    Предпросмотр появится после выбора файла
                  </div>
                )}
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={activateManualMode}
                    className={getLocationModeTone(location.source === "manual")}
                  >
                    <span className="panel-section-title text-sm font-semibold">Адрес</span>
                    <span className="mt-2 block text-sm leading-6 opacity-80">Введите место вручную.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void activateGeolocationMode()}
                    disabled={isResolvingLocation}
                    className={`${getLocationModeTone(location.source === "geolocation")} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span className="panel-section-title text-sm font-semibold">Геолокация</span>
                    <span className="mt-2 block text-sm leading-6 opacity-80">
                      Использовать текущее местоположение.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={activateMapMode}
                    className={getLocationModeTone(location.source === "map")}
                  >
                    <span className="panel-section-title text-sm font-semibold">Карта</span>
                    <span className="mt-2 block text-sm leading-6 opacity-80">
                      Отметить точку на карте.
                    </span>
                  </button>
                </div>

                <div className="grid gap-4">
                  <div className="panel-input rounded-[1.2rem] p-4">
                    <p className="panel-kicker text-[11px] uppercase tracking-[0.22em]">Текущее место</p>
                    <p className="mt-3 panel-copy text-sm leading-7">{locationSummary}</p>
                  </div>

                  <label className="grid gap-2">
                    <span className="panel-copy text-sm font-medium">
                      {location.source === "manual" ? "Адрес" : "Адрес для уточнения"}
                    </span>
                    <input
                      value={location.addressOverride}
                      onChange={(event) =>
                        setLocation((current) => ({
                          ...current,
                          addressOverride: event.target.value,
                        }))
                      }
                      placeholder={
                        location.source === "manual"
                          ? "Например, 15-й микрорайон"
                          : "Уточните адрес, если нужно"
                      }
                      className="panel-input rounded-[1.1rem] px-4 py-3 text-sm outline-none"
                    />
                  </label>

                  <div className="flex flex-wrap gap-3">
                    {location.source === "geolocation" ? (
                      <button
                        type="button"
                        onClick={() => void activateGeolocationMode()}
                        disabled={isResolvingLocation}
                        className="panel-secondary-button rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isResolvingLocation ? "Определяем..." : "Определить заново"}
                      </button>
                    ) : null}

                    {location.source === "map" ? (
                      <button
                        type="button"
                        onClick={() => setIsMapPickerOpen(true)}
                        className="panel-secondary-button rounded-full px-4 py-2 text-sm font-semibold"
                      >
                        Открыть карту
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.06fr)_minmax(320px,0.94fr)]">
                <div className="grid gap-4">
                  <label className="grid gap-2">
                    <span className="panel-copy text-sm font-medium">Коротко опишите проблему</span>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      maxLength={500}
                      rows={7}
                      placeholder="Что случилось и почему это мешает?"
                      className="panel-input rounded-[1.2rem] px-4 py-3 text-sm outline-none"
                    />
                    <span className="panel-copy text-xs">{description.length}/500</span>
                  </label>

                  <div className="panel-muted-card rounded-[1.2rem] p-4">
                    <p className="panel-kicker text-[11px] uppercase tracking-[0.22em]">Перед отправкой</p>
                    <p className="panel-copy mt-2 text-sm leading-7">
                      Заявка пройдет локальную проверку. Если данных недостаточно, форма подскажет, что уточнить.
                    </p>
                  </div>
                </div>

                <div className="panel-surface-strong rounded-[1.4rem] p-5">
                  <p className="panel-kicker text-[11px] uppercase tracking-[0.22em]">Сводка</p>
                  <div className="mt-4 grid gap-3">
                    <div className="panel-muted-card rounded-[1rem] p-4">
                      <p className="panel-kicker text-[11px] uppercase tracking-[0.22em]">Категория</p>
                      <p className="panel-section-title mt-2 text-base font-semibold">
                        {category ? CATEGORY_META[category].label : "Не выбрана"}
                      </p>
                    </div>
                    <div className="panel-muted-card rounded-[1rem] p-4">
                      <p className="panel-kicker text-[11px] uppercase tracking-[0.22em]">Фото</p>
                      <p className="panel-section-title mt-2 text-base font-semibold">
                        {photo ? photo.name : "Не добавлено"}
                      </p>
                    </div>
                    <div className="panel-muted-card rounded-[1rem] p-4">
                      <p className="panel-kicker text-[11px] uppercase tracking-[0.22em]">Место</p>
                      <p className="panel-section-title mt-2 text-base font-semibold">{locationSummary}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          {feedback ? (
            <div className={getFeedbackTone(feedback.kind)}>
              <div className="panel-feedback-head">
                <span className={getFeedbackBadgeTone(feedback.kind)}>
                  {getFeedbackBadgeLabel(feedback.kind)}
                </span>
              </div>
              <p className="mt-3 font-semibold">{feedback.message}</p>
              {feedback.reasons?.length ? (
                <ul className="mt-3 grid gap-2 text-sm">
                  {feedback.reasons.map((reason) => (
                    <li key={reason}>• {reason}</li>
                  ))}
                </ul>
              ) : null}
              {feedback.suggestedCategory ? (
                <p className="mt-3 text-sm">
                  Возможная категория: {CATEGORY_META[feedback.suggestedCategory].label}
                </p>
              ) : null}
              {moderationAttempts > 0 && feedback.kind !== "success" ? (
                <p className="mt-3 text-xs uppercase tracking-[0.24em] opacity-80">
                  Попытка проверки: {Math.min(moderationAttempts, 3)} из 3
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-4 border-t pt-4 panel-divider md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-3">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="panel-secondary-button rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Назад
                </button>
              ) : null}

              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="panel-primary-button rounded-full px-6 py-3 text-sm font-semibold"
                >
                  Дальше
                </button>
              ) : null}

              {isLocked ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="panel-secondary-button rounded-full px-5 py-3 text-sm font-semibold"
                >
                  Начать заново
                </button>
              ) : null}
            </div>

            {currentStep === STEPS.length - 1 ? (
              <button
                type="submit"
                disabled={isSubmitting || isLocked || isResolvingLocation}
                className="panel-primary-button rounded-full px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? "Отправляем..."
                  : isLocked
                    ? "Заявка отклонена"
                    : "Отправить заявку"}
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <LocationPickerModal
        isOpen={isMapPickerOpen}
        initialLocation={
          hasSelectedCoordinates
            ? {
                lat: location.lat!,
                lng: location.lng!,
                address: trimmedAddress || location.resolvedAddress || "Локация уточняется",
              }
            : null
        }
        onClose={() => setIsMapPickerOpen(false)}
        onConfirm={handleMapLocationConfirm}
      />
    </>
  );
}

function getLocationModeTone(isActive: boolean) {
  return `rounded-[1.35rem] border px-4 py-4 text-left transition ${
    isActive
      ? "panel-primary-button border-transparent shadow-lg"
      : "panel-surface-strong hover:border-[color:var(--panel-border)]"
  }`;
}

function getFeedbackTone(kind: SubmissionFeedback["kind"]) {
  switch (kind) {
    case "success":
      return "panel-success rounded-[1.3rem] px-4 py-3 text-sm";
    case "retry":
      return "panel-feedback-warning rounded-[1.3rem] px-4 py-3 text-sm";
    case "rejected":
      return "panel-feedback-danger rounded-[1.3rem] px-4 py-3 text-sm";
    case "info":
      return "panel-feedback-info rounded-[1.3rem] px-4 py-3 text-sm";
    case "error":
      return "panel-feedback-neutral rounded-[1.3rem] px-4 py-3 text-sm";
  }
}

function getFeedbackBadgeLabel(kind: SubmissionFeedback["kind"]) {
  switch (kind) {
    case "success":
      return "Успешно";
    case "retry":
      return "Внимание";
    case "rejected":
      return "Требует исправления";
    case "info":
      return "Подсказка";
    case "error":
      return "Проверьте данные";
  }
}

function getFeedbackBadgeTone(kind: SubmissionFeedback["kind"]) {
  switch (kind) {
    case "success":
      return "panel-feedback-badge panel-feedback-badge-success";
    case "retry":
      return "panel-feedback-badge panel-feedback-badge-warning";
    case "rejected":
      return "panel-feedback-badge panel-feedback-badge-danger";
    case "info":
      return "panel-feedback-badge panel-feedback-badge-info";
    case "error":
      return "panel-feedback-badge panel-feedback-badge-neutral";
  }
}
