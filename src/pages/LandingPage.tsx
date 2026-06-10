import { Link } from "react-router";
import {
  Building2,
  ChevronRight,
  Cpu,
  Eye,
  LayoutDashboard,
  MapPin,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import { CityPulseLogo } from "@/components/icons/CityPulseLogo";
import { ReportIcon } from "@/components/icons/ReportIcon";
import { ShieldIcon } from "@/components/icons/ShieldIcon";

function LandingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/88 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3 text-slate-900">
          <CityPulseLogo size={28} />
          <div>
            <p className="text-sm font-extrabold tracking-[0.18em] text-slate-500 uppercase">City portal</p>
            <p className="text-base font-extrabold leading-none">{APP_NAME}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-500 md:flex">
          <a href="#about" className="transition-colors hover:text-slate-900">
            About
          </a>
          <a href="#how" className="transition-colors hover:text-slate-900">
            How it works
          </a>
          <a href="#features" className="transition-colors hover:text-slate-900">
            Features
          </a>
        </nav>

        <Link
          to="/login/citizen"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section
      id="about"
      className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.92),_rgba(255,255,255,0)_42%),linear-gradient(180deg,_#dbeafe_0%,_#eff6ff_28%,_#f0fdf4_72%,_#dcfce7_100%)]"
    >
      <div className="absolute inset-x-0 bottom-0 h-[44%] bg-[linear-gradient(180deg,rgba(20,83,45,0)_0%,rgba(20,83,45,0.06)_100%)]" />
      <svg
        viewBox="0 0 1440 360"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[40vh] min-h-[280px] w-full text-emerald-900/8"
        aria-hidden="true"
      >
        <path
          d="M0 360V219l109-46 84-56 112 46 115-90 89 58 108-81 108 59 126-81 100 46 112-56 177 82V360Z"
          fill="currentColor"
        />
        <path
          d="M0 360V262l122-39 100 26 119-63 107 31 143-69 100 55 114-43 104 56 157-37 174 53v75Z"
          fill="rgba(21,128,61,0.12)"
        />
      </svg>

      <div className="relative mx-auto grid min-h-[calc(100vh-3.5rem)] w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
        <div className="max-w-xl">
          <div className="mb-6 flex items-center gap-3">
            <CityPulseLogo size={48} />
            <p className="text-[11px] font-extrabold uppercase tracking-[0.38em] text-green-700">
              Stronger city. Together.
            </p>
          </div>
          <h1 className="text-4xl font-black leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
            Report city issues.
            <br />
            Help <span className="text-green-600">Aktau</span> respond faster.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
            Citizens submit issues in seconds. AI validates, clusters, and prioritizes the signal.
            City teams coordinate the response before the backlog becomes the story.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              to="/login/citizen"
              className="group rounded-2xl border-2 border-slate-200 bg-white/92 p-5 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.4)] transition-all hover:-translate-y-1 hover:border-green-400 hover:shadow-[0_24px_55px_-26px_rgba(22,163,74,0.35)]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600 transition-colors group-hover:bg-green-100">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900">Sign in as citizen</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Report a problem, add context, and follow the response.
                  </p>
                </div>
              </div>
            </Link>

            <Link
              to="/login/admin"
              className="group rounded-2xl border-2 border-green-600 bg-green-600 p-5 text-white shadow-[0_24px_60px_-30px_rgba(22,163,74,0.75)] transition-all hover:-translate-y-1 hover:bg-green-700 hover:border-green-700"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14 text-white transition-colors group-hover:bg-white/20">
                  <LayoutDashboard size={20} />
                </div>
                <div>
                  <p className="text-base font-bold">Sign in as admin</p>
                  <p className="mt-1 text-sm leading-6 text-green-100">
                    Open the operations view, investigate clusters, and assign work.
                  </p>
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
            <Link to="/citizen/report" className="inline-flex items-center gap-2 transition-colors hover:text-green-700">
              <ChevronRight size={14} />
              Go to the citizen report form
            </Link>
            <Link to="/admin" className="inline-flex items-center gap-2 transition-colors hover:text-green-700">
              <ChevronRight size={14} />
              Open the admin panel
            </Link>
          </div>
        </div>

        {/* Hero right — city illustration */}
        <div className="relative hidden lg:block">
          <div className="absolute -left-8 top-12 h-40 w-40 rounded-full bg-cyan-200/45 blur-3xl" />
          <div className="absolute -right-10 bottom-12 h-48 w-48 rounded-full bg-green-200/45 blur-3xl" />

          <img
            src="/hero-smartcity.png"
            alt="Smart city with recycling infrastructure"
            className="relative w-full rounded-[28px] border border-white/70 shadow-[0_35px_90px_-40px_rgba(15,23,42,0.35)]"
          />

          <div className="absolute -left-10 bottom-8 rounded-2xl border border-white/80 bg-white/92 px-4 py-3 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.55)]">
            <p className="text-sm font-black text-green-700">+12 new reports</p>
            <p className="mt-1 text-xs text-slate-500">captured in the last 24 hours</p>
          </div>

          <div className="absolute -right-8 top-12 rounded-2xl bg-slate-950 px-4 py-3 text-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.8)]">
            <p className="text-sm font-black">AI verified</p>
            <p className="mt-1 text-xs text-slate-300">noise filtered before dispatch</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Citizens report",
      description: "A resident adds a photo, location, and a short explanation directly from the report flow.",
      icon: <ReportIcon size={32} />,
      tone: "bg-green-50 border-green-100",
    },
    {
      number: "02",
      title: "AI prioritizes",
      description: "The system validates the signal, detects duplicates, and ranks urgency before staff see it.",
      icon: <ShieldIcon size={32} />,
      tone: "bg-amber-50 border-amber-100",
    },
    {
      number: "03",
      title: "City teams respond",
      description: "Administrators review the cluster, coordinate the handoff, and close the loop for the citizen.",
      icon: <Building2 size={24} className="text-sky-500" />,
      tone: "bg-sky-50 border-sky-100",
    },
  ];

  return (
    <section id="how" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.38em] text-green-700">Process</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
            How CityPulse works
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-500">
            A simple public flow on the surface, with structured triage and operations logic behind it.
          </p>
        </div>

        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.number}
              className="relative rounded-[28px] border border-slate-200 bg-slate-50/65 p-7 text-center shadow-[0_18px_45px_-36px_rgba(15,23,42,0.45)]"
            >
              {index < steps.length - 1 ? (
                <div className="pointer-events-none absolute right-0 top-10 hidden translate-x-1/2 text-slate-300 md:block">
                  <ChevronRight size={20} />
                </div>
              ) : null}
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border ${step.tone}`}
              >
                {step.icon}
              </div>
              <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.3em] text-slate-300">
                {step.number}
              </p>
              <h3 className="mt-3 text-xl font-bold text-slate-900">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesStrip() {
  const features = [
    { icon: <Eye size={18} />, title: "Transparency", description: "Every step is visible to both sides." },
    { icon: <Shield size={18} />, title: "Verified", description: "Moderation and AI reduce bad signal." },
    { icon: <Cpu size={18} />, title: "AI assistant", description: "Automatic clustering and urgency scoring." },
    { icon: <MapPin size={18} />, title: "Made for Aktau", description: "Built around local response flows." },
    { icon: <Sparkles size={18} />, title: "Shared momentum", description: "Citizens and teams improve the city together." },
  ];

  return (
    <section id="features" className="border-t border-slate-200 bg-slate-50 py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white/88 p-5 shadow-[0_18px_45px_-36px_rgba(15,23,42,0.3)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-sm font-bold uppercase tracking-[0.08em] text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CityScapeBanner() {
  return (
    <section className="relative overflow-hidden">
      <img
        src="/hero-cityscape.png"
        alt="Aktau cityscape with mountains and greenery"
        className="h-48 w-full object-cover sm:h-56"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 px-4 pb-6 text-center sm:px-6">
        <p className="text-lg font-bold text-slate-900">Building a smarter, greener Aktau</p>
        <p className="mt-1 text-sm text-slate-600">Together with citizens, AI, and city teams</p>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
        <div className="flex items-center gap-3">
          <CityPulseLogo size={24} />
          <div>
            <p className="text-sm font-bold text-slate-900">{APP_NAME}</p>
            <p className="text-xs text-slate-500">Stronger city. Together.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-slate-500">
          <Link to="/login/citizen" className="transition-colors hover:text-green-700">
            Citizen login
          </Link>
          <Link to="/login/admin" className="transition-colors hover:text-green-700">
            Admin login
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <LandingNav />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <CityScapeBanner />
        <FeaturesStrip />
      </main>
      <LandingFooter />
    </div>
  );
}
