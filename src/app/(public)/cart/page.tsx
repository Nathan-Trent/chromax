"use client";

import { PageHeader } from "@/components/public/PageHeader";
import {
  formatCartPrice,
  getLineUnitPrice,
  useCartStore,
  type CartItem,
} from "@/lib/store/cart";
import { CATEGORY_HEX } from "@/lib/design/category-theme";
import type { ProductCategory } from "@/lib/supabase/queries/products";
import Image from "next/image";
import Link from "next/link";

function CategoryPlaceholder({ accent }: { accent?: ProductCategory }) {
  const bg = accent ? CATEGORY_HEX[accent] : "#F5F0E8";
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-lg text-2xl ${accent ? "text-white/90" : "text-[#CCCCCC]"}`}
      style={{ backgroundColor: bg }}
    >
      🎨
    </div>
  );
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const currency = useCartStore((s) => s.currency);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const getTotal = useCartStore((s) => s.getTotal);

  const total = getTotal();

  if (items.length === 0) {
    return (
      <>
        <section className="bg-[#1a1a2e] py-12">
          <div className="mx-auto max-w-[1280px] px-6 text-center">
            <h1 className="font-[family-name:var(--font-fraunces)] text-4xl font-semibold text-white">
              Your cart is empty
            </h1>
            <p className="mx-auto mt-3 max-w-lg font-sans text-[15px] text-white/60">
              Browse our catalogue and add coatings — your selections will appear here.
            </p>
          </div>
        </section>
        <div className="flex flex-col items-center bg-[#F5F0E8] px-6 py-24">
          <svg
            className="mb-6 h-24 w-24 text-white/20"
            width="96"
            height="96"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M6 6h15l-1.5 9h-12L6 6zm0 0L5 3H2"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="20" r="1" fill="currentColor" />
            <circle cx="17" cy="20" r="1" fill="currentColor" />
          </svg>
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-lg bg-[#E8A020] px-8 py-3 font-sans text-sm font-medium text-[#1a1a2e] transition duration-150 hover:bg-[#D49215] motion-reduce:transition-none"
          >
            Browse products
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader badge="Cart" heading="Your cart" subtext="Review quantities before checkout — prices update with your currency preference." />

      <div className="bg-[#F5F0E8] py-12">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              {items.map((item) => (
                <CartLine
                  key={item.lineKey}
                  item={item}
                  currency={currency}
                  onRemove={() => removeItem(item.lineKey)}
                  onChangeQty={(q) => updateQuantity(item.lineKey, q)}
                />
              ))}
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-24 overflow-hidden rounded-xl border border-[#E8E8E4] border-t-4 border-t-[#E8A020] bg-white p-6 shadow-sm">
                <h2 className="mb-4 font-sans text-base font-semibold text-[#1a1a2e]">
                  Order summary
                </h2>
                {items.map((item) => {
                  const unit = getLineUnitPrice(item, currency);
                  const sub = unit * item.quantity;
                  return (
                    <div
                      key={item.lineKey}
                      className="mb-2 flex w-full justify-between font-sans text-[13px] text-[#555555]"
                    >
                      <span className="min-w-0 flex-1 truncate pr-2">{item.name}</span>
                      <span className="shrink-0 tabular-nums">{formatCartPrice(sub, currency)}</span>
                    </div>
                  );
                })}
                <div className="my-4 border-t border-[#E8E8E4]" />
                <div className="flex justify-between">
                  <span className="text-[15px] font-semibold text-[#1a1a2e]">Total</span>
                  <span className="font-[family-name:var(--font-fraunces)] text-xl font-semibold tabular-nums text-[#1a1a2e]">
                    {formatCartPrice(total, currency)}
                  </span>
                </div>
                <p className="mt-2 font-sans text-xs text-[#888888]">Prices shown in {currency}</p>
                <Link
                  href="/checkout"
                  className="mt-4 flex w-full items-center justify-center rounded-lg bg-[#E8A020] px-5 py-2.5 font-sans text-[13px] font-medium text-[#1a1a2e] transition duration-150 hover:bg-[#D49215] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a2e] motion-reduce:transition-none"
                >
                  Proceed to checkout
                </Link>
                <Link
                  href="/products"
                  className="mt-3 block text-center font-sans text-sm font-medium text-[#185FA5] transition duration-150 hover:underline motion-reduce:transition-none"
                >
                  Continue shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CartLine({
  item,
  currency,
  onRemove,
  onChangeQty,
}: {
  item: CartItem;
  currency: "NGN" | "USD" | "GBP";
  onRemove: () => void;
  onChangeQty: (q: number) => void;
}) {
  const unit = getLineUnitPrice(item, currency);
  const canDecrement = item.quantity > 1;
  const accent = item.category ? CATEGORY_HEX[item.category] : undefined;

  return (
    <div
      className="mb-4 flex gap-4 rounded-xl border border-[#E8E8E4] bg-white p-4 shadow-sm transition duration-200 hover:shadow-md motion-reduce:transition-none"
      style={
        accent
          ? { borderLeftWidth: 4, borderLeftColor: accent, borderLeftStyle: "solid" }
          : undefined
      }
    >
      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-[#F5F0E8]">
        {item.image_url ? (
          <Image src={item.image_url} alt="" fill className="object-cover" sizes="72px" />
        ) : (
          <CategoryPlaceholder accent={item.category} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-[#1a1a2e]">{item.name}</p>
        {item.variant ? <p className="text-xs text-[#888888]">Colour: {item.variant}</p> : null}
        <p className="mt-1 font-sans text-sm text-[#555555]">
          {formatCartPrice(unit, currency)} each
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canDecrement}
            onClick={() => onChangeQty(item.quantity - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E0DED4] font-sans text-[13px] text-[#333333] transition duration-150 hover:border-[#E8A020] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#E8A020] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="min-w-[1.5rem] text-center font-sans text-[13px] font-medium text-[#E8A020]">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onChangeQty(item.quantity + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E0DED4] font-sans text-[13px] text-[#333333] transition duration-150 hover:border-[#E8A020] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#E8A020] motion-reduce:transition-none"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="mt-2 font-sans text-xs text-[#888888] transition duration-150 hover:text-[#993C1D] motion-reduce:transition-none"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
