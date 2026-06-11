import { Bell, MapPin, Shield } from "lucide-react";

import { CitizenShell } from "@/components/citizen-v2/CitizenShell";
import { useAuth } from "@/contexts/AuthContext";

export default function CitizenSettingsPage() {
  const { user, signOut } = useAuth();

  return (
    <CitizenShell title="Настройки" subtitle="Аккаунт и локальные параметры.">
      <div className="grid gap-5 xl:grid-cols-3">
        <article className="citizen-v2-panel">
          <div className="flex items-center gap-3">
            <Shield size={22} className="text-emerald-700" />
            <h2>Аккаунт</h2>
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p><span className="font-semibold text-slate-900">Имя:</span> {user?.fullName ?? "Житель"}</p>
            <p><span className="font-semibold text-slate-900">Почта:</span> {user?.email ?? "Недоступно"}</p>
            <p><span className="font-semibold text-slate-900">Роль:</span> Житель</p>
          </div>
          <button type="button" onClick={signOut} className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
            Выйти
          </button>
        </article>

        <article className="citizen-v2-panel">
          <div className="flex items-center gap-3">
            <MapPin size={22} className="text-teal-700" />
            <h2>Локация</h2>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            Сейчас гражданский контур работает с Актау по умолчанию. Персональные настройки района можно будет добавить позже.
          </p>
        </article>

        <article className="citizen-v2-panel">
          <div className="flex items-center gap-3">
            <Bell size={22} className="text-amber-700" />
            <h2>Уведомления</h2>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            Настройки уведомлений пока не вынесены в интерфейс. Раздел оставлен в навигации для целостного маршрута.
          </p>
        </article>
      </div>
    </CitizenShell>
  );
}
