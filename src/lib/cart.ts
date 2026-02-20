// src/lib/cart.ts
export type CartItem = {
  slug: string;
  name: string;
  price: number;
  qty: number;
};

const KEY = "cart:v1";

function safeParse(json: string | null): CartItem[] {
  if (!json) return [];
  try {
    const data = JSON.parse(json);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(KEY));
}

export function setCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  // แจ้งทุกส่วนของเว็บว่า cart เปลี่ยนแล้ว
  window.dispatchEvent(new CustomEvent("cart:updated", { detail: items }));
}

export function addToCart(input: Omit<CartItem, "qty">, qty = 1) {
  const cart = getCart();
  const idx = cart.findIndex((x) => x.slug === input.slug);
  if (idx >= 0) cart[idx].qty += qty;
  else cart.push({ ...input, qty });
  setCart(cart);
}

export function updateQty(slug: string, qty: number) {
  const cart = getCart();
  const next = cart
    .map((x) => (x.slug === slug ? { ...x, qty } : x))
    .filter((x) => x.qty > 0);
  setCart(next);
}

export function removeItem(slug: string) {
  const cart = getCart().filter((x) => x.slug !== slug);
  setCart(cart);
}

export function clearCart() {
  setCart([]);
}

export function cartCount(items?: CartItem[]) {
  const cart = items ?? getCart();
  return cart.reduce((sum, x) => sum + x.qty, 0);
}

export function cartTotal(items?: CartItem[]) {
  const cart = items ?? getCart();
  return cart.reduce((sum, x) => sum + x.qty * x.price, 0);
}
