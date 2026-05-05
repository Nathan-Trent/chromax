"use client";

/** Parse strings like "25+", "1,000+", "ISO" for count-up animations. */
export function parseStatDisplay(raw: string): {
  isNumeric: boolean;
  target: number;
  suffix: string;
  fullDisplay: string;
} {
  const fullDisplay = raw.trim();
  if (!fullDisplay) {
    return { isNumeric: false, target: 0, suffix: "", fullDisplay: "" };
  }

  const digits = fullDisplay.replace(/,/g, "").match(/^(\d+)/);
  if (!digits) {
    return { isNumeric: false, target: 0, suffix: "", fullDisplay };
  }

  const target = Number.parseInt(digits[1], 10);
  const suffix = fullDisplay.slice(digits[0].length);
  return {
    isNumeric: Number.isFinite(target),
    target,
    suffix,
    fullDisplay,
  };
}
