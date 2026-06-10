import { ArrowRight, ShieldCheck } from "lucide-react";

export function CitizenTrustBanner() {
  return (
    <section className="mt-4 rounded-[28px] border border-emerald-100 bg-[linear-gradient(180deg,#f7fff9_0%,#edf9ef_100%)] p-5 shadow-[0_24px_55px_-40px_rgba(34,197,94,0.35)]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-700">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Transparent. Verified. Trusted.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            All reports are reviewed for accuracy. You can help by verifying
            issues in your area.
          </p>
        </div>
      </div>

      <button
        type="button"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-white px-4 py-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
      >
        Verify Issues
        <ArrowRight size={16} />
      </button>
    </section>
  );
}
