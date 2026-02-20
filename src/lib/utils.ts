export function thb(n: number) {
  return new Intl.NumberFormat('th-TH').format(n);
}
export function uid(prefix='') {
  const s = crypto.randomUUID();
  return prefix ? `${prefix}_${s}` : s;
}
export function orderCode() {
  const t = Date.now().toString().slice(-6);
  return `NB${t}`;
}
export function parseIntEnv(v: string | undefined, fallback: number) {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}
export function parseFloatEnv(v: string | undefined, fallback: number) {
  const n = Number.parseFloat(v ?? '');
  return Number.isFinite(n) ? n : fallback;
}
export function haversineKm(lat1:number, lon1:number, lat2:number, lon2:number) {
  const R = 6371;
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLon = (lon2-lon1) * Math.PI/180;
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
export function computeDeliveryFee(distanceKm: number, env: Record<string,string|undefined>) {
  const freeUpTo = parseFloatEnv(env.DELIVERY_FREE_UP_TO_KM, 5);
  const t1max = parseFloatEnv(env.DELIVERY_TIER_1_MAX_KM, 10);
  const t1fee = parseIntEnv(env.DELIVERY_TIER_1_FEE, 30);
  const t2max = parseFloatEnv(env.DELIVERY_TIER_2_MAX_KM, 15);
  const t2fee = parseIntEnv(env.DELIVERY_TIER_2_FEE, 50);
  const t3max = parseFloatEnv(env.DELIVERY_TIER_3_MAX_KM, 20);
  const t3fee = parseIntEnv(env.DELIVERY_TIER_3_FEE, 70);

  if (distanceKm <= freeUpTo) return 0;
  if (distanceKm <= t1max) return t1fee;
  if (distanceKm <= t2max) return t2fee;
  if (distanceKm <= t3max) return t3fee;
  const extra = Math.ceil(distanceKm - t3max) * 10;
  return t3fee + extra;
}
export function computeDeliveryDateISO(now: Date, cutoffHour: number) {
  const utcMs = now.getTime();
  const bkkMs = utcMs + 7*60*60*1000;
  const bkk = new Date(bkkMs);
  const hour = bkk.getUTCHours();
  const dayMs = 24*60*60*1000;
  const addDays = hour < cutoffHour ? 1 : 2;
  const delivery = new Date(bkkMs + addDays*dayMs);
  const y = delivery.getUTCFullYear();
  const m = String(delivery.getUTCMonth()+1).padStart(2,'0');
  const d = String(delivery.getUTCDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
