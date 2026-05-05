"use client";

export interface CarSVGProps {
  colours: {
    body: string;
    roof: string;
    trim: string;
    windows: string;
  };
  activePart: string;
  onPartClick: (part: string) => void;
}

/** Side-profile sedan — detailed vector silhouette with multi-segment beziers; paintable parts via data-part. */
export function CarSVG({ colours, activePart, onPartClick }: CarSVGProps) {
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
      aria-label="Automotive colour preview"
    >
      <defs>
        <linearGradient id="carGround" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B8B4A8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8A867C" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="carHeadlight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFDE7" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#F4D03F" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="carTaillight" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#E74C3C" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#922B21" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="carWindowSheen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
        </linearGradient>
        <filter id="carShadowBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
        </filter>
      </defs>

      <ellipse
        cx="400"
        cy="318"
        rx="280"
        ry="18"
        fill="url(#carGround)"
        filter="url(#carShadowBlur)"
        opacity="0.85"
      />

      <g
        data-part="trim"
        onClick={() => onPartClick("trim")}
        style={{ cursor: "pointer" }}
      >
        <path
          d="M 118 286
             C 108 282 102 272 108 262
             C 114 252 126 246 142 244
             L 658 244
             C 676 246 688 256 692 268
             C 696 276 692 286 684 290
             L 678 292
             L 122 292
             C 118 292 116 289 118 286 Z"
          fill={colours.trim}
          {...strokeFor("trim")}
        />
        <path
          d="M 118 286
             C 125 274 520 272 682 276
             L 684 282
             C 520 278 125 280 116 290
             Z"
          fill={colours.trim}
          opacity="0.92"
          {...strokeFor("trim")}
        />
        <path
          d="M 128 262
             C 118 255 122 248 132 244
             L 152 238
             C 172 232 198 228 228 236
             L 258 236 L 258 244 L 140 250 Z"
          fill={colours.trim}
          opacity="0.95"
          {...strokeFor("trim")}
        />
        <path
          d="M 542 236
             C 568 230 600 232 628 244
             C 642 250 654 260 662 268
             L 648 272
             C 620 252 574 244 540 248 Z"
          fill={colours.trim}
          opacity="0.95"
          {...strokeFor("trim")}
        />
        <path
          d="M 408 252
             C 418 248 432 246 446 248
             C 456 250 462 256 458 262
             C 454 266 440 268 428 266
             C 416 264 404 258 408 252 Z"
          fill={colours.trim}
          opacity="0.85"
          {...strokeFor("trim")}
        />
        <path
          d="M 298 236
             C 306 232 318 230 326 236
             C 332 240 330 248 322 250
             C 312 252 298 248 294 242
             C 292 238 294 238 298 236 Z"
          fill={colours.trim}
          opacity="0.9"
          {...strokeFor("trim")}
        />
      </g>

      <g style={{ pointerEvents: "none" }}>
        <ellipse cx="235" cy="275" rx="39" ry="39" fill="#141414" />
        <ellipse cx="235" cy="275" rx="31" ry="31" fill="#252525" />
        <ellipse cx="235" cy="275" rx="20" ry="20" fill="#3A3A3A" />
        <circle cx="235" cy="275" r="11" fill="#6B6B6B" />
        <circle cx="235" cy="275" r="5" fill="#A8A8A8" />
        <path
          d="M 200 275 L 270 275"
          stroke="#3D3D3D"
          strokeWidth="1.5"
          opacity="0.6"
        />

        <ellipse cx="568" cy="275" rx="39" ry="39" fill="#141414" />
        <ellipse cx="568" cy="275" rx="31" ry="31" fill="#252525" />
        <ellipse cx="568" cy="275" rx="20" ry="20" fill="#3A3A3A" />
        <circle cx="568" cy="275" r="11" fill="#6B6B6B" />
        <circle cx="568" cy="275" r="5" fill="#A8A8A8" />
        <path
          d="M 533 275 L 603 275"
          stroke="#3D3D3D"
          strokeWidth="1.5"
          opacity="0.6"
        />
      </g>

      <g
        data-part="body"
        onClick={() => onPartClick("body")}
        style={{ cursor: "pointer" }}
      >
        <path
          d="M 104 270
             C 96 264 94 248 100 234
             C 106 218 122 204 144 194
             C 170 182 202 176 230 174
             C 248 173 262 176 272 182
             C 282 188 288 198 292 208
             C 296 216 302 222 312 224
             L 318 226
             C 328 227 340 228 352 228
             L 488 228
             C 508 228 528 224 544 214
             C 556 206 566 194 576 182
             C 586 172 598 166 614 166
             C 636 166 658 176 674 192
             C 688 206 696 226 696 248
             C 696 264 688 278 674 288
             C 664 295 650 298 634 298
             L 618 298
             C 608 298 600 294 596 284
             L 592 276
             C 588 252 574 242 552 240
             C 530 238 512 252 508 274
             L 506 286
             C 504 294 496 298 486 298
             L 318 298
             C 308 298 300 294 296 286
             L 294 274
             C 290 250 272 238 250 240
             C 228 242 212 256 208 278
             L 206 285
             C 204 293 196 298 186 298
             L 148 298
             C 130 296 116 288 108 276
             C 104 274 102 272 104 270 Z"
          fill={colours.body}
          {...strokeFor("body")}
        />
        <path
          d="M 138 208
             C 168 196 205 188 238 186
             C 252 185 262 188 268 194
             C 272 198 274 204 270 210
             C 262 206 248 204 232 206
             C 196 210 162 218 138 228
             Z"
          fill={colours.body}
          opacity="0.88"
          {...strokeFor("body")}
        />
        <path
          d="M 598 188
             C 618 176 648 174 668 186
             C 684 196 692 212 690 230
             C 688 244 678 254 662 258
             C 642 252 624 240 612 222
             C 604 210 598 200 598 188 Z"
          fill={colours.body}
          opacity="0.9"
          {...strokeFor("body")}
        />
        <path
          d="M 104 270
             C 112 262 124 256 138 254
             C 128 262 116 272 118 284
             C 108 282 100 276 104 270 Z"
          fill={colours.body}
          opacity="0.82"
          {...strokeFor("body")}
        />
        <path
          d="M 672 286
             C 682 280 690 268 692 254
             C 698 262 700 272 696 282
             C 690 292 678 298 664 298
             C 658 292 664 288 672 286 Z"
          fill={colours.body}
          opacity="0.85"
          {...strokeFor("body")}
        />
      </g>

      <g
        data-part="roof"
        onClick={() => onPartClick("roof")}
        style={{ cursor: "pointer" }}
      >
        <path
          d="M 274 190
             C 282 158 306 130 342 118
             C 372 110 402 108 434 112
             C 484 118 528 136 556 168
             C 570 184 576 198 574 212
             C 572 222 564 230 552 234
             L 528 236
             C 468 220 396 212 330 220
             C 296 224 278 218 272 204
             C 268 196 268 188 274 190 Z"
          fill={colours.roof}
          {...strokeFor("roof")}
        />
        <path
          d="M 412 118
             C 418 118 424 120 428 124
             C 432 138 434 152 434 168
             C 434 192 428 212 416 228
             L 404 226
             C 412 204 416 180 416 156
             C 416 142 414 128 412 118 Z"
          fill={colours.roof}
          opacity="0.86"
          {...strokeFor("roof")}
        />
        <path
          d="M 324 138
             C 368 122 428 120 476 132
             C 516 142 548 160 564 182
             C 548 172 518 164 482 160
             C 432 154 378 156 332 166
             C 324 158 320 148 324 138 Z"
          fill={colours.roof}
          opacity="0.8"
          {...strokeFor("roof")}
        />
      </g>

      <g
        data-part="windows"
        onClick={() => onPartClick("windows")}
        style={{ cursor: "pointer" }}
      >
        <path
          d="M 276 198
             C 284 182 296 168 312 156
             C 332 140 358 130 384 124
             C 394 122 402 124 408 128
             C 412 138 414 150 412 162
             C 408 182 398 202 386 218
             L 284 226
             C 278 220 274 210 274 200
             C 274 198 275 197 276 198 Z"
          fill={colours.windows}
          fillOpacity={0.88}
          {...strokeFor("windows")}
        />
        <path
          d="M 412 128
             C 424 128 436 130 448 136
             C 462 144 472 156 478 172
             C 484 190 484 210 478 228
             L 416 230
             C 424 210 426 188 422 166
             C 420 152 416 138 412 128 Z"
          fill={colours.windows}
          fillOpacity={0.88}
          {...strokeFor("windows")}
        />
        <path
          d="M 484 132
             C 512 138 540 150 558 172
             C 576 192 584 218 582 244
             C 580 254 574 262 562 264
             L 494 266
             C 486 252 482 232 482 210
             C 482 184 482 158 484 132 Z"
          fill={colours.windows}
          fillOpacity={0.88}
          {...strokeFor("windows")}
        />
        <path
          fill="url(#carWindowSheen)"
          d="M 288 184
             C 300 168 322 154 350 148
             L 372 146
             C 354 162 338 182 328 206
             L 292 214
             C 288 204 286 194 288 184 Z"
          style={{ pointerEvents: "none" }}
        />
        <path
          fill="url(#carWindowSheen)"
          d="M 418 154
             C 432 158 448 168 456 184
             L 450 208
             C 438 196 428 182 422 166
             Z"
          opacity="0.7"
          style={{ pointerEvents: "none" }}
        />
        <path
          d="M 308 192 L 308 218 M 320 188 L 320 216"
          stroke="rgba(0,0,0,0.2)"
          strokeWidth="0.8"
          style={{ pointerEvents: "none" }}
        />
        <path
          d="M 498 188 L 498 230 M 510 192 L 510 228"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="0.8"
          style={{ pointerEvents: "none" }}
        />
      </g>

      <g style={{ pointerEvents: "none" }}>
        <path
          d="M 668 248
             C 682 248 692 254 698 262
             L 702 268
             L 696 276
             C 686 282 672 282 662 278
             Z"
          fill="url(#carTaillight)"
        />
        <path
          d="M 108 250
             C 94 252 88 260 86 270
             L 84 274
             L 92 280
             C 102 274 114 268 124 264
             Z"
          fill="url(#carHeadlight)"
        />
        <path
          d="M 128 242 L 148 228"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M 136 236 L 152 224"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
