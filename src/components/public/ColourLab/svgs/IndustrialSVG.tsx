"use client";

export interface IndustrialSVGProps {
  colours: {
    structure: string;
    panels: string;
    pipes: string;
    markings: string;
  };
  activePart: string;
  onPartClick: (part: string) => void;
}

export function IndustrialSVG({
  colours,
  activePart,
  onPartClick,
}: IndustrialSVGProps) {
  const strokeFor = (part: string) =>
    activePart === part
      ? { stroke: "#E8A020", strokeWidth: 2 as const }
      : { stroke: "none" as const, strokeWidth: 0 as const };

  return (
    <svg
      viewBox="0 0 800 500"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full [&_*]:transition-none"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Industrial colour preview"
    >
      <defs>
        <linearGradient id="indGround" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#9CA3AF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6B7280" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      <rect width="800" height="500" fill="#E5E7EB" />
      <rect y="380" width="800" height="120" fill="url(#indGround)" />

      <g
        data-part="markings"
        onClick={() => onPartClick("markings")}
        style={{ cursor: "pointer" }}
      >
        <rect
          x="140"
          y="360"
          width="520"
          height="8"
          fill={colours.markings}
          {...strokeFor("markings")}
        />
        <path
          d="M 160 200 L 175 200 L 168 365 L 153 365 Z"
          fill={colours.markings}
          opacity="0.95"
          {...strokeFor("markings")}
        />
        <path
          d="M 620 200 L 635 200 L 642 365 L 627 365 Z"
          fill={colours.markings}
          opacity="0.95"
          {...strokeFor("markings")}
        />
        <path
          d="M 260 345 L 280 345 L 275 355 L 265 355 Z"
          fill={colours.markings}
          {...strokeFor("markings")}
        />
        <path
          d="M 520 345 L 540 345 L 535 355 L 525 355 Z"
          fill={colours.markings}
          {...strokeFor("markings")}
        />
      </g>

      <g
        data-part="structure"
        onClick={() => onPartClick("structure")}
        style={{ cursor: "pointer" }}
      >
        <path
          d="M 140 360 L 140 160 L 660 160 L 660 360 Z"
          fill={colours.structure}
          opacity="0.15"
          {...strokeFor("structure")}
        />
        <rect x="150" y="170" width="24" height="190" fill={colours.structure} {...strokeFor("structure")} />
        <rect x="250" y="170" width="24" height="190" fill={colours.structure} {...strokeFor("structure")} />
        <rect x="400" y="170" width="24" height="190" fill={colours.structure} {...strokeFor("structure")} />
        <rect x="550" y="170" width="24" height="190" fill={colours.structure} {...strokeFor("structure")} />
        <rect x="626" y="170" width="24" height="190" fill={colours.structure} {...strokeFor("structure")} />
        <rect x="150" y="170" width="500" height="20" fill={colours.structure} {...strokeFor("structure")} />
        <rect x="150" y="250" width="500" height="16" fill={colours.structure} {...strokeFor("structure")} />
        <rect x="150" y="320" width="500" height="16" fill={colours.structure} {...strokeFor("structure")} />
        <path
          d="M 130 160 L 400 95 L 670 160 Z"
          fill={colours.structure}
          {...strokeFor("structure")}
        />
        <path
          d="M 150 165 L 400 108 L 650 165"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="3"
          fill="none"
        />
      </g>

      <g
        data-part="panels"
        onClick={() => onPartClick("panels")}
        style={{ cursor: "pointer" }}
      >
        <rect
          x="184"
          y="196"
          width="152"
          height="154"
          fill={colours.panels}
          {...strokeFor("panels")}
        />
        <rect
          x="356"
          y="196"
          width="178"
          height="154"
          fill={colours.panels}
          {...strokeFor("panels")}
        />
        <path
          d="M 200 210 L 320 210 M 200 240 L 320 240 M 200 270 L 320 270"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth="2"
        />
        <path
          d="M 380 210 L 500 210 M 380 245 L 500 245 M 380 280 L 500 280"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth="2"
        />
      </g>

      <g
        data-part="pipes"
        onClick={() => onPartClick("pipes")}
        style={{ cursor: "pointer" }}
      >
        <path
          d="M 480 180 L 480 95 L 520 95 L 520 110 L 540 110 L 540 180"
          fill="none"
          stroke={
            activePart === "pipes" ? "#E8A020" : colours.pipes
          }
          strokeWidth={activePart === "pipes" ? 6 : 14}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 300 180 L 300 120 L 260 120"
          fill="none"
          stroke={
            activePart === "pipes" ? "#E8A020" : colours.pipes
          }
          strokeWidth={activePart === "pipes" ? 4 : 10}
          strokeLinecap="round"
        />
        <ellipse
          cx="520"
          cy="95"
          rx="18"
          ry="10"
          fill={colours.pipes}
          stroke={activePart === "pipes" ? "#E8A020" : "none"}
          strokeWidth={2}
        />
      </g>
    </svg>
  );
}
