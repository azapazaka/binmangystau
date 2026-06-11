import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { CityPulseLogo } from "@/components/icons";
import { useAuth } from "@/contexts/AuthContext";
import { APP_NAME, DEMO_ACCOUNTS } from "@/lib/constants";

export default function LoginPage() {
  const { role = "citizen" } = useParams<{ role: "citizen" | "admin" }>();
  const { signIn, registerCitizen } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const [mode, setMode] = useState<"sign_in" | "register">("sign_in");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isAdmin = role === "admin";
  const isRegisterMode = !isAdmin && mode === "register";

  const roleMeta = isAdmin
    ? {
        eyebrow: "Городские операции",
        title: "Войдите в центр управления",
        subtitle:
          "Проверяйте кластеры, координируйте реагирование и держите поток обращений под контролем, пока очередь не стала проблемой.",
        badge: "Доступ администратора",
        icon: <LayoutDashboard size={18} />,
        accent: "from-emerald-500 via-teal-500 to-sky-500",
        surface: "from-emerald-50 via-white to-sky-50",
        switchHref: "/login/citizen",
        switchLabel: "Войти как житель",
        highlights: [
          "Карта обращений с приоритетами кластеров",
          "Модерация обращений и очередь AI-проверки",
          "Пульс сообщества и аналитика реакции",
        ],
      }
    : {
        eyebrow: "Портал жителя",
        title: "Сообщайте о проблемах без лишней возни",
        subtitle:
          "Отправляйте обращение, следите за реакцией и помогайте подтверждать, что происходит вокруг Актау.",
        badge: "Доступ жителя",
        icon: <Users size={18} />,
        accent: "from-amber-400 via-emerald-400 to-teal-500",
        surface: "from-amber-50 via-white to-emerald-50",
        switchHref: "/login/admin",
        switchLabel: "Войти как администратор",
        highlights: [
          "Быстрая подача обращения с контекстом карты",
          "Личная активность, проверка и отслеживание статуса",
          "Общий городской сигнал на базе данных Supabase",
        ],
      };

  const fill = () => {
    const account = DEMO_ACCOUNTS[role as "citizen" | "admin"];
    setMode("sign_in");
    setFullName("");
    setError(null);
    setSuccess(null);
    setEmail(account.email);
    setPassword(account.password);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (isRegisterMode) {
      const result = await registerCitizen({
        fullName,
        email,
        password,
      });
      setLoading(false);

      if (result.status === "error") {
        setError(result.message);
        return;
      }

      if (result.status === "confirm_email") {
        setSuccess(result.message);
        setPassword("");
        return;
      }

      nav("/citizen/report", { replace: true });
      return;
    }

    const nextError = await signIn(email, password);
    setLoading(false);
    if (nextError) {
      setError(nextError);
      return;
    }
    nav(from ?? (isAdmin ? "/admin" : "/citizen/report"), { replace: true });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,244,214,0.75),_rgba(255,244,214,0)_28%),radial-gradient(circle_at_bottom_right,_rgba(187,247,208,0.6),_rgba(187,247,208,0)_32%),linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_100%)] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/70 bg-white/75 shadow-[0_45px_120px_-58px_rgba(15,23,42,0.45)] backdrop-blur xl:grid-cols-[1.08fr_0.92fr]">
        <section
          className={`relative overflow-hidden bg-gradient-to-br ${roleMeta.surface} p-7 sm:p-10 xl:p-12`}
        >
          <div
            className={`absolute inset-x-10 top-0 h-56 rounded-full bg-gradient-to-r ${roleMeta.accent} opacity-20 blur-3xl`}
          />
          <div className="relative flex h-full flex-col">
            <Link
              to="/"
              className="inline-flex items-center gap-3 text-slate-900 no-underline"
            >
              <CityPulseLogo size={34} />
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-400">
                  Городская платформа
                </p>
                <p className="text-lg font-black tracking-[-0.03em] text-slate-950">
                  {APP_NAME}
                </p>
              </div>
            </Link>

            <div className="mt-12 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 shadow-sm">
                {roleMeta.icon}
                {roleMeta.badge}
              </div>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.32em] text-slate-400">
                {roleMeta.eyebrow}
              </p>
              <h1 className="mt-3 max-w-lg text-4xl font-black leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-5xl">
                {roleMeta.title}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-8 text-slate-600">
                {roleMeta.subtitle}
              </p>
            </div>

            <div className="mt-8 grid gap-3">
              {roleMeta.highlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/78 px-4 py-4 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.35)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <ShieldCheck size={18} />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-10">
              <div className="rounded-[28px] border border-slate-200/80 bg-white/86 p-5 shadow-[0_24px_55px_-42px_rgba(15,23,42,0.45)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Демо-доступ</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Используйте встроенную демо-учётную запись, чтобы изучить
                      приложение без создания нового пользователя.
                    </p>
                  </div>
                  <Sparkles size={18} className="mt-1 text-amber-500" />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Email
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {DEMO_ACCOUNTS[role as "citizen" | "admin"].email}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Пароль
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {DEMO_ACCOUNTS[role as "citizen" | "admin"].password}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white/88 p-6 sm:p-8 xl:p-10">
          <div className="w-full max-w-md">
            <div className="mb-6 flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
              <Link
                to="/login/citizen"
                className={[
                  "flex-1 rounded-xl px-4 py-3 text-center text-sm font-semibold no-underline transition",
                  !isAdmin
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-900",
                ].join(" ")}
              >
                Житель
              </Link>
              <Link
                to="/login/admin"
                className={[
                  "flex-1 rounded-xl px-4 py-3 text-center text-sm font-semibold no-underline transition",
                  isAdmin
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-900",
                ].join(" ")}
              >
                Админ
              </Link>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_26px_70px_-42px_rgba(15,23,42,0.35)] sm:p-8">
              <div className="mb-6">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                  Защищённый вход
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
                  {isRegisterMode ? `Создайте аккаунт ${APP_NAME}` : `Продолжите в ${APP_NAME}`}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {isRegisterMode
                    ? "Создайте учётную запись жителя, чтобы отправлять обращения и следить за реакцией."
                    : "Используйте действующие данные Supabase или демо-аккаунт для этой роли."}
                </p>
              </div>

              <form onSubmit={submit} className="flex flex-col gap-4">
                {isRegisterMode ? (
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                      Имя и фамилия
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                      placeholder="Айгерим Серик"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>
                ) : null}

                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                    Почта
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                    Пароль
                  </label>
                  <div className="relative">
                    <input
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      placeholder="Введите пароль"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-11 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((current) => !current)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error ? (
                  <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </p>
                ) : null}

                {success ? (
                  <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {success}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary mt-1 w-full rounded-2xl py-3.5 text-sm font-bold"
                >
                    {loading
                    ? isRegisterMode
                      ? "Создаём аккаунт..."
                      : "Входим..."
                    : isRegisterMode
                      ? "Создать аккаунт"
                      : "Войти"}
                </button>
              </form>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <button
                  onClick={fill}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Использовать демо-аккаунт
                </button>
                <Link
                  to={roleMeta.switchHref}
                  className="inline-flex items-center justify-center gap-2 px-2 text-sm font-semibold text-emerald-700 no-underline hover:text-emerald-800"
                >
                  {roleMeta.switchLabel}
                  <ArrowRight size={15} />
                </Link>
              </div>

              {!isAdmin ? (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode((current) => current === "sign_in" ? "register" : "sign_in");
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                  >
                    {isRegisterMode
                      ? "Уже есть аккаунт? Войти"
                      : "Нет аккаунта? Зарегистрироваться"}
                  </button>
                </div>
              ) : null}

              <div className="mt-6 rounded-[24px] bg-slate-50 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Рабочее пространство Актау
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Эта сессия подключена к тому же Vite-приложению, которое
                      используется для обращений, аналитики, управления вывозом
                      и проверки сообщества.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
