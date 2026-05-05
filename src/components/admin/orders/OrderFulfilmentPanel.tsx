"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { showConfirm } from "@/components/ui/GlobalAlertDialog";
import type { OrderStatus } from "@/types/order";
import { nextOrderStatus } from "@/lib/orders/order-flow";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type OrderFulfilmentPanelProps = {
  orderId: string;
  status: OrderStatus;
  customerEmail: string;
  trackingNumber: string | null;
  courier: string | null;
  canFulfil: boolean;
  canCancelRequest: boolean;
  canCancelApprove: boolean;
  hasPendingCancel: boolean;
};

function advanceLabel(current: OrderStatus): string | null {
  const next = nextOrderStatus(current);
  if (!next) return null;
  switch (next) {
    case "confirmed":
      return "Mark as confirmed";
    case "packed":
      return "Mark as packed";
    case "dispatched":
      return "Mark as dispatched";
    case "delivered":
      return "Mark as delivered";
    default:
      return `Advance to ${next}`;
  }
}

export function OrderFulfilmentPanel({
  orderId,
  status,
  customerEmail,
  trackingNumber: initialTracking,
  courier: initialCourier,
  canFulfil,
  canCancelRequest,
  canCancelApprove,
  hasPendingCancel,
}: OrderFulfilmentPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ variant: "success" | "error" | "info"; msg: string } | null>(
    null,
  );
  const [tracking, setTracking] = useState(initialTracking ?? "");
  const [courier, setCourier] = useState(initialCourier ?? "");
  const [cancelLoading, setCancelLoading] = useState(false);

  const next = nextOrderStatus(status);
  const label = advanceLabel(status);
  const canAdvance =
    canFulfil &&
    Boolean(next) &&
    status !== "cancelled" &&
    status !== "delivered";

  const needsDispatchFields = status === "packed" && next === "dispatched";

  async function submitAdvance() {
    if (!next) return;
    setToast(null);
    setLoading(true);
    try {
      const body: Record<string, unknown> = { status: next };
      if (needsDispatchFields) {
        body.tracking_number = tracking.trim() || null;
        body.courier = courier.trim() || null;
      }
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setToast({ variant: "error", msg: json.error ?? "Update failed" });
        return;
      }
      setToast({ variant: "success", msg: "Order updated." });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function submitCancelAction(action: "request" | "approve") {
    setToast(null);
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/cancellation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setToast({ variant: "error", msg: json.error ?? "Cancellation action failed" });
        return;
      }
      setToast({
        variant: action === "request" ? "info" : "info",
        msg:
          action === "request"
            ? "Cancellation request sent for review."
            : "Cancellation approved. Order marked cancelled.",
      });
      router.refresh();
    } finally {
      setCancelLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {toast ? (
        <Toast
          variant={toast.variant}
          message={toast.msg}
          duration={toast.variant === "error" ? undefined : 3000}
          onDismiss={() => setToast(null)}
        />
      ) : null}

      {canAdvance && label ? (
        <div className="space-y-3">
          {needsDispatchFields ? (
            <>
              <Input
                label="Tracking number"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                required
              />
              <Input
                label="Courier name"
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
              />
            </>
          ) : null}
          <Button type="button" loading={loading} disabled={loading} onClick={() => void submitAdvance()}>
            {label}
          </Button>
        </div>
      ) : null}

      {status !== "cancelled" && status !== "delivered" ? (
        <div className="border-t border-[#E8E8E4] pt-4">
          {canCancelRequest && !hasPendingCancel ? (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="border-[#993C1D] text-[#5C240F]"
                disabled={cancelLoading}
                onClick={() =>
                  void (async () => {
                    const ok = await showConfirm({
                      title: "Request cancellation",
                      message:
                        "Your chief accountant will be notified to review this request. Continue?",
                      confirmLabel: "Request cancellation",
                      confirmVariant: "danger",
                      icon: "warning",
                    });
                    if (ok) void submitCancelAction("request");
                  })()
                }
              >
                Request cancellation
              </Button>
            </div>
          ) : null}

          {canCancelApprove && hasPendingCancel ? (
            <div className="mt-3 space-y-2">
              <Button
                type="button"
                variant="outline"
                className="border-[#993C1D] text-[#5C240F]"
                disabled={cancelLoading}
                onClick={() =>
                  void (async () => {
                    const ok = await showConfirm({
                      title: "Approve cancellation",
                      message: `Approve cancellation for ${customerEmail}? The order will be marked cancelled.`,
                      confirmLabel: "Approve cancellation",
                      cancelLabel: "Back",
                      confirmVariant: "danger",
                      icon: "warning",
                    });
                    if (ok) void submitCancelAction("approve");
                  })()
                }
              >
                Approve cancellation
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
