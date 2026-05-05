"use client";

import { Input } from "@/components/ui/Input";
import type { MouseEvent as ReactMouseEvent, ReactElement } from "react";
import { useEffect, useId, useRef, useState } from "react";

const btnGhost = `
  inline-flex items-center justify-center rounded-lg px-4 py-2.5 font-sans text-[13px] font-medium
  border border-[#D0D0CA] text-[#555] bg-transparent transition-colors duration-150 ease-out
  hover:bg-[#F5F0E8] hover:border-[#999] hover:text-[#333]
  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a2e]
  motion-reduce:transition-none
`.trim();

const btnSolidDanger =
  "inline-flex items-center justify-center rounded-lg px-4 py-2.5 font-sans text-[13px] font-medium bg-[#993C1D] text-white transition-colors duration-150 ease-out hover:bg-[#7A2E14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#993C1D] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

const btnSolidTeal =
  "inline-flex items-center justify-center rounded-lg px-4 py-2.5 font-sans text-[13px] font-medium bg-[#0F6E56] text-white transition-colors duration-150 ease-out hover:bg-[#0A5241] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6E56] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

const btnSolidNavy =
  "inline-flex items-center justify-center rounded-lg px-4 py-2.5 font-sans text-[13px] font-medium bg-[#1a1a2e] text-white transition-colors duration-150 ease-out hover:bg-[#2D2D4E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a2e] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

function iconCircle(
  kind: NonNullable<AlertDialogProps["icon"]>,
): { wrap: string; node: ReactElement } {
  switch (kind) {
    case "warning":
      return {
        wrap: "bg-[#FAEEDA] text-[#BA7517]",
        node: <span className="text-xl leading-none">⚠️</span>,
      };
    case "info":
      return {
        wrap: "bg-[#E8F0FA] text-[#185FA5]",
        node: <span className="text-xl leading-none">ℹ️</span>,
      };
    case "success":
      return {
        wrap: "bg-[#E6F5EF] text-[#0F6E56]",
        node: <span className="text-xl leading-none">✓</span>,
      };
    case "danger":
      return {
        wrap: "bg-[#FCEAEA] text-[#A32D2D]",
        node: <span className="text-lg leading-none font-semibold">✕</span>,
      };
    default:
      return { wrap: "", node: <span /> };
  }
}

export interface AlertDialogProps {
  open: boolean;
  variant: "confirm" | "info" | "prompt";
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "danger" | "teal" | "navy";
  promptPlaceholder?: string;
  promptMatch?: string;
  icon?: "warning" | "info" | "success" | "danger" | null;
  onConfirm: (value?: string) => void;
  onCancel: () => void;
}

export function AlertDialog({
  open,
  variant,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "navy",
  promptPlaceholder,
  promptMatch,
  icon,
  onConfirm,
  onCancel,
}: AlertDialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [promptValue, setPromptValue] = useState("");

  useEffect(() => {
    if (!open) {
      setEntered(false);
      setPromptValue("");
      return;
    }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (variant === "info") onConfirm();
        else onCancel();
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === "textarea") return;
        const matchOk = !promptMatch || promptValue.trim() === promptMatch;
        if (!matchOk) return;
        e.preventDefault();
        if (variant === "prompt") onConfirm(promptValue);
        else onConfirm();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, variant, promptMatch, promptValue, onConfirm, onCancel]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    requestAnimationFrame(() => {
      const focusable = panel.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    });
  }, [open, variant]);

  if (!open) return null;

  const solidClass =
    confirmVariant === "danger" ? btnSolidDanger : confirmVariant === "teal" ? btnSolidTeal : btnSolidNavy;

  const promptOk =
    variant === "prompt" ? (!promptMatch ? true : promptValue.trim() === promptMatch) : true;

  function handleOverlayMouseDown(e: ReactMouseEvent<HTMLDivElement>) {
    if (variant !== "info") return;
    if (e.target === e.currentTarget) onCancel();
  }

  const iconEl = icon ? iconCircle(icon) : null;

  return (
    <div
      className={[
        "fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity motion-reduce:transition-none",
        entered ? "opacity-100 duration-100" : "opacity-0 duration-100",
      ].join(" ")}
      onMouseDown={handleOverlayMouseDown}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={[
          "w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-[opacity,transform] motion-reduce:transition-none ease-out",
          entered ? "scale-100 opacity-100 duration-[150ms]" : "scale-95 opacity-0 duration-[150ms]",
        ].join(" ")}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {iconEl ? (
          <div
            className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${iconEl.wrap}`}
          >
            {iconEl.node}
          </div>
        ) : null}
        <h2
          id={titleId}
          className="font-[family-name:var(--font-fraunces)] text-center text-xl font-semibold text-[#1a1a2e] mb-2"
        >
          {title}
        </h2>
        <p className="text-center font-sans text-[14px] leading-relaxed text-[#555]">{message}</p>

        {variant === "prompt" ? (
          <div className="mt-4">
            <Input
              label=""
              placeholder={promptPlaceholder}
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
            />
            {promptMatch ? (
              <p className="mt-2 font-sans text-[12px] text-[#888]">
                Type &quot;{promptMatch}&quot; to confirm
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          {variant === "info" ? null : (
            <button type="button" className={btnGhost} onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            className={solidClass}
            disabled={variant === "prompt" && !promptOk}
            onClick={() => {
              if (variant === "prompt") onConfirm(promptValue);
              else onConfirm();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
