"use client";

import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const maxWidthClass: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
  );
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className = "",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = getFocusableElements(panel);
      focusables[0]?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusables = getFocusableElements(panel);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus?.();
      previouslyFocusedRef.current = null;
    };
  }, [isOpen, onClose]);

  function handleBackdropMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1a2e]/60 transition-opacity duration-200 ease-out motion-reduce:transition-none"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : "Dialog"}
        onMouseDown={(e) => e.stopPropagation()}
        className={[
          "flex max-h-[min(90vh,calc(100vh-2rem))] w-full flex-col rounded-xl bg-[#F5F0E8] shadow-xl transition-transform duration-200 ease-out motion-reduce:transition-none",
          maxWidthClass[size],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <header
          className={`flex shrink-0 items-center gap-4 border-b border-[#E0DED4] px-5 py-4 ${title ? "justify-between" : "justify-end"}`}
        >
          {title ? (
            <h3 id={titleId} className="font-sans text-base font-medium text-[#333333]">
              {title}
            </h3>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-[#333333] transition-colors duration-150 ease-in-out motion-reduce:transition-none hover:bg-[#E8E4E4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F0E8]"
            aria-label="Close dialog"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 font-sans text-sm text-[#333333]">
          {children}
        </div>
      </div>
    </div>
  );
}
