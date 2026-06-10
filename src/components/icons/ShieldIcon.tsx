/** Verification shield icon — teal shield with checkmark and city pulse */
export function ShieldIcon({
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
      {/* Shield outline */}
      <path
        d="M50 8L12 28v30c0 28 16 44 38 54 22-10 38-26 38-54V28z"
        fill="url(#shield-fill)"
        stroke="url(#shield-stroke)"
        strokeWidth="5"
      />

      {/* City skyline at bottom (faint) */}
      <path
        d="M30 82v-6h4v-4h4v4h4v-8h6v14h4v-10h4v10h4v-6h6v6"
        stroke="#94a3b8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.35"
      />

      {/* Pulse line (faint) */}
      <path
        d="M26 86h10l3-5 4 10 4-10 3 5h24"
        stroke="#94a3b8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.3"
      />

      {/* Checkmark */}
      <path
        d="M36 52l12 12 20-24"
        stroke="#1e3a5f"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <defs>
        <linearGradient id="shield-fill" x1="50" y1="8" x2="50" y2="112">
          <stop stopColor="#f0fdfa" />
          <stop offset="1" stopColor="#ecfdf5" />
        </linearGradient>
        <linearGradient id="shield-stroke" x1="50" y1="8" x2="50" y2="112">
          <stop stopColor="#0d9488" />
          <stop offset="1" stopColor="#16a34a" />
        </linearGradient>
      </defs>
    </svg>
  );
}
