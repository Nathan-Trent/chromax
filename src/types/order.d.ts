export type OrderStatus =
  | "new"
  | "confirmed"
  | "packed"
  | "dispatched"
  | "delivered"
  | "cancelled";

export type OrderCurrency = "NGN" | "USD" | "GBP";

export type OrderSource = "website" | "erp" | "phone";

export type ShippingAddressJson = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  country?: string | null;
  postcode?: string | null;
};

export type OrderLineItem = {
  name: string;
  variant?: string | null;
  qty?: number;
  quantity?: number;
  unit_price?: number;
  product_id?: string | null;
};

export type AdminOrderRow = {
  id: string;
  reference: string;
  customer_id: string | null;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  items: OrderLineItem[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  currency: OrderCurrency;
  status: OrderStatus;
  payment_status: string;
  payment_method: string | null;
  payment_ref: string | null;
  tracking_number: string | null;
  courier: string | null;
  shipping_address: ShippingAddressJson;
  notes: string | null;
  source: OrderSource;
  erp_synced_at: string | null;
  erp_order_id: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  refund_amount: number | null;
  created_at: string;
  updated_at: string;
};
