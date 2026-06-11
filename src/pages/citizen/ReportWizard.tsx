import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
import {
  Camera,
  Check,
  CheckCircle2,
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
import { CATEGORY_META } from "@/lib/constants";
import { createReport } from "@/lib/api";
import { env } from "@/lib/env";
import type { ReportCategory } from "@/types";

type StepState = {
  label: string;
  done: boolean;
};

const CATEGORY_OPTIONS = Object.keys(CATEGORY_META) as ReportCategory[];

function buildStepState(input: {
  photo: File | null;
  address: string;
  category: ReportCategory;
  description: string;
}): StepState[] {
  return [
    { label: "Фото", done: Boolean(input.photo) },
    { label: "Локация", done: input.address.trim().length > 0 },
    { label: "Категория", done: Boolean(input.category) },
    { label: "Описание", done: input.description.trim().length > 0 },
    {
      label: "Отправка",
      done:
        Boolean(input.photo) &&
        input.address.trim().length > 0 &&
        Boolean(input.category),
    },
  ];
}

export default function ReportWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const steps = useMemo(
    () => buildStepState({ photo, address, category, description }),
    [photo, address, category, description],
  );
  const completedSteps = steps.filter((step) => step.done).length;
  const submitReady = Boolean(photo) && Boolean(user) && address.trim().length > 0;

  const categoryMeta = CATEGORY_META[category];

  function onPickPhoto(event: ChangeEvent<HTMLInputElement>) {
    const nextPhoto = event.target.files?.[0];
    if (!nextPhoto) return;

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

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
        setDistrict("Текущая локация");
        setSubmitError(null);
      },
      () => {
        setSubmitError("Нет доступа к геолокации. Введите адрес вручную.");
      },
    );
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
        subtitle="Обращение сохранено и появилось в вашем списке."
      >
        <div className="mx-auto mt-8 max-w-3xl">
          <article className="citizen-v2-panel flex flex-col items-center px-8 py-14 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={38} />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-slate-950">Заявка принята.</h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
              Обращение успешно отправлено и теперь доступно в вашем списке заявок.
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
                onClick={() => navigate("/citizen")}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700"
              >
                Назад на главную
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
      subtitle="Сообщите о городской проблеме в Актау."
    >
      <section className="mt-6 border-t border-slate-200/80 pt-5">
        <div className="grid gap-3 lg:grid-cols-5">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                  step.done
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                {step.done ? <Check size={16} /> : index + 1}
              </div>
              <span className="text-sm font-medium text-slate-700">{step.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_320px]">
        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.18fr)]">
            <article className="citizen-v2-panel">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">Фото проблемы</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Четкое фото помогает быстрее понять и обработать обращение.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickPhoto}
                />
              </div>

              <div className="mt-5">
                {photoPreview ? (
                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                    <img
                      src={photoPreview}
                      alt="Выбранное изображение"
                      className="h-[340px] w-full object-cover"
                    />
                    <div className="flex justify-center p-5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white"
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
                    className="flex h-[396px] w-full flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 text-center transition hover:border-teal-400 hover:bg-teal-50/40"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-teal-700 shadow-sm">
                      <ImagePlus size={28} />
                    </div>
                    <p className="mt-5 text-lg font-semibold text-slate-900">Загрузите фото</p>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      Добавьте одно фото, на котором хорошо видно проблему.
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                      <Upload size={16} />
                      Выбрать файл
                    </span>
                  </button>
                )}
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-[20px] bg-emerald-50 px-4 py-4 text-emerald-800">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">
                    {photo ? "Фото добавлено" : "Нужно добавить фото"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-emerald-700/90">
                    {photo
                      ? "Изображение готово к отправке."
                      : "Перед отправкой добавьте фото."}
                  </p>
                </div>
              </div>
            </article>

            <div className="space-y-5">
              <article className="citizen-v2-panel">
                <h2 className="text-2xl font-semibold text-slate-950">Подтвердите локацию</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Укажите, где находится проблема. Можно использовать текущую геолокацию или ввести адрес вручную.
                </p>

                <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                  <div className="flex h-[170px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.12),transparent_42%),linear-gradient(135deg,#eef6f4_0%,#f8fafc_45%,#edf4fb_100%)]">
                    <div className="rounded-full bg-white p-4 text-teal-700 shadow-sm">
                      <MapPin size={24} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-full bg-blue-50 p-2 text-blue-600">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {address || "Адрес пока не указан"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{district}</p>
                      </div>
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

                <div className="mt-4 grid gap-3">
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

                  <div className="grid gap-3 sm:grid-cols-2">
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

              <article className="citizen-v2-panel">
                <h2 className="text-2xl font-semibold text-slate-950">Категория</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Выберите категорию, которая лучше всего подходит к проблеме.
                </p>

                <div className="mt-5 rounded-[24px] bg-emerald-50/70 p-4">
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
                        <p className="text-sm font-semibold text-slate-900">
                          {categoryMeta.label}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Категория будет сохранена в заявке и использована при обработке.
                        </p>
                      </div>
                    </div>
                    <CitizenStatusBadge label="Текущая категория" tone="success" />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: meta.color }}
                            />
                            <span className="text-sm font-semibold text-slate-900">
                              {meta.label}
                            </span>
                          </div>
                          {active ? <Check size={16} className="text-teal-700" /> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </article>

              <article className="citizen-v2-panel">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950">Описание</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Добавьте детали, которые помогут быстрее обработать заявку.
                    </p>
                  </div>
                  <span className="text-sm font-medium text-slate-400">
                    {description.length}/280
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value.slice(0, 280))}
                  rows={4}
                  placeholder="Например: фонарь не работает уже три дня, вечером участок совсем темный."
                  className="mt-5 w-full rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-teal-500"
                />
              </article>
            </div>
          </div>

          <section className="grid gap-4 md:grid-cols-3">
            <article className="citizen-v2-panel">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Безопасно</p>
                  <p className="mt-1 text-sm text-slate-500">Данные обращения защищены.</p>
                </div>
              </div>
            </article>
            <article className="citizen-v2-panel">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Проверка</p>
                  <p className="mt-1 text-sm text-slate-500">Заявки проходят разбор и попадают в рабочую очередь.</p>
                </div>
              </div>
            </article>
            <article className="citizen-v2-panel">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Статус в пути</p>
                  <p className="mt-1 text-sm text-slate-500">Следите за заявкой от отправки до закрытия.</p>
                </div>
              </div>
            </article>
          </section>
        </div>

        <aside className="space-y-5">
          <article className="citizen-v2-panel sticky top-6">
            <h2 className="text-2xl font-semibold text-slate-950">Проверьте заявку</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Проверьте данные перед отправкой.
            </p>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Предпросмотр обращения"
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div className="flex h-48 items-center justify-center text-sm font-medium text-slate-400">
                  Добавьте фото для предпросмотра
                </div>
              )}
            </div>

            <div className="mt-5 space-y-5">
              <div className="border-b border-slate-200 pb-4">
                <p className="text-sm font-semibold text-slate-900">Локация</p>
                <p className="mt-2 text-sm text-slate-700">
                  {address || "Адрес не указан"}
                </p>
                <p className="mt-1 text-sm text-slate-500">{district}</p>
              </div>

              <div className="border-b border-slate-200 pb-4">
                <p className="text-sm font-semibold text-slate-900">Категория</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <CategoryBadge category={category} />
                  <span className="text-sm font-medium text-slate-500">
                    {completedSteps}/5 шагов
                  </span>
                </div>
              </div>

              <div className="border-b border-slate-200 pb-4">
                <p className="text-sm font-semibold text-slate-900">Описание</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {description.trim() || "Дополнительных деталей пока нет."}
                </p>
              </div>
            </div>

            {submitError ? (
              <div className="mt-5 rounded-[20px] bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {submitError}
              </div>
            ) : null}

            <button
              type="button"
              onClick={onSubmit}
              disabled={!submitReady || submitting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-700 px-5 py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Отправка..." : "Отправить заявку"}
              <ChevronRight size={16} />
            </button>

            <p className="mt-4 text-center text-sm text-slate-500">
              Обращение отправляется в защищенном режиме.
            </p>
          </article>
        </aside>
      </div>
    </CitizenShell>
  );
}
