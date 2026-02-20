export async function listProducts(DB: D1Database) {
  const { results } = await DB.prepare(
    "SELECT id, slug, name_th, description, price_thb, image_url FROM products WHERE is_active=1 ORDER BY created_at DESC"
  ).all();
  return results as any[];
}
export async function getProductBySlug(DB: D1Database, slug: string) {
  const row = await DB.prepare(
    "SELECT id, slug, name_th, description, price_thb, image_url FROM products WHERE slug=? AND is_active=1"
  ).bind(slug).first();
  return row as any | null;
}
export async function getCoupon(DB: D1Database, code: string) {
  const row = await DB.prepare(
    "SELECT * FROM coupons WHERE code=? AND is_active=1"
  ).bind(code.toUpperCase()).first();
  return row as any | null;
}
export async function countRedemptions(DB: D1Database, couponId: string) {
  const row = await DB.prepare("SELECT COUNT(1) as c FROM coupon_redemptions WHERE coupon_id=?")
    .bind(couponId).first() as any;
  return Number(row?.c ?? 0);
}
export async function countRedemptionsByPhone(DB: D1Database, couponId: string, phone: string) {
  const row = await DB.prepare("SELECT COUNT(1) as c FROM coupon_redemptions WHERE coupon_id=? AND customer_phone=?")
    .bind(couponId, phone).first() as any;
  return Number(row?.c ?? 0);
}
