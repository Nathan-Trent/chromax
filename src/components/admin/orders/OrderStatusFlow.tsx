import type { OrderStatus } from "@/types/order";
import { ORDER_FLOW_STEPS, orderStatusIndex } from "@/lib/orders/order-flow";

export interface OrderStatusFlowProps {
  status: OrderStatus;
}

export function OrderStatusFlow({ status }: OrderStatusFlowProps) {
  if (status === "cancelled") {
    return (
      <p className="font-sans text-sm text-[#888]">Order cancelled — status flow not shown.</p>
    );
  }

  const currentIdx = orderStatusIndex(status);

  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-0">
      {ORDER_FLOW_STEPS.map((step, i) => {
        const isComplete = i < currentIdx;
        const isActive = i === currentIdx;
        const label = step.charAt(0).toUpperCase() + step.slice(1);
        let circle =
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition-colors";
        let line = "mx-1 hidden h-0.5 w-6 sm:block";
        if (isComplete) {
          circle += " border-[#0F6E56] bg-[#0F6E56] text-white";
          line += " bg-[#0F6E56]";
        } else if (isActive) {
          circle +=
            " border-[var(--color-gold)] bg-[#FAEEDA] text-[var(--color-navy)]";
          line += " bg-[#E0DED4]";
        } else {
          circle += " border-[#D0D0CA] bg-white text-[#999]";
          line += " bg-[#E0DED4]";
        }
        return (
          <div key={step} className="flex items-center">
            {i > 0 ? <div className={line} aria-hidden /> : null}
            <div className="flex flex-col items-center gap-1">
              <div className={circle}>{i + 1}</div>
              <span
                className={[
                  "font-sans text-[10px] font-medium uppercase tracking-wide",
                  isActive ? "text-[var(--color-navy)]" : "text-[#888]",
                ].join(" ")}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
