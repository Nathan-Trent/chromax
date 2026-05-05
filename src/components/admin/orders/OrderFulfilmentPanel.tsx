"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
  const [err, setErr] = useState<string | null>(null);
  const [tracking, setTracking] = useState(initialTracking ?? "");
  const [courier, setCourier] = useState(initialCourier ?? "");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showReqConfirm, setShowReqConfirm] = useState(false);
  const [showApprConfirm, setShowApprConfirm] = useState(false);

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
    setErr(null);
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
        setErr(json.error ?? "Update failed");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function submitCancelAction(action: "request" | "approve") {
    setErr(null);
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/cancellation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(json.error ?? "Cancellation action failed");
        return;
      }
      setShowReqConfirm(false);
      setShowApprConfirm(false);
      router.refresh();
    } finally {
      setCancelLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {err ? (
        <p className="rounded-lg bg-[#993C1D]/10 px-3 py-2 font-sans text-sm text-[#5C240F]">{err}</p>
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
              {showReqConfirm ? (
                <div className="rounded-lg border border-[#E8E8E4] bg-[#F5F0E8] p-3">
                  <p className="font-sans text-sm text-[#555]">
                    Request cancellation? Your chief accountant will be notified to review.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={cancelLoading}
                      onClick={() => setShowReqConfirm(false)}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="border border-[#993C1D] bg-transparent text-[#5C240F] hover:bg-[#993C1D]/10"
                      loading={cancelLoading}
                      disabled={cancelLoading}
                      onClick={() => void submitCancelAction("request")}
                    >
                      Confirm request
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#993C1D] text-[#5C240F]"
                  disabled={cancelLoading}
                  onClick={() => setShowReqConfirm(true)}
                >
                  Request cancellation
                </Button>
              )}
            </div>
          ) : null}

          {canCancelApprove && hasPendingCancel ? (
            <div className="mt-3 space-y-2">
              {showApprConfirm ? (
                <div className="rounded-lg border border-[#E8E8E4] bg-[#F5F0E8] p-3">
                  <p className="font-sans text-sm text-[#555]">
                    Approve cancellation for {customerEmail}? Order will be marked cancelled.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={cancelLoading}
                      onClick={() => setShowApprConfirm(false)}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="border border-[#993C1D] bg-transparent text-[#5C240F] hover:bg-[#993C1D]/10"
                      loading={cancelLoading}
                      disabled={cancelLoading}
                      onClick={() => void submitCancelAction("approve")}
                    >
                      Approve cancellation
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#993C1D] text-[#5C240F]"
                  disabled={cancelLoading}
                  onClick={() => setShowApprConfirm(true)}
                >
                  Approve cancellation
                </Button>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
