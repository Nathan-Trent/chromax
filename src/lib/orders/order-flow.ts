import type { OrderStatus } from "@/types/order";

export const ORDER_FLOW_STEPS: Exclude<OrderStatus, "cancelled">[] = [
  "new",
  "confirmed",
  "packed",
  "dispatched",
  "delivered",
];

export function orderStatusIndex(status: OrderStatus): number {
  if (status === "cancelled") return -1;
  return ORDER_FLOW_STEPS.indexOf(status as (typeof ORDER_FLOW_STEPS)[number]);
}

export function nextOrderStatus(current: OrderStatus): OrderStatus | null {
  if (current === "cancelled" || current === "delivered") return null;
  const step = current as (typeof ORDER_FLOW_STEPS)[number];
  const i = ORDER_FLOW_STEPS.indexOf(step);
  if (i < 0 || i >= ORDER_FLOW_STEPS.length - 1) return null;
  return ORDER_FLOW_STEPS[i + 1] ?? null;
}

export function isForwardTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (to === "cancelled") return false;
  const a = ORDER_FLOW_STEPS.indexOf(from as (typeof ORDER_FLOW_STEPS)[number]);
  const b = ORDER_FLOW_STEPS.indexOf(to as (typeof ORDER_FLOW_STEPS)[number]);
  if (a < 0 || b < 0) return false;
  return b === a + 1;
}
