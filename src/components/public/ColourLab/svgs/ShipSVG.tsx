"use client";

export interface ShipSVGProps {
  colours: {
    hull: string;
    deck: string;
    superstructure: string;
    trim: string;
  };
  activePart: string;
  onPartClick: (part: string) => void;
}

export function ShipSVG({ colours, activePart, onPartClick }: ShipSVGProps) {
  const strokeFor = (part: string) =>
    activePart === part
      ? { stroke: "#E8A020", strokeWidth: 2 as const }
      : { stroke: "none" as const, strokeWidth: 0 as const };

  return (
    <svg
      viewBox="0 0 800 400"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full [&_*]:transition-none"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Marine colour preview"
    >
      <defs>
        <linearGradient id="shipWater" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5D8AA8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#2C5270" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id="shipWaterline" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id="shipReflect" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
      </defs>

      <rect width="800" height="400" fill="#87A8BE" fillOpacity="0.25" />
      <rect y="240" width="800" height="160" fill="url(#shipWater)" />

      <g opacity="0.4" style={{ pointerEvents: "none" }}>
        <path
          d="M 50 300 Q 200 285 400 295 T 750 305"
          stroke="url(#shipWaterline)"
          strokeWidth="40"
          fill="none"
          filter="url(#shipReflect)"
        />
      </g>

      <g
        data-part="hull"
        onClick={() => onPartClick("hull")}
        style={{ cursor: "pointer" }}
      >
        <path
          d="M 85 255 
             Q 80 265 85 278 L 95 285 L 105 288 
             L 650 288 L 665 282 L 672 270 
             L 675 255 L 670 242 L 655 235 
             L 620 228 L 150 228 Q 110 232 95 245 Z"
          fill={colours.hull}
          {...strokeFor("hull")}
        />
        <path
          d="M 120 235 Q 200 218 380 215 L 520 218 Q 600 222 640 235 Z"
          fill={colours.hull}
          opacity="0.85"
          {...strokeFor("hull")}
        />
        <circle cx="180" cy="258" r="5" fill="#1A2838" opacity="0.7" />
        <circle cx="220" cy="258" r="5" fill="#1A2838" opacity="0.7" />
        <circle cx="380" cy="262" r="4" fill="#1A2838" opacity="0.65" />
        <circle cx="520" cy="260" r="4" fill="#1A2838" opacity="0.65" />
      </g>

      <g
        data-part="trim"
        onClick={() => onPartClick("trim")}
        style={{ cursor: "pointer" }}
      >
        <path
          d="M 95 248 L 655 248 L 658 255 L 98 255 Z"
          fill={colours.trim}
          {...strokeFor("trim")}
        />
        <path
          d="M 105 252 L 640 252"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="2"
        />
      </g>

      <g
        data-part="deck"
        onClick={() => onPartClick("deck")}
        style={{ cursor: "pointer" }}
      >
        <path
          d="M 150 228 L 620 228 L 615 218 L 155 218 Z"
          fill={colours.deck}
          {...strokeFor("deck")}
        />
        <path
          d="M 200 218 L 580 218 L 575 208 L 205 208 Z"
          fill={colours.deck}
          opacity="0.88"
          {...strokeFor("deck")}
        />
        <line
          x1="250"
          y1="210"
          x2="530"
          y2="210"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="1"
        />
      </g>

      <g
        data-part="superstructure"
        onClick={() => onPartClick("superstructure")}
        style={{ cursor: "pointer" }}
      >
        <path
          d="M 320 208 L 330 125 L 480 120 L 495 135 L 500 208 Z"
          fill={colours.superstructure}
          {...strokeFor("superstructure")}
        />
        <rect
          x="355"
          y="155"
          width="110"
          height="48"
          fill={colours.superstructure}
          opacity="0.9"
          {...strokeFor("superstructure")}
        />
        <rect
          x="375"
          y="168"
          width="28"
          height="22"
          fill="#87CEEB"
          fillOpacity="0.35"
        />
        <rect
          x="415"
          y="168"
          width="28"
          height="22"
          fill="#87CEEB"
          fillOpacity="0.35"
        />
        <path
          d="M 425 125 L 432 95 L 452 92 L 458 122 Z"
          fill={colours.superstructure}
          opacity="0.95"
          {...strokeFor("superstructure")}
        />
        <line
          x1="430"
          y1="95"
          x2="430"
          y2="55"
          stroke="#4A5568"
          strokeWidth="4"
        />
        <line
          x1="420"
          y1="55"
          x2="455"
          y2="55"
          stroke="#4A5568"
          strokeWidth="3"
        />
        <ellipse cx="432" cy="72" rx="4" ry="3" fill="#6B7280" />
      </g>
    </svg>
  );
}
