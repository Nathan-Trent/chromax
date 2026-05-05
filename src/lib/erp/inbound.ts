import type { SupabaseClient } from "@supabase/supabase-js";

import { logStockLowThresholdAlert } from "@/lib/erp/client";
import { ERP_EVENTS } from "@/lib/erp/events";
import { notifySuperAdmins } from "@/lib/notifications/notify";
import { NOTIFICATION_TYPES } from "@/lib/notifications/rules";

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

function str(d: Record<string, unknown>, key: string): string | null {
  const v = d[key];
  return typeof v === "string" && v.trim() ? v : null;
}

const ORDER_STATUSES = new Set([
  "new",
  "confirmed",
  "packed",
  "dispatched",
  "delivered",
  "cancelled",
]);

function num(d: Record<string, unknown>, key: string): number | null {
  const v = d[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Applies ERP → dashboard side effects. Errors are logged; caller still returns 200.
 */
export async function applyErpInboundEvent(
  service: SupabaseClient,
  eventType: string,
  data: Record<string, unknown>,
  recordId: string,
): Promise<void> {
  try {
    switch (eventType) {
      case ERP_EVENTS.STOCK_UPDATED: {
        const erpPid = str(data, "product_id") ?? recordId;
        const stockVal = num(data, "stock") ?? num(data, "quantity");
        if (erpPid == null || stockVal == null) break;
        await service
          .from("products")
          .update({ stock: Math.floor(stockVal), updated_at: new Date().toISOString() })
          .eq("erp_product_id", erpPid);
        break;
      }
      case ERP_EVENTS.STOCK_LOW_THRESHOLD: {
        const erpPid = str(data, "product_id") ?? recordId;
        const name = str(data, "name") ?? "Unknown product";
        const current = num(data, "stock");
        const threshold = num(data, "low_threshold");
        let prodId: string | null = null;
        let label = name;
        if (erpPid) {
          const { data: prod } = await service
            .from("products")
            .select("id, name")
            .eq("erp_product_id", erpPid)
            .maybeSingle();
          if (prod?.id) {
            prodId = prod.id;
            label = (prod.name as string) || name;
          }
        }
        await logStockLowThresholdAlert(service, prodId, label, {
          erp_product_id: erpPid,
          stock: current,
          low_threshold: threshold,
        });
        break;
      }
      case ERP_EVENTS.ORDER_STATUS_UPDATED: {
        const erpOid = str(data, "order_id") ?? recordId;
        const newStatusRaw = str(data, "new_status") ?? str(data, "status");
        if (!erpOid || !newStatusRaw) break;

        const newStatus = ORDER_STATUSES.has(newStatusRaw) ? newStatusRaw : null;
        if (!newStatus) break;

        const { data: before } = await service
          .from("orders")
          .select("id, reference, status, erp_order_id")
          .eq("erp_order_id", erpOid)
          .maybeSingle();

        const orderPatch: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
          status: newStatus,
        };
        const tn = str(data, "tracking_number");
        if (tn !== null) orderPatch.tracking_number = tn;
        const cr = str(data, "courier");
        if (cr !== null) orderPatch.courier = cr;

        await service.from("orders").update(orderPatch).eq("erp_order_id", erpOid);

        if (before?.id) {
          await service.from("audit_log").insert({
            user_id: null,
            user_email: "erp@chromax-sync",
            user_role: "ERP",
            action_type: "order.status_updated",
            section: "orders",
            record_id: before.id,
            record_label: before.reference ?? before.id,
            before_values: { status: before.status },
            after_values: {
              status: newStatus,
              tracking_number: str(data, "tracking_number"),
              courier: str(data, "courier"),
            },
            source: "erp",
          });
        }
        break;
      }
      case ERP_EVENTS.ORDER_CREATED_IN_ERP: {
        const erpOid = str(data, "order_id") ?? recordId;
        if (!erpOid) break;

        const { data: exists } = await service
          .from("orders")
          .select("id")
          .eq("erp_order_id", erpOid)
          .maybeSingle();
        if (exists) break;

        const reference =
          str(data, "reference") ??
          `CX-ERP-${erpOid.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 24)}`;

        const items = data.items;
        const shippingAddress = asRecord(data.shipping_address) ?? {};
        const rawStatus = str(data, "status") ?? "new";
        const orderStatus = ORDER_STATUSES.has(rawStatus) ? rawStatus : "new";
        const rawPay = str(data, "payment_status") ?? "pending";
        const payStatus =
          rawPay === "paid" || rawPay === "refunded" || rawPay === "failed"
            ? rawPay
            : "pending";
        const cur = str(data, "currency") ?? "NGN";
        const currency: "NGN" | "USD" | "GBP" =
          cur === "USD" || cur === "GBP" ? cur : "NGN";
        const totalVal = num(data, "total") ?? 0;

        await service.from("orders").insert({
          reference,
          customer_id: null,
          customer_email: str(data, "customer_email") ?? "unknown@erp.local",
          customer_name: str(data, "customer_name") ?? "ERP Customer",
          customer_phone: str(data, "customer_phone"),
          items: Array.isArray(items) ? items : [],
          subtotal: num(data, "subtotal") ?? num(data, "total") ?? 0,
          shipping_cost: num(data, "shipping_cost") ?? 0,
          total: totalVal,
          currency: currency as "NGN" | "USD" | "GBP",
          status: orderStatus as "new" | "confirmed" | "packed" | "dispatched" | "delivered" | "cancelled",
          payment_status: payStatus as "pending" | "paid" | "refunded" | "failed",
          payment_method: null,
          shipping_address: shippingAddress,
          source: "erp",
          erp_order_id: erpOid,
          notes: str(data, "notes"),
        });

        void notifySuperAdmins({
          type: NOTIFICATION_TYPES.ORDER_NEW,
          title: "New order from ERP",
          message: `Order ${reference} created in ERP — ${totalVal} ${currency}`,
        });
        break;
      }
      case ERP_EVENTS.PAYMENT_CONFIRMED: {
        const erpOid = str(data, "order_id") ?? recordId;
        if (!erpOid) break;
        await service
          .from("orders")
          .update({
            payment_status: "paid",
            payment_ref: str(data, "payment_ref"),
            updated_at: new Date().toISOString(),
          })
          .eq("erp_order_id", erpOid);
        break;
      }
      case ERP_EVENTS.PRODUCT_UPDATED: {
        const erpPid = str(data, "product_id") ?? recordId;
        if (!erpPid) break;
        const patch: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        const name = str(data, "name");
        const slug = str(data, "slug");
        const stock = num(data, "stock");
        const lowTh = num(data, "low_threshold");
        if (name) patch.name = name;
        if (slug) patch.slug = slug;
        if (stock != null) patch.stock = Math.floor(stock);
        if (lowTh != null) patch.low_threshold = Math.floor(lowTh);
        const pn = num(data, "price_ngn");
        const pu = num(data, "price_usd");
        const pg = num(data, "price_gbp");
        if (pn != null) patch.price_ngn = pn;
        if (pu != null) patch.price_usd = pu;
        if (pg != null) patch.price_gbp = pg;
        await service.from("products").update(patch).eq("erp_product_id", erpPid);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("[ERP inbound] handler error:", eventType, e);
  }
}

export function extractEnvelope(body: unknown): {
  event_type: string;
  record_id: string;
  data: Record<string, unknown>;
} | null {
  const rec = asRecord(body);
  if (!rec) return null;
  const eventType = str(rec, "event_type");
  if (!eventType) return null;
  const recordId = str(rec, "record_id") ?? "";
  const data = asRecord(rec.data) ?? {};
  return { event_type: eventType, record_id: recordId, data };
}
