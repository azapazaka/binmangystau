/** CityPulse brand logo — teal circle, city skyline, pulse line, green pin chevron */
export function CityPulseLogo({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={size * 1.17}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Teal circle */}
      <circle cx="60" cy="56" r="48" stroke="url(#logo-ring)" strokeWidth="8" fill="none" />

      {/* City skyline silhouette */}
      <path
        d="M34 62V46h8v-8h4v8h4V38h8v24h4V42h4v20h4V48h8v14h8V50h4v12h4"
        stroke="#1e3a5f"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Heartbeat / pulse line */}
      <path
        d="M20 68h18l4-10 6 20 6-20 4 10h42"
        stroke="url(#logo-pulse)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Green chevron / pin bottom */}
      <path
        d="M36 82L60 130L84 82"
        fill="url(#logo-pin)"
      />

      <defs>
        <linearGradient id="logo-ring" x1="12" y1="8" x2="108" y2="104">
          <stop stopColor="#0d9488" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
        <linearGradient id="logo-pulse" x1="20" y1="68" x2="100" y2="68">
          <stop stopColor="#14b8a6" />
          <stop offset="1" stopColor="#22c55e" />
        </linearGradient>
        <linearGradient id="logo-pin" x1="60" y1="82" x2="60" y2="130">
          <stop stopColor="#16a34a" />
          <stop offset="1" stopColor="#22c55e" />
        </linearGradient>
      </defs>
    </svg>
  );
}
