function crc16ccitt(str: string) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
function tlv(id: string, value: string) {
  return id + value.length.toString().padStart(2,'0') + value;
}
export function promptPayPayload(phone: string, amountThb: number) {
  const p = phone.replace(/\D/g,'');
  const normalized = p.startsWith('0') ? ('66' + p.slice(1)) : p;

  const merchantAccount = tlv('00','A000000677010111') + tlv('01', normalized);
  const payload =
    tlv('00','01') +
    tlv('01','12') +
    tlv('29', merchantAccount) +
    tlv('52','0000') +
    tlv('53','764') +
    tlv('54', amountThb.toFixed(2)) +
    tlv('58','TH') +
    tlv('59','NONG BEE') +
    tlv('60','MAE HONG SON');
  const withCrc = payload + '6304';
  const crc = crc16ccitt(withCrc);
  return withCrc + crc;
}
