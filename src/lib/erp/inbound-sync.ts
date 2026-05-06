import type { SupabaseClient } from "@supabase/supabase-js";

import { applyErpInboundEvent } from "@/lib/erp/inbound";
import { ERP_EVENTS } from "@/lib/erp/events";
import { notifyERPSyncUsers, notifyERPSyncUsersWithEmails } from "@/lib/notifications/notify";
import type { ERPSyncPendingRow } from "@/types/erp-sync";

import { logStockLowThresholdAlert } from "./client";

type R = Record<string, unknown>;

type Snapshot = {
  erp_product_id: number | null;
  dashboard_product_id: string | null;
  erp_product_name: string | null;
  field_changed: string;
  current_value: Record<string, unknown> | null;
  incoming_value: Record<string, unknown>;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

function str(d: R, key: string): string | null {
  const v = d[key];
  return typeof v === "string" && v.trim() ? v : null;
}

function num(d: R, key: string): number | null {
  const v = d[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseErpInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && /^\s*\d+\s*$/.test(v)) return Number.parseInt(v.trim(), 10);
  return null;
}

const ORDER_STATUSES = new Set([
  "new",
  "confirmed",
  "packed",
  "dispatched",
  "delivered",
  "cancelled",
]);

export async function fetchSyncSetting(
  service: SupabaseClient,
  eventType: string,
): Promise<{
  auto_sync: boolean;
  undo_window_hours: number;
  is_active: boolean;
} | null> {
  const { data } = await service
    .from("erp_sync_settings")
    .select("auto_sync, undo_window_hours, is_active")
    .eq("event_type", eventType)
    .maybeSingle();
  if (!data) return null;
  return {
    auto_sync: Boolean(data.auto_sync),
    undo_window_hours: typeof data.undo_window_hours === "number" ? data.undo_window_hours : 24,
    is_active: data.is_active !== false,
  };
}

async function buildSnapshot(
  service: SupabaseClient,
  eventType: string,
  data: R,
  recordId: string,
): Promise<Snapshot | null> {
  switch (eventType) {
    case ERP_EVENTS.STOCK_UPDATED: {
      const erpPid = parseErpInt(data.product_id) ?? parseErpInt(recordId);
      const stockVal = num(data, "stock") ?? num(data, "quantity");
      if (erpPid == null || stockVal == null) return null;

      const { data: prod } = await service
        .from("products")
        .select("id, name, stock, erp_product_name")
        .eq("erp_product_id", erpPid)
        .maybeSingle();
      if (!prod?.id) return null;

      return {
        erp_product_id: erpPid,
        dashboard_product_id: prod.id as string,
        erp_product_name: (prod.erp_product_name as string | null) ?? (prod.name as string),
        field_changed: "stock",
        current_value: { stock: prod.stock as number },
        incoming_value: { stock: Math.floor(stockVal) },
      };
    }
    case ERP_EVENTS.STOCK_LOW_THRESHOLD: {
      const erpPid = parseErpInt(data.product_id) ?? parseErpInt(recordId);
      if (erpPid == null) return null;
      const { data: prod } = await service
        .from("products")
        .select("id, name, stock, low_threshold, erp_product_name")
        .eq("erp_product_id", erpPid)
        .maybeSingle();
      if (!prod?.id) return null;
      const name = (prod.name as string) || str(data, "name") || "Unknown product";
      return {
        erp_product_id: erpPid,
        dashboard_product_id: prod.id as string,
        erp_product_name: (prod.erp_product_name as string | null) ?? name,
        field_changed: "low_threshold",
        current_value: {
          stock: prod.stock as number,
          low_threshold: prod.low_threshold as number,
        },
        incoming_value: {
          stock: num(data, "stock"),
          low_threshold: num(data, "low_threshold"),
        },
      };
    }
    case ERP_EVENTS.ORDER_STATUS_UPDATED: {
      const erpOid = str(data, "order_id") ?? recordId;
      const newStatusRaw = str(data, "new_status") ?? str(data, "status");
      if (!erpOid || !newStatusRaw) return null;
      const newStatus = ORDER_STATUSES.has(newStatusRaw) ? newStatusRaw : null;
      if (!newStatus) return null;

      const { data: before } = await service
        .from("orders")
        .select("id, reference, status")
        .eq("erp_order_id", erpOid)
        .maybeSingle();
      if (!before?.id) return null;

      return {
        erp_product_id: null,
        dashboard_product_id: null,
        erp_product_name: null,
        field_changed: "status",
        current_value: { status: before.status as string, erp_order_id: erpOid },
        incoming_value: {
          status: newStatus,
          tracking_number: str(data, "tracking_number"),
          courier: str(data, "courier"),
          erp_order_id: erpOid,
        },
      };
    }
    case ERP_EVENTS.ORDER_CREATED_IN_ERP: {
      const erpOid = str(data, "order_id") ?? recordId;
      if (!erpOid) return null;
      const { data: exists } = await service
        .from("orders")
        .select("id")
        .eq("erp_order_id", erpOid)
        .maybeSingle();
      if (exists) return null;

      return {
        erp_product_id: null,
        dashboard_product_id: null,
        erp_product_name: null,
        field_changed: "order",
        current_value: null,
        incoming_value: { erp_order_id: erpOid, summary: "New ERP order" },
      };
    }
    case ERP_EVENTS.PAYMENT_CONFIRMED: {
      const erpOid = str(data, "order_id") ?? recordId;
      if (!erpOid) return null;
      const { data: ord } = await service
        .from("orders")
        .select("id, reference, payment_status")
        .eq("erp_order_id", erpOid)
        .maybeSingle();
      if (!ord?.id) return null;
      return {
        erp_product_id: null,
        dashboard_product_id: null,
        erp_product_name: null,
        field_changed: "payment_status",
        current_value: {
          payment_status: ord.payment_status as string,
          erp_order_id: erpOid,
          reference: ord.reference as string,
        },
        incoming_value: {
          payment_status: "paid",
          payment_ref: str(data, "payment_ref"),
          erp_order_id: erpOid,
        },
      };
    }
    case ERP_EVENTS.PRODUCT_UPDATED: {
      const erpPid = parseErpInt(data.product_id) ?? parseErpInt(recordId);
      if (erpPid == null) return null;
      const { data: prod } = await service
        .from("products")
        .select(
          "id, name, slug, stock, low_threshold, erp_product_name, description, short_desc, status",
        )
        .eq("erp_product_id", erpPid)
        .maybeSingle();
      if (!prod?.id) return null;

      const incoming: R = {};
      if (str(data, "name")) incoming.name = str(data, "name");
      if (str(data, "slug")) incoming.slug = str(data, "slug");
      const st = num(data, "stock");
      if (st != null) incoming.stock = Math.floor(st);
      const lt = num(data, "low_threshold");
      if (lt != null) incoming.low_threshold = Math.floor(lt);

      const current: R = {
        name: prod.name,
        slug: prod.slug,
        stock: prod.stock,
        low_threshold: prod.low_threshold,
        description: prod.description,
        short_desc: prod.short_desc,
        status: prod.status,
      };

      return {
        erp_product_id: erpPid,
        dashboard_product_id: prod.id as string,
        erp_product_name: (prod.erp_product_name as string | null) ?? (prod.name as string),
        field_changed: "product",
        current_value: current,
        incoming_value: incoming,
      };
    }
    default:
      return null;
  }
}

export async function applyErpSyncPendingChange(
  service: SupabaseClient,
  item: ERPSyncPendingRow,
): Promise<void> {
  const payload = (item.payload ?? {}) as R;
  const incoming = (item.incoming_value ?? {}) as R;
  const dir = item.direction;
  if (dir !== "erp_to_dashboard") {
    console.warn("[erp sync] unsupported direction for apply", dir);
    return;
  }

  switch (item.field_changed) {
    case "stock": {
      const erpPid = item.erp_product_id ?? parseErpInt(incoming.erp_product_id);
      const stockVal = num(incoming, "stock");
      if (erpPid == null || stockVal == null) return;
      await service
        .from("products")
        .update({
          stock: Math.floor(stockVal),
          erp_last_stock_sync: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("erp_product_id", erpPid);
      return;
    }
    case "low_threshold": {
      const erpPid = item.erp_product_id ?? parseErpInt(payload.erp_product_id);
      const name = str(payload, "product_label") ?? "Unknown product";
      const prodId = item.dashboard_product_id;
      await logStockLowThresholdAlert(service, prodId, name, {
        erp_product_id: erpPid,
        stock: num(incoming, "stock"),
        low_threshold: num(incoming, "low_threshold"),
      });
      return;
    }
    case "status": {
      const erpOid = str(incoming, "erp_order_id") ?? str(payload, "erp_order_id");
      const newStatusRaw = str(incoming, "status");
      if (!erpOid || !newStatusRaw) return;
      const newStatus = ORDER_STATUSES.has(newStatusRaw) ? newStatusRaw : null;
      if (!newStatus) return;

      const orderPatch: R = {
        updated_at: new Date().toISOString(),
        status: newStatus,
      };
      const tn = str(incoming, "tracking_number");
      if (tn !== null) orderPatch.tracking_number = tn;
      const cr = str(incoming, "courier");
      if (cr !== null) orderPatch.courier = cr;

      await service.from("orders").update(orderPatch).eq("erp_order_id", erpOid);
      return;
    }
    case "order": {
      const erpOid = str(incoming, "erp_order_id") ?? str(payload, "erp_order_id");
      if (!erpOid) return;
      const nested = asRecord(payload.event_data) ?? payload;
      await applyErpInboundEvent(service, ERP_EVENTS.ORDER_CREATED_IN_ERP, nested, erpOid);
      return;
    }
    case "payment_status": {
      const erpOid = str(incoming, "erp_order_id") ?? str(payload, "erp_order_id");
      if (!erpOid) return;
      await service
        .from("orders")
        .update({
          payment_status: "paid",
          payment_ref: str(incoming, "payment_ref"),
          updated_at: new Date().toISOString(),
        })
        .eq("erp_order_id", erpOid);
      return;
    }
    case "product": {
      const erpPid = item.erp_product_id ?? parseErpInt(incoming.erp_product_id);
      if (erpPid == null) return;
      const patch: R = { updated_at: new Date().toISOString() };
      if (typeof incoming.name === "string") patch.name = incoming.name;
      if (typeof incoming.slug === "string") patch.slug = incoming.slug;
      if (typeof incoming.stock === "number") patch.stock = Math.floor(incoming.stock);
      if (typeof incoming.low_threshold === "number")
        patch.low_threshold = Math.floor(incoming.low_threshold);
      if (Object.keys(patch).length <= 1) return;
      await service.from("products").update(patch).eq("erp_product_id", erpPid);
      return;
    }
    default:
      console.warn("[erp sync] unknown field_changed", item.field_changed);
  }
}

export async function undoErpSyncPendingChange(
  service: SupabaseClient,
  item: ERPSyncPendingRow,
): Promise<void> {
  const current = item.current_value as R | null;
  const incoming = item.incoming_value as R | null;
  const payload = (item.payload ?? {}) as R;
  const dir = item.direction;
  if (dir !== "erp_to_dashboard") return;

  switch (item.field_changed) {
    case "stock": {
      const erpPid = item.erp_product_id ?? parseErpInt(payload.erp_product_id);
      const prev = current != null ? num(current, "stock") : null;
      if (erpPid == null || prev == null) return;
      await service
        .from("products")
        .update({ stock: Math.floor(prev), updated_at: new Date().toISOString() })
        .eq("erp_product_id", erpPid);
      return;
    }
    case "status": {
      const inc = incoming ?? {};
      const erpOid = str(inc, "erp_order_id") ?? (current ? str(current, "erp_order_id") : null);
      const prevStatus = current != null ? str(current, "status") : null;
      if (!erpOid || !prevStatus || !ORDER_STATUSES.has(prevStatus)) return;
      await service
        .from("orders")
        .update({ status: prevStatus, updated_at: new Date().toISOString() })
        .eq("erp_order_id", erpOid);
      return;
    }
    case "payment_status": {
      const inc = incoming ?? {};
      const erpOid = str(inc, "erp_order_id") ?? str(current ?? {}, "erp_order_id");
      const prev = current != null ? str(current, "payment_status") : null;
      if (!erpOid || !prev) return;
      await service
        .from("orders")
        .update({
          payment_status: prev,
          updated_at: new Date().toISOString(),
        })
        .eq("erp_order_id", erpOid);
      return;
    }
    case "product": {
      const erpPid = item.erp_product_id;
      if (erpPid == null || !current) return;
      const patch: R = { updated_at: new Date().toISOString() };
      for (const k of ["name", "slug", "stock", "low_threshold", "description", "short_desc", "status"]) {
        if (k in current && current[k] !== undefined) patch[k] = current[k];
      }
      await service.from("products").update(patch).eq("erp_product_id", erpPid);
      return;
    }
    case "order": {
      const createdId = typeof payload.created_order_id === "string" ? payload.created_order_id : null;
      if (!createdId) return;
      await service.from("orders").delete().eq("id", createdId);
      return;
    }
    case "low_threshold":
      return;
    default:
      return;
  }
}

function snapshotPayloadExtras(
  eventType: string,
  data: R,
  recordId: string,
  webhookLogId: string,
): R {
  return {
    webhook_log_id: webhookLogId,
    event_data: data,
    record_id: recordId,
    event_type: eventType,
  };
}

export async function processErpInboundSync(params: {
  service: SupabaseClient;
  webhookLogId: string;
  eventType: string;
  recordId: string;
  data: R;
}): Promise<void> {
  const { service, webhookLogId, eventType, recordId } = params;
  const data = { ...params.data };

  const setting = await fetchSyncSetting(service, eventType);
  if (setting && !setting.is_active) {
    return;
  }

  const autoApply = !setting || setting.auto_sync === true;

  const snapshot = await buildSnapshot(service, eventType, data, recordId);
  if (!snapshot) {
    return;
  }

  const insertBase: {
    event_type: string;
    direction: "erp_to_dashboard";
    erp_product_id: number | null;
    dashboard_product_id: string | null;
    field_changed: string;
    current_value: Snapshot["current_value"];
    incoming_value: Snapshot["incoming_value"];
    payload: R;
  } = {
    event_type: eventType,
    direction: "erp_to_dashboard",
    erp_product_id: snapshot.erp_product_id,
    dashboard_product_id: snapshot.dashboard_product_id,
    field_changed: snapshot.field_changed,
    current_value: snapshot.current_value,
    incoming_value: snapshot.incoming_value,
    payload: {
      ...snapshotPayloadExtras(eventType, data, recordId, webhookLogId),
      erp_product_name: snapshot.erp_product_name,
      product_label: snapshot.erp_product_name,
    },
  };

  if (autoApply) {
    const pendingRowLike: ERPSyncPendingRow = {
      id: "",
      ...insertBase,
      payload: insertBase.payload,
      status: "auto_applied",
      auto_applied: true,
      reviewed_by: null,
      reviewed_at: new Date().toISOString(),
      review_note: null,
      undone_at: null,
      undone_by: null,
      created_at: new Date().toISOString(),
    };

    try {
      await applyErpSyncPendingChange(service, pendingRowLike);

      let createdOrderId: string | undefined;
      if (eventType === ERP_EVENTS.ORDER_CREATED_IN_ERP) {
        const erpOid = str(data, "order_id") ?? recordId;
        const { data: created } = await service
          .from("orders")
          .select("id")
          .eq("erp_order_id", erpOid)
          .maybeSingle();
        if (created?.id) {
          createdOrderId = created.id as string;
          insertBase.payload = {
            ...insertBase.payload,
            created_order_id: createdOrderId,
            erp_order_id: erpOid,
          };
        }
      }

      const { error } = await service.from("erp_sync_pending").insert({
        ...insertBase,
        status: "auto_applied",
        auto_applied: true,
        reviewed_at: new Date().toISOString(),
      });
      if (error) {
        console.error("[erp sync] pending insert (auto):", error.message);
        return;
      }

      await service.from("audit_log").insert({
        user_id: null,
        user_email: "erp@chromax-sync",
        user_role: "ERP",
        action_type: "erp_sync.auto_applied",
        section: "erp_sync",
        record_id: webhookLogId,
        record_label: snapshot.erp_product_name ?? eventType,
        before_values: snapshot.current_value,
        after_values: snapshot.incoming_value,
        source: "erp",
      });

      const undoH = setting?.undo_window_hours ?? 24;
      void notifyERPSyncUsersWithEmails({
        kind: "auto_applied",
        eventType,
        fieldChanged: snapshot.field_changed,
        productName: snapshot.erp_product_name,
        currentSummary: snapshot.current_value,
        incomingSummary: snapshot.incoming_value,
        undoWindowHours: undoH,
      });
    } catch (e) {
      console.error("[erp sync] auto apply failed:", e);
    }
    return;
  }

  const { data: inserted, error: insErr } = await service
    .from("erp_sync_pending")
    .insert({
      ...insertBase,
      status: "pending",
      auto_applied: false,
    })
    .select("id")
    .single();

  if (insErr || !inserted?.id) {
    console.error("[erp sync] pending insert:", insErr?.message);
    return;
  }

  void notifyERPSyncUsers({
    type: "erp_sync_pending_review",
    title: "ERP sync review required",
    message: `${eventType} — ${snapshot.field_changed} for ${snapshot.erp_product_name ?? "record"}`,
    data: { pending_id: inserted.id, event_type: eventType },
  });

  void notifyERPSyncUsersWithEmails({
    kind: "pending_review",
    eventType,
    fieldChanged: snapshot.field_changed,
    productName: snapshot.erp_product_name,
    currentSummary: snapshot.current_value,
    incomingSummary: snapshot.incoming_value,
    pendingId: inserted.id,
  });
}
