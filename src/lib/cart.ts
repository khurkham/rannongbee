export type CartItem = {
  id: string;        // slug
  name: string;
  price: number;
  qty: number;
};

const KEY = "rannongbee_cart_v1";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart:changed"));
}

export function addToCart(item: Omit<CartItem, "qty">, qty = 1) {
  const cart = readCart();
  const found = cart.find((x) => x.id === item.id);
  if (found) found.qty += qty;
  else cart.push({ ...item, qty });
  writeCart(cart);
}

export function updateQty(id: string, qty: number) {
  const cart = readCart();
  const found = cart.find((x) => x.id === id);
  if (!found) return;
  found.qty = Math.max(1, qty);
  writeCart(cart);
}

export function removeItem(id: string) {
  const cart = readCart().filter((x) => x.id !== id);
  writeCart(cart);
}

export function clearCart() {
  writeCart([]);
}

export function cartCount(): number {
  return readCart().reduce((sum, x) => sum + x.qty, 0);
}

export function cartTotal(): number {
  return readCart().reduce((sum, x) => sum + x.qty * x.price, 0);
}
