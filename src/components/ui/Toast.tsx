"use client";

import type { ReactElement, SVGProps } from "react";
import { useEffect, useRef } from "react";

export interface ToastProps {
  variant: "success" | "error" | "warning" | "info";
  message: string;
  onDismiss?: () => void;
  duration?: number;
}

const styles: Record<ToastProps["variant"], string> = {
  success: "bg-[#1D9E75]/18 text-[#0A4A3A]",
  error: "bg-[#A32D2D]/15 text-[#A32D2D]",
  warning: "bg-[#BA7517]/18 text-[#BA7517]",
  info: "bg-[#185FA5]/15 text-[#185FA5]",
};

function IconSuccess(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden {...props}>
      <path
        d="M10 18.333a8.333 8.333 0 100-16.666 8.333 8.333 0 000 16.666z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6.25 10l2.08 2.083L13.75 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconError(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden {...props}>
      <path
        d="M10 18.333a8.333 8.333 0 100-16.666 8.333 8.333 0 000 16.666z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M7.5 7.5l5 5M12.5 7.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconWarning(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden {...props}>
      <path
        d="M9.154 3.62a1 1 0 011.692 0l6.666 11.497a1 1 0 01-.866 1.498H3.354a1 1 0 01-.866-1.498L9.154 3.62z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 8v3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="14.375" r="0.625" fill="currentColor" />
    </svg>
  );
}

function IconInfo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden {...props}>
      <path
        d="M10 18.333a8.333 8.333 0 100-16.666 8.333 8.333 0 000 16.666z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M10 13.75V10M10 6.667h.008" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const icons: Record<
  ToastProps["variant"],
  (props: SVGProps<SVGSVGElement>) => ReactElement
> = {
  success: IconSuccess,
  error: IconError,
  warning: IconWarning,
  info: IconInfo,
};

export function Toast({
  variant,
  message,
  onDismiss,
  duration,
}: ToastProps) {
  const dismissed = useRef(false);

  useEffect(() => {
    dismissed.current = false;
    if (!duration || !onDismiss || variant === "error") return undefined;
    const t = window.setTimeout(() => {
      if (!dismissed.current) onDismiss();
    }, duration);
    return () => window.clearTimeout(t);
  }, [duration, onDismiss, variant, message]);

  const Icon = icons[variant];

  return (
    <div
      role="status"
      className={[
        "flex w-80 max-w-full items-start gap-3 rounded-xl p-4 shadow-md",
        styles[variant],
      ].join(" ")}
    >
      <span className="mt-0.5 shrink-0">
        <Icon className="block" />
      </span>
      <p className="min-w-0 flex-1 font-sans text-sm leading-relaxed">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={() => {
            dismissed.current = true;
            onDismiss();
          }}
          className="shrink-0 rounded-lg p-1 text-current opacity-70 transition-opacity duration-150 ease-in-out motion-reduce:transition-none hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          aria-label="Dismiss notification"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path
              d="M4.5 4.5l9 9M13.5 4.5l-9 9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
