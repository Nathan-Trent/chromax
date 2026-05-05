"use client";

import { AlertDialog } from "@/components/ui/AlertDialog";
import type { AlertOptions } from "@/components/ui/alert-dialog-types";
import { useCallback, useRef, useState } from "react";

export type { AlertOptions } from "@/components/ui/alert-dialog-types";

type HookState =
  | {
      variant: "confirm" | "info" | "prompt";
      options: AlertOptions;
    }
  | null;

export function useAlertDialog() {
  const [state, setState] = useState<HookState>(null);
  const resolveRef = useRef<((value: boolean | string | null | void) => void) | null>(null);

  const alert = useCallback((message: string, title = "Notice") => {
    return new Promise<void>((resolve) => {
      resolveRef.current = () => resolve();
      setState({
        variant: "info",
        options: { title, message, icon: "info", confirmLabel: "OK" },
      });
    });
  }, []);

  const confirm = useCallback((options: AlertOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = (v) => resolve(v === true);
      setState({ variant: "confirm", options });
    });
  }, []);

  const prompt = useCallback((options: AlertOptions) => {
    return new Promise<string | null>((resolve) => {
      resolveRef.current = (v) => {
        if (v === false || v === null) resolve(null);
        else resolve(typeof v === "string" ? v : String(v));
      };
      setState({ variant: "prompt", options });
    });
  }, []);

  const handleConfirm = useCallback(
    (value?: string) => {
      const r = resolveRef.current;
      if (!r || !state) return;
      resolveRef.current = null;
      if (state.variant === "info") r(undefined);
      else if (state.variant === "prompt") r(value ?? "");
      else r(true);
      setState(null);
    },
    [state],
  );

  const handleCancel = useCallback(() => {
    const r = resolveRef.current;
    if (!r || !state) return;
    resolveRef.current = null;
    if (state.variant === "info") r(undefined);
    else if (state.variant === "prompt") r(null);
    else r(false);
    setState(null);
  }, [state]);

  const DialogComponent = state ? (
    <AlertDialog
      open
      variant={state.variant === "info" ? "info" : state.variant}
      title={state.options.title}
      message={state.options.message}
      confirmLabel={state.options.confirmLabel}
      cancelLabel={state.options.cancelLabel}
      confirmVariant={state.options.confirmVariant}
      promptPlaceholder={state.options.promptPlaceholder}
      promptMatch={state.options.promptMatch}
      icon={state.options.icon ?? null}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return { alert, confirm, prompt, DialogComponent };
}
