CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_th TEXT NOT NULL,
  description TEXT DEFAULT '',
  price_thb INTEGER NOT NULL,
  image_url TEXT DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,
  value INTEGER NOT NULL,
  min_subtotal_thb INTEGER NOT NULL DEFAULT 0,
  max_redemptions INTEGER,
  max_per_customer INTEGER NOT NULL DEFAULT 1,
  starts_at TEXT,
  ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id TEXT PRIMARY KEY,
  coupon_id TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_id TEXT,
  redeemed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (coupon_id) REFERENCES coupons(id)
);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_phone ON coupon_redemptions(customer_phone);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  address TEXT NOT NULL,
  lat REAL,
  lng REAL,
  distance_km REAL,
  delivery_fee_thb INTEGER NOT NULL DEFAULT 0,
  subtotal_thb INTEGER NOT NULL,
  discount_thb INTEGER NOT NULL DEFAULT 0,
  total_thb INTEGER NOT NULL,
  coupon_code TEXT,
  delivery_date TEXT NOT NULL,
  placed_at TEXT NOT NULL DEFAULT (datetime('now')),
  slip_url TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(delivery_date);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  name_th TEXT NOT NULL,
  unit_price_thb INTEGER NOT NULL,
  qty INTEGER NOT NULL,
  note TEXT DEFAULT '',
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
