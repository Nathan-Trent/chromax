-- requires_colour_selection: when true, PDP blocks Add to cart until a swatch is chosen (see ProductDetailCartSection / AddToCartButton).
alter table public.products
  add column if not exists requires_colour_selection boolean default false;
