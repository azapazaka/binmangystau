import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
import {
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  MapPin,
  Shield,
  Sparkles,
  Upload,
} from "lucide-react";

import { CitizenShell } from "@/components/citizen-v2/CitizenShell";
import { CitizenStatusBadge } from "@/components/citizen-v2/CitizenStatusBadge";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { useAuth } from "@/contexts/AuthContext";
import { createReport } from "@/lib/api";
import { CATEGORY_META } from "@/lib/constants";
import { env } from "@/lib/env";
import type { ReportCategory } from "@/types";

type StepKey = "photo" | "location" | "category" | "details" | "review";

type StepDefinition = {
  key: StepKey;
  label: string;
  required: boolean;
};

const STEP_DEFINITIONS: StepDefinition[] = [
  { key: "photo", label: "Фото", required: true },
  { key: "location", label: "Локация", required: true },
  { key: "category", label: "Категория", required: true },
  { key: "details", label: "Описание", required: false },
  { key: "review", label: "Проверка", required: true },
];

const CATEGORY_OPTIONS = Object.keys(CATEGORY_META) as ReportCategory[];

function isStepComplete(
  step: StepKey,
  input: {
    photo: File | null;
    address: string;
    category: ReportCategory;
    description: string;
  },
) {
  switch (step) {
    case "photo":
      return Boolean(input.photo);
    case "location":
      return input.address.trim().length > 0;
    case "category":
      return Boolean(input.category);
    case "details":
      return true;
    case "review":
      return Boolean(input.photo) && input.address.trim().length > 0 && Boolean(input.category);
    default:
      return false;
  }
}

