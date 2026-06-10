import { Heart, Lock, Shield, Siren } from "lucide-react";

import { citizenCopy } from "@/components/citizen-v2/citizen-copy";

const VALUES = [
  {
    icon: Shield,
    title: "Safe & respectful",
    note: "We keep our community friendly and safe.",
  },
  {
    icon: Lock,
    title: "Privacy first",
    note: "Your data is private and secure.",
  },
  {
    icon: Siren,
    title: "Real impact",
    note: "Reports lead to real actions.",
  },
] as const;

export function CitizenValueStrip() {
  return (
    <section className="mt-6 grid gap-6 rounded-[28px] border border-white/70 bg-white/90 px-6 py-5 shadow-[0_20px_55px_-42px_rgba(15,23,42,0.2)] xl:grid-cols-[1fr_1fr_1fr_280px_240px] xl:items-center">
      {VALUES.map(({ icon: Icon, title, note }) => (
        <article key={title} className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <Icon size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{note}</p>
          </div>
        </article>
      ))}

      <div className="h-20 rounded-[22px] bg-[linear-gradient(135deg,#d8f1db_0%,#f7e5bd_100%)]" />

      <article>
        <h2 className="text-[1.6rem] font-bold leading-tight tracking-[-0.03em] text-slate-950">
          {citizenCopy.cityName} is our home.
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Let&apos;s keep it clean, safe and beautiful.
        </p>
        <Heart size={18} className="mt-3 text-slate-400" />
      </article>
    </section>
  );
}
