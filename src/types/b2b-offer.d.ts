export type B2BOfferStatus =
  | "pending"
  | "reviewing"
  | "countered"
  | "accepted"
  | "declined"
  | "expired"
  | "converted";

export type B2BOfferCurrency = "NGN" | "USD" | "GBP";

export type B2BThreadEntry = {
  from: "buyer" | "chromax";
  price?: number | null;
  message: string;
  timestamp: string;
  by?: string | null;
};

export type AdminB2BOfferRow = {
  id: string;
  reference: string;
  buyer_email: string;
  buyer_name: string;
  buyer_company: string | null;
  buyer_country: string | null;
  buyer_phone: string | null;
  product_id: string | null;
  product_name: string;
  product_code: string;
  quantity: number;
  offered_price: number;
  currency: B2BOfferCurrency;
  list_price: number;
  min_price: number | null;
  status: B2BOfferStatus;
  thread: B2BThreadEntry[];
  auto_counter_at: string | null;
  responded_at: string | null;
  accepted_at: string | null;
  order_id: string | null;
  assigned_to: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
};
