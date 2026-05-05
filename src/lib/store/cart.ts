import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ProductCategory } from "@/lib/supabase/queries/products";

export interface CartItem {
  /** Stable line id for quantity/remove operations */
  lineKey: string;
  id: string;
  name: string;
  slug: string;
  price_ngn: number | null;
  price_usd: number | null;
  price_gbp: number | null;
  quantity: number;
  variant?: string;
  image_url?: string;
  /** Product category for cart line accent (optional on legacy persisted carts) */
  category?: ProductCategory;
}

type AddItemPayload = Omit<CartItem, "quantity" | "lineKey">;

export interface CartStore {
  items: CartItem[];
  currency: "NGN" | "USD" | "GBP";
  addItem: (item: AddItemPayload) => void;
  removeItem: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  clearCart: () => void;
  setCurrency: (currency: "NGN" | "USD" | "GBP") => void;
  getTotal: () => number;
  getItemCount: () => number;
}

function lineKeyFor(id: string, variant?: string): string {
  return `${id}::${variant ?? ""}`;
}

function priceForCurrency(
  item: Pick<CartItem, "price_ngn" | "price_usd" | "price_gbp">,
  currency: "NGN" | "USD" | "GBP",
): number {
  const v =
    currency === "NGN"
      ? item.price_ngn
      : currency === "USD"
        ? item.price_usd
        : item.price_gbp;
  return v != null && !Number.isNaN(Number(v)) ? Number(v) : 0;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      currency: "NGN",

      addItem: (item) => {
        const lineKey = lineKeyFor(item.id, item.variant);
        set((state) => {
          const idx = state.items.findIndex((i) => i.lineKey === lineKey);
          if (idx >= 0) {
            const next = state.items.slice();
            const cur = next[idx];
            if (!cur) return state;
            next[idx] = {
              ...cur,
              quantity: cur.quantity + 1,
            };
            return { items: next };
          }
          return {
            items: [
              ...state.items,
              {
                ...item,
                lineKey,
                quantity: 1,
              },
            ],
          };
        });
      },

      removeItem: (lineKey) =>
        set((state) => ({
          items: state.items.filter((i) => i.lineKey !== lineKey),
        })),

      updateQuantity: (lineKey, quantity) =>
        set((state) => {
          if (quantity < 1) {
            return {
              items: state.items.filter((i) => i.lineKey !== lineKey),
            };
          }
          return {
            items: state.items.map((i) =>
              i.lineKey === lineKey ? { ...i, quantity } : i,
            ),
          };
        }),

      clearCart: () => set({ items: [] }),

      setCurrency: (currency) => set({ currency }),

      getTotal: () => {
        const { items, currency } = get();
        return items.reduce(
          (sum, i) => sum + priceForCurrency(i, currency) * i.quantity,
          0,
        );
      },

      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "chromax_cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        items: s.items,
        currency: s.currency,
      }),
      merge: (persisted, current) => {
        if (persisted == null || typeof persisted !== "object") {
          return current;
        }
        const p = persisted as Partial<CartStore>;
        const rawItems = p.items ?? current.items;
        return {
          ...current,
          ...p,
          items: rawItems.map((i) => ({
            ...i,
            lineKey: i.lineKey ?? lineKeyFor(i.id, i.variant),
          })),
        };
      },
    },
  ),
);

export function getLineUnitPrice(
  item: Pick<CartItem, "price_ngn" | "price_usd" | "price_gbp">,
  currency: "NGN" | "USD" | "GBP",
): number {
  return priceForCurrency(item, currency);
}

/** Format amount for display in the active cart currency */
export function formatCartPrice(
  amount: number,
  currency: "NGN" | "USD" | "GBP",
): string {
  if (currency === "NGN") {
    return `₦${amount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
  }
  if (currency === "USD") {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `£${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
