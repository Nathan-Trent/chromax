export type AlertIcon = "warning" | "info" | "success" | "danger";

export interface AlertOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "danger" | "teal" | "navy";
  icon?: AlertIcon;
  promptPlaceholder?: string;
  promptMatch?: string;
}
