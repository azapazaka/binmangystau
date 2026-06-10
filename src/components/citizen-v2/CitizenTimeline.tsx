export type CitizenTimelineItem = {
  title: string;
  at: string;
  note: string;
  status: "complete" | "current" | "upcoming";
};

export function CitizenTimeline({ items }: { items: CitizenTimelineItem[] }) {
  return (
    <div className="space-y-5">
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={[
                "h-3.5 w-3.5 rounded-full border-2",
                item.status === "complete"
                  ? "border-emerald-600 bg-emerald-500"
                  : item.status === "current"
                    ? "border-sky-600 bg-white"
                    : "border-slate-300 bg-white",
              ].join(" ")}
            />
            {index < items.length - 1 ? (
              <span className="mt-2 h-14 w-px bg-slate-200" />
            ) : null}
          </div>
          <div className="pb-1">
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            <p className="mt-1 text-sm text-slate-500">{item.at}</p>
            <p className="mt-1 text-sm text-slate-500">{item.note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
