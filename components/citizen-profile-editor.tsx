"use client";

import Image from "next/image";
import { useEffect, useEffectEvent, useId, useState } from "react";

import { getPendingProfileMigration } from "@/lib/profile-client";

type CitizenProfileDraft = {
  displayName: string;
  district: string;
  bio: string;
  avatarUrl: string | null;
};

type CitizenProfileEditorProps = {
  email: string;
  initialProfile: CitizenProfileDraft;
  resetProfile: CitizenProfileDraft;
  storageKey: string;
  hasStoredProfile: boolean;
  isDemo: boolean;
};

type SaveState =
  | { kind: "idle"; message: string | null }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const MAX_AVATAR_SIZE = 3 * 1024 * 1024;

export function CitizenProfileEditor({
  email,
  initialProfile,
  resetProfile,
  storageKey,
  hasStoredProfile,
  isDemo,
}: CitizenProfileEditorProps) {
  const avatarInputId = useId();
  const [profile, setProfile] = useState<CitizenProfileDraft>(initialProfile);
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
          role: "citizen",
          rawLocalStorageValue: savedProfile,
          hasStoredProfile,
        });

        if (!migration || cancelled) {
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

  function updateField<Key extends keyof CitizenProfileDraft>(
    field: Key,
    value: CitizenProfileDraft[Key],
  ) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
    setSaveState({ kind: "idle", message: null });
  }

  const persistProfileEvent = useEffectEvent(persistProfile);

  async function persistProfile(
    nextProfile: CitizenProfileDraft,
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
        profile?: CitizenProfileDraft;
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
            <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Profile photo</p>
            <div className="mt-5 flex flex-col items-center text-center">
              <div className="relative h-32 w-32 overflow-hidden rounded-[2rem] border border-[color:var(--panel-border)] bg-[var(--panel-muted-surface)] shadow-[var(--panel-shadow)]">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt="Аватар профиля"
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
              <p className="panel-copy mt-2 text-sm leading-7">{email}</p>

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
              <p className="panel-section-title text-sm font-semibold">Привязка к аккаунту</p>
              <p className="panel-copy mt-2 text-sm leading-7">
                Email уже связан с текущей сессией и отображается как системное поле. Теперь профиль
                и аватар сохраняются в аккаунте, а не только локально в браузере.
              </p>
            </div>
          </aside>

          <div className="panel-surface-strong rounded-[2rem] p-5 md:p-6">
            <div className="flex flex-col gap-2">
              <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Personal profile</p>
              <h1 className="panel-title text-4xl font-semibold">Личные данные гражданина</h1>
              <p className="panel-copy max-w-3xl text-sm leading-7">
                Сначала здесь формируется сама персональная карточка пользователя: имя, email,
                район, описание и аватар. Ниже уже идут рейтинг, достижения и статистика активности.
              </p>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="panel-copy text-sm font-medium">Как вас отображать</span>
                <input
                  value={profile.displayName}
                  onChange={(event) => updateField("displayName", event.target.value)}
                  className="panel-input rounded-[1rem] px-4 py-3 text-sm outline-none"
                  placeholder="Например, Алия С."
                  maxLength={48}
                />
              </label>

              <label className="grid gap-2">
                <span className="panel-copy text-sm font-medium">Email аккаунта</span>
                <input
                  value={email}
                  readOnly
                  className="panel-input rounded-[1rem] px-4 py-3 text-sm opacity-80 outline-none"
                />
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="panel-copy text-sm font-medium">Ваш район</span>
                <input
                  value={profile.district}
                  onChange={(event) => updateField("district", event.target.value)}
                  className="panel-input rounded-[1rem] px-4 py-3 text-sm outline-none"
                  placeholder="Например, Алмалинский район"
                  maxLength={64}
                />
              </label>
            </div>

            <label className="mt-5 grid gap-2">
              <span className="panel-copy text-sm font-medium">О себе</span>
              <textarea
                value={profile.bio}
                onChange={(event) => updateField("bio", event.target.value)}
                className="panel-input min-h-36 rounded-[1.2rem] px-4 py-3 text-sm outline-none"
                placeholder="Коротко расскажите, что для вас важно в городе и почему вы пользуетесь CityPulse."
                maxLength={280}
              />
              <span className="panel-copy text-xs">{profile.bio.length}/280</span>
            </label>

            <div className="panel-muted-card mt-5 rounded-[1.4rem] p-4">
              <p className="panel-section-title text-sm font-semibold">Текущий режим сохранения</p>
              <p className="panel-copy mt-2 text-sm leading-7">
                {isDemo
                  ? "Демо-аккаунт теперь тоже использует серверное хранение, чтобы весь опыт оставался консистентным."
                  : "Профиль и аватар сохраняются в Supabase и переживают обновление страницы и смену устройства."}
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
