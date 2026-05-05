export const WORKFLOW_ACTION_DEFINITIONS: {
  action_type: string;
  label: string;
  description: string;
}[] = [
  {
    action_type: "product.price_updated",
    label: "Product pricing change",
    description: "List / bulk price changes that require accountant approval.",
  },
  {
    action_type: "content.page_updated",
    label: "Content / page change",
    description: "Updates to homepage, about, or contact CMS blocks.",
  },
  {
    action_type: "order.cancel_requested",
    label: "Order cancellation",
    description: "Cancelling an order after a fulfilment staff request.",
  },
  {
    action_type: "b2b.counter_sent",
    label: "B2B counter-offer",
    description: "Sending a counter price below the approval threshold.",
  },
  {
    action_type: "swatch.updated",
    label: "Colour swatch update",
    description: "Swatch colour or catalog metadata changes.",
  },
  {
    action_type: "product.created",
    label: "New product created",
    description: "Publishing or structuring a new catalog SKU.",
  },
  {
    action_type: "product.status_changed",
    label: "Product status change",
    description: "Moving a product between draft, live, and archived.",
  },
];

export function workflowLabelForActionType(actionType: string): string {
  const def = WORKFLOW_ACTION_DEFINITIONS.find((d) => d.action_type === actionType);
  if (def) return def.label;
  if (actionType === "order.cancelled") return "Order cancellation";
  return actionType;
}
