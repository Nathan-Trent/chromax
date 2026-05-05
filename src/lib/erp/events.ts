export const ERP_EVENTS = {
  ORDER_STATUS_UPDATED: "order.status_updated",
  ORDER_CANCELLED: "order.cancelled",
  B2B_OFFER_ACCEPTED: "b2b_offer.accepted",
  B2B_OFFER_COUNTER_SENT: "b2b_offer.counter_sent",
  PRODUCT_PRICE_UPDATED: "product.price_updated",
  LEAD_CAPTURED: "lead.captured",
  QUOTE_REQUESTED: "quote.requested",

  STOCK_UPDATED: "stock.updated",
  STOCK_LOW_THRESHOLD: "stock.low_threshold",
  ORDER_CREATED_IN_ERP: "order.created",
  PRODUCT_UPDATED: "product.updated",
  PAYMENT_CONFIRMED: "payment.confirmed",
} as const;

export type ERPEventType = (typeof ERP_EVENTS)[keyof typeof ERP_EVENTS];