export default function ReportWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [lat, setLat] = useState(env.defaultLat);
  const [lng, setLng] = useState(env.defaultLng);
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("Актау");
  const [category, setCategory] = useState<ReportCategory>("road");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const steps = useMemo(
    () =>
      STEP_DEFINITIONS.map((step) => ({
        ...step,
        done: isStepComplete(step.key, { photo, address, category, description }),
      })),
    [photo, address, category, description],
  );

  const currentDefinition = STEP_DEFINITIONS[currentStep];
  const currentStepDone = steps[currentStep]?.done ?? false;
  const completedSteps = steps.filter((step) => step.done).length;
  const submitReady = Boolean(photo) && Boolean(user) && address.trim().length > 0;
  const categoryMeta = CATEGORY_META[category];

  function onPickPhoto(event: ChangeEvent<HTMLInputElement>) {
    const nextPhoto = event.target.files?.[0];
    if (!nextPhoto) return;

    if (photoPreview) URL.revokeObjectURL(photoPreview);

    setSubmitError(null);
    setPhoto(nextPhoto);
    setPhotoPreview(URL.createObjectURL(nextPhoto));
  }

  function onUseCurrentLocation() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLat = position.coords.latitude;
        const nextLng = position.coords.longitude;
        setLat(nextLat);
        setLng(nextLng);
        setAddress(`${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}`);
        setDistrict("Текущая геолокация");
        setSubmitError(null);
      },
      () => {
        setSubmitError("Нет доступа к геолокации. Введите адрес вручную.");
      },
    );
  }

  function goToStep(index: number) {
    if (index < 0 || index >= STEP_DEFINITIONS.length) return;
    if (index > currentStep && !currentStepDone) return;
    setCurrentStep(index);
    setSubmitError(null);
  }

  function goNext() {
    if (!currentStepDone || currentStep === STEP_DEFINITIONS.length - 1) return;
    setCurrentStep((step) => Math.min(step + 1, STEP_DEFINITIONS.length - 1));
    setSubmitError(null);
  }

  async function onSubmit() {
    if (!photo || !user || !address.trim()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await createReport({
        photo,
        userCategory: category,
        description: description.trim(),
        lat,
        lng,
        address: address.trim(),
        submittedBy: user.id,
      });
      setDone(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Не удалось отправить заявку.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <CitizenShell
        title="Заявка отправлена"
        subtitle="Обращение сохранено и уже доступно в вашем списке."
      >
        <div className="mx-auto mt-8 max-w-3xl">
          <article className="citizen-v2-panel flex flex-col items-center px-8 py-14 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={38} />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-slate-950">Заявка принята.</h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
              Обращение успешно отправлено. Теперь его можно отслеживать в разделе с вашими заявками.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/citizen/my-reports")}
                className="rounded-2xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white"
              >
                Открыть мои заявки
              </button>
              <button
                type="button"
                onClick={() => navigate("/citizen/report")}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700"
              >
                Отправить ещё одну
              </button>
            </div>
          </article>
        </div>
      </CitizenShell>
    );
  }

  return (
    <CitizenShell
      title="Новая заявка"
      subtitle="Заполняйте заявку по шагам, чтобы ничего не пропустить."
    >
      <div className="mt-6 space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_20px_70px_-46px_rgba(15,23,42,0.28)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
                Шаг {currentStep + 1} из {STEP_DEFINITIONS.length}
              </p>
              <p className="mt-2 text-lg font-bold text-slate-950">{currentDefinition.label}</p>
            </div>
            <div className="rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-500">
              {completedSteps}/{STEP_DEFINITIONS.length} готово
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#0f766e_0%,#14b8a6_100%)] transition-all duration-300"
              style={{ width: `${((currentStep + 1) / STEP_DEFINITIONS.length) * 100}%` }}
            />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {steps.map((step, index) => (
              <button
                key={step.key}
                type="button"
                onClick={() => goToStep(index)}
                disabled={index > currentStep && !currentStepDone}
                className={[
                  "flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition",
                  index === currentStep
                    ? "border-teal-200 bg-teal-50 text-teal-800"
                    : step.done
                      ? "border-emerald-100 bg-emerald-50/60 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-500",
                  index > currentStep && !currentStepDone ? "opacity-55" : "hover:border-slate-300",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition",
                    step.done
                      ? "bg-teal-700 text-white"
                      : index === currentStep
                        ? "bg-white text-teal-700 shadow-sm"
                        : "bg-slate-50 text-slate-500",
                  ].join(" ")}
                >
                  {step.done ? <Check size={16} /> : index + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold">{step.label}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {step.required ? "обязательно" : "необязательно"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <div className="mx-auto max-w-5xl">
          {currentDefinition.key === "photo" ? (
            <article key="photo" className="citizen-v2-panel citizen-v2-step-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="citizen-v2-eyebrow">Шаг 1</p>
                  <h2>Фото проблемы</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Загрузите одно чёткое фото. Без него заявка не отправится.
                  </p>
                </div>
                <CitizenStatusBadge label="Обязательно" tone="warning" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickPhoto}
                />
              </div>

              <div className="mt-6">
                {photoPreview ? (
                  <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-slate-50">
                    <img src={photoPreview} alt="Предпросмотр" className="h-[420px] w-full object-cover" />
                    <div className="flex justify-center p-5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
                      >
                        <Camera size={16} />
                        Заменить фото
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-[420px] w-full flex-col items-center justify-center rounded-[26px] border border-dashed border-slate-300 bg-slate-50 px-6 text-center transition hover:border-teal-400 hover:bg-teal-50/40"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-teal-700 shadow-sm">
                      <ImagePlus size={28} />
                    </div>
                    <p className="mt-5 text-xl font-semibold text-slate-900">Загрузите фото</p>
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Покажите проблему крупно и без лишнего фона. Фото станет главным превью заявки.
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                      <Upload size={16} />
                      Выбрать файл
                    </span>
                  </button>
                )}
              </div>
            </article>
          ) : null}

          {currentDefinition.key === "location" ? (
            <article key="location" className="citizen-v2-panel citizen-v2-step-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="citizen-v2-eyebrow">Шаг 2</p>
                  <h2>Подтвердите локацию</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Укажите, где находится проблема. Можно использовать геолокацию или вручную ввести адрес.
                  </p>
                </div>
                <CitizenStatusBadge label="Обязательно" tone="warning" />
              </div>

              <div className="mt-6 overflow-hidden rounded-[26px] border border-slate-200 bg-slate-50">
                <div className="flex h-[190px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.14),transparent_44%),linear-gradient(135deg,#eef6f4_0%,#f8fafc_45%,#edf4fb_100%)]">
                  <div className="rounded-full bg-white p-5 text-teal-700 shadow-sm">
                    <MapPin size={24} />
                  </div>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {address || "Адрес пока не указан"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{district}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onUseCurrentLocation}
                    className="text-sm font-semibold text-teal-700"
                  >
                    Моя геолокация
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Адрес</span>
                  <input
                    value={address}
                    onChange={(event) => {
                      setAddress(event.target.value);
                      setDistrict("Актау");
                      setSubmitError(null);
                    }}
                    placeholder="мкр 12, дом 52, Актау"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-500"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700">Широта</span>
                    <input
                      value={lat}
                      onChange={(event) => setLat(Number(event.target.value))}
                      type="number"
                      step="0.00001"
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-500"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700">Долгота</span>
                    <input
                      value={lng}
                      onChange={(event) => setLng(Number(event.target.value))}
                      type="number"
                      step="0.00001"
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-500"
                    />
                  </label>
                </div>
              </div>
            </article>
          ) : null}

          {currentDefinition.key === "category" ? (
            <article key="category" className="citizen-v2-panel citizen-v2-step-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="citizen-v2-eyebrow">Шаг 3</p>
                  <h2>Выберите категорию</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Категория помогает быстрее направить заявку нужной городской службе.
                  </p>
                </div>
                <CitizenStatusBadge label="Обязательно" tone="warning" />
              </div>

              <div className="mt-6 rounded-[24px] bg-emerald-50/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-1 h-11 w-11 rounded-2xl"
                      style={{ backgroundColor: `${categoryMeta.color}18` }}
                    >
                      <div
                        className="m-2 h-7 w-7 rounded-xl"
                        style={{ backgroundColor: categoryMeta.color }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{categoryMeta.label}</p>
                      <p className="mt-1 text-sm text-slate-500">Сейчас будет отправлена именно эта категория.</p>
                    </div>
                  </div>
                  <CitizenStatusBadge label="Текущая" tone="success" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {CATEGORY_OPTIONS.map((option) => {
                  const meta = CATEGORY_META[option];
                  const active = option === category;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setCategory(option)}
                      className={`rounded-[22px] border px-4 py-4 text-left transition ${
                        active
                          ? "border-teal-600 bg-teal-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: meta.color }} />
                          <span className="text-sm font-semibold text-slate-900">{meta.label}</span>
                        </div>
                        {active ? <Check size={16} className="text-teal-700" /> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>
          ) : null}

          {currentDefinition.key === "details" ? (
            <article key="details" className="citizen-v2-panel citizen-v2-step-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="citizen-v2-eyebrow">Шаг 4</p>
                  <h2>Добавьте описание</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Этот шаг необязателен, но детали помогают быстрее понять ситуацию.
                  </p>
                </div>
                <CitizenStatusBadge label="Необязательно" tone="info" />
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Что происходит?</p>
                  <span className="text-sm font-medium text-slate-400">{description.length}/280</span>
                </div>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value.slice(0, 280))}
                  rows={6}
                  placeholder="Например: мусор не вывозили несколько дней, контейнер переполнен и отходы уже на тротуаре."
                  className="mt-4 w-full rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-teal-500"
                />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <article className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                      <Shield size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Безопасно</p>
                      <p className="mt-1 text-sm text-slate-500">Данные отправляются в защищённом режиме.</p>
                    </div>
                  </div>
                </article>
                <article className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Прозрачно</p>
                      <p className="mt-1 text-sm text-slate-500">После отправки заявка появится у вас в истории.</p>
                    </div>
                  </div>
                </article>
              </div>
            </article>
          ) : null}

          {currentDefinition.key === "review" ? (
            <article key="review" className="citizen-v2-panel citizen-v2-step-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="citizen-v2-eyebrow">Шаг 5</p>
                  <h2>Проверьте заявку</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Финальный шаг перед отправкой. Здесь видны все ключевые данные.
                  </p>
                </div>
                <CitizenStatusBadge label="Готово к отправке" tone="success" />
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_320px]">
                <div className="space-y-5">
                  <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-slate-50">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Предпросмотр заявки" className="h-[340px] w-full object-cover" />
                    ) : (
                      <div className="flex h-[340px] items-center justify-center text-sm font-medium text-slate-400">
                        Фото не добавлено
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                      <p className="text-sm font-semibold text-slate-900">Локация</p>
                      <p className="mt-2 text-sm text-slate-700">{address || "Адрес не указан"}</p>
                      <p className="mt-1 text-sm text-slate-500">{district}</p>
                    </div>
                    <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                      <p className="text-sm font-semibold text-slate-900">Категория</p>
                      <div className="mt-3">
                        <CategoryBadge category={category} />
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
                  <p className="text-sm font-semibold text-slate-900">Краткая сводка</p>
                  <div className="mt-4 space-y-4">
                    <div className="border-b border-slate-200 pb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Фото</p>
                      <p className="mt-2 text-sm text-slate-700">{photo ? photo.name : "Не добавлено"}</p>
                    </div>
                    <div className="border-b border-slate-200 pb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Координаты</p>
                      <p className="mt-2 text-sm text-slate-700">
                        {lat.toFixed(4)}, {lng.toFixed(4)}
                      </p>
                    </div>
                    <div className="border-b border-slate-200 pb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Описание</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {description.trim() || "Дополнительных деталей пока нет."}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Статус</p>
                      <p className="mt-2 text-sm text-slate-700">{completedSteps}/{STEP_DEFINITIONS.length} шагов готово</p>
                    </div>
                  </div>
                </aside>
              </div>
            </article>
          ) : null}
        </div>

        {submitError ? (
          <div className="mx-auto max-w-5xl rounded-[20px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </div>
        ) : null}

        <section className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_60px_-44px_rgba(15,23,42,0.35)]">
          <div>
            <p className="text-sm font-semibold text-slate-900">{currentDefinition.label}</p>
            <p className="mt-1 text-sm text-slate-500">
              {currentDefinition.required ? "Этот шаг нужно заполнить." : "Этот шаг можно пропустить."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => goToStep(currentStep - 1)}
              disabled={currentStep === 0 || submitting}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Назад
            </button>

            {currentDefinition.key === "review" ? (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!submitReady || submitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Отправка..." : "Отправить заявку"}
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                disabled={!currentStepDone || submitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Далее
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </section>
      </div>
    </CitizenShell>
  );
}
