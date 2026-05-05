import type { createClient } from "@/lib/supabase/server";
import type { B2BThreadEntry } from "@/types/b2b-offer";
import type { PendingChangeRow } from "@/types/admin-workflows";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export type ApplyResult = { ok: true } | { ok: false; error: string };

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

/**
 * Applies an approved pending change to the underlying record.
 * Call only after authZ; caller updates pending_changes row and audit_log.
 */
export async function applyPendingChange(
  supabase: SupabaseServer,
  pending: PendingChangeRow,
  approverUserId: string,
): Promise<ApplyResult> {
  const after = asRecord(pending.after_values);
  if (!after) {
    return { ok: false, error: "Invalid after_values" };
  }

  const recordId = pending.record_id;
  if (!recordId && pending.action_type !== "content.page_updated") {
    return { ok: false, error: "Missing record id" };
  }

  try {
    switch (pending.action_type) {
      case "content.page_updated": {
        const id = pending.record_id;
        if (!id) return { ok: false, error: "Missing content page id" };
        const updatePayload: Record<string, unknown> = {
          content: after.content,
          last_edited_by: approverUserId,
        };
        if (typeof after.status === "string") {
          updatePayload.status = after.status;
        }
        const { error } = await supabase.from("content_pages").update(updatePayload).eq("id", id);
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      }

      case "product.price_updated": {
        const { error } = await supabase
          .from("products")
          .update({
            price_ngn: after.price_ngn ?? null,
            price_usd: after.price_usd ?? null,
            price_gbp: after.price_gbp ?? null,
          })
          .eq("id", recordId);
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      }

      case "b2b.counter_sent": {
        const { data: offer, error: oErr } = await supabase
          .from("b2b_offers")
          .select("*")
          .eq("id", recordId)
          .maybeSingle();
        if (oErr) return { ok: false, error: oErr.message };
        if (!offer) return { ok: false, error: "Offer not found" };

        const counterPrice =
          typeof after.counter_price === "number" ? after.counter_price : Number(after.counter_price);
        if (!Number.isFinite(counterPrice)) {
          return { ok: false, error: "Invalid counter price" };
        }

        const message =
          typeof after.message === "string" ? after.message : "Counter-offer";
        const thread = Array.isArray(offer.thread) ? [...(offer.thread as B2BThreadEntry[])] : [];
        const ts = new Date().toISOString();
        thread.push({
          from: "chromax",
          price: counterPrice,
          message: message.trim() || "Counter-offer",
          timestamp: ts,
          by: null,
        });

        const { error: uErr } = await supabase
          .from("b2b_offers")
          .update({
            status: "countered",
            responded_at: ts,
            thread,
          })
          .eq("id", recordId);

        if (uErr) return { ok: false, error: uErr.message };
        return { ok: true };
      }

      case "order.cancel_requested": {
        const now = new Date().toISOString();
        const { data: order, error: fErr } = await supabase
          .from("orders")
          .select("id, status")
          .eq("id", recordId)
          .maybeSingle();
        if (fErr) return { ok: false, error: fErr.message };
        if (!order) return { ok: false, error: "Order not found" };

        const { error: uErr } = await supabase
          .from("orders")
          .update({
            status: "cancelled",
            cancelled_at: now,
            cancellation_reason: "Approved via pending change",
          })
          .eq("id", recordId);

        if (uErr) return { ok: false, error: uErr.message };
        return { ok: true };
      }

      default:
        return {
          ok: false,
          error: `Automatic apply is not implemented for action type: ${pending.action_type}`,
        };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Apply failed" };
  }
}
