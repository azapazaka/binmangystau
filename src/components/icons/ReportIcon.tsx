/** Report document icon — page with image and alert badge */
export function ReportIcon({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Document body */}
      <rect x="12" y="6" width="66" height="90" rx="12" fill="#f0fdfa" stroke="#1e3a5f" strokeWidth="5" />

      {/* Text lines */}
      <line x1="28" y1="24" x2="62" y2="24" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
      <line x1="28" y1="34" x2="56" y2="34" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
      <line x1="28" y1="44" x2="48" y2="44" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />

      {/* Image / mountain icon */}
      <rect x="24" y="54" width="42" height="30" rx="6" fill="#e0f2fe" stroke="#0d9488" strokeWidth="2.5" />
      <path d="M28 78l10-12 8 8 6-6 10 10z" fill="#14b8a6" opacity="0.6" />
      <circle cx="56" cy="62" r="4" fill="#0d9488" opacity="0.5" />

      {/* Alert badge */}
      <circle cx="76" cy="84" r="16" fill="#16a34a" />
      <text x="76" y="90" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="sans-serif">!</text>
    </svg>
  );
}
