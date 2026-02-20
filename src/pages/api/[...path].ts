import { Hono } from 'hono';
import { z } from 'zod';
import QRCode from 'qrcode';
import { promptPayPayload } from '../../lib/promptpay';
import { computeDeliveryDateISO, computeDeliveryFee, haversineKm, orderCode, thb, uid, parseFloatEnv, parseIntEnv } from '../../lib/utils';
import { getCoupon, countRedemptions, countRedemptionsByPhone } from '../../lib/db';
import { pushLineMessage } from '../../lib/line';

type Bindings = {
  DB: D1Database;
  PROMPTPAY_PHONE: string;
  CUTOFF_HOUR: string;
  STORE_LAT: string;
  STORE_LNG: string;
  DELIVERY_FREE_UP_TO_KM: string;
  DELIVERY_TIER_1_MAX_KM: string;
  DELIVERY_TIER_1_FEE: string;
  DELIVERY_TIER_2_MAX_KM: string;
  DELIVERY_TIER_2_FEE: string;
  DELIVERY_TIER_3_MAX_KM: string;
  DELIVERY_TIER_3_FEE: string;
  GOOGLE_MAPS_API_KEY?: string;
  LINE_CHANNEL_ACCESS_TOKEN?: string;
  LINE_ADMIN_USER_ID?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/health', (c) => c.json({ ok: true }));

app.get('/promptpay-qr', async (c) => {
  const amount = Number(c.req.query('amount') || '0');
  if (!Number.isFinite(amount) || amount <= 0) return c.text('Invalid amount', 400);
  const phone = (c.env.PROMPTPAY_PHONE || '').replace(/\D/g,'');
  if (!phone) return c.text('Missing PROMPTPAY_PHONE', 500);
  const payload = promptPayPayload(phone, amount);
  const svg = await QRCode.toString(payload, { type: 'svg', margin: 1, width: 220 });
  return c.html(svg, 200, { 'Content-Type': 'image/svg+xml; charset=utf-8' });
});

const GeocodeSchema = z.object({ address: z.string().min(5) });
app.post('/geocode', async (c) => {
  const body = await c.req.json().catch(()=>null);
  const parsed = GeocodeSchema.safeParse(body);
  if (!parsed.success) return c.json({ ok:false, error: 'Invalid address' }, 400);
  const key = c.env.GOOGLE_MAPS_API_KEY;
  if (!key) return c.json({ ok:false, error: 'Missing GOOGLE_MAPS_API_KEY' }, 500);

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', parsed.data.address);
  url.searchParams.set('key', key);
  const res = await fetch(url.toString());
  const j = await res.json<any>();
  const loc = j?.results?.[0]?.geometry?.location;
  if (!loc) return c.json({ ok:false, error: 'Geocode not found' }, 404);
  return c.json({ ok:true, lat: loc.lat, lng: loc.lng });
});

const ValidateSchema = z.object({
  customer_phone: z.string().min(8),
  address: z.string().min(5),
  lat: z.number(),
  lng: z.number(),
  items: z.array(z.object({
    product_id: z.string(),
    name_th: z.string(),
    unit_price_thb: z.number().int().positive(),
    qty: z.number().int().positive(),
    note: z.string().optional().default('')
  })).min(1),
  coupon_code: z.string().optional().default(''),
});

app.post('/validate', async (c) => {
  const body = await c.req.json().catch(()=>null);
  const parsed = ValidateSchema.safeParse(body);
  if (!parsed.success) return c.json({ ok:false, error: 'Invalid payload' }, 400);

  const { items, coupon_code, customer_phone, lat, lng } = parsed.data;
  const subtotal = items.reduce((s,it)=>s + it.unit_price_thb * it.qty, 0);

  const storeLat = parseFloatEnv(c.env.STORE_LAT, 19.3010);
  const storeLng = parseFloatEnv(c.env.STORE_LNG, 97.9685);
  const distance = haversineKm(storeLat, storeLng, lat, lng);
  const fee = computeDeliveryFee(distance, c.env as any);

  let discount = 0;
  let freeShipping = false;
  let couponError = '';
  let appliedCoupon: any = null;

  if (coupon_code && coupon_code.trim()) {
    const coupon = await getCoupon(c.env.DB, coupon_code.trim());
    if (!coupon) couponError = 'ไม่พบคูปอง หรือคูปองไม่พร้อมใช้งาน';
    else {
      const now = new Date();
      const startsOk = !coupon.starts_at || new Date(coupon.starts_at) <= now;
      const endsOk = !coupon.ends_at || new Date(coupon.ends_at) >= now;
      if (!startsOk || !endsOk) couponError = 'คูปองหมดอายุหรือยังไม่เริ่มใช้งาน';
      else if (subtotal < Number(coupon.min_subtotal_thb||0)) couponError = `ยอดขั้นต่ำสำหรับคูปองนี้คือ ${thb(Number(coupon.min_subtotal_thb))} บาท`;
      else {
        const totalUsed = await countRedemptions(c.env.DB, coupon.id);
        if (coupon.max_redemptions != null && totalUsed >= Number(coupon.max_redemptions)) couponError = 'คูปองนี้ถูกใช้ครบสิทธิ์แล้ว';
        else {
          const usedByPhone = await countRedemptionsByPhone(c.env.DB, coupon.id, customer_phone);
          if (usedByPhone >= Number(coupon.max_per_customer||1)) couponError = 'คุณใช้คูปองนี้ครบสิทธิ์แล้ว';
          else {
            appliedCoupon = coupon;
            if (coupon.kind === 'percent') discount = Math.floor(subtotal * (Number(coupon.value)/100));
            if (coupon.kind === 'fixed') discount = Math.min(subtotal, Number(coupon.value));
            if (coupon.kind === 'free_shipping') freeShipping = true;
          }
        }
      }
    }
  }

  const deliveryFee = freeShipping ? 0 : fee;
  const total = Math.max(0, subtotal - discount) + deliveryFee;

  const cutoff = parseIntEnv(c.env.CUTOFF_HOUR, 20);
  const delivery_date = computeDeliveryDateISO(new Date(), cutoff);

  return c.json({
    ok: true,
    subtotal_thb: subtotal,
    discount_thb: discount,
    delivery_fee_thb: deliveryFee,
    total_thb: total,
    distance_km: Number(distance.toFixed(2)),
    delivery_date,
    coupon: appliedCoupon ? { code: appliedCoupon.code, kind: appliedCoupon.kind, value: appliedCoupon.value } : null,
    coupon_error: couponError
  });
});

const CreateSchema = ValidateSchema.extend({
  customer_name: z.string().min(2),
  slip_url: z.string().optional().default(''),
});

app.post('/orders', async (c) => {
  const body = await c.req.json().catch(()=>null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return c.json({ ok:false, error: 'Invalid payload' }, 400);

  const validateRes = await (await fetch(new Request(new URL('/api/validate', c.req.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_phone: parsed.data.customer_phone,
      address: parsed.data.address,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      items: parsed.data.items,
      coupon_code: parsed.data.coupon_code
    })
  }))).json<any>();

  if (!validateRes.ok) return c.json({ ok:false, error: validateRes.error || 'Validate failed' }, 400);

  const id = uid('order');
  const code = orderCode();
  const status = 'PENDING_PAYMENT';

  await c.env.DB.prepare(`
    INSERT INTO orders (id, code, status, customer_name, customer_phone, address, lat, lng, distance_km, delivery_fee_thb, subtotal_thb, discount_thb, total_thb, coupon_code, delivery_date, slip_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, code, status,
    parsed.data.customer_name,
    parsed.data.customer_phone,
    parsed.data.address,
    parsed.data.lat,
    parsed.data.lng,
    validateRes.distance_km,
    validateRes.delivery_fee_thb,
    validateRes.subtotal_thb,
    validateRes.discount_thb,
    validateRes.total_thb,
    parsed.data.coupon_code?.trim() || '',
    validateRes.delivery_date,
    parsed.data.slip_url || ''
  ).run();

  const batch = parsed.data.items.map((it) =>
    c.env.DB.prepare(`
      INSERT INTO order_items (id, order_id, product_id, name_th, unit_price_thb, qty, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(uid('item'), id, it.product_id, it.name_th, it.unit_price_thb, it.qty, it.note || '')
  );
  await c.env.DB.batch(batch);

  if (validateRes.coupon && parsed.data.coupon_code?.trim()) {
    const coupon = await getCoupon(c.env.DB, parsed.data.coupon_code.trim());
    if (coupon) {
      await c.env.DB.prepare(`
        INSERT INTO coupon_redemptions (id, coupon_id, customer_phone, order_id)
        VALUES (?, ?, ?, ?)
      `).bind(uid('redeem'), coupon.id, parsed.data.customer_phone, id).run();
    }
  }

  const lines = parsed.data.items
    .map((it)=>`- ${it.name_th} x${it.qty}${it.note?` (${it.note})`:''}`)
    .join('\n');

  const msg =
`📦 ออเดอร์ใหม่ #${code}
ลูกค้า: ${parsed.data.customer_name}
โทร: ${parsed.data.customer_phone}
ส่งวันที่: ${validateRes.delivery_date}
ระยะทาง: ${validateRes.distance_km} กม.
ค่าส่ง: ${validateRes.delivery_fee_thb} บาท
ส่วนลด: ${validateRes.discount_thb} บาท
ยอดสุทธิ: ${validateRes.total_thb} บาท
ชำระ: โอน/PromptPay (จ่ายก่อน)
รายการ:
${lines}
ดูออเดอร์: ${new URL(`/admin/orders/${code}`, c.req.url).toString()}`;

  await pushLineMessage(c.env as any, msg);

  return c.json({ ok:true, code, order_id: id });
});

export const ALL = app;
