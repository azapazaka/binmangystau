import type { ReactNode } from "react";

const toneMeta = {
  teal:   { bg: "bg-teal-50",    text: "text-teal-700"    },
  green:  { bg: "bg-emerald-50", text: "text-emerald-700" },
  amber:  { bg: "bg-amber-50",   text: "text-amber-700"   },
  purple: { bg: "bg-purple-50",  text: "text-purple-700"  },
  blue:   { bg: "bg-blue-50",    text: "text-blue-600"    },
} as const;

type Tone = keyof typeof toneMeta;

export function CitizenMetricCard({
  icon,
  label,
  value,
  tone = "teal",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note?: string;
  tone?: Tone;
}) {
  const { bg, text } = toneMeta[tone];
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${bg} ${text}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-black leading-none text-slate-950">{value}</p>
        <p className="mt-0.5 truncate text-[11px] text-slate-500">{label}</p>
      </div>
    </article>
  );
}
