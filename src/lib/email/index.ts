import { sendEmail } from "@/lib/email/sender";

export async function sendOrderConfirmation(order: {
  reference: string;
  customer_name: string;
  customer_email: string;
  items: unknown[];
  total: number;
  currency: string;
  shipping_address: unknown;
}): Promise<void> {
  try {
    const itemsRaw = Array.isArray(order.items) ? order.items : [];
    const items = itemsRaw.map((row: unknown) => {
      const o = row as Record<string, unknown>;
      return {
        name: String(o.name ?? "Item"),
        qty: Number(o.qty ?? o.quantity ?? 1) || 1,
        unitPrice: Number(o.unit_price ?? o.unitPrice ?? 0) || 0,
        currency: order.currency,
      };
    });
    let shippingAddress = "";
    if (typeof order.shipping_address === "string") {
      shippingAddress = order.shipping_address;
    } else if (order.shipping_address && typeof order.shipping_address === "object") {
      shippingAddress = JSON.stringify(order.shipping_address, null, 2);
    }
    void sendEmail({
      to: order.customer_email,
      template: "order_confirmation",
      data: {
        customerName: order.customer_name,
        orderReference: order.reference,
        items,
        total: order.total,
        currency: order.currency,
        shippingAddress,
      },
      notificationType: "order_confirmation",
    });
  } catch (e) {
    console.warn("[email] sendOrderConfirmation:", e);
  }
}

export async function sendOrderStatusUpdate(order: {
  reference: string;
  customer_name: string;
  customer_email: string;
  status: string;
  tracking_number?: string | null;
  courier?: string | null;
}): Promise<void> {
  try {
    void sendEmail({
      to: order.customer_email,
      template: "order_status_update",
      data: {
        customerName: order.customer_name,
        orderReference: order.reference,
        newStatus: order.status,
        trackingNumber: order.tracking_number ?? undefined,
        courier: order.courier ?? undefined,
      },
      notificationType: "order_status_update",
    });
  } catch (e) {
    console.warn("[email] sendOrderStatusUpdate:", e);
  }
}

export async function sendB2BOfferReceived(
  offer: {
    reference: string;
    buyer_name: string;
    buyer_company?: string | null;
    product_name: string;
    quantity: number;
    offered_price: number;
    currency: string;
    id: string;
  },
  adminEmail: string,
): Promise<void> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    void sendEmail({
      to: adminEmail,
      template: "b2b_offer_received",
      data: {
        buyerName: offer.buyer_name,
        buyerCompany: offer.buyer_company ?? "—",
        productName: offer.product_name,
        quantity: offer.quantity,
        offeredPrice: offer.offered_price,
        currency: offer.currency,
        reference: offer.reference,
        adminUrl: `${appUrl.replace(/\/$/, "")}/admin/b2b/${offer.id}`,
      },
      notificationType: "b2b_offer_received",
    });
  } catch (e) {
    console.warn("[email] sendB2BOfferReceived:", e);
  }
}

export async function sendB2BOfferResponse(
  offer: {
    reference: string;
    buyer_name: string;
    buyer_email: string;
    product_name: string;
    currency: string;
  },
  action: "accepted" | "countered" | "declined",
  counterPrice?: number,
  message?: string,
): Promise<void> {
  try {
    void sendEmail({
      to: offer.buyer_email,
      template: "b2b_offer_response",
      data: {
        buyerName: offer.buyer_name,
        action,
        productName: offer.product_name,
        reference: offer.reference,
        counterPrice,
        message,
        currency: offer.currency,
      },
      notificationType: "b2b_offer_response",
    });
  } catch (e) {
    console.warn("[email] sendB2BOfferResponse:", e);
  }
}

export async function sendApprovalRequested(
  recordLabel: string,
  actionType: string,
  submittedBy: string,
  approverEmail: string,
  dashboardUrl: string,
): Promise<void> {
  try {
    void sendEmail({
      to: approverEmail,
      template: "approval_requested",
      data: {
        approverName: approverEmail.split("@")[0],
        actionType,
        recordLabel,
        submittedBy,
        dashboardUrl,
      },
      notificationType: "approval_requested",
    });
  } catch (e) {
    console.warn("[email] sendApprovalRequested:", e);
  }
}

export async function sendApprovalActioned(
  recordLabel: string,
  actionType: string,
  submitterEmail: string,
  submitterName: string,
  status: "approved" | "rejected",
  comment?: string,
): Promise<void> {
  try {
    void sendEmail({
      to: submitterEmail,
      template: "approval_actioned",
      data: {
        submitterName,
        actionType,
        recordLabel,
        status,
        comment,
      },
      notificationType: "approval_actioned",
    });
  } catch (e) {
    console.warn("[email] sendApprovalActioned:", e);
  }
}

/**
 * sendStaffInvite — intentionally not called from the invite API route.
 *
 * Supabase Auth sends the invite email with the signed token URL via our branded
 * template configured in Supabase Dashboard → Auth → Email Templates → Invite user.
 *
 * A custom email cannot carry the signed token — only Supabase Auth can generate it.
 * This function is kept for potential future use such as invite reminder emails.
 */
export async function sendStaffInvite(options: {
  toEmail: string;
  inviterName: string;
  inviterEmail: string;
  roleName: string;
  acceptUrl: string;
}): Promise<void> {
  try {
    void sendEmail({
      to: options.toEmail,
      template: "staff_invite",
      data: {
        inviterName: options.inviterName,
        inviterEmail: options.inviterEmail,
        roleName: options.roleName,
        acceptUrl: options.acceptUrl,
        expiresIn: "48 hours",
      },
      notificationType: "staff_invite",
    });
  } catch (e) {
    console.warn("[email] sendStaffInvite:", e);
  }
}
