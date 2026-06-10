/** Smart waste container icon — teal circle, recycle bin, wifi, green pin */
export function SmartWasteIcon({
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
      <circle cx="60" cy="56" r="48" stroke="url(#waste-ring)" strokeWidth="7" fill="none" />

      {/* Bin body */}
      <rect x="38" y="42" width="44" height="34" rx="6" fill="#1e3a5f" />
      {/* Bin lid */}
      <rect x="34" y="36" width="52" height="8" rx="4" fill="#1e3a5f" />
      {/* Bin handle */}
      <rect x="54" y="30" width="12" height="8" rx="3" fill="#1e3a5f" />

      {/* Recycle symbol */}
      <path
        d="M52 56l4-6 4 6m-12 4l6 4-2 6m12-4l-6 4 2 6"
        stroke="#22c55e"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Simplified recycle arrows */}
      <path
        d="M54 52l6 0m-9 10l3 5m6-5l3 5"
        stroke="#22c55e"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Wifi arcs */}
      <path d="M54 28a10 10 0 0 1 12 0" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M50 23a16 16 0 0 1 20 0" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M46 18a22 22 0 0 1 28 0" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Wifi dot */}
      <circle cx="60" cy="32" r="2" fill="#0d9488" />

      {/* Green chevron / pin bottom */}
      <path d="M36 82L60 126L84 82" fill="url(#waste-pin)" />
      {/* Pulse on chevron */}
      <path
        d="M42 90h8l3-6 4 12 4-12 3 6h14"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />

      <defs>
        <linearGradient id="waste-ring" x1="12" y1="8" x2="108" y2="104">
          <stop stopColor="#0d9488" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
        <linearGradient id="waste-pin" x1="60" y1="82" x2="60" y2="126">
          <stop stopColor="#16a34a" />
          <stop offset="1" stopColor="#22c55e" />
        </linearGradient>
      </defs>
    </svg>
  );
}
