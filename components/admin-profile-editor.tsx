"use client";

import Image from "next/image";
import { useEffect, useEffectEvent, useId, useMemo, useState } from "react";

import { CATEGORY_META } from "@/lib/constants";
import { getPendingProfileMigration } from "@/lib/profile-client";
import type { ReportCategory } from "@/types";

type AdminProfileDraft = {
  displayName: string;
  position: string;
  department: string;
  district: string;
  bio: string;
  categories: ReportCategory[];
  avatarUrl: string | null;
};

type AdminProfileEditorProps = {
  email: string;
  initialProfile: AdminProfileDraft;
  resetProfile: AdminProfileDraft;
  storageKey: string;
  hasStoredProfile: boolean;
  isDemo: boolean;
};

type SaveState =
  | { kind: "idle"; message: string | null }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const MAX_AVATAR_SIZE = 3 * 1024 * 1024;
const CATEGORY_OPTIONS = Object.entries(CATEGORY_META) as Array<
  [ReportCategory, (typeof CATEGORY_META)[ReportCategory]]
>;

export function AdminProfileEditor({
  email,
  initialProfile,
  resetProfile,
  storageKey,
  hasStoredProfile,
  isDemo,
}: AdminProfileEditorProps) {
  const avatarInputId = useId();
  const [profile, setProfile] = useState<AdminProfileDraft>(initialProfile);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle", message: null });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      try {
        const savedProfile = window.localStorage.getItem(storageKey);

        if (!savedProfile || cancelled) {
          return;
        }

        if (hasStoredProfile) {
          window.localStorage.removeItem(storageKey);
          return;
        }

        const migration = getPendingProfileMigration({
          role: "admin",
          rawLocalStorageValue: savedProfile,
          hasStoredProfile,
        });

        if (!migration || migration.role !== "admin" || cancelled) {
          return;
        }

        setProfile(migration.profile);
        void persistProfileEvent(migration.profile, {
          successMessage: null,
          clearLegacyStorage: true,
        });
      } catch {
        if (!cancelled) {
          setSaveState({
            kind: "error",
            message: "Не удалось прочитать сохранённый профиль. Можно заполнить его заново.",
          });
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [hasStoredProfile, storageKey]);

  const selectedCategoryLabels = useMemo(
    () => profile.categories.map((category) => CATEGORY_META[category].label),
    [profile.categories],
  );

  function updateField<Key extends keyof AdminProfileDraft>(
    field: Key,
    value: AdminProfileDraft[Key],
  ) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
    setSaveState({ kind: "idle", message: null });
  }

  function toggleCategory(category: ReportCategory) {
    const nextCategories = profile.categories.includes(category)
      ? profile.categories.filter((item) => item !== category)
      : [...profile.categories, category];

    updateField("categories", nextCategories);
  }

  const persistProfileEvent = useEffectEvent(persistProfile);

  async function persistProfile(
    nextProfile: AdminProfileDraft,
    options: {
      successMessage: string | null;
      clearLegacyStorage: boolean;
    },
  ) {
    setSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextProfile),
      });
      const payload = (await response.json()) as {
        message?: string;
        profile?: AdminProfileDraft;
      };

      if (!response.ok || !payload.profile) {
        throw new Error(payload.message ?? "Failed to save profile.");
      }

      setProfile(payload.profile);

      if (options.clearLegacyStorage) {
        window.localStorage.removeItem(storageKey);
      }

      if (options.successMessage) {
        setSaveState({
          kind: "success",
          message: options.successMessage,
        });
      } else {
        setSaveState({ kind: "idle", message: null });
      }
    } catch {
      setSaveState({
        kind: "error",
        message: "Не удалось сохранить профиль. Попробуйте ещё раз.",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void persistProfile(profile, {
      successMessage: "Профиль сохранён.",
      clearLegacyStorage: true,
    });
  }

  function handleReset() {
    setProfile(resetProfile);
    void persistProfile(resetProfile, {
      successMessage: "Профиль возвращён к стартовым данным.",
      clearLegacyStorage: true,
    });
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setSaveState({
        kind: "error",
        message: "Аватар должен быть меньше 3 МБ.",
      });
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setSaveState({
          kind: "error",
          message: "Не удалось загрузить изображение. Попробуйте другой файл.",
        });
        return;
      }

      updateField("avatarUrl", reader.result);
      setSaveState({
        kind: "success",
        message: "Аватар обновлён. Не забудьте сохранить профиль.",
      });
    };

    reader.onerror = () => {
      setSaveState({
        kind: "error",
        message: "Не удалось прочитать изображение.",
      });
    };

    reader.readAsDataURL(file);
  }

  const initials = getInitials(profile.displayName);

  return (
    <form onSubmit={handleSave} className="grid gap-6">
      <section className="panel-surface rounded-[2.4rem] p-6 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="panel-surface-strong rounded-[2rem] p-5">
            <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Admin profile</p>
            <div className="mt-5 flex flex-col items-center text-center">
              <div className="relative h-32 w-32 overflow-hidden rounded-[2rem] border border-[color:var(--panel-border)] bg-[var(--panel-muted-surface)] shadow-[var(--panel-shadow)]">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt="Аватар администратора"
                    fill
                    unoptimized
                    sizes="128px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-semibold tracking-[-0.05em] text-[var(--panel-text)]">
                    {initials}
                  </div>
                )}
              </div>

              <h2 className="panel-title mt-5 text-2xl font-semibold">{profile.displayName}</h2>
              <p className="panel-copy mt-2 text-sm leading-7">{profile.position}</p>
              <p className="panel-copy mt-1 text-sm leading-7">{email}</p>

              <label
                htmlFor={avatarInputId}
                className="panel-primary-button mt-5 inline-flex cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold"
              >
                Загрузить аватар
              </label>
              <input
                id={avatarInputId}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarChange}
                className="sr-only"
              />

              <button
                type="button"
                onClick={() => updateField("avatarUrl", null)}
                className="panel-link mt-3 text-sm font-semibold"
              >
                Убрать изображение
              </button>
            </div>

            <div className="panel-muted-card mt-6 rounded-[1.4rem] p-4 text-left">
              <p className="panel-section-title text-sm font-semibold">Зона ответственности</p>
              <div className="mt-3 grid gap-3">
                <div>
                  <p className="panel-kicker text-xs uppercase tracking-[0.28em]">Отдел</p>
                  <p className="panel-title mt-2 text-base font-semibold">
                    {profile.department || "Не указан"}
                  </p>
                </div>
                <div>
                  <p className="panel-kicker text-xs uppercase tracking-[0.28em]">Район</p>
                  <p className="panel-title mt-2 text-base font-semibold">
                    {profile.district || "Не указан"}
                  </p>
                </div>
                <div>
                  <p className="panel-kicker text-xs uppercase tracking-[0.28em]">Категории</p>
                  <p className="panel-title mt-2 text-base font-semibold">
                    {selectedCategoryLabels.length > 0
                      ? selectedCategoryLabels.join(", ")
                      : "Пока не выбраны"}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <div className="panel-surface-strong rounded-[2rem] p-5 md:p-6">
            <div className="flex flex-col gap-2">
              <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Workspace identity</p>
              <h1 className="panel-title text-4xl font-semibold">Рабочий профиль администратора</h1>
              <p className="panel-copy max-w-3xl text-sm leading-7">
                Здесь собирается рабочая карточка администратора: имя, email, должность, отдел,
                район, категории ответственности и короткое описание. Она сохраняется в Supabase и
                остаётся привязанной к аккаунту.
              </p>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="panel-copy text-sm font-medium">Имя администратора</span>
                <input
                  value={profile.displayName}
                  onChange={(event) => updateField("displayName", event.target.value)}
                  className="panel-input rounded-[1rem] px-4 py-3 text-sm outline-none"
                  placeholder="Например, Айдос Н."
                  maxLength={48}
                />
              </label>

              <label className="grid gap-2">
                <span className="panel-copy text-sm font-medium">Рабочий email</span>
                <input
                  value={email}
                  readOnly
                  className="panel-input rounded-[1rem] px-4 py-3 text-sm opacity-80 outline-none"
                />
              </label>

              <label className="grid gap-2">
                <span className="panel-copy text-sm font-medium">Должность</span>
                <input
                  value={profile.position}
                  onChange={(event) => updateField("position", event.target.value)}
                  className="panel-input rounded-[1rem] px-4 py-3 text-sm outline-none"
                  placeholder="Например, оператор смены"
                  maxLength={56}
                />
              </label>

              <label className="grid gap-2">
                <span className="panel-copy text-sm font-medium">Отдел</span>
                <input
                  value={profile.department}
                  onChange={(event) => updateField("department", event.target.value)}
                  className="panel-input rounded-[1rem] px-4 py-3 text-sm outline-none"
                  placeholder="Например, городской контакт-центр"
                  maxLength={64}
                />
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="panel-copy text-sm font-medium">Район или участок</span>
                <input
                  value={profile.district}
                  onChange={(event) => updateField("district", event.target.value)}
                  className="panel-input rounded-[1rem] px-4 py-3 text-sm outline-none"
                  placeholder="Например, Бостандыкский район"
                  maxLength={64}
                />
              </label>
            </div>

            <div className="mt-5 grid gap-2">
              <span className="panel-copy text-sm font-medium">Категории ответственности</span>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {CATEGORY_OPTIONS.map(([key, meta]) => {
                  const isActive = profile.categories.includes(key);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleCategory(key)}
                      className={`rounded-[1.2rem] border px-4 py-4 text-left transition ${
                        isActive
                          ? "panel-primary-button border-transparent"
                          : "panel-muted-card hover:border-[color:var(--panel-border)]"
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
            </div>

            <label className="mt-5 grid gap-2">
              <span className="panel-copy text-sm font-medium">О себе</span>
              <textarea
                value={profile.bio}
                onChange={(event) => updateField("bio", event.target.value)}
                className="panel-input min-h-36 rounded-[1.2rem] px-4 py-3 text-sm outline-none"
                placeholder="Коротко опишите свой рабочий фокус и зону ответственности."
                maxLength={280}
              />
              <span className="panel-copy text-xs">{profile.bio.length}/280</span>
            </label>

            <div className="panel-muted-card mt-5 rounded-[1.4rem] p-4">
              <p className="panel-section-title text-sm font-semibold">Текущий режим сохранения</p>
              <p className="panel-copy mt-2 text-sm leading-7">
                {isDemo
                  ? "Демо-аккаунт теперь тоже использует серверное хранение, чтобы весь опыт оставался консистентным."
                  : "Профиль, аватар и зона ответственности сохраняются в Supabase и доступны на любом устройстве."}
              </p>
            </div>

            {saveState.message ? (
              <div
                className={`mt-5 rounded-[1.2rem] px-4 py-3 text-sm ${
                  saveState.kind === "error" ? "panel-feedback-neutral" : "panel-success"
                }`}
              >
                {saveState.message}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="panel-primary-button rounded-full px-6 py-3 text-sm font-semibold"
              >
                {saving ? "Сохранение..." : "Сохранить профиль"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="panel-secondary-button rounded-full px-6 py-3 text-sm font-semibold"
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>
      </section>
    </form>
  );
}

function getInitials(displayName: string) {
  const words = displayName.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (words.length === 0) {
    return "CP";
  }

  return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
}
