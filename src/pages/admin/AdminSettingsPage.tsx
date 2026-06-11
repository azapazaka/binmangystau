import {
  Bell,
  Database,
  LogOut,
  MapPin,
  Shield,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { env, isMapboxConfigured, isSupabaseConfigured } from "@/lib/env";

export default function AdminSettingsPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-4">
      <header>
        <p className="citizen-v2-eyebrow">Настройки</p>
        <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
          Настройки
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Аккаунт, интеграции и текущий режим работы.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="citizen-v2-panel">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-emerald-700" />
            <h2>Аккаунт оператора</h2>
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">Имя:</span>{" "}
              {user?.fullName ?? "Не указано"}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Почта:</span>{" "}
              {user?.email ?? "Недоступно"}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Роль:</span> Администратор
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <LogOut size={16} />
            Выйти
          </button>
        </section>

        <section className="citizen-v2-panel">
          <div className="flex items-center gap-3">
            <Database size={20} className="text-sky-700" />
            <h2>Состояние интеграций</h2>
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">Supabase:</span>{" "}
              {isSupabaseConfigured() ? "Подключено" : "Нет env-переменных"}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Mapbox:</span>{" "}
              {isMapboxConfigured() ? "Настроено" : "Резервный режим карты"}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Центр карты:</span>{" "}
              {env.defaultLat}, {env.defaultLng}
            </p>
          </div>
        </section>

        <section className="citizen-v2-panel">
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-amber-700" />
            <h2>Рабочий контекст</h2>
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">Город:</span> Актау
            </p>
            <p>
              <span className="font-semibold text-slate-900">Радиус кластера:</span>{" "}
              {env.clusterRadiusMeters} м
            </p>
            <p>
              <span className="font-semibold text-slate-900">Режим:</span>{" "}
              Рабочий
            </p>
          </div>
        </section>

        <section className="citizen-v2-panel xl:col-span-2">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-violet-700" />
            <h2>Оповещения</h2>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600">
            Панель показывает карту, заявки и аналитику. AI-классификация и
            приоритизация включены, ручная проверка доступна в очереди.
          </p>
        </section>

        <section className="citizen-v2-panel">
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-emerald-700" />
            <h2>О приложении</h2>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            Основной интерфейс работает на Vite. Дополнительные эксперименты не
            участвуют в текущих маршрутах приложения.
          </p>
        </section>
      </div>
    </div>
  );
}
