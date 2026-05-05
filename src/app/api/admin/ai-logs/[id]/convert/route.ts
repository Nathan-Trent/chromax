import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { getAdminRequestContext, roleNamesCsv } from "@/lib/auth/admin-api";
import { hasPermission } from "@/lib/auth/permissions";
import type { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type SupabaseAdmin = Awaited<ReturnType<typeof createClient>>;

async function uniqueB2bReference(supabase: SupabaseAdmin): Promise<string> {
  const year = new Date().getFullYear();
  for (let i = 0; i < 12; i++) {
    const ref = `B2B-${year}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const { data } = await supabase.from("b2b_offers").select("id").eq("reference", ref).maybeSingle();
    if (!data) return ref;
  }
  return `B2B-${year}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const ctx = await getAdminRequestContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPermission(ctx.roles, "ai_leads", "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: lead, error: lErr } = await ctx.supabase.from("ai_leads").select("*").eq("id", id).maybeSingle();

  if (lErr) {
    return NextResponse.json({ error: lErr.message }, { status: 500 });
  }
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const email = lead.email as string | null;
  if (!email?.trim()) {
    return NextResponse.json({ error: "Lead has no email — cannot create B2B offer" }, { status: 422 });
  }

  const reference = await uniqueB2bReference(ctx.supabase);
  const productLabel = (lead.product_interest as string | null)?.trim() || "Unknown product";
  const notesParts = [
    lead.project_description ? `Project: ${lead.project_description}` : null,
    lead.conversation_summary ? `Summary: ${lead.conversation_summary}` : null,
    `Source: AI lead ${lead.id}`,
  ].filter(Boolean);

  const { data: offer, error: oErr } = await ctx.supabase
    .from("b2b_offers")
    .insert({
      reference,
      buyer_email: email.trim(),
      buyer_name: (lead.name as string | null)?.trim() || "Web lead",
      buyer_company: (lead.company as string | null)?.trim() || null,
      buyer_country: (lead.country as string | null)?.trim() || null,
      buyer_phone: (lead.phone as string | null)?.trim() || null,
      product_id: null,
      product_name: productLabel.slice(0, 240),
      product_code: "TBD",
      quantity: 1,
      offered_price: 0,
      currency: "NGN",
      list_price: 0,
      min_price: null,
      status: "pending",
      thread: [],
      internal_notes: notesParts.join("\n\n") || null,
    })
    .select("id")
    .single();

  if (oErr || !offer) {
    return NextResponse.json({ error: oErr?.message ?? "Could not create offer" }, { status: 500 });
  }

  const { error: uErr } = await ctx.supabase
    .from("ai_leads")
    .update({ status: "converted" })
    .eq("id", id);

  if (uErr) {
    return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  await writeAuditLog(ctx.supabase, {
    userId: ctx.user.id,
    userEmail: ctx.user.email,
    userRole: roleNamesCsv(ctx.roles),
    actionType: "ai_leads.converted_to_b2b",
    section: "ai_leads",
    recordId: id,
    recordLabel: email,
    afterValues: { offer_id: offer.id, reference },
    source: "dashboard",
  });

  return NextResponse.json({ data: { offer_id: offer.id as string } });
}
