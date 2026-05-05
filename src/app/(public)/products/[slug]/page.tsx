import { ProductDetailCartSection } from "@/components/public/ProductDetailCartSection";
import { ProductAccordion } from "@/components/public/ProductAccordion";
import {
  categoryLabel,
  formatNgn,
  ProductStockBadge,
} from "@/components/public/ProductCard";
import type { ProductCategory } from "@/lib/supabase/queries/products";
import {
  getProductBySlug,
  getProductStock,
} from "@/lib/supabase/queries/products";
import { getSwatches, type ColourSwatchCategory } from "@/lib/supabase/queries/swatches";
import { CATEGORY_HEX } from "@/lib/design/category-theme";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const CATEGORY_EMOJI: Record<ProductCategory, string> = {
  industrial: "⚙️",
  marine: "⚓",
  automotive: "🚗",
  architectural: "🏠",
  custom: "🧪",
};

function toSwatchCategory(cat: ProductCategory): ColourSwatchCategory {
  const m: Record<ProductCategory, ColourSwatchCategory> = {
    industrial: "industrial",
    marine: "marine",
    automotive: "automotive",
    architectural: "architectural",
    custom: "industrial",
  };
  return m[cat];
}

function orderImages(product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>) {
  if (!product?.images?.length) return [];
  const imgs = [...product.images];
  imgs.sort((a, b) => {
    if (a.is_primary === b.is_primary) return 0;
    return a.is_primary ? -1 : 1;
  });
  return imgs;
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Product not found | Chromax-MCR" };
  }
  return {
    title: product.seo_title ?? `${product.name} | Chromax-MCR`,
    description:
      product.seo_description ??
      product.short_desc ??
      product.description?.slice(0, 160) ??
      `Chromax-MCR — ${product.name}`,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const [stockInfo, swatchesInCategory] = await Promise.all([
    getProductStock(product.id),
    getSwatches(toSwatchCategory(product.category)),
  ]);

  const linkedSwatches = swatchesInCategory.filter(
    (s) => s.product_id === product.id,
  );

  const orderedImages = orderImages(product);
  const mainImage = orderedImages[0];

  const priceLabel = formatNgn(product.price_ngn);
  const inStock = stockInfo.in_stock;
  const accent = CATEGORY_HEX[product.category];

  return (
    <>
      <section className="bg-[#1a1a2e] py-8">
        <div className="mx-auto max-w-[1280px] px-6">
          <nav
            className="font-sans text-sm text-white/50"
            aria-label="Breadcrumb"
          >
            <Link href="/products" className="transition duration-150 hover:text-white motion-reduce:transition-none">
              Products
            </Link>
            <span className="mx-1.5">›</span>
            <Link
              href={`/products?category=${product.category}`}
              className="transition duration-150 hover:text-white motion-reduce:transition-none"
            >
              {categoryLabel(product.category)}
            </Link>
            <span className="mx-1.5">›</span>
            <span className="text-white/70">{product.name}</span>
          </nav>
          <div
            className="mt-4 inline-flex rounded-md px-3 py-1 font-sans text-[11px] font-medium uppercase tracking-widest text-white"
            style={{ backgroundColor: accent }}
          >
            {categoryLabel(product.category)}
          </div>
        </div>
      </section>

      <div className="bg-[#F5F0E8] py-12">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <div className="relative overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="relative aspect-[4/3] w-full bg-white">
                  {mainImage?.url ? (
                    <>
                      <Image
                        src={mainImage.url}
                        alt={mainImage.alt ?? product.name}
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 1024px) 100vw, 60vw"
                      />
                      <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
                        style={{
                          background: `linear-gradient(to top, ${accent}66, transparent)`,
                        }}
                        aria-hidden
                      />
                    </>
                  ) : (
                    <div
                      className="flex h-full items-center justify-center text-8xl text-white"
                      style={{ backgroundColor: accent }}
                    >
                      <span aria-hidden>{CATEGORY_EMOJI[product.category]}</span>
                    </div>
                  )}
                </div>
              </div>
              {orderedImages.length > 1 ? (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                  {orderedImages.map((img, idx) => (
                    <div
                      key={`${img.url}-${idx}`}
                      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#F5F0E8] ${
                        idx === 0 ? "" : "border-2 border-transparent"
                      }`}
                      style={
                        idx === 0
                          ? { boxShadow: `0 0 0 2px ${accent}` }
                          : undefined
                      }
                    >
                      {img.url ? (
                        <Image
                          src={img.url}
                          alt={img.alt ?? product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-8">
                {product.tds_url ? (
                  <a
                    href={product.tds_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-sm font-medium transition duration-150 hover:opacity-80 motion-reduce:transition-none"
                    style={{ color: accent }}
                  >
                    📄 Technical Data Sheet
                  </a>
                ) : (
                  <p className="font-sans text-sm text-[#888]">TDS coming soon</p>
                )}
              </div>
            </div>

            <div className="lg:col-span-5">
              <h1 className="font-[family-name:var(--font-fraunces)] mb-3 text-4xl font-semibold text-[#1a1a2e]">
                {product.name}
              </h1>

              <div className="mb-6">
                <ProductStockBadge
                  stock={stockInfo.stock}
                  lowThreshold={stockInfo.low_threshold}
                />
              </div>

              <p className="mb-6 font-sans text-[15px] leading-relaxed text-[#555]">
                {product.short_desc ?? ""}
              </p>

              <div
                className="mb-6 rounded-xl border border-[#E8E8E4] border-l-4 bg-[#F5F0E8] p-5"
                style={{ borderLeftColor: accent }}
              >
                <p className="mb-1 font-sans text-[11px] font-medium uppercase tracking-widest text-[#888]">
                  Price
                </p>
                {priceLabel ? (
                  <p className="font-sans text-[#1a1a2e]">
                    <span className="text-3xl font-semibold">{priceLabel}</span>
                    <span className="ml-2 font-sans text-[12px] text-[#888]">
                      excl. shipping
                    </span>
                  </p>
                ) : (
                  <p className="font-sans text-[#888]">Contact us for pricing</p>
                )}
              </div>

              <ProductDetailCartSection
                product={product}
                linkedSwatches={linkedSwatches}
                inStock={inStock}
              />

              <div className="mt-8 rounded-xl bg-[#1a1a2e] p-5">
                <p className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-white">
                  Buying in bulk?
                </p>
                <p className="mt-2 font-sans text-[13px] text-white/60">
                  B2B pricing and volume quotes for contractors, distributors and manufacturers.
                </p>
                <Link
                  href={`/contact?type=b2b&product_id=${encodeURIComponent(product.id)}&product_slug=${encodeURIComponent(product.slug)}`}
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#E8A020] px-5 py-2.5 font-sans text-[13px] font-medium text-[#1a1a2e] transition duration-150 hover:bg-[#D49215] motion-reduce:transition-none"
                >
                  Make an offer →
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-[#E0DED4] pt-10">
            <ProductAccordion description={product.description} />
          </div>
        </div>
      </div>
    </>
  );
}
