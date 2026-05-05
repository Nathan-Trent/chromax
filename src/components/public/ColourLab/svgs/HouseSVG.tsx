"use client";

export interface HouseSVGProps {
  colours: {
    walls: string;
    roof: string;
    door: string;
    windows: string;
  };
  activePart: string;
  onPartClick: (part: string) => void;
}

export function HouseSVG({ colours, activePart, onPartClick }: HouseSVGProps) {
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
      aria-label="Architectural colour preview"
    >
      <defs>
        <linearGradient id="houseSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#DCE8F0" />
          <stop offset="100%" stopColor="#E8E4DC" />
        </linearGradient>
        <filter id="houseShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
        </filter>
      </defs>

      <rect width="800" height="500" fill="url(#houseSky)" />

      <ellipse
        cx="400"
        cy="455"
        rx="220"
        ry="12"
        fill="#A09888"
        fillOpacity="0.35"
        filter="url(#houseShadow)"
      />

      <path
        d="M 200 420 L 600 420 L 600 440 L 200 440 Z"
        fill="#C4B8A8"
        fillOpacity="0.6"
      />

      <g
        data-part="walls"
        onClick={() => onPartClick("walls")}
        style={{ cursor: "pointer" }}
      >
        <path
          d="M 220 380 L 220 220 L 580 220 L 580 380 Z"
          fill={colours.walls}
          {...strokeFor("walls")}
        />
        <path
          d="M 230 230 L 230 370 L 400 370 L 400 230 Z"
          fill={colours.walls}
          opacity="0.92"
          {...strokeFor("walls")}
        />
        <path
          d="M 410 230 L 410 370 L 570 370 L 570 230 Z"
          fill={colours.walls}
          opacity="0.88"
          {...strokeFor("walls")}
        />
        <path
          d="M 225 280 L 575 280"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth="1"
        />
        <path
          d="M 225 320 L 575 320"
          stroke="rgba(0,0,0,0.05)"
          strokeWidth="1"
        />
        <path
          d="M 235 240 L 240 365 M 250 240 L 255 365 M 265 240 L 270 365"
          stroke="rgba(0,0,0,0.04)"
          strokeWidth="0.8"
        />
      </g>

      <g
        data-part="roof"
        onClick={() => onPartClick("roof")}
        style={{ cursor: "pointer" }}
      >
        <path
          d="M 180 220 L 400 95 L 620 220 Z"
          fill={colours.roof}
          {...strokeFor("roof")}
        />
        <path
          d="M 200 210 L 400 105 L 600 210 L 585 218 L 215 218 Z"
          fill={colours.roof}
          opacity="0.82"
          {...strokeFor("roof")}
        />
        <path
          d="M 190 218 L 400 102 L 610 218"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M 505 130 L 520 115 L 535 125 L 525 175 L 500 168 Z"
          fill={colours.roof}
          opacity="0.9"
          {...strokeFor("roof")}
        />
        <rect
          x="508"
          y="118"
          width="22"
          height="55"
          rx="2"
          fill={colours.roof}
          opacity="0.85"
          {...strokeFor("roof")}
        />
      </g>

      <path
        d="M 200 218 L 400 108 L 600 218"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="3"
        fill="none"
        style={{ pointerEvents: "none" }}
      />

      <g
        data-part="windows"
        onClick={() => onPartClick("windows")}
        style={{ cursor: "pointer" }}
      >
        <rect
          x="255"
          y="245"
          width="58"
          height="52"
          fill={colours.windows}
          fillOpacity={0.85}
          {...strokeFor("windows")}
        />
        <rect
          x="340"
          y="245"
          width="58"
          height="52"
          fill={colours.windows}
          fillOpacity={0.85}
          {...strokeFor("windows")}
        />
        <rect
          x="430"
          y="245"
          width="58"
          height="52"
          fill={colours.windows}
          fillOpacity={0.85}
          {...strokeFor("windows")}
        />
        <line
          x1="284"
          y1="245"
          x2="284"
          y2="297"
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="1.5"
        />
        <line
          x1="255"
          y1="271"
          x2="313"
          y2="271"
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="1.5"
        />
        <line
          x1="369"
          y1="245"
          x2="369"
          y2="297"
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="1.5"
        />
        <line
          x1="340"
          y1="271"
          x2="398"
          y2="271"
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="1.5"
        />
        <line
          x1="459"
          y1="245"
          x2="459"
          y2="297"
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="1.5"
        />
        <line
          x1="430"
          y1="271"
          x2="488"
          y2="271"
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="1.5"
        />
        <rect
          x="250"
          y="325"
          width="48"
          height="40"
          fill={colours.windows}
          fillOpacity={0.85}
          {...strokeFor("windows")}
        />
        <line
          x1="274"
          y1="325"
          x2="274"
          y2="365"
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="1.2"
        />
        <line
          x1="250"
          y1="345"
          x2="298"
          y2="345"
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="1.2"
        />
      </g>

      <g
        data-part="door"
        onClick={() => onPartClick("door")}
        style={{ cursor: "pointer" }}
      >
        <path
          d="M 330 380 L 330 305 L 385 305 L 385 380 Z"
          fill={colours.door}
          {...strokeFor("door")}
        />
        <rect
          x="333"
          y="308"
          width="49"
          height="20"
          rx="1"
          fill="rgba(0,0,0,0.06)"
        />
        <rect
          x="333"
          y="335"
          width="49"
          height="42"
          rx="1"
          fill="rgba(0,0,0,0.04)"
        />
        <circle cx="376" cy="342" r="3" fill="#C0A060" />
        <line
          x1="358"
          y1="308"
          x2="358"
          y2="380"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth="1"
        />
      </g>
    </svg>
  );
}
