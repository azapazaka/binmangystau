type PublicTrafficVisualProps = {
  variant: "main" | "citizen" | "admin";
};

type TrafficTone = "a" | "b" | "c" | "d";

type TrafficPath = {
  d: string;
  tone: TrafficTone;
  width: number;
  opacity?: number;
};

type TrafficNode = {
  x: number;
  y: number;
  tone: TrafficTone;
  size: "sm" | "md" | "lg";
};

const PATHS: Record<PublicTrafficVisualProps["variant"], readonly TrafficPath[]> = {
  main: [
    { d: "M92 270C150 206 212 170 292 162C364 154 436 184 514 174C594 164 666 120 734 118", tone: "a", width: 6 },
    { d: "M120 124C188 176 252 242 320 320C390 398 460 446 594 470", tone: "b", width: 5, opacity: 0.92 },
    { d: "M162 448C228 404 284 338 338 258C386 186 446 124 548 88", tone: "c", width: 4, opacity: 0.9 },
    { d: "M342 52C364 126 386 204 420 286C458 378 518 446 608 500", tone: "d", width: 4, opacity: 0.84 },
    { d: "M142 206C210 256 268 288 344 302C430 318 516 308 666 338", tone: "a", width: 3.2, opacity: 0.74 },
    { d: "M204 88C264 154 312 220 372 280C438 346 500 384 562 412C614 434 662 464 714 520", tone: "b", width: 3.2, opacity: 0.76 },
    { d: "M218 492C286 430 344 376 392 318C438 262 496 214 582 178", tone: "c", width: 3.2, opacity: 0.72 },
    { d: "M436 94C448 170 460 246 492 316C526 392 588 452 674 490", tone: "d", width: 2.8, opacity: 0.66 },
  ],
  citizen: [
    { d: "M108 286C168 230 226 198 296 188C366 178 434 198 502 188C580 176 648 136 716 132", tone: "a", width: 5.2, opacity: 0.84 },
    { d: "M146 152C206 210 262 270 318 336C384 414 446 458 562 482", tone: "d", width: 4, opacity: 0.74 },
    { d: "M188 454C246 408 298 348 346 272C392 200 446 144 532 108", tone: "c", width: 3.6, opacity: 0.76 },
    { d: "M360 82C376 150 394 220 424 290C456 366 506 430 578 480", tone: "b", width: 3.2, opacity: 0.68 },
    { d: "M154 224C220 268 278 298 354 314C430 330 506 324 632 350", tone: "a", width: 2.8, opacity: 0.62 },
    { d: "M240 110C286 172 330 228 386 282C444 338 498 372 556 398C610 422 654 450 694 500", tone: "b", width: 2.6, opacity: 0.6 },
    { d: "M262 488C316 430 366 384 412 324C452 272 500 228 570 198", tone: "c", width: 2.4, opacity: 0.58 },
  ],
  admin: [
    { d: "M86 272C154 206 220 166 302 156C386 146 454 178 542 168C628 158 702 118 748 112", tone: "a", width: 7 },
    { d: "M116 110C186 170 256 246 334 336C412 428 492 474 642 500", tone: "b", width: 5.4, opacity: 0.95 },
    { d: "M154 476C228 420 294 348 358 250C416 162 480 106 592 72", tone: "c", width: 5.1, opacity: 0.94 },
    { d: "M320 34C352 120 380 216 420 308C468 420 540 488 648 530", tone: "d", width: 4.4, opacity: 0.92 },
    { d: "M132 196C214 252 286 294 376 312C468 330 558 320 712 350", tone: "a", width: 3.8, opacity: 0.82 },
    { d: "M214 74C274 148 326 224 392 292C468 370 540 414 608 442C658 462 704 486 744 532", tone: "b", width: 3.8, opacity: 0.82 },
    { d: "M208 512C288 450 352 392 410 328C466 266 530 214 624 170", tone: "c", width: 3.6, opacity: 0.78 },
    { d: "M460 86C474 180 488 268 524 352C564 444 628 500 724 532", tone: "d", width: 3.2, opacity: 0.72 },
    { d: "M274 108C320 176 360 252 402 338C440 416 486 474 562 524", tone: "a", width: 2.8, opacity: 0.68 },
  ],
};

