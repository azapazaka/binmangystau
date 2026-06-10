export function CitizenFilterChipGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={[
            "rounded-2xl border px-4 py-2.5 text-sm font-medium transition",
            value === option
              ? "border-teal-700 bg-teal-700 text-white shadow-[0_18px_40px_-26px_rgba(15,118,110,0.7)]"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
          ].join(" ")}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
