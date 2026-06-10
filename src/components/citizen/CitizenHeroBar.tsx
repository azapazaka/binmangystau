import { useId } from "react";

import { Bell, ChevronDown, Funnel, Plus, Search } from "lucide-react";
import { citizenCopy } from "@/components/citizen-v2/citizen-copy";

const FILTERS = ["All", "Roads", "Lights", "Trash", "Traffic", "Other"] as const;
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

type CitizenHeroBarProps = {
  districtLabel?: string;
  profileName?: string;
  profileSubtitle?: string;
  searchInputId?: string;
  selectedFilterLabel?: (typeof FILTERS)[number];
};

export function CitizenHeroBar({
  districtLabel = "All districts",
  profileName = "Aida K.",
  profileSubtitle = "Active Citizen",
  searchInputId,
  selectedFilterLabel = "All",
}: CitizenHeroBarProps) {
  const generatedSearchInputId = useId();
  const resolvedSearchInputId = searchInputId ?? generatedSearchInputId;

  return (
    <section className="rounded-[28px] border border-white/70 bg-white/92 p-8 shadow-[0_30px_80px_-42px_rgba(15,23,42,0.28)]">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-black leading-none tracking-[-0.05em] text-slate-950 sm:text-5xl xl:text-[3.2rem]">
            Explore issues in <span className="text-emerald-700">{citizenCopy.cityName}</span>
          </h1>
          <p className="mt-3 text-base text-slate-500 sm:text-lg">
            See what&apos;s happening around you and help make our city better.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <button
            type="button"
            aria-label="Notifications"
            className={`relative rounded-full border border-slate-200 bg-white p-3 text-slate-500 transition hover:bg-slate-50 ${FOCUS_RING}`}
          >
            <Bell size={20} />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
          </button>

          <button
            type="button"
            className={`flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left ${FOCUS_RING}`}
          >
            <div className="h-11 w-11 rounded-full bg-[linear-gradient(135deg,#f4d5c8_0%,#eadfce_100%)]" />
            <div>
              <p className="text-sm font-bold text-slate-900">{profileName}</p>
              <p className="text-sm text-slate-500">{profileSubtitle}</p>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-2xl bg-teal-700 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_24px_55px_-30px_rgba(15,118,110,0.8)] sm:px-6 sm:py-4 sm:text-base ${FOCUS_RING}`}
          >
            <Plus size={18} />
            New Report
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 xl:flex-row xl:items-center">
        <button
          type="button"
          className={`flex min-w-[150px] items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 ${FOCUS_RING}`}
        >
          {districtLabel}
          <ChevronDown size={16} className="text-slate-400" />
        </button>

        <label
          htmlFor={resolvedSearchInputId}
          className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 focus-within:ring-offset-white"
        >
          <span className="sr-only">Search issues</span>
          <Search size={18} className="text-slate-400" />
          <input
            id={resolvedSearchInputId}
            readOnly
            placeholder="Search location or issue..."
            aria-label="Search issues"
            className={`w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 ${FOCUS_RING}`}
          />
        </label>

        <fieldset
          aria-label="Issue filters"
          role="radiogroup"
          className="flex flex-wrap items-center gap-2 border-0 p-0 xl:ml-4"
        >
          {FILTERS.map((filter) => (
            <label
              key={filter}
              className={[
                "cursor-pointer rounded-2xl text-sm font-medium",
                selectedFilterLabel === filter
                  ? "text-teal-800"
                  : "text-slate-700",
              ].join(" ")}
            >
              <input
                checked={selectedFilterLabel === filter}
                className="peer sr-only"
                name="citizen-issue-filter"
                readOnly
                type="radio"
                value={filter}
              />
              <span
                className={[
                  "block rounded-2xl border px-4 py-3 transition-colors",
                  "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-white",
                  selectedFilterLabel === filter
                    ? "border-teal-700 bg-teal-50 text-teal-800"
                    : "border-slate-200 bg-white text-slate-700",
                ].join(" ")}
              >
                {filter}
              </span>
            </label>
          ))}
        </fieldset>

        <button
          type="button"
          className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 xl:ml-auto ${FOCUS_RING}`}
        >
          <Funnel size={16} />
          Filters
        </button>
      </div>
    </section>
  );
}
