export async function pushLineMessage(env: Record<string, string|undefined>, text: string) {
  const token = env.LINE_CHANNEL_ACCESS_TOKEN;
  const to = env.LINE_ADMIN_USER_ID;
  if (!token || !to) return { ok: false, skipped: true };

  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to,
      messages: [{ type: 'text', text }]
    })
  });
  const ok = res.ok;
  const body = await res.text().catch(()=>'');
  return { ok, status: res.status, body };
}