const NODES: Record<PublicTrafficVisualProps["variant"], readonly TrafficNode[]> = {
  main: [
    { x: 292, y: 162, tone: "a", size: "md" },
    { x: 376, y: 278, tone: "b", size: "lg" },
    { x: 442, y: 296, tone: "c", size: "md" },
    { x: 514, y: 190, tone: "d", size: "md" },
    { x: 582, y: 178, tone: "a", size: "sm" },
    { x: 608, y: 418, tone: "b", size: "sm" },
    { x: 338, y: 258, tone: "d", size: "sm" },
  ],
  citizen: [
    { x: 296, y: 188, tone: "a", size: "md" },
    { x: 362, y: 292, tone: "d", size: "md" },
    { x: 420, y: 308, tone: "c", size: "sm" },
    { x: 498, y: 188, tone: "b", size: "sm" },
    { x: 532, y: 108, tone: "a", size: "sm" },
    { x: 574, y: 482, tone: "d", size: "sm" },
  ],
  admin: [
    { x: 302, y: 156, tone: "a", size: "md" },
    { x: 390, y: 292, tone: "b", size: "lg" },
    { x: 454, y: 304, tone: "c", size: "md" },
    { x: 542, y: 168, tone: "d", size: "md" },
    { x: 592, y: 72, tone: "a", size: "sm" },
    { x: 636, y: 500, tone: "b", size: "sm" },
    { x: 688, y: 364, tone: "c", size: "sm" },
    { x: 358, y: 250, tone: "d", size: "sm" },
  ],
};

function getNodeRadius(size: TrafficNode["size"]) {
  switch (size) {
    case "lg":
      return 10;
    case "md":
      return 7;
    case "sm":
      return 5;
  }
}

export function PublicTrafficVisual({ variant }: PublicTrafficVisualProps) {
  const paths = PATHS[variant];
  const nodes = NODES[variant];

  return (
    <div className={`portal-traffic-visual portal-traffic-visual-${variant}`} aria-hidden="true">
      <div className="portal-traffic-backplate" />
      <div className="portal-traffic-mesh" />
      <div className="portal-traffic-glow portal-traffic-glow-a" />
      <div className="portal-traffic-glow portal-traffic-glow-b" />
      <svg
        className="portal-traffic-svg"
        viewBox="0 0 780 560"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="portal-traffic-grid">
          <path d="M96 92H712" />
          <path d="M80 178H728" />
          <path d="M70 266H738" />
          <path d="M80 354H728" />
          <path d="M96 442H712" />
          <path d="M162 58V514" />
          <path d="M286 42V532" />
          <path d="M408 36V536" />
          <path d="M534 48V528" />
          <path d="M652 68V518" />
        </g>

        <g className="portal-traffic-rings">
          <circle cx="404" cy="286" r="50" />
          <circle cx="404" cy="286" r="112" />
          <circle cx="404" cy="286" r="176" />
        </g>

        {paths.map((path) => (
          <path
            key={path.d}
            d={path.d}
            className={`portal-traffic-line portal-traffic-line-${path.tone}`}
            style={{
              strokeWidth: path.width,
              opacity: path.opacity ?? 1,
            }}
          />
        ))}

        {nodes.map((node) => (
          <g key={`${node.x}-${node.y}-${node.tone}`}>
            <circle
              cx={node.x}
              cy={node.y}
              r={getNodeRadius(node.size) * 2.8}
              className={`portal-traffic-node-glow portal-traffic-line-${node.tone}`}
            />
            <circle
              cx={node.x}
              cy={node.y}
              r={getNodeRadius(node.size)}
              className={`portal-traffic-node portal-traffic-line-${node.tone}`}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
