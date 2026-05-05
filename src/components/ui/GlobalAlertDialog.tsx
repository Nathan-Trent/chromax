"use client";

import { AlertDialog } from "@/components/ui/AlertDialog";
import type { AlertOptions } from "@/components/ui/alert-dialog-types";
import { useCallback, useEffect, useRef, useState } from "react";

export type { AlertOptions };

type JobVariant = "alert" | "confirm" | "prompt";

interface AlertJob {
  id: string;
  variant: JobVariant;
  options: AlertOptions;
  resolve: (value: boolean | string | null | void) => void;
}

const queue: AlertJob[] = [];
let emit: ((job: AlertJob) => void) | null = null;

function enqueue(job: AlertJob) {
  emit?.(job);
}

let idSeq = 0;

export function showAlert(message: string, title = "Notice"): Promise<void> {
  return new Promise((resolve) => {
    enqueue({
      id: String(++idSeq),
      variant: "alert",
      options: {
        title,
        message,
        icon: "info",
        confirmLabel: "OK",
      },
      resolve: () => resolve(),
    });
  });
}

export function showConfirm(options: AlertOptions): Promise<boolean> {
  return new Promise((resolve) => {
    enqueue({
      id: String(++idSeq),
      variant: "confirm",
      options,
      resolve: (v) => resolve(v === true),
    });
  });
}

export function showPrompt(options: AlertOptions): Promise<string | null> {
  return new Promise((resolve) => {
    enqueue({
      id: String(++idSeq),
      variant: "prompt",
      options,
      resolve: (v) => {
        if (v === false || v === null) resolve(null);
        else resolve(typeof v === "string" ? v : String(v));
      },
    });
  });
}

export function GlobalAlertDialog() {
  const [active, setActive] = useState<AlertJob | null>(null);
  const activeRef = useRef<AlertJob | null>(null);
  activeRef.current = active;

  const pump = useCallback((finished: AlertJob | null, value: boolean | string | null | void) => {
    finished?.resolve(value);
    const next = queue.shift() ?? null;
    setActive(next);
  }, []);

  useEffect(() => {
    emit = (job: AlertJob) => {
      setActive((curr) => {
        if (curr) {
          queue.push(job);
          return curr;
        }
        return job;
      });
    };
    return () => {
      emit = null;
    };
  }, []);

  const handleConfirm = useCallback(
    (value?: string) => {
      const curr = activeRef.current;
      if (!curr) return;
      if (curr.variant === "alert") {
        pump(curr, undefined);
        return;
      }
      if (curr.variant === "prompt") {
        pump(curr, value ?? "");
        return;
      }
      pump(curr, true);
    },
    [pump],
  );

  const handleCancel = useCallback(() => {
    const curr = activeRef.current;
    if (!curr) return;
    if (curr.variant === "alert") {
      pump(curr, undefined);
      return;
    }
    if (curr.variant === "prompt") {
      pump(curr, null);
      return;
    }
    pump(curr, false);
  }, [pump]);

  if (!active) return null;

  const uiVariant = active.variant === "alert" ? "info" : active.variant;

  return (
    <AlertDialog
      open
      variant={uiVariant}
      title={active.options.title}
      message={active.options.message}
      confirmLabel={active.options.confirmLabel}
      cancelLabel={active.options.cancelLabel}
      confirmVariant={active.options.confirmVariant}
      promptPlaceholder={active.options.promptPlaceholder}
      promptMatch={active.options.promptMatch}
      icon={active.options.icon ?? null}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
}
